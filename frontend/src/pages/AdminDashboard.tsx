import { useState, useEffect, useMemo } from 'react';
import { Loader2, CheckCircle, XCircle, Eye, Download, FileSpreadsheet, Calendar as CalendarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  cancellation_reason?: string;
  cancellation_proof_url?: string;
  events?: { title: string; price?: number };
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/bookings`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        console.error('Invalid bookings data:', data);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session?.user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        try {
          const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${session.user.id}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.role === 'admin') {
              setIsAdmin(true);
              fetchBookings();
            } else {
              setIsAdmin(false);
              setLoading(false);
            }
          } else {
            setIsAdmin(false);
            setLoading(false);
          }
        } catch {
          setIsAdmin(false);
          setLoading(false);
        }
      });
    });
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

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  // 1. Filter bookings by date
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!startDate && !endDate) return true;
      const bookingDate = new Date(b.created_at).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() + 86400000 : Infinity; // +1 day to include end date fully
      return bookingDate >= start && bookingDate <= end;
    });
  }, [bookings, startDate, endDate]);

  // 2. Global Stats based on Filtered Data
  const totalTicketsSold = filteredBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.quantity, 0);

  const pendingVerifications = filteredBookings
    .filter(b => b.status === 'pending')
    .length;

  const totalRevenue = filteredBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.quantity * (b.events?.price || 0)), 0);

  // 3. Chart Data (Daily Revenue)
  const chartData = useMemo(() => {
    const dailyMap = filteredBookings
      .filter(b => b.status === 'confirmed')
      .reduce((acc, b) => {
        const dateObj = new Date(b.created_at);
        const sortKey = dateObj.toISOString().split('T')[0]; 
        const revenue = b.quantity * (b.events?.price || 0);
        
        if (!acc[sortKey]) {
          acc[sortKey] = {
            revenue: 0,
            displayDate: dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
          };
        }
        acc[sortKey].revenue += revenue;
        return acc;
      }, {} as Record<string, { revenue: number; displayDate: string }>);

    return Object.entries(dailyMap)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([, data]) => ({
        date: data.displayDate,
        revenue: data.revenue
      }));
  }, [filteredBookings]);

  // 4. Per Event Stats
  const eventStats = filteredBookings.reduce((acc, booking) => {
    if (booking.status !== 'confirmed') return acc;
    const eventName = booking.events?.title || 'Unknown Event';
    const revenue = booking.quantity * (booking.events?.price || 0);
    
    if (!acc[eventName]) acc[eventName] = { ticketsSold: 0, revenue: 0 };
    acc[eventName].ticketsSold += booking.quantity;
    acc[eventName].revenue += revenue;
    return acc;
  }, {} as Record<string, { ticketsSold: number, revenue: number }>);

  const sortedEventStats = Object.entries(eventStats)
    .map(([eventName, stats]) => ({ eventName, ...stats }))
    .sort((a, b) => b.ticketsSold - a.ticketsSold);

  // 5. Export Handlers
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sortedEventStats.map(s => ({
      'Nama Event': s.eventName,
      'Tiket Terjual': s.ticketsSold,
      'Pendapatan (IDR)': s.revenue
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Pendapatan");
    XLSX.writeFile(wb, "Laporan_Pendapatan_EventGate.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Pendapatan EventGate", 14, 15);
    doc.setFontSize(10);
    doc.text(`Periode: ${startDate || 'Semua'} s/d ${endDate || 'Semua'}`, 14, 22);

    const tableColumn = ["Nama Event", "Tiket Terjual", "Pendapatan (Rp)"];
    const tableRows = sortedEventStats.map(stat => [
      stat.eventName,
      stat.ticketsSold.toString(),
      formatRupiah(stat.revenue)
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
    });

    doc.save("Laporan_Pendapatan_EventGate.pdf");
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Akses Ditolak</h2>
        <p className="text-gray-500">Hanya administrator yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-sm">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="outline-none bg-transparent text-gray-700" />
            <span className="text-gray-400">-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="outline-none bg-transparent text-gray-700" />
          </div>
          
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          
          <button onClick={exportToPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>
      
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

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-6">Grafik Pendapatan Harian</h2>
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
             <div className="flex h-full items-center justify-center text-gray-400">Tidak ada data di rentang tanggal ini.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                <YAxis tickFormatter={(val) => `Rp${val/1000}k`} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: any) => formatRupiah(Number(value) || 0)} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Performa per Event */}
      <h2 className="text-xl font-bold mb-4">Performa per Event</h2>
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
            {filteredBookings.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Belum ada pemesanan.</td></tr>
            ) : (
              filteredBookings.map((booking) => (
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
                    {booking.payment_proof_url && (
                      <a href={booking.payment_proof_url} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 text-xs hover:underline mb-1">
                        <Eye className="w-3 h-3" /> Bukti Bayar
                      </a>
                    )}
                    {booking.status === 'cancellation_requested' && (
                      <div className="mt-2 bg-orange-50 p-2 rounded border border-orange-100 min-w-[120px]">
                         <div className="text-[10px] font-bold text-orange-800 uppercase">Alasan Batal:</div>
                         <p className="text-xs text-orange-900 mt-0.5 whitespace-normal break-words max-w-[200px]">{booking.cancellation_reason || 'Tidak ada alasan'}</p>
                         {booking.cancellation_proof_url && (
                           <a href={booking.cancellation_proof_url} target="_blank" rel="noreferrer" className="text-orange-600 flex items-center gap-1 text-[10px] hover:underline mt-1 font-bold">
                             <Eye className="w-3 h-3" /> Bukti Batal
                           </a>
                         )}
                      </div>
                    )}
                    {!booking.payment_proof_url && booking.status !== 'cancellation_requested' && <span className="text-xs text-gray-400">Tidak ada</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                      booking.status === 'rejected' || booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      booking.status === 'cancellation_requested' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {booking.status === 'cancellation_requested' ? 'Cancel Req' : booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {booking.status === 'cancellation_requested' ? (
                        <>
                          <button 
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            className="text-[10px] px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded font-bold uppercase tracking-wider transition-colors"
                            title="Setujui Batal"
                          >
                            Setujui Batal
                          </button>
                          <button 
                            onClick={() => updateStatus(booking.id, 'confirmed')}
                            className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded font-bold uppercase tracking-wider transition-colors"
                            title="Tolak Batal"
                          >
                            Tolak Batal
                          </button>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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