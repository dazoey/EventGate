import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Share2, Heart, Loader2, Ticket, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  image_url: string;
  ticket_quota: number;
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [soldTickets, setSoldTickets] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Regular');
  const [quantity, setQuantity] = useState(1);
  const [proof, setProof] = useState<File | null>(null);

  // Auto-fill nama dan email dari profil user yang sedang login
  useEffect(() => {
    const prefillUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Set email dari Supabase Auth
          setEmail(session.user.email || '');

          // Fetch profil untuk mendapatkan nama lengkap dan role
          const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${session.user.id}`);
          if (response.ok) {
            const profile = await response.json();
            setName(profile.full_name || profile.display_name || '');
            if (profile.role === 'admin') {
              setIsAdmin(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    prefillUserData();
  }, []);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}`);
        const data = await response.json();
        setEvent(data);

        // Fetch confirmed bookings to calculate sold tickets
        const bookingsRes = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}/sold`);
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setSoldTickets(bookingsData.sold || 0);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof) {
      alert('Harap unggah bukti transfer!');
      return;
    }

    setBookingLoading(true);
    const formData = new FormData();
    formData.append('event_id', id || '');
    formData.append('user_name', name);
    formData.append('user_email', email);
    formData.append('ticket_category', category);
    formData.append('quantity', quantity.toString());
    formData.append('paymentProof', proof);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        alert('Pemesanan berhasil! Admin akan memverifikasi bukti pembayaran Anda.');
        navigate('/');
      } else {
        const err = await response.json();
        alert('Gagal memesan: ' + err.error);
      }
    } catch (error) {
      console.error('Error booking:', error);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus event ini? Semua data pesanan yang terkait juga akan terhapus.')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('Event berhasil dihapus.');
        navigate('/');
      } else {
        const err = await response.json();
        alert('Gagal menghapus event: ' + err.error);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Terjadi kesalahan koneksi.');
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;
  if (!event) return <div className="text-center py-20 text-xl">Event tidak ditemukan.</div>;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-8">
        
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            <div className="relative h-64 sm:h-96 w-full">
              <img 
                src={event.image_url || "https://images.unsplash.com/photo-1470229722913-7c092db658cb?auto=format&fit=crop&w=1000&h=600"} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                {isAdmin && (
                  <button onClick={handleDeleteEvent} className="bg-white/80 backdrop-blur p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors" title="Hapus Event (Admin)">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button className="bg-white/80 backdrop-blur p-2 rounded-full hover:bg-white text-gray-700 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="bg-white/80 backdrop-blur p-2 rounded-full hover:bg-white text-pink-500 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{event.title}</h1>
                  <p className="text-xl text-gray-500 font-medium uppercase">{event.location}</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm text-blue-600 font-medium">Mulai Dari</div>
                  <div className="text-2xl font-bold text-gray-900">Rp {Number(event.price).toLocaleString('id-ID')}</div>
                  <div className="text-xs text-gray-400 mt-1">+ 12% biaya admin</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <Calendar className="w-6 h-6 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Tanggal Acara</div>
                    <div className="text-sm text-blue-600">{event.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <MapPin className="w-6 h-6 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Lokasi</div>
                    <div className="text-sm text-blue-600">{event.location}</div>
                  </div>
                </div>
                {event.ticket_quota > 0 && (() => {
                  const remaining = event.ticket_quota - soldTickets;
                  const percentage = (soldTickets / event.ticket_quota) * 100;
                  const statusColor = remaining <= 0 ? 'text-red-600' : remaining <= event.ticket_quota * 0.2 ? 'text-amber-600' : 'text-emerald-600';
                  const barColor = remaining <= 0 ? 'bg-red-500' : remaining <= event.ticket_quota * 0.2 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <Ticket className="w-6 h-6 text-gray-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Sisa Tiket</div>
                        <div className={`text-sm font-bold ${statusColor}`}>
                          {remaining <= 0 ? 'Habis' : `${remaining.toLocaleString('id-ID')} / ${event.ticket_quota.toLocaleString('id-ID')}`}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                          <div className={`${barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Deskripsi Event</h2>
                <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                  {event.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="bg-[#1e293b] rounded-2xl p-6 text-white sticky top-6">
            <h3 className="text-xl font-bold mb-6 border-b border-gray-700 pb-4">Pesan Tiket Manual</h3>
            
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nama Lengkap</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white" />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Kategori Tiket</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white">
                  <option value="Regular">Regular - Rp {Number(event.price).toLocaleString('id-ID')}</option>
                  <option value="VIP">VIP - Rp {(Number(event.price) * 2).toLocaleString('id-ID')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Jumlah</label>
                <input 
                  type="number" 
                  min="1" 
                  max={event.ticket_quota > 0 ? Math.max(0, event.ticket_quota - soldTickets) : undefined}
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white" 
                />
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-blue-300 mb-1">Unggah Bukti Transfer</label>
                <p className="text-[10px] text-gray-400 mb-2">Transfer ke Bank BCA 12345678 a/n EventGate</p>
                <input 
                  required
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setProof(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>

              <button 
                type="submit" 
                disabled={bookingLoading || (event.ticket_quota > 0 && (event.ticket_quota - soldTickets) <= 0)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg mt-6 transition-colors shadow-lg flex justify-center items-center gap-2"
              >
                {bookingLoading && <Loader2 className="animate-spin w-5 h-5" />}
                {event.ticket_quota > 0 && (event.ticket_quota - soldTickets) <= 0 
                  ? 'Tiket Habis' 
                  : bookingLoading ? 'Memproses...' : 'Pesan Tiket Sekarang'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
