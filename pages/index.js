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
    router.push(`/market/00000000-0000-0000-0000-000000000010?${params}`);
  }

  const makes = ['Toyota','Nissan','Honda','Mitsubishi','Hyundai','Kia','Ford','Chevrolet','BMW','Mercedes-Benz','Lexus','Infiniti','Dodge','Jeep'];
  const years = Array.from({ length: 25 }, (_, i) => 2026 - i);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Head>
        <title>dawirny — UAE Car Marketplace</title>
      </Head>

      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          <DawirnyLogo size="md" />
          <Link href="/login" className="px-6 py-2 rounded-2xl text-sm font-bold border-2 border-teal-600 text-teal-600 hover:bg-teal-50 transition-all">
            Dealer Login
          </Link>
        </div>
      </header>

      <main>
        {/* HERO SECTION - Added pt-32 for spacing */}
        <section className="relative pt-32 pb-24 px-4" style={{ background: 'linear-gradient(135deg, #0d6b5e 0%, #1A9988 100%)' }}>
          <div className="max-w-5xl mx-auto text-center">
            {/* Title: Reverted to Yellow for high contrast */}
            <h1 className="text-5xl md:text-7xl font-black leading-tight uppercase tracking-tighter mb-8 text-yellow-400">
              Find Your Car at <br/><span className="text-white">Dubai Auto Market</span>
            </h1>
            
            <div className="bg-white/10 backdrop-blur-xl p-3 rounded-[40px] shadow-2xl max-w-4xl mx-auto border border-white/20">
              <form onSubmit={handleSearch} className="bg-white rounded-[32px] p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col text-left px-4 border-r border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Make</label>
                  <select 
                    value={filters.make} 
                    onChange={e => setFilters({ ...filters, make: e.target.value })}
                    className="w-full bg-transparent font-bold text-gray-900 focus:outline-none py-1"
                  >
                    <option value="">All Makes</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col text-left px-4 border-r border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Model</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Patrol"
                    value={filters.model} 
                    onChange={e => setFilters({ ...filters, model: e.target.value })}
                    className="w-full bg-transparent font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none py-1"
                  />
                </div>

                <div className="flex flex-col text-left px-4 border-r border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Year</label>
                  <select 
                    value={filters.year} 
                    onChange={e => setFilters({ ...filters, year: e.target.value })}
                    className="w-full bg-transparent font-bold text-gray-900 focus:outline-none py-1"
                  >
                    <option value="">Any Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <button type="submit" className="w-full bg-black text-yellow-400 font-black py-4 rounded-2xl hover:scale-[1.02] transition-all uppercase tracking-widest">
                  Search
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* MARKET SELECTOR - Added heavy top padding */}
        <section className="max-w-7xl mx-auto px-4 py-32">
          <h2 className="text-3xl font-black text-gray-900 uppercase mb-12 text-center">Explore Markets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/market/00000000-0000-0000-0000-000000000010" className="group bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-3xl mb-6">🏪</div>
                <h3 className="text-2xl font-black text-gray-900 uppercase mb-2">Dubai Auto Market</h3>
                <p className="text-gray-500 font-medium mb-6">Ras Al Khor, Industrial 3</p>
                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                  <span className="text-xl font-black text-teal-600">{stats?.active_vehicles || '--'} CARS</span>
                  <span className="font-bold text-sm">BROWSE →</span>
                </div>
            </Link>
            {['Sharjah', 'Abu Dhabi'].map(city => (
                <div key={city} className="bg-gray-50 rounded-[40px] p-8 border-2 border-dashed border-gray-200 opacity-50 flex flex-col justify-center items-center text-center">
                  <span className="text-xl font-black text-gray-300 uppercase">{city} Market</span>
                  <span className="text-xs font-bold text-gray-400 mt-2">COMING SOON</span>
                </div>
            ))}
          </div>
        </section>

        {/* RESTORED: HOW IT WORKS */}
        <section className="bg-white border-t border-gray-100 py-32">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-black text-gray-900 uppercase mb-4">How it Works</h2>
                <p className="text-gray-500 font-medium">From your phone to the showroom in minutes</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-12">
              {[
                { icon: '🔍', step: 'Search', desc: 'Filter by make, model, and price from home' },
                { icon: '📍', step: 'Locate', desc: 'See exactly which showroom has your car' },
                { icon: '🗺️', step: 'Navigate', desc: 'Get the showroom number and walk straight there' },
                { icon: '🤝', step: 'Deal', desc: 'Arrive informed with verified inventory data' },
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="text-lg font-black text-gray-900 uppercase mb-3">{item.step}</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}




