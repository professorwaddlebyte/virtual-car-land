import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../components/DawirnyLogo';
import Footer from '../components/Footer';

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  
  // Expanded filters to include model and year for better UX
  const [filters, setFilters] = useState({ make: '', model: '', year: '' });

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.make) params.set('make', filters.make);
    if (filters.model) params.set('model', filters.model);
    if (filters.year) params.set('year', filters.year);
    
    // Directs user to the main market ID with search queries attached
    router.push(`/market/00000000-0000-0000-0000-000000000010?${params}`);
  }

  const makes = ['Toyota','Nissan','Honda','Mitsubishi','Hyundai','Kia','Ford','Chevrolet','BMW','Mercedes-Benz','Lexus','Infiniti','Dodge','Jeep'];
  const years = Array.from({ length: 25 }, (_, i) => 2025 - i);

  return (
    <>
      <Head>
        <title>dawirny — UAE Car Markets</title>
        <meta name="description" content="Browse every dealer at UAE Auto Markets. Find the exact car. Walk straight to the showroom." />
      </Head>
      
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <DawirnyLogo size="sm" />
            <div className="flex items-center gap-6">
              <Link href="/shortlist" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Shortlist</Link>
              <Link href="/markets" className="px-6 py-3 rounded-2xl text-white text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-teal-900/20" style={{ background: '#1A9988' }}>
                Browse Markets
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d6b5e 0%, #1A9988 100%)' }}>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
            <p className="text-xl sm:text-2xl font-medium text-white opacity-90 mb-2">
              The Smart Way to
            </p>
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.1]" style={{ marginBottom: '24px' }}>
              Buy Cars in <br/>UAE.
            </h1>
            
            <p className="text-lg sm:text-xl font-bold max-w-2xl mx-auto" style={{ color: '#FFD700', marginBottom: '40px' }}>
              Search live inventory across UAE auto markets. No more endless walking.
            </p>

            {/* Search Bar - Landing Page Style */}
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-[28px] shadow-2xl mx-auto border-4" style={{ maxWidth: '800px', borderColor: '#1A9988' }}>
              <div className="flex flex-col md:flex-row gap-2">
                <select 
                  value={filters.make} 
                  onChange={e => setFilters({ ...filters, make: e.target.value })}
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="">All Makes</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                
                <input 
                  type="text" 
                  placeholder="Model (e.g. Camry)" 
                  value={filters.model} 
                  onChange={e => setFilters({ ...filters, model: e.target.value })}
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 focus:ring-0"
                />

                <select 
                  value={filters.year} 
                  onChange={e => setFilters({ ...filters, year: e.target.value })}
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer"
                >
                  <option value="">Any Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <button type="submit" className="md:w-auto px-10 py-4 rounded-[20px] text-white font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-teal-900/10" style={{ background: '#1A9988' }}>
                  Search
                </button>
              </div>
            </form>

            {/* Stats - Changed Live Listings to Cars */}
            {stats && (
              <div className="flex justify-center items-center gap-3 sm:gap-8 mt-16">
                {[
                  { value: stats.active_vehicles || 0, label: 'Cars' },
                  { value: stats.dealers || 0, label: 'Dealers' },
                  { value: stats.showrooms || 0, label: 'Showrooms' },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl py-4 px-6 min-w-[100px] sm:min-w-[140px]">
                    <p className="text-3xl sm:text-4xl font-black text-white leading-none">{s.value.toLocaleString()}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-teal-50 mt-2">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white border-t border-gray-100 flex-1">
          <div className="max-w-7xl mx-auto px-4" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
            <h2 className="text-3xl font-black text-gray-900 mb-2 text-center uppercase tracking-tight">How It Works</h2>
            <p className="text-gray-400 font-bold text-center mb-16 uppercase tracking-widest text-xs">From your phone to the showroom in minutes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { icon: '🔍', step: 'Search', desc: 'Filter by make, model, price and specs from home' },
                { icon: '📍', step: 'Locate', desc: 'See exactly which showroom has your car' },
                { icon: '🗺️', step: 'Navigate', desc: 'Get the showroom number and walk straight there' },
                { icon: '🤝', step: 'Deal', desc: 'Arrive informed with market price data in hand' },
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="text-5xl mb-6 transition-transform group-hover:scale-110 duration-300">{item.icon}</div>
                  <h3 className="text-lg font-black text-gray-900 mb-3 uppercase tracking-tighter">{item.step}</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}




