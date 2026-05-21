import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, TrendingUp, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  price: number;
}

interface Booking {
  id: string;
  user_name: string;
  user_email: string;
  quantity: number;
  status: string;
  created_at: string;
  events: {
    title: string;
    price: number;
  };
}

interface Stats {
  totalTicketsSold: number;
  totalRevenue: number;
  dailyRevenue: { date: string; revenue: number }[];
}

export default function OrganizerDashboard() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }
    setUserId(session.user.id);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/organizer/${session.user.id}/dashboard`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setBookings(data.bookings || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/organizer/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, organizer_id: userId })
      });
      
      if (response.ok) {
        fetchDashboardData();
      } else {
        alert('Gagal memperbarui status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;
  }

  if (!userId) {
    return <div className="text-center py-20 text-gray-500">Silakan login untuk melihat dashboard organizer.</div>;
  }

  const maxRevenue = stats?.dailyRevenue.reduce((max, d) => Math.max(max, d.revenue), 0) || 1;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-[#0f172a] mb-8">Dashboard Organizer</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Tiket Terjual</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalTicketsSold || 0} Tiket</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Pendapatan</p>
            <p className="text-2xl font-bold text-gray-900">{formatRupiah(stats?.totalRevenue || 0)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Event Aktif</p>
            <p className="text-2xl font-bold text-gray-900">{events.length} Event</p>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Grafik Pendapatan Harian</h2>
        {stats?.dailyRevenue && stats.dailyRevenue.length > 0 ? (
          <div className="h-64 flex items-end gap-2 mt-4">
            {stats.dailyRevenue.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                <div 
                  className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors" 
                  style={{ height: `${(data.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}
                ></div>
                <span className="text-[10px] text-gray-500 rotate-45 origin-left mt-2">{data.date.split('-').slice(1).join('/')}</span>
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                  {formatRupiah(data.revenue)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400">Belum ada data pendapatan.</div>
        )}
      </div>

      {/* Booking History & Verification */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Verifikasi & Riwayat Pesanan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="p-4 font-semibold">Event</th>
                <th className="p-4 font-semibold">Pembeli</th>
                <th className="p-4 font-semibold">Jumlah</th>
                <th className="p-4 font-semibold">Total Harga</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm font-medium text-gray-900">{booking.events?.title || 'Unknown Event'}</td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-900">{booking.user_name}</p>
                    <p className="text-xs text-gray-500">{booking.user_email}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{booking.quantity} Tiket</td>
                  <td className="p-4 text-sm text-gray-600 font-medium">
                    {formatRupiah(booking.quantity * (booking.events?.price || 0))}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                      ${booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 
                        booking.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                    >
                      {booking.status === 'confirmed' ? 'Dikonfirmasi' : booking.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                    </span>
                  </td>
                  <td className="p-4">
                    {booking.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Terima
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Selesai</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Belum ada pesanan untuk event Anda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}