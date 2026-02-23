import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [search, setSearch] = useState({ make: '', model: '', price_min: '', price_max: '', gcc: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        setStats(data.data);
        setMarkets(data.data.markets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.make) params.set('make', search.make);
    if (search.model) params.set('model', search.model);
    if (search.price_min) params.set('price_min', search.price_min);
    if (search.price_max) params.set('price_max', search.price_max);
    if (search.gcc) params.set('gcc', search.gcc);
    window.location.href = `/market/00000000-0000-0000-0000-000000000010?${params.toString()}`;
  };

  const makes = [
    'Toyota', 'Nissan', 'Honda', 'Mitsubishi', 'Hyundai', 'Kia', 'Ford', 'Chevrolet',
    'BMW', 'Mercedes-Benz', 'Lexus', 'Infiniti', 'Dodge', 'Jeep'
  ];

  return (
    <>
      <Head>
        <title>Virtual Car Land — UAE Car Markets</title>
        <meta name="description" content="Find your car at Dubai Auto Market. Browse inventory, locate showrooms, navigate directly to the right dealer." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚗</span>
                <span className="font-bold text-xl" style={{color: '#0055A4'}}>Virtual Car Land</span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                  Dealer Login
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 px-4" style={{background: 'linear-gradient(135deg, #0055A4 0%, #003d7a 100%)'}}>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Your Car at Dubai Auto Market
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Browse every dealer. Find the exact car. Walk straight to the showroom.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select
                  value={search.make}
                  onChange={e => setSearch({...search, make: e.target.value, model: ''})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Makes</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Model (e.g. Camry, Patrol)"
                  value={search.model}
                  onChange={e => setSearch({...search, model: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={search.gcc}
                  onChange={e => setSearch({...search, gcc: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">GCC & Non-GCC</option>
                  <option value="true">GCC Specs Only</option>
                  <option value="false">Non-GCC Only</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="number"
                  placeholder="Min Price (AED)"
                  value={search.price_min}
                  onChange={e => setSearch({...search, price_min: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max Price (AED)"
                  value={search.price_max}
                  onChange={e => setSearch({...search, price_max: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-xl text-white font-bold text-lg transition-opacity hover:opacity-90"
                style={{background: 'linear-gradient(135deg, #0055A4, #FFD700)'}}
              >
                Search Cars →
              </button>
            </form>
          </div>
        </section>

        {/* Stats Bar */}
        {!loading && stats && (
          <section className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold" style={{color: '#0055A4'}}>{stats.active_vehicles}</div>
                  <div className="text-sm text-gray-500 mt-1">Cars Available</div>
                </div>
                <div>
                  <div className="text-3xl font-bold" style={{color: '#0055A4'}}>{stats.dealers}</div>
                  <div className="text-sm text-gray-500 mt-1">Dealers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold" style={{color: '#0055A4'}}>{stats.showrooms}</div>
                  <div className="text-sm text-gray-500 mt-1">Showrooms</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Markets */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Market</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/market/00000000-0000-0000-0000-000000000010" className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{background: '#0055A4'}}>
                  🏪
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600">Dubai Auto Market</h3>
                  <p className="text-sm text-gray-500">Ras Al Khor, Dubai</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{stats?.active_vehicles || '—'} cars listed</span>
                <span className="font-medium" style={{color: '#0055A4'}}>Browse →</span>
              </div>
            </Link>

            {/* Placeholder for future markets */}
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">🔜</div>
                <p className="text-sm text-gray-400 font-medium">Sharjah Auto Market</p>
                <p className="text-xs text-gray-300 mt-1">Coming Soon</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">🔜</div>
                <p className="text-sm text-gray-400 font-medium">Abu Dhabi Auto Market</p>
                <p className="text-xs text-gray-300 mt-1">Coming Soon</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { icon: '🔍', title: 'Search', desc: 'Filter by make, model, price and specs from home' },
                { icon: '📍', title: 'Locate', desc: 'See exactly which showroom has your car' },
                { icon: '🗺️', title: 'Navigate', desc: 'Get the showroom number and walk straight there' },
                { icon: '🤝', title: 'Deal', desc: 'Arrive informed with market price data in hand' }
              ].map((step, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">© 2026 Virtual Car Land. Built for UAE car markets.</p>
          </div>
        </footer>
      </div>
    </>
  );
}