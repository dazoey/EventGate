# EventGate Database Schema (Supabase)

Copy and paste the following SQL code into the **SQL Editor** in your Supabase Dashboard to set up the necessary tables for the EventGate application.

## 1. Create Tables

```sql
-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: events
-- Stores information about available events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TEXT, -- Store as text or use TIMESTAMP (e.g., '14 APR 2026')
  location TEXT,
  price DECIMAL NOT NULL DEFAULT 0,
  ticket_quota INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: bookings
-- Stores ticket sales and manual payment confirmations
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  ticket_category TEXT DEFAULT 'Regular',
  quantity INTEGER DEFAULT 1,
  payment_proof_url TEXT, -- URL to the uploaded image in Supabase Storage
  status TEXT DEFAULT 'pending', -- Options: 'pending', 'confirmed', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional but recommended
-- For development, you can disable RLS or create policies to allow access.
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Simple policies for development (allows anyone to read events and create bookings)
CREATE POLICY "Allow public read access on events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public update on bookings" ON bookings FOR UPDATE USING (true);
```

## 2. Storage Setup

1.  Go to **Storage** in your Supabase Dashboard.
2.  Create a new bucket named: `eventgate-bucket`.
3.  Set the bucket to **Public** (so the `payment_proof_url` is accessible).
4.  Ensure the storage policies allow `INSERT` and `SELECT` for public or authenticated users.

## 3. Seed Data (Optional)

Run this to add initial events:

```sql
INSERT INTO events (title, description, date, location, price, image_url)
VALUES 
('DWP 2026', 'A massive music festival experience in Bali.', '14 APR', 'Bali, Indonesia', 900000, 'https://images.unsplash.com/photo-1540039155732-6761b54cb993'),
('EMINA JELLY TINT WORKSHOP', 'Learn makeup tips and tricks with Emina.', '20 AUG', 'Jakarta', 150000, 'https://images.unsplash.com/photo-1522337660859-02fbefca4702'),
('JUSTIN BEIBER 2026 TOUR', 'The world tour finally hits Jakarta.', '18 SEP', 'Jakarta', 2500000, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea');
```
