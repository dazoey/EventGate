import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';
import multer from 'multer';

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Log setiap request yang masuk untuk debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'EventGate API is running' });
});

app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const { search, place, sort } = req.query;
    let query = supabase.from('events').select('*');

    if (search && typeof search === 'string' && search.trim() !== '') {
      query = query.ilike('title', `%${search.trim()}%`);
    }
    
    if (place && typeof place === 'string' && place.trim() !== '') {
      query = query.ilike('location', `%${place.trim()}%`);
    }

    // Server-side Sorting
    if (sort === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});
// Get single event
app.get('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('events').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Event not found' });
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete event
app.delete('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('events').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new event
app.post('/api/events', upload.single('image'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, description, date, location, price, ticket_quota, organizer_id } = req.body;
    let imageUrl = null;

    if (req.file) {
      const fileName = `events/${Date.now()}-${req.file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('eventgate-bucket')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('eventgate-bucket').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase.from('events').insert([{
      title, description, date, location, price: parseFloat(price), image_url: imageUrl,
      ticket_quota: ticket_quota ? parseInt(ticket_quota, 10) : 0,
      organizer_id: organizer_id || null
    }]).select();

    if (error) throw error;
    res.status(201).json({ message: 'Event created successfully', event: data[0] });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sold tickets count for an event
app.get('/api/events/:id/sold', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('quantity')
      .eq('event_id', req.params.id)
      .eq('status', 'confirmed');

    if (error) throw error;
    const sold = (data || []).reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);
    res.json({ sold });
  } catch (error: any) {
    console.error('Error fetching sold tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', upload.single('paymentProof'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { event_id, user_email, user_name, ticket_category, quantity } = req.body;
    const requestedQuantity = parseInt(quantity, 10);

    // 1. Dapatkan detail event untuk mengetahui kuota total
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('ticket_quota')
      .eq('id', event_id)
      .single();

    if (eventError || !eventData) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // 2. Hitung jumlah tiket yang sudah terjual (status confirmed dan pending)
    // Menghitung status pending juga untuk menghindari double-booking bersamaan
    const { data: soldData, error: soldError } = await supabase
      .from('bookings')
      .select('quantity')
      .eq('event_id', event_id)
      .in('status', ['confirmed', 'pending']);

    if (soldError) throw soldError;

    const totalSoldOrPending = (soldData || []).reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);
    const remainingTickets = eventData.ticket_quota - totalSoldOrPending;

    if (requestedQuantity > remainingTickets) {
      return res.status(400).json({ error: `Maaf, tiket tidak mencukupi. Sisa tiket: ${remainingTickets > 0 ? remainingTickets : 0}` });
    }

    let paymentProofUrl = null;
    
    if (req.file) {
      const fileName = `proofs/${Date.now()}-${req.file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('eventgate-bucket')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('eventgate-bucket').getPublicUrl(fileName);
      paymentProofUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase.from('bookings').insert([{
      event_id, user_email, user_name, ticket_category, 
      quantity: requestedQuantity, 
      payment_proof_url: paymentProofUrl,
      status: 'pending'
    }]).select();

    if (error) throw error;
    res.status(201).json({ message: 'Booking successful', booking: data[0] });
  } catch (error: any) {
    console.error('Error processing booking:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/bookings', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(title, price)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// Admin: Update booking status
app.patch('/api/admin/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase.from('bookings').update({ status }).eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Organizer: Get dashboard stats and bookings
app.get('/api/organizer/:organizer_id/dashboard', async (req: Request, res: Response) => {
  try {
    const { organizer_id } = req.params;

    // 1. Get all events created by this organizer
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizer_id);

    if (eventsError) throw eventsError;
    if (!eventsData || eventsData.length === 0) {
      return res.json({ events: [], bookings: [], stats: { totalTicketsSold: 0, totalRevenue: 0, dailyRevenue: [] } });
    }

    const eventIds = eventsData.map(e => e.id);

    // 2. Get all bookings for these events
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, events(title, price)')
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;

    // 3. Calculate Stats
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    const revenueByDate: Record<string, number> = {};

    bookingsData?.forEach(booking => {
      if (booking.status === 'confirmed') {
        totalTicketsSold += booking.quantity;
        const revenue = booking.quantity * (booking.events?.price || 0);
        totalRevenue += revenue;

        const date = new Date(booking.created_at).toISOString().split('T')[0];
        if (!revenueByDate[date]) {
          revenueByDate[date] = 0;
        }
        revenueByDate[date] += revenue;
      }
    });

    const dailyRevenue = Object.keys(revenueByDate).map(date => ({
      date,
      revenue: revenueByDate[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      events: eventsData,
      bookings: bookingsData,
      stats: {
        totalTicketsSold,
        totalRevenue,
        dailyRevenue
      }
    });
  } catch (error: any) {
    console.error('Error fetching organizer dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Organizer: Update booking status for their events
app.patch('/api/organizer/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { status, organizer_id } = req.body; // Need to verify if the event belongs to this organizer, but since we trust the client to an extent or we can query it

    // Optional: Verify if the booking belongs to an event of the organizer
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('event_id')
      .eq('id', req.params.id)
      .single();

    if (bookingError) throw bookingError;

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', bookingData.event_id)
      .single();

    if (eventError) throw eventError;

    if (eventData.organizer_id !== organizer_id) {
       return res.status(403).json({ error: 'Unauthorized to update this booking' });
    }

    const { data, error } = await supabase.from('bookings').update({ status }).eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User: Get personal bookings
app.get('/api/bookings/user/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(title, date, location, image_url)')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: error.message });
  }
});

// User: Request cancellation for a booking
app.patch('/api/bookings/:id/cancel-request', upload.single('proof'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { reason } = req.body;
    let proofUrl = null;

    if (req.file) {
      const fileName = `cancellations/${Date.now()}-${req.file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('eventgate-bucket')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('eventgate-bucket').getPublicUrl(fileName);
      proofUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancellation_requested',
        cancellation_reason: reason || null,
        cancellation_proof_url: proofUrl
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Cancellation requested successfully', booking: data[0] });
  } catch (error: any) {
    console.error('Error requesting cancellation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Profile: Get user profile
app.get('/api/profiles/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
    if (error && error.code !== 'PGRST116') throw error; // ignore not found
    res.json(data || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Profile: Update or Create user profile
app.put('/api/profiles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, display_name, email_tickets, event_updates } = req.body;
    
    // Hilangkan karakter aneh atau spasi dari ID
    const cleanId = id.trim();

    if (!cleanId || cleanId === ':id') {
      return res.status(400).json({ error: 'User ID tidak valid' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ 
        id: cleanId, 
        full_name, 
        display_name, 
        email_tickets: email_tickets ?? true, 
        event_updates: event_updates ?? false,
        updated_at: new Date().toISOString() 
      })
      .select();
    
    if (error) {
      console.error('❌ Supabase Database Error:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log(`✅ Profil updated: ${cleanId}`);
    res.json(data[0]);
  } catch (error: any) {
    console.error('❌ Server Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Tangani error jika port sudah digunakan
const server = app.listen(port, () => {
  console.log(`✅ Server EventGate aktif di: http://localhost:${port}`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} sudah digunakan. Gunakan port lain atau matikan proses yang sedang berjalan.`);
    process.exit(1);
  } else {
    console.error('❌ Terjadi kesalahan pada server:', err);
  }
});

// Tangani crash yang tidak terduga agar tidak langsung keluar
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
