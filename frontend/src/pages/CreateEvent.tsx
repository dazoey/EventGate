import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Upload, MapPin, Calendar, DollarSign, Type, FileText, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [calViewYear, setCalViewYear] = useState(new Date().getFullYear());
  const [calViewMonth, setCalViewMonth] = useState(new Date().getMonth());

  // State sementara di dalam picker — baru diterapkan saat klik "Terapkan"
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [yearInput, setYearInput] = useState(String(new Date().getFullYear()));

  const calendarRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: ''
  });

  const today = new Date();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
        setShowMonthYearPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync state sementara saat picker dibuka
  const openMonthYearPicker = () => {
    setPickerYear(calViewYear);
    setPickerMonth(calViewMonth);
    setYearInput(String(calViewYear));
    setShowMonthYearPicker(true);
  };

  const handleApplyPicker = () => {
    const parsed = parseInt(yearInput);
    const finalYear = !isNaN(parsed) && parsed > 0 ? parsed : pickerYear;
    setCalViewYear(finalYear);
    setCalViewMonth(pickerMonth);
    setShowMonthYearPicker(false);
  };

  const handleSelectDate = (y: number, m: number, d: number) => {
    const formatted = `${d} ${MONTHS_ID[m].slice(0, 3).toUpperCase()} ${y}`;
    setFormData({ ...formData, date: formatted });
    setShowCalendar(false);
    setShowMonthYearPicker(false);
  };

  const changeMonth = (dir: number) => {
    let m = calViewMonth + dir;
    let y = calViewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCalViewMonth(m);
    setCalViewYear(y);
  };

  const adjustPickerYear = (dir: number) => {
    const next = pickerYear + dir;
    setPickerYear(next);
    setYearInput(String(next));
  };

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setYearInput(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed > 0) setPickerYear(parsed);
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

  const formatRupiah = (value: string) => {
    const angka = value.replace(/\D/g, '');
    return angka.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

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
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 text-blue-500" /> Tanggal
              </label>
              <div className="relative" ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCalendar(!showCalendar);
                    setShowMonthYearPicker(false);
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl outline-none transition-all text-left flex items-center gap-2 bg-white ${
                    showCalendar ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className={formData.date ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.date || 'Pilih tanggal event...'}
                  </span>
                  <span className="ml-auto text-gray-400 text-xs">{showCalendar ? '▲' : '▼'}</span>
                </button>

                {showCalendar && (
                  <div className="absolute z-50 top-full mt-2 left-0 w-72 bg-[#1e2d45] border border-[#2d4a6b] rounded-2xl p-4 shadow-xl">

                    {!showMonthYearPicker ? (
                      <>
                        {/* Header kalender biasa */}
                        <div className="flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#2d4a6b] hover:text-white transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={openMonthYearPicker}
                            className="text-white text-sm font-semibold px-2 py-1 rounded-lg hover:bg-[#2d4a6b] transition-colors flex items-center gap-1"
                          >
                            {MONTHS_ID[calViewMonth]} {calViewYear}
                            <span className="text-gray-400 text-[10px]">▼</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-[#2d4a6b] hover:text-white transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Nama hari */}
                        <div className="grid grid-cols-7 mb-1">
                          {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(h => (
                            <div key={h} className="text-center text-[10px] font-semibold text-gray-500 py-1">{h}</div>
                          ))}
                        </div>

                        {/* Grid tanggal */}
                        <div className="grid grid-cols-7 gap-0.5">
                          {Array.from({ length: getFirstDay(calViewYear, calViewMonth) }).map((_, i) => (
                            <div key={`empty-${i}`} />
                          ))}
                          {Array.from({ length: getDaysInMonth(calViewYear, calViewMonth) }).map((_, i) => {
                            const d = i + 1;
                            const isToday =
                              d === today.getDate() &&
                              calViewMonth === today.getMonth() &&
                              calViewYear === today.getFullYear();
                            const isSelected =
                              formData.date === `${d} ${MONTHS_ID[calViewMonth].slice(0, 3).toUpperCase()} ${calViewYear}`;
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => handleSelectDate(calViewYear, calViewMonth, d)}
                                className={`aspect-square text-xs rounded-full flex items-center justify-center transition-colors
                                  ${isSelected
                                    ? 'bg-blue-500 text-white font-bold'
                                    : isToday
                                    ? 'text-blue-400 font-bold hover:bg-[#2d4a6b]'
                                    : 'text-gray-300 hover:bg-[#2d4a6b] hover:text-white'
                                  }`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2d4a6b]">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, date: '' })}
                            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                          >
                            Hapus pilihan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCalViewYear(today.getFullYear());
                              setCalViewMonth(today.getMonth());
                            }}
                            className="text-xs bg-[#2d4a6b] hover:bg-[#3a5f8a] text-white px-3 py-1 rounded-lg transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Month/Year Picker Panel — pilih bulan & tahun sekaligus, baru klik Terapkan */
                      <div>
                        <p className="text-gray-400 text-xs font-semibold mb-3 text-center tracking-wide uppercase">
                          Pilih Bulan & Tahun
                        </p>

                        {/* Input tahun dengan tombol +/- */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <button
                            type="button"
                            onClick={() => adjustPickerYear(-1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2d4a6b] text-gray-300 hover:text-white transition-colors"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={yearInput}
                            onChange={handleYearInputChange}
                            className="w-20 text-center text-white font-bold text-lg bg-[#2d4a6b] border border-[#3a5f8a] rounded-xl py-1 outline-none focus:border-blue-400"
                          />
                          <button
                            type="button"
                            onClick={() => adjustPickerYear(1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2d4a6b] text-gray-300 hover:text-white transition-colors"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Grid 12 bulan */}
                        <div className="grid grid-cols-3 gap-1.5 mb-4">
                          {MONTHS_SHORT.map((m, i) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setPickerMonth(i)}
                              className={`text-xs py-2 rounded-xl transition-colors font-medium ${
                                i === pickerMonth
                                  ? 'bg-blue-500 text-white'
                                  : 'text-gray-300 hover:bg-[#2d4a6b] hover:text-white'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>

                        {/* Tombol aksi */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMonthYearPicker(false)}
                            className="flex-1 text-xs text-gray-400 hover:text-white py-2 rounded-xl bg-[#2d4a6b] hover:bg-[#3a5f8a] transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyPicker}
                            className="flex-1 text-xs text-white py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors font-semibold"
                          >
                            Terapkan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <DollarSign className="w-4 h-4 text-blue-500" /> Harga Tiket (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">Rp</span>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatRupiah(formData.price)}
                  onChange={e => setFormData({ ...formData, price: e.target.value.replace(/\D/g, '') })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
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
              onChange={e => setFormData({ ...formData, description: e.target.value })}
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