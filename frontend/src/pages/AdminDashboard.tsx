import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Booking {
  id: string;
  user_name: string;
  user_email: string;
  ticket_category: string;
  quantity: number;
  payment_proof_url: string;
  status: string;
  created_at: string;
  event_id: string;
  events?: { title: string; price?: number };
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      // In a real app, this should be authenticated
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/bookings`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;

  const totalTicketsSold = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.quantity, 0);

  const pendingVerifications = bookings
    .filter(b => b.status === 'pending')
    .length;

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.quantity * (b.events?.price || 0)), 0);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  // Kalkulasi performa per event
  const eventStats = bookings.reduce((acc, booking) => {
    if (booking.status !== 'confirmed') return acc;
    
    const eventName = booking.events?.title || 'Unknown Event';
    const revenue = booking.quantity * (booking.events?.price || 0);

    if (!acc[eventName]) {
      acc[eventName] = { ticketsSold: 0, revenue: 0 };
    }
    
    acc[eventName].ticketsSold += booking.quantity;
    acc[eventName].revenue += revenue;
    
    return acc;
  }, {} as Record<string, { ticketsSold: number, revenue: number }>);

  // Ubah object ke array dan urutkan berdasarkan tiket terjual terbanyak
  const sortedEventStats = Object.entries(eventStats)
    .map(([eventName, stats]) => ({ eventName, ...stats }))
    .sort((a, b) => b.ticketsSold - a.ticketsSold);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard - Manajemen Tiket</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 font-medium mb-1">Total Tiket Terjual</div>
          <div className="text-3xl font-bold text-gray-900">{totalTicketsSold}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 font-medium mb-1">Total Pendapatan</div>
          <div className="text-3xl font-bold text-green-600">{formatRupiah(totalRevenue)}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 font-medium mb-1">Menunggu Verifikasi</div>
          <div className="text-3xl font-bold text-yellow-600">{pendingVerifications}</div>
        </div>
      </div>

      {/* Performa per Event */}
      <h2 className="text-xl font-bold mb-4 mt-12">Performa per Event</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm font-semibold">
              <th className="px-6 py-4 border-b">Nama Event</th>
              <th className="px-6 py-4 border-b text-right">Tiket Terjual (Confirmed)</th>
              <th className="px-6 py-4 border-b text-right">Pendapatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedEventStats.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400">Belum ada data penjualan yang dikonfirmasi.</td></tr>
            ) : (
              sortedEventStats.map((stat, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{stat.eventName}</td>
                  <td className="px-6 py-4 text-right text-blue-600 font-bold">{stat.ticketsSold}</td>
                  <td className="px-6 py-4 text-right text-green-600 font-medium">{formatRupiah(stat.revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mb-4">Riwayat Pemesanan</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm font-semibold">
              <th className="px-6 py-4 border-b">Pemesan</th>
              <th className="px-6 py-4 border-b">Event & Tiket</th>
              <th className="px-6 py-4 border-b">Bukti</th>
              <th className="px-6 py-4 border-b">Status</th>
              <th className="px-6 py-4 border-b text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Belum ada pemesanan.</td></tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{booking.user_name}</div>
                    <div className="text-xs text-gray-500">{booking.user_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{booking.events?.title || 'Unknown Event'}</div>
                    <div className="text-xs text-gray-500">{booking.ticket_category} x {booking.quantity}</div>
                  </td>
                  <td className="px-6 py-4">
                    {booking.payment_proof_url ? (
                      <a href={booking.payment_proof_url} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 text-xs hover:underline">
                        <Eye className="w-3 h-3" /> Lihat Bukti
                      </a>
                    ) : <span className="text-xs text-gray-400">Tidak ada</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                      booking.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => updateStatus(booking.id, 'confirmed')}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Konfirmasi"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => updateStatus(booking.id, 'rejected')}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Tolak"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
