import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../components/DawirnyLogo';
import Footer from '../components/Footer';

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
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
        
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <DawirnyLogo size="sm" />
            <div className="flex items-center gap-6">
              <Link href="/login" className="px-5 py-2.5 rounded-2xl text-white text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-teal-900/20" style={{ background: '#1A9988' }}>
                Dealer Login
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section - 3) Reduced bottom padding to shrink green area */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d6b5e 0%, #1A9988 100%)' }}>
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10" style={{ paddingTop: '30px', paddingBottom: '60px' }}>
            {/* 1) Moved "The Smart Way to" up (reduced pt) */}
            <p className="text-xl sm:text-2xl font-medium text-white opacity-90 mb-2">
              The Smart Way to
            </p>
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.1]" style={{ marginBottom: '24px' }}>
              Buy Cars in <br/>UAE.
            </h1>
            
            <p className="text-lg sm:text-xl font-bold max-w-2xl mx-auto" style={{ color: '#FFD700', marginBottom: '40px' }}>
              Search live inventory across UAE auto markets. No more endless walking.
            </p>

            <form onSubmit={handleSearch} className="bg-white p-2 rounded-[28px] shadow-2xl mx-auto border-4" style={{ maxWidth: '800px', borderColor: '#1A9988' }}>
              <div className="flex flex-col md:flex-row gap-2">
                <select value={filters.make} onChange={e => setFilters({ ...filters, make: e.target.value })}
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 appearance-none cursor-pointer">
                  <option value="">All Makes</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                
                <input type="text" placeholder="Model..." value={filters.model} onChange={e => setFilters({ ...filters, model: e.target.value })}
                  className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 focus:border-[#1A9988] outline-none" />

                <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 appearance-none cursor-pointer">
                  <option value="">Any Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <button type="submit" className="md:w-auto px-10 py-4 rounded-[20px] text-white font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-lg" style={{ background: '#1A9988' }}>
                  Search
                </button>
              </div>
            </form>

            {/* 2) Moved stats down (mt-24) and made borders fully rounded */}
            {stats && (
              <div className="flex justify-center items-center gap-3 sm:gap-8 mt-24">
                {[
                  { value: stats.active_vehicles || 0, label: 'Cars' },
                  { value: stats.dealers || 0, label: 'Dealers' },
                  { value: stats.showrooms || 0, label: 'Showrooms' },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-6 px-8 min-w-[110px] sm:min-w-[160px]">
                    <p className="text-3xl sm:text-4xl font-black text-white leading-none">{s.value.toLocaleString()}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-teal-50 mt-2">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4) Gap between Hero and Browse Markets */}
        <div className="bg-gray-50 h-16 w-full"></div>

        {/* Browse Markets Section */}
        <div className="bg-white py-20 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Browse by Market</h2>
                <p className="text-gray-500 font-bold mt-2">Every showroom in the UAE, indexed and searchable.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Ras Al Khor', location: 'Dubai', count: stats?.active_vehicles || '...', id: '00000000-0000-0000-0000-000000000010' },
                { name: 'Souq Al Haraj', location: 'Sharjah', count: 'Coming Soon', id: null },
                { name: 'Motor World', location: 'Abu Dhabi', count: 'Coming Soon', id: null },
              ].map((m, i) => (
                <div key={i} className={`group relative rounded-[40px] p-8 border-2 transition-all ${m.id ? 'border-gray-100 hover:border-[#1A9988] cursor-pointer' : 'border-dashed border-gray-200 opacity-60'}`}>
                  {m.id && <Link href={`/market/${m.id}`} className="absolute inset-0 z-10" />}
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-teal-50 transition-colors">🏙️</div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">{m.location}</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{m.name}</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{m.count} {m.id ? 'Cars Available' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5) Gap between Browse Markets and How It Works */}
        <div className="bg-gray-50 h-16 w-full"></div>

        {/* How It Works Section */}
        <div className="bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center uppercase tracking-tight">How It Works</h2>
            <p className="text-gray-400 font-bold text-center mb-16 uppercase tracking-widest text-xs">From your phone to the showroom in minutes</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { icon: '🔍', step: 'Search', desc: 'Filter by make, model, price and specs from home' },
                { icon: '📍', step: 'Locate', desc: 'See exactly which showroom has your car' },
                { icon: '🗺️', step: 'Navigate', desc: 'Get the showroom number and walk straight there' },
                { icon: '🤝', step: 'Deal', desc: 'Arrive informed with market price data in hand' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-wider">{item.step}</h3>
                  <p className="text-[11px] text-gray-500 font-bold leading-relaxed px-2 uppercase">{item.desc}</p>
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



