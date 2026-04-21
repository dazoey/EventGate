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
  events?: { title: string };
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard - Manajemen Tiket</h1>
      
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
