import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../components/DawirnyLogo';
import Footer from '../components/Footer';

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ make: '', gcc: '' });

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.make) params.set('make', filters.make);
    if (filters.gcc) params.set('gcc', filters.gcc);
    router.push(`/market/00000000-0000-0000-0000-000000000010?${params}`);
  }

  const makes = ['Toyota','Nissan','Honda','Mitsubishi','Hyundai','Kia','Ford','Chevrolet','BMW','Mercedes-Benz','Lexus','Infiniti','Dodge','Jeep'];

  return (
    <>
      <Head>
        <title>dawirny — UAE Car Markets</title>
        <meta name="description" content="Browse every dealer at Dubai Auto Market. Find the exact car. Walk straight to the showroom." />
      </Head>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <DawirnyLogo size="md" />
              <Link href="/login" className="px-5 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all hover:bg-teal-50 active:scale-95"
                style={{ borderColor: '#1A9988', color: '#1A9988' }}>
                Dealer Login
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d6b5e 0%, #1A9988 100%)' }}>
          {/* Subtle Decorative Background Element */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10" style={{ paddingTop: '80px', paddingBottom: '100px' }}>
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.1]" style={{ marginBottom: '24px' }}>
              The Smart Way to <br/>Buy Cars in Dubai.
            </h1>
            <p className="text-xl font-medium max-w-2xl mx-auto opacity-90 text-teal-50" style={{ marginBottom: '48px' }}>
              Search live inventory across the <span className="text-yellow-400 font-bold">Ras Al Khor</span> auto market. No more endless walking.
            </p>

            {/* Search Glassmorphism Card */}
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-[28px] shadow-2xl shadow-black/20 mx-auto transition-transform hover:scale-[1.01]" style={{ maxWidth: '640px' }}>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={filters.make} onChange={e => setFilters({ ...filters, make: e.target.value })}
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-teal-500 text-gray-700 appearance-none cursor-pointer">
                  <option value="">All Makes</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filters.gcc} onChange={e => setFilters({ ...filters, gcc: e.target.value })}
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-teal-500 text-gray-700 appearance-none cursor-pointer">
                  <option value="">All Specs</option>
                  <option value="true">GCC Specs Only</option>
                  <option value="false">Non-GCC Only</option>
                </select>
                <button type="submit" className="sm:w-auto px-8 py-4 rounded-[20px] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-900/20 transition-all hover:brightness-110 active:scale-95" style={{ background: '#1A9988' }}>
                  Search
                </button>
              </div>
            </form>

            {/* Stats Pill */}
            {stats && (
              <div className="inline-flex items-center gap-12 mt-12 bg-black/10 backdrop-blur-md px-10 py-5 rounded-3xl border border-white/10">
                {[
                  { value: stats.active_vehicles || 0, label: 'Live Listings' },
                  { value: stats.dealers || 0, label: 'Dealers' },
                  { value: stats.showrooms || 0, label: 'Showrooms' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl font-black text-white">{s.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-teal-100/70 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Browse by Market */}
        <div className="max-w-7xl mx-auto px-4 w-full" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Browse by Market</h2>
              <p className="text-gray-500 font-medium">Select a physical location to explore inventory</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <Link href="/market/00000000-0000-0000-0000-000000000010"
              className="group relative bg-white rounded-[32px] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-teal-100 mb-6 group-hover:rotate-6 transition-transform">🏪</div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">Dubai Auto Market</h3>
                <p className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-6">Ras Al Khor, Dubai</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <span className="text-3xl font-black text-gray-900">
                    {stats?.active_vehicles || '—'}
                    <span className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-tighter">Cars</span>
                  </span>
                  <div className="w-10 h-10 rounded-full border-2 border-teal-600 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    →
                  </div>
                </div>
              </div>
            </Link>

            {[{ name: 'Sharjah Auto Market', city: 'Sharjah' }, { name: 'Abu Dhabi Auto Market', city: 'Abu Dhabi' }].map((market, i) => (
              <div key={i} className="bg-gray-100/50 rounded-[32px] p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center text-3xl mb-4 grayscale">🏪</div>
                <h3 className="text-xl font-bold text-gray-400">{market.name}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 mb-4">{market.city}</p>
                <span className="px-4 py-1.5 bg-white text-gray-400 text-[10px] font-black uppercase rounded-full border border-gray-200">Coming Soon</span>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white py-24 border-t border-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">The Dawirny Advantage</h2>
              <p className="text-gray-500 font-medium italic">From your phone to the showroom floor in four simple steps.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-12">
              {[
                { icon: '🔍', step: 'Search', desc: 'Filter by make, model, and price from your couch.', color: 'bg-blue-50' },
                { icon: '📍', step: 'Locate', desc: 'Identify the exact showroom holding the keys.', color: 'bg-purple-50' },
                { icon: '🗺️', step: 'Navigate', desc: 'Use our market map to walk straight to the door.', color: 'bg-teal-50' },
                { icon: '🤝', step: 'Deal', desc: 'Close the deal with transparent market data.', color: 'bg-yellow-50' },
              ].map((item, i) => (
                <div key={i} className="group text-center">
                  <div className={`w-20 h-20 ${item.color} rounded-[28px] flex items-center justify-center text-4xl mx-auto mb-6 transition-transform group-hover:-translate-y-2 duration-300 shadow-sm`}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tighter">{item.step}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed px-4">{item.desc}</p>
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


