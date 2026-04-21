import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Loader2, AlertCircle, Search, SlidersHorizontal, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  image_url: string;
  created_at: string;
}

const mockEvents: Event[] = [
  { id: 'm1', title: 'DWP 2026', date: '14 APR', location: 'Bali, Indonesia', price: 900000, image_url: 'https://images.unsplash.com/photo-1540039155732-6761b54cb993?auto=format&fit=crop&w=400&h=250', description: "We'll get you directly seated and inside for you to enjoy the show.", created_at: new Date().toISOString() },
  { id: 'm2', title: 'EMINA JELLY TINT WORKSHOP', date: '20 AUG', location: 'Jakarta', price: 150000, image_url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=400&h=250', description: "Directly seated and inside for you to enjoy the show.", created_at: new Date().toISOString() },
  { id: 'm3', title: 'JUSTIN BEIBER 2026 TOUR', date: '18 SEP', location: 'Jakarta', price: 2500000, image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=400&h=250', description: "Directly seated and inside for you to enjoy the show.", created_at: new Date().toISOString() },
];

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSampleMode, setIsSampleMode] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [placeTerm, setPlaceTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (placeTerm) params.append('place', placeTerm);
      if (sortBy) params.append('sort', sortBy);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      // Jika database kosong, gunakan mock data
      if (data.length === 0 && !searchTerm && !placeTerm) {
        setEvents(mockEvents);
        setIsSampleMode(true);
      } else {
        setEvents(data);
        setIsSampleMode(false);
      }
    } catch (err) {
      console.warn('Backend disconnected, using sample data');
      setEvents(mockEvents);
      setIsSampleMode(true);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, placeTerm, sortBy]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 400); // Debounce typing

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, placeTerm, sortBy, fetchEvents]);

  const scrollToEvents = () => {
    document.getElementById('upcoming-events')?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPlaceTerm('');
    setSortBy('newest');
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="bg-[#0f172a] text-white py-20 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase leading-tight tracking-tighter">EventGate<br/>Your Gateway to Events</h1>
          <p className="text-gray-400 mb-8 max-w-lg text-lg leading-relaxed">
            Temukan dan pesan tiket event favoritmu dengan mudah, cepat, dan aman hanya di EventGate.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={scrollToEvents}
              className="bg-pink-600 hover:bg-pink-700 px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-pink-500/20 active:scale-95"
            >
              Get Ticket
            </button>
            <button className="border border-white/20 hover:bg-white/10 px-8 py-3 rounded-full font-medium transition-all">
              Learn More
            </button>
          </div>
        </div>
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-gradient-to-b from-transparent to-[#0f172a]" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&h=600)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-6xl mx-auto -mt-12 relative z-20 px-4">
        <div className="bg-[#1e293b] rounded-[2.5rem] p-6 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] text-white flex flex-col md:flex-row items-center gap-8 border border-white/10 backdrop-blur-xl">
          
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Pencarian Event</label>
              {searchTerm && <button onClick={() => setSearchTerm('')}><X className="w-3 h-3 text-gray-500" /></button>}
            </div>
            <div className="flex items-center gap-3 border-b border-gray-700 pb-2 focus-within:border-pink-500 transition-all duration-300">
              <Search className="w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Konser, Workshop..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent outline-none text-base placeholder:text-gray-600 font-medium" 
              />
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-gray-800"></div>
          
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Lokasi</label>
              {placeTerm && <button onClick={() => setPlaceTerm('')}><X className="w-3 h-3 text-gray-500" /></button>}
            </div>
            <div className="flex items-center gap-3 border-b border-gray-700 pb-2 focus-within:border-pink-500 transition-all duration-300">
              <MapPin className="w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Jakarta, Bali..." 
                value={placeTerm}
                onChange={(e) => setPlaceTerm(e.target.value)}
                className="w-full bg-transparent outline-none text-base placeholder:text-gray-600 font-medium" 
              />
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-gray-800"></div>

          <div className="flex-1 w-full space-y-3">
            <label className="text-[10px] text-blue-400 block font-black uppercase tracking-[0.2em]">Urutkan</label>
            <div className="flex items-center gap-3 border-b border-gray-700 pb-2 focus-within:border-pink-500 transition-all duration-300">
              <SlidersHorizontal className="w-5 h-5 text-gray-500" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent outline-none text-base cursor-pointer appearance-none font-medium"
              >
                <option value="newest" className="bg-[#1e293b]">Terbaru</option>
                <option value="price-asc" className="bg-[#1e293b]">Harga Terendah</option>
                <option value="price-desc" className="bg-[#1e293b]">Harga Tertinggi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events Listing */}
      <div id="upcoming-events" className="max-w-7xl mx-auto py-24 px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] uppercase tracking-tighter leading-none">Upcoming<br/>Events</h2>
            <div className="w-24 h-2 bg-gradient-to-r from-blue-600 to-pink-500 mt-6 rounded-full"></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-gray-300 uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-xl">
              {events.length} Terdeteksi
            </span>
            {isSampleMode && (
              <div className="flex items-center gap-2 text-[10px] text-pink-600 bg-pink-50 border border-pink-100 px-4 py-2 rounded-xl font-black uppercase">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Sample Data</span>
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-40 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              <Ticket className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Sinkronisasi Database...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-32 bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-white shadow-xl rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase">Event Tidak Ditemukan</h3>
            <p className="text-gray-500 mt-3 font-medium">Maaf, pencarian "{searchTerm}" di "{placeTerm}" tidak menghasilkan apa-apa.</p>
            <button 
              onClick={clearFilters}
              className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
            >
              Ulangi Pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {events.map(event => (
              <Link to={`/events/${event.id}`} key={event.id} className="group relative flex flex-col h-full">
                <div className="relative aspect-[4/3] rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-pink-500/10">
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10">
                     <span className="text-white font-black uppercase tracking-widest text-xs">Lihat Detail Tiket →</span>
                  </div>
                  
                  {/* Date Badge */}
                  <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-md px-4 py-3 rounded-[1.5rem] text-center shadow-2xl min-w-[70px]">
                    <div className="text-blue-600 text-[10px] font-black uppercase leading-none tracking-widest mb-1">{event.date.split(' ')[1] || 'APR'}</div>
                    <div className="text-gray-900 text-3xl font-black leading-none">{event.date.split(' ')[0] || '14'}</div>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-8 right-8 bg-white px-5 py-2 rounded-2xl text-blue-600 font-black text-sm shadow-2xl">
                    Rp {Number(event.price).toLocaleString('id-ID')}
                  </div>
                </div>
                
                <div className="mt-8 px-4 flex flex-col flex-grow">
                  <h3 className="font-black text-gray-900 text-2xl mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm font-black text-gray-400 mb-4 uppercase tracking-widest">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                    <span className="truncate">{event.location}</span>
                  </div>
                  <p className="text-gray-500 line-clamp-2 leading-relaxed text-sm font-medium">{event.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Event Banner */}
      <div className="bg-[#0f172a] py-28 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full -mr-64 -mt-64 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/10 rounded-full -ml-64 -mb-64 blur-[120px]"></div>

        <div className="max-w-5xl mx-auto flex items-center justify-between flex-col md:flex-row gap-20 relative z-10 text-white">
          <div className="text-center md:text-left flex-1">
            <h2 className="text-4xl md:text-6xl font-black mb-8 uppercase leading-[0.9] tracking-tighter">Bikin Event<br/><span className="text-pink-500">Hebatmu</span> Disini</h2>
            <p className="text-gray-400 mb-12 max-w-md text-lg leading-relaxed font-medium">Gabung dengan ribuan penyelenggara profesional lainnya. Kelola tiket, pantau transaksi, dan kembangkan komunitas Anda secara gratis.</p>
            <Link 
              to="/admin/create-event"
              className="inline-block bg-white text-blue-900 px-12 py-5 rounded-[2.5rem] font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95 text-sm"
            >
              Mulai Sekarang
            </Link>
          </div>
          <div className="w-full md:w-auto flex justify-center perspective-1000">
            <div className="w-80 h-56 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-2xl rounded-[3.5rem] flex flex-col items-center justify-center text-blue-400 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rotate-6 hover:rotate-0 transition-all duration-700 cursor-default group/card">
               <div className="w-24 h-24 bg-gradient-to-br from-blue-500/30 to-pink-500/30 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner group-hover/card:scale-110 transition-transform">
                  <Ticket className="w-12 h-12 text-white" />
               </div>
               <span className="font-black tracking-[0.4em] text-[10px] uppercase opacity-40 group-hover/card:opacity-100 transition-opacity">EventGate Master</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
