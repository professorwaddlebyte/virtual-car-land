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
    fetch('/api/health').then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.make) params.set('make', filters.make);
    if (filters.model) params.set('model', filters.model);
    if (filters.year) params.set('year', filters.year);
    // Routing to the primary Dubai Market ID as per project specs
    router.push(`/market/00000000-0000-0000-0000-000000000010?${params}`);
  }

  const makes = ['Toyota','Nissan','Honda','Mitsubishi','Hyundai','Kia','Ford','Chevrolet','BMW','Mercedes-Benz','Lexus','Infiniti','Dodge','Jeep'];
  const years = Array.from({ length: 25 }, (_, i) => 2026 - i);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Head>
        <title>dawirny — UAE Car Marketplace</title>
        <meta name="description" content="Browse every dealer at Dubai Auto Market. Find the exact car. Walk straight to the showroom." />
      </Head>

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <DawirnyLogo size="md" />
          <Link href="/login" className="px-6 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all hover:bg-teal-50"
            style={{ borderColor: '#1A9988', color: '#1A9988' }}>
            Dealer Login
          </Link>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative py-20 px-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d6b5e 0%, #1A9988 50%, #22b8a4 100%)' }}>
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight uppercase tracking-tighter mb-6">
              Find Your Car at <br/><span className="text-teal-200">Dubai Auto Market</span>
            </h1>
            <p className="text-xl font-medium text-teal-50/80 mb-12 max-w-2xl mx-auto">
              The professional gateway to Ras Al Khor. Browse live inventory and walk straight to the right showroom.
            </p>

            <div className="bg-white/10 backdrop-blur-xl p-2 rounded-[40px] shadow-2xl max-w-4xl mx-auto border border-white/20">
              <form onSubmit={handleSearch} className="bg-white rounded-[32px] p-4 shadow-inner grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex flex-col text-left px-4 border-r border-gray-100 last:border-0">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Make</label>
                  <select 
                    value={filters.make} 
                    onChange={e => setFilters({ ...filters, make: e.target.value })}
                    className="w-full bg-transparent font-bold text-gray-900 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">All Makes</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col text-left px-4 border-r border-gray-100 last:border-0">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Model</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Land Cruiser"
                    value={filters.model} 
                    onChange={e => setFilters({ ...filters, model: e.target.value })}
                    className="w-full bg-transparent font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col text-left px-4 border-r border-gray-100 last:border-0">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Year</label>
                  <select 
                    value={filters.year} 
                    onChange={e => setFilters({ ...filters, year: e.target.value })}
                    className="w-full bg-transparent font-bold text-gray-900 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Any Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
                  SEARCH CARS
                </button>
              </form>
            </div>

            {stats && (
              <div className="flex justify-center gap-12 mt-16">
                {[
                  { value: stats.active_vehicles, label: 'Cars Live' },
                  { value: stats.dealers, label: 'Verified Dealers' },
                  { value: stats.showrooms, label: 'Showrooms' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-4xl font-black text-white leading-none">{s.value}</p>
                    <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mt-2">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* MARKET SELECTOR */}
        <section className="max-w-7xl mx-auto px-4 py-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-900 uppercase">Browse Markets</h2>
              <p className="text-gray-500 font-medium">Select a physical location to explore</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/market/00000000-0000-0000-0000-000000000010" className="group">
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-6xl italic font-black">DXB</span>
                </div>
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-3xl mb-6">🏪</div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase">Dubai Auto Market</h3>
                <p className="text-gray-500 text-sm font-medium mb-6">Ras Al Khor, Industrial 3</p>
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <span className="text-xl font-black text-teal-600">{stats?.active_vehicles || '--'} <span className="text-xs text-gray-400">CARS</span></span>
                  <span className="font-bold text-sm text-gray-900 group-hover:text-teal-600">BROWSE →</span>
                </div>
              </div>
            </Link>

            {/* Coming Soon Placeholders */}
            {['Sharjah', 'Abu Dhabi'].map((city) => (
              <div key={city} className="bg-gray-50 rounded-[40px] p-8 border-2 border-dashed border-gray-200 opacity-60">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-6 grayscale">🏗️</div>
                <h3 className="text-2xl font-black text-gray-400 mb-2 uppercase">{city} Market</h3>
                <p className="text-gray-400 text-sm font-medium mb-6">Coming Soon</p>
                <div className="h-[1px] bg-gray-200 w-full"></div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}



