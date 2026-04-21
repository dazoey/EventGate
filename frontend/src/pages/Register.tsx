import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        alert('Registrasi berhasil! Silakan cek email Anda untuk verifikasi (jika diaktifkan) atau silakan login.');
        navigate('/login');
      }
    } catch (error: any) {
      alert('Gagal daftar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="hidden md:flex w-1/2 bg-[#081229] p-12 flex-col justify-between text-white relative">
        <div className="flex items-center gap-2 font-bold text-xl z-10">
          <Ticket className="w-6 h-6" />
          <span>EventGate</span>
        </div>
        
        <div className="z-10 mt-auto mb-20">
          <h1 className="text-4xl lg:text-5xl font-light italic text-blue-200 leading-tight">
            Gerbang Utama<br />
            Menuju Event Seru,<br />
            Kapan Saja, Di<br />
            Mana Saja!
          </h1>
        </div>
        
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 to-transparent pointer-events-none"></div>
      </div>

      {/* Right Content */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-none p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Create an account</h2>
          
          <form className="space-y-4" onSubmit={handleSignUp}>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eventgate123@gmail.com" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-4 flex justify-center items-center gap-2"
            >
              {loading && <Loader2 className="animate-spin w-5 h-5" />}
              {loading ? 'Processing...' : 'Create account'}
            </button>
            
            <button type="button" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium py-2.5 rounded-lg transition-colors mt-3 flex items-center justify-center gap-2">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
              Continue with Google
            </button>
          </form>
          
          <div className="text-center mt-6 text-sm text-gray-600">
            Already Have An Account ? <Link to="/login" className="text-blue-600 hover:underline font-medium">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
