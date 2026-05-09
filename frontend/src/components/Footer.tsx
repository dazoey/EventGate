import { Ticket } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="footer" className="bg-[#0f172a] text-white py-12 px-6 md:px-12 mt-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-xl mb-4">
            <Ticket className="w-6 h-6" />
            <span>EventGate</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            EventGate is a global self-service ticketing platform for live experiences that allows anyone to create, share, find and attend events that fuel their passions and enrich their lives.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4">Plan Events</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-white">Create and Set Up</a></li>
            <li><a href="#" className="hover:text-white">Sell Tickets</a></li>
            <li><a href="#" className="hover:text-white">Online RSVP</a></li>
            <li><a href="#" className="hover:text-white">Online Events</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4">EventGate</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-white">About Us</a></li>

            <li><a href="#" className="hover:text-white">Contact Us</a></li>
          </ul>
        </div>
        

      </div>
      <div className="border-t border-gray-800 mt-12 pt-6 text-center text-xs text-gray-500">
        Copyright © 2026 Sharon Tabitha
      </div>
    </footer>
  );
}
