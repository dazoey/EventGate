# EventGate - Sistem Manajemen Event & Penjualan Tiket

Aplikasi full-stack untuk manajemen event dan penjualan tiket menggunakan React, Express, dan Supabase.

## Struktur Proyek

- `frontend/`: React + Vite + Tailwind CSS (V4)
- `backend/`: Express + TypeScript + ESM

## Persiapan Database (Supabase)

1.  Buka [Supabase Dashboard](https://supabase.com/) dan buat proyek baru.
2.  Buka **SQL Editor** dan jalankan query berikut untuk membuat tabel:

```sql
-- Tabel Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  location TEXT,
  price DECIMAL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  ticket_category TEXT,
  quantity INTEGER,
  payment_proof_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3.  Pergi ke **Storage**, buat bucket baru bernama `eventgate-bucket` dan atur menjadi **Public**.

## Konfigurasi

### Backend
Isi file `backend/.env` dengan kredensial Supabase Anda:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Frontend
Isi file `frontend/.env` dengan kredensial yang sama:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Cara Menjalankan

### 1. Jalankan Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Jalankan Frontend
```bash
cd frontend
npm install
npm run dev
```

Akses aplikasi di `http://localhost:5173`.
Dashboard Admin dapat diakses di `http://localhost:5173/admin`.
