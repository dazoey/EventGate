import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetails from './pages/EventDetails';
import AdminDashboard from './pages/AdminDashboard';
import CreateEvent from './pages/CreateEvent';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Help from './pages/Help';
import OrganizerDashboard from './pages/OrganizerDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-gray-900">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/pengaturan" element={<Settings />} />
          <Route path="/bantuan" element={<Help />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/create-event" element={<CreateEvent />} />
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="*" element={<div className="p-10 text-center">Halaman Tidak Ditemukan (404)</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
