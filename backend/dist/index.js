import express from 'express';
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
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'EventGate API is running' });
});
app.get('/api/events', async (req, res) => {
    try {
        const { data, error } = await supabase.from('events').select('*');
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/events/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('events').select('*').eq('id', req.params.id).single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ error: 'Event not found' });
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/bookings', upload.single('paymentProof'), async (req, res) => {
    try {
        const { event_id, user_email, user_name, ticket_category, quantity } = req.body;
        let paymentProofUrl = null;
        if (req.file) {
            const fileName = `proofs/${Date.now()}-${req.file.originalname}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('eventgate-bucket')
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            if (uploadError)
                throw uploadError;
            const { data: publicUrlData } = supabase.storage.from('eventgate-bucket').getPublicUrl(fileName);
            paymentProofUrl = publicUrlData.publicUrl;
        }
        const { data, error } = await supabase.from('bookings').insert([{
                event_id, user_email, user_name, ticket_category,
                quantity: parseInt(quantity, 10),
                payment_proof_url: paymentProofUrl,
                status: 'pending'
            }]).select();
        if (error)
            throw error;
        res.status(201).json({ message: 'Booking successful', booking: data[0] });
    }
    catch (error) {
        console.error('Error processing booking:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/admin/bookings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, events(title)')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/admin/bookings/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const { data, error } = await supabase.from('bookings').update({ status }).eq('id', req.params.id).select();
        if (error)
            throw error;
        res.json(data[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Tangani error jika port sudah digunakan
const server = app.listen(port, () => {
    console.log(`✅ Server EventGate aktif di: http://localhost:${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} sudah digunakan. Gunakan port lain atau matikan proses yang sedang berjalan.`);
        process.exit(1);
    }
    else {
        console.error('❌ Terjadi kesalahan pada server:', err);
    }
});
// Tangani crash yang tidak terduga agar tidak langsung keluar
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
