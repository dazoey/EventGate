import { HelpCircle, Mail, MessageSquare, Phone } from 'lucide-react';

export default function Help() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-[#0f172a] uppercase tracking-tighter">Pusat Bantuan</h1>
        <p className="text-gray-500 mt-4 font-medium">Kami siap membantu kendala transaksi dan penggunaan platform EventGate.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest mb-2">Live Chat</h3>
          <p className="text-gray-500 text-sm leading-relaxed">Hubungi customer service kami yang aktif 24/7 untuk bantuan instan.</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group">
          <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-pink-600 group-hover:text-white transition-colors">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest mb-2">Email Support</h3>
          <p className="text-gray-500 text-sm leading-relaxed">Kirimkan pertanyaan atau laporan kendala ke support@eventgate.com.</p>
        </div>
      </div>

      <div className="mt-12 p-10 bg-[#0f172a] rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Butuh bantuan cepat?</h3>
          <p className="text-gray-400 mt-2 font-medium">Tim teknis kami akan merespon dalam waktu kurang dari 15 menit.</p>
        </div>
        <button className="bg-white text-[#0f172a] px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-pink-500 hover:text-white transition-all active:scale-95 shadow-2xl">
          Hubungi Kami
        </button>
      </div>
    </div>
  );
}
