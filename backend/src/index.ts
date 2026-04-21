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

// Create new event
app.post('/api/events', upload.single('image'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, description, date, location, price } = req.body;
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
      title, description, date, location, price: parseFloat(price), image_url: imageUrl
    }]).select();

    if (error) throw error;
    res.status(201).json({ message: 'Event created successfully', event: data[0] });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', upload.single('paymentProof'), async (req: Request, res: Response): Promise<any> => {
  try {
    const { event_id, user_email, user_name, ticket_category, quantity } = req.body;
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
      quantity: parseInt(quantity, 10), 
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
      .select('*, events(title)')
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
