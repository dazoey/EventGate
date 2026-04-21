import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { User, Ticket, Calendar, MapPin, Clock, Loader2, Mail, ShieldCheck } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileData {
  full_name: string;
  display_name: string;
}

interface Booking {
  id: string;
  ticket_category: string;
  quantity: number;
  status: string;
  created_at: string;
  events: {
    title: string;
    date: string;
    location: string;
    image_url: string;
  };
}

export default function Profile() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const currentUser = session.user;
      setUser(currentUser);

      try {
        // 1. Fetch Profile Data (Sinkronisasi Nama/Username)
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${currentUser.id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // 2. Fetch Booking History
        const bookingsRes = await fetch(`${import.meta.env.VITE_API_URL}/bookings/user/${currentUser.email}`);
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin w-12 h-12 text-blue-600" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Sinkronisasi Profil...</p>
      </div>
    );
  }

  // Gunakan Display Name jika ada, jika tidak pakai username email
  const nameToDisplay = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const fullName = profile?.full_name || 'EventGate Member';

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column: User Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
            <div className="bg-[#0f172a] h-32 relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-pink-500 flex items-center justify-center border-8 border-white shadow-xl">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <div className="pt-16 pb-10 px-8 text-center">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{nameToDisplay}</h2>
              <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-1">{fullName}</p>
              
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mt-4">
                <Mail className="w-4 h-4" />
                <span className="font-medium">{user?.email}</span>
              </div>
              
              <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-green-600 bg-green-50 w-fit mx-auto px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-green-100">
                <ShieldCheck className="w-4 h-4" />
                Account Verified
              </div>

              <div className="mt-10 pt-8 border-t border-gray-50 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                  <span className="text-gray-300">Member Since</span>
                  <span className="text-gray-900">{new Date(user?.created_at || '').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                  <span className="text-gray-300">Transactions</span>
                  <span className="text-gray-900">{bookings.length} Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Booking History */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter leading-none">Riwayat<br/>Tiket Saya</h2>
              <div className="w-16 h-1.5 bg-pink-500 mt-4 rounded-full"></div>
            </div>
            <div className="hidden sm:block px-6 py-2 bg-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
              My Collections
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="bg-gray-50 rounded-[3rem] p-16 border border-gray-100 border-dashed text-center group hover:border-blue-200 transition-colors">
              <div className="w-20 h-20 bg-white shadow-xl rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-200 group-hover:scale-110 transition-transform">
                <Ticket className="w-10 h-10" />
              </div>
              <h3 className="text-gray-900 font-black text-xl uppercase">Belum Ada Tiket</h3>
              <p className="text-gray-500 mt-3 max-w-xs mx-auto text-sm font-medium">Anda belum melakukan pemesanan. Mulai jelajahi event seru kami!</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-10 bg-[#0f172a] text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl active:scale-95"
              >
                Cari Event Menarik
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-full md:w-56 h-40 md:h-auto overflow-hidden">
                    <img 
                      src={booking.events?.image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4'} 
                      className="w-full h-full object-cover" 
                      alt={booking.events?.title}
                    />
                  </div>
                  <div className="flex-grow p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-black text-gray-900 text-xl leading-tight uppercase tracking-tight">{booking.events?.title}</h3>
                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                          booking.status === 'confirmed' ? 'bg-green-50 text-green-600 border border-green-100' : 
                          booking.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {booking.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mt-6">
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-tight">
                          <Calendar className="w-5 h-5 text-blue-500" />
                          <span className="text-gray-900">{booking.events?.date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-tight">
                          <MapPin className="w-5 h-5 text-blue-500" />
                          <span className="text-gray-900 truncate">{booking.events?.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-tight">
                          <Ticket className="w-5 h-5 text-pink-500" />
                          <span className="text-gray-900">{booking.ticket_category} x {booking.quantity}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-tight">
                          <Clock className="w-5 h-5 text-gray-300" />
                          <span className="text-gray-400">{new Date(booking.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
