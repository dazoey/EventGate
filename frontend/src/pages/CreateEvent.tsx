import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Upload, MapPin, Calendar, DollarSign, Type, FileText } from 'lucide-react';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('date', formData.date);
    data.append('location', formData.location);
    data.append('price', formData.price);
    if (image) data.append('image', image);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        alert('Event berhasil dibuat!');
        navigate('/');
      } else {
        const err = await response.json();
        alert('Gagal membuat event: ' + err.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#0f172a] text-white p-8">
          <h1 className="text-3xl font-bold">Buat Event Baru</h1>
          <p className="text-gray-400 mt-2">Isi formulir di bawah untuk mempublikasikan event Anda ke EventGate.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Type className="w-4 h-4 text-blue-500" /> Nama Event
              </label>
              <input 
                required 
                type="text" 
                placeholder="Contoh: Konser Jazz Jakarta"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 text-blue-500" /> Tanggal
              </label>
              <input 
                required 
                type="text" 
                placeholder="Contoh: 15 DES 2026"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4 text-blue-500" /> Lokasi
              </label>
              <input 
                required 
                type="text" 
                placeholder="Contoh: Gelora Bung Karno"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <DollarSign className="w-4 h-4 text-blue-500" /> Harga Tiket (Rp)
              </label>
              <input 
                required 
                type="number" 
                placeholder="Contoh: 500000"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 text-blue-500" /> Deskripsi Event
            </label>
            <textarea 
              required 
              rows={4}
              placeholder="Jelaskan detail event Anda di sini..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Upload className="w-4 h-4 text-blue-500" /> Poster Event
            </label>
            <div className="relative group border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-blue-500 transition-colors text-center">
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setImage(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {image ? image.name : 'Klik atau seret gambar ke sini'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
            {loading ? 'Sedang Mempublikasikan...' : 'Publikasikan Event Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}
