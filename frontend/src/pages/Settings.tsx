import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, Save, Loader2, Bell, Lock, Check, AlertCircle } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');

  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    email_tickets: true,
    event_updates: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        navigate('/login');
        return;
      }

      const id = session.user.id;
      setUserId(id);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.id) {
            setFormData({
              full_name: data.full_name || '',
              display_name: data.display_name || '',
              email_tickets: data.email_tickets ?? true,
              event_updates: data.event_updates ?? false
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!userId) {
      alert('Sesi Anda habis, silakan login kembali.');
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal menyimpan');
      }

      // DISINI KUNCINYA: Kirim event buat ngasih tau Navbar biar update namanya
      window.dispatchEvent(new Event('profileUpdated'));

      if (e) alert('Pengaturan berhasil disimpan!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key: 'email_tickets' | 'event_updates') => {
    const newVal = !formData[key];
    const newFormData = { ...formData, [key]: newVal };
    setFormData(newFormData);
    saveSilently(newFormData);
  };

  const saveSilently = async (updatedData: typeof formData) => {
    if (!userId) return;
    setSaving(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/profiles/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err) {
      console.error('Silent save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4 text-[#0f172a]">
        <Loader2 className="animate-spin w-12 h-12 text-blue-600" />
        <p className="font-black uppercase tracking-widest text-[10px]">Sinkronisasi Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-[#0f172a] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
          <SettingsIcon className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter">Pengaturan Akun</h1>
          <p className="text-gray-400 text-sm font-medium">Kelola informasi profil dan preferensi notifikasi Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-100'}`}>
            <User className="w-4 h-4" />
            Profil Publik
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Bell className="w-4 h-4" />
            Notifikasi
          </button>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'profile' ? (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">Nama Lengkap</label>
                    <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">Nama Tampilan</label>
                    <input type="text" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-900" />
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-black tracking-widest">
                    {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Sedang Menyimpan...</> : <><Check className="w-3 h-3 text-green-500" /> Semua Perubahan Tersimpan</>}
                  </div>
                  <button type="submit" disabled={saving} className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-[#0f172a] text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-2xl disabled:bg-gray-400">
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:border-blue-200 transition-colors">
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-xs tracking-[0.2em]">Email Tiket</h4>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Terima bukti pemesanan dan tiket PDF via email.</p>
                  </div>
                  <button onClick={() => toggleNotification('email_tickets')} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${formData.email_tickets ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${formData.email_tickets ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:border-blue-200 transition-colors">
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-xs tracking-[0.2em]">Update Event</h4>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Dapatkan info event terbaru berdasarkan lokasimu.</p>
                  </div>
                  <button onClick={() => toggleNotification('event_updates')} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${formData.event_updates ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${formData.event_updates ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
