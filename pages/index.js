import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Footer from '../components/Footer';

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ make: '', model: '', year: '' });

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  // Inside index.js - Update handleSearch function:
  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
  
    // Use 'make', 'model', and 'year' as keys
    if (filters.make) params.set('make', filters.make);
    if (filters.model) params.set('model', filters.model);
    if (filters.year) params.set('year', filters.year);
  
    // Navigate to Dubai Market (verify this ID matches your DB)
    const marketId = '00000000-0000-0000-0000-000000000010';
    router.push(`/market/${marketId}?${params.toString()}`);
  }

  const makes = ['Toyota','Nissan','BMW','Mercedes-Benz','Lexus','Ford','Chevrolet','Jeep'];
  const years = Array.from({length: 26}, (_, i) => 2026 - i);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Head>
        <title>dawirny — UAE Car Markets</title>
        <meta name="description" content="Browse every dealer at Dubai Auto Market. Find the exact car. Walk straight to the showroom." />
      </Head>

      {/* HERO SECTION */}
      <div className="relative bg-white pb-20 pt-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-teal-50/50 skew-x-12 transform translate-x-20 z-0"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <header className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-teal-200" style={{ background: '#1A9988' }}>d</div>
              <span className="font-bold text-2xl tracking-tighter" style={{ color: '#1A9988' }}>dawirny</span>
            </div>
            <div className="flex gap-4">
              <button onClick={() => router.push('/dealer/login')} className="text-sm font-bold text-gray-400 hover:text-teal-600">Dealer Portal</button>
            </div>
          </header>

          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-none mb-6">
              FIND THE CAR.<br />
              <span style={{ color: '#1A9988' }}>WALK TO THE DOOR.</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium mb-10 max-w-xl">
              We map every showroom in the UAE's auto markets, so you don't have to wander. Search {stats?.total_vehicles || 'thousands'} live listings.
            </p>

            {/* NEW SEARCH BAR */}
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-3xl shadow-2xl border border-gray-100 flex flex-col md:flex-row gap-2 max-w-4xl">
              <div className="flex-1 px-4 py-3 border-r border-gray-50">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Make</label>
                <select 
                  className="w-full bg-transparent font-bold text-gray-800 outline-none appearance-none"
                  value={filters.make}
                  onChange={e => setFilters({...filters, make: e.target.value})}
                >
                  <option value="">Any Make</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex-1 px-4 py-3 border-r border-gray-50">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Model</label>
                <input 
                  type="text" 
                  placeholder="e.g. Patrol" 
                  className="w-full bg-transparent font-bold text-gray-800 outline-none"
                  value={filters.model}
                  onChange={e => setFilters({...filters, model: e.target.value})}
                />
              </div>
              <div className="flex-1 px-4 py-3">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Year</label>
                <select 
                  className="w-full bg-transparent font-bold text-gray-800 outline-none appearance-none"
                  value={filters.year}
                  onChange={e => setFilters({...filters, year: e.target.value})}
                >
                  <option value="">Any Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button 
                type="submit"
                className="px-8 py-4 rounded-2xl text-white font-black uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-teal-200"
                style={{ background: '#1A9988' }}
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MARKETS SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-20 w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase">Available Markets</h2>
            <p className="text-gray-500 font-medium">Select a market to see the live directory</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: '00000000-0000-0000-0000-000000000010', name: 'Dubai Auto Market', loc: 'Ras Al Khor', icon: '🏙️' },
            { id: 'coming-soon-1', name: 'Souq Al Haraj', loc: 'Sharjah', icon: '🏗️', soon: true },
            { id: 'coming-soon-2', name: 'Motor World', loc: 'Abu Dhabi', icon: '🏎️', soon: true },
          ].map((m) => (
            <div 
              key={m.id}
              onClick={() => !m.soon && router.push(`/market/${m.id}`)}
              className={`group p-8 rounded-[40px] border-2 transition-all cursor-pointer bg-white ${m.soon ? 'opacity-60 grayscale' : 'hover:border-teal-500 hover:shadow-xl hover:-translate-y-1 border-gray-100'}`}
            >
              <div className="text-4xl mb-6">{m.icon}</div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">{m.name}</h3>
              <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-6">📍 {m.loc}</p>
              
              {m.soon ? (
                <span className="px-4 py-1 bg-gray-100 text-gray-400 text-[10px] font-black uppercase rounded-full">Coming Soon</span>
              ) : (
                <span className="flex items-center gap-2 text-teal-600 font-black text-sm group-hover:gap-4 transition-all uppercase">
                  Browse Market →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}




