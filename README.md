# EventGate - Sistem Manajemen Event & Penjualan Tiket

Aplikasi full-stack komprehensif untuk manajemen event dan penjualan tiket. Dibangun menggunakan arsitektur modern yang memisahkan frontend (React) dan backend (Node.js/Express) dengan Supabase sebagai layanan database dan penyimpanan.

## 🚀 Fitur Utama

### Sisi Pengguna (User Side)
- **Eksplorasi Event:** Melihat daftar event yang tersedia dengan fitur pencarian dan pengurutan (harga, tanggal).
- **Detail Event:** Melihat informasi lengkap mengenai suatu acara.
- **Pemesanan Tiket:** Memesan tiket dan mengunggah bukti pembayaran.
- **Profil Pengguna:** Mengelola informasi profil dasar dan pengaturan notifikasi.
- **Riwayat Pemesanan:** Melihat status dan daftar tiket yang telah dipesan.

### Sisi Admin (Admin Side)
- **Manajemen Event:** Membuat event baru lengkap dengan detail, harga, dan banner gambar.
- **Dashboard Pemesanan:** Melihat seluruh transaksi pemesanan tiket yang masuk.
- **Verifikasi Pembayaran:** Menyetujui (`confirmed`) atau menolak (`rejected`) pemesanan berdasarkan bukti pembayaran.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router DOM
- **Backend:** Node.js, Express, TypeScript, Multer (untuk upload file)
- **Database & Storage:** Supabase (PostgreSQL, Supabase Storage)

---

## 📂 Struktur Proyek

```text
EventGate/
├── backend/                  # Server Node.js/Express API
│   ├── src/
│   │   ├── index.ts          # Entry point & API Routes
│   │   └── supabaseClient.ts # Konfigurasi client Supabase
│   ├── package.json
│   └── DATABASE_SCHEMA.md    # Detail Schema Database
└── frontend/                 # Aplikasi Web React
    ├── src/
    │   ├── components/       # Komponen UI (Navbar, Footer, dll)
    │   ├── pages/            # Halaman Aplikasi (Home, AdminDashboard, dll)
    │   ├── lib/              # Client API
    │   ├── App.tsx           # Routing Utama
    │   └── main.tsx
    ├── package.json
    └── tailwind.config.js
```

---

## 📡 API Documentation

Base URL Backend berjalan di: `http://localhost:5005` (secara default).

### 1. Sistem & Umum
| Method | Endpoint | Deskripsi | Parameter/Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Cek status server (Health Check) | - |

### 2. Event (Acara)
| Method | Endpoint | Deskripsi | Parameter/Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Mengambil daftar semua event | Query: `?search=...`, `?place=...`, `?sort=price-asc/price-desc` |
| `GET` | `/api/events/:id` | Mengambil detail 1 event spesifik | Params: `id` (UUID Event) |
| `POST` | `/api/events` | **(Admin)** Membuat event baru | `multipart/form-data`: `title`, `description`, `date`, `location`, `price`, file `image` |

### 3. Pemesanan (Booking)
| Method | Endpoint | Deskripsi | Parameter/Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Membuat pesanan tiket baru | `multipart/form-data`: `event_id`, `user_name`, `user_email`, `ticket_category`, `quantity`, file `paymentProof` |
| `GET` | `/api/bookings/user/:email`| Mengambil riwayat pesanan user | Params: `email` pengguna |
| `GET` | `/api/admin/bookings` | **(Admin)** Mengambil semua pesanan | - |
| `PATCH`| `/api/admin/bookings/:id` | **(Admin)** Update status pesanan | JSON: `{ "status": "confirmed" \| "rejected" }` |

### 4. Profil Pengguna
| Method | Endpoint | Deskripsi | Parameter/Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profiles/:id` | Mengambil profil user by ID | Params: `id` pengguna |
| `PUT` | `/api/profiles/:id` | Update / Create profil user | JSON: `{ "full_name", "display_name", "email_tickets", "event_updates" }` |

---

## ⚙️ Persiapan Database (Supabase)

1. Buka [Supabase Dashboard](https://supabase.com/) dan buat proyek baru.
2. Buka **SQL Editor** dan jalankan query berikut untuk membuat tabel:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabel Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  location TEXT,
  price DECIMAL NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  ticket_category TEXT DEFAULT 'Regular',
  quantity INTEGER DEFAULT 1,
  payment_proof_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Profil (Opsional, tergantung skema di Supabase Anda)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  display_name TEXT,
  email_tickets BOOLEAN DEFAULT true,
  event_updates BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pengaturan RLS (Row Level Security) untuk Development
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow public all access on bookings" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow public all access on profiles" ON profiles FOR ALL USING (true);
```

3. Pergi ke **Storage**, buat bucket baru bernama `eventgate-bucket`.
4. Atur bucket tersebut menjadi **Public** agar URL gambar dapat diakses oleh frontend.

---

## 🔑 Konfigurasi Environment Variables

Anda perlu membuat file `.env` di kedua folder (`frontend` dan `backend`).

### Backend (`backend/.env`)
```env
PORT=5005
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

---

## 🚀 Cara Menjalankan Aplikasi

Buka dua terminal terpisah.

### 1. Jalankan Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
```
*Backend akan berjalan di `http://localhost:5005`*

### 2. Jalankan Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
*Frontend akan berjalan di `http://localhost:5173`*

Akses aplikasi utama melalui browser pada alamat frontend. 
Untuk masuk ke Dashboard Admin, akses rute: `http://localhost:5173/admin`.
