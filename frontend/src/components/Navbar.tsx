import { Link, useNavigate } from 'react-router-dom';
import { Ticket, User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profiles/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Navbar profile fetch error:', err);
    }
  };

  useEffect(() => {
    // 1. Ambil sesi awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    // 2. Dengerin perubahan login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // 3. Dengerin event custom "profileUpdated" biar navbar ganti nama detik itu juga
    const handleProfileUpdate = () => {
      if (user) fetchProfile(user.id);
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="sticky top-0 w-full bg-[#0f172a]/95 backdrop-blur-md text-white py-4 px-6 md:px-12 z-[100] border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl group" onClick={() => setIsMenuOpen(false)}>
          <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-pink-500/20">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <span className="tracking-tighter uppercase font-black">EventGate</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest">
          <Link to="/profil" className="hover:text-pink-500 transition-colors">Profil</Link>
          <Link to="/pengaturan" className="hover:text-pink-500 transition-colors">Pengaturan</Link>
          <Link to="/bantuan" className="hover:text-pink-500 transition-colors">Bantuan</Link>
          
          {user ? (
            <div className="flex items-center gap-6 pl-6 border-l border-white/10">
              <div className="flex items-center gap-2 text-blue-400">
                <UserIcon className="w-4 h-4" />
                <span className="max-w-[150px] truncate">{displayName}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-white text-[#0f172a] px-6 py-2.5 rounded-full hover:bg-pink-500 hover:text-white transition-all active:scale-95">
              Login
            </Link>
          )}
        </div>

        <button className="md:hidden w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0f172a] border-t border-white/5 shadow-2xl p-8 flex flex-col gap-6 md:hidden">
          <Link to="/profil" className="flex items-center justify-between py-2" onClick={() => setIsMenuOpen(false)}>
             <span className="text-lg font-bold uppercase group-hover:text-pink-500">Profil Saya</span>
             <UserIcon className="w-5 h-5 text-blue-400" />
          </Link>
          <Link to="/pengaturan" className="flex items-center justify-between py-2" onClick={() => setIsMenuOpen(false)}>
             <span className="text-lg font-bold uppercase group-hover:text-pink-500">Pengaturan</span>
             <Menu className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="h-px bg-white/5 my-2"></div>
          {user ? (
            <div className="flex flex-col gap-6">
              <div className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                {displayName}
              </div>
              <button onClick={handleLogout} className="w-full bg-red-600/10 text-red-500 font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-3">
                <LogOut className="w-5 h-5" />
                <span>Keluar Akun</span>
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full bg-pink-600 text-white font-black uppercase py-4 rounded-2xl text-center">
              Login Sekarang
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
