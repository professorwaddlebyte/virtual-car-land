import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ make: '', gcc: '' });

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
    if (filters.gcc) params.set('gcc', filters.gcc);
    router.push(`/market/00000000-0000-0000-0000-000000000010?${params}`);
  }

  const makes = [
    'Toyota', 'Nissan', 'Honda', 'Mitsubishi', 'Hyundai',
    'Kia', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz',
    'Lexus', 'Infiniti', 'Dodge', 'Jeep'
  ];

  return (
    <>
      <Head>
        <title>Virtual Car Land — UAE Car Markets</title>
        <meta name="description" content="Browse every dealer at Dubai Auto Market. Find the exact car. Walk straight to the showroom." />
      </Head>

      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚗</span>
                <span className="font-bold text-xl" style={{ color: '#0055A4' }}>Virtual Car Land</span>
              </div>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors"
                style={{ borderColor: '#0055A4', color: '#0055A4' }}
              >
                Dealer Login
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #003d7a 0%, #0055A4 50%, #1a6ec4 100%)' }}>
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Find Your Car at<br />Dubai Auto Market
            </h1>
            <p className="text-lg text-blue-200 mb-10 max-w-xl mx-auto">
              Browse every dealer. Find the exact car. Walk straight to the showroom.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 shadow-xl max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <select
                  value={filters.make}
                  onChange={e => setFilters({ ...filters, make: e.target.value })}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="">All Makes</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  value={filters.gcc}
                  onChange={e => setFilters({ ...filters, gcc: e.target.value })}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="">GCC & Non-GCC</option>
                  <option value="true">GCC Specs Only</option>
                  <option value="false">Non-GCC Only</option>
                </select>
                <button
                  type="submit"
                  className="py-3 rounded-xl text-white font-bold text-sm"
                  style={{ background: '#0055A4' }}
                >
                  Search Cars →
                </button>
              </div>
            </form>

            {/* Stats Strip */}
            {stats && (
              <div className="flex items-center justify-center gap-8 mt-8">
                {[
                  { value: stats.active_vehicles || 0, label: 'Cars Listed' },
                  { value: stats.dealers || 0, label: 'Dealers' },
                  { value: stats.showrooms || 0, label: 'Showrooms' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl font-bold text-white">{s.value}</p>
                    <p className="text-sm text-blue-200 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Markets */}
        <div className="max-w-7xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by Market</h2>
          <p className="text-gray-500 mb-8">Select a market to browse all available inventory</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {/* Dubai Auto Market */}
            <Link
              href="/market/00000000-0000-0000-0000-000000000010"
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden border-2 border-transparent hover:border-blue-400 group"
            >
              <div className="h-3 w-full" style={{ background: 'linear-gradient(90deg, #0055A4, #1a6ec4)' }} />
              <div className="p-6">
                <div className="text-3xl mb-3">🏪</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                  Dubai Auto Market
                </h3>
                <p className="text-sm text-gray-500 mb-4">Ras Al Khor, Dubai</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold" style={{ color: '#0055A4' }}>
                    {stats?.active_vehicles || '—'}
                    <span className="text-sm font-normal text-gray-500 ml-1">cars listed</span>
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#0055A4' }}>Browse →</span>
                </div>
              </div>
            </Link>

            {/* Coming Soon */}
            {[
              { name: 'Sharjah Auto Market', city: 'Sharjah' },
              { name: 'Abu Dhabi Auto Market', city: 'Abu Dhabi' },
            ].map((market, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-dashed border-gray-200 opacity-70">
                <div className="h-3 w-full bg-gray-200" />
                <div className="p-6">
                  <div className="text-3xl mb-3">🔜</div>
                  <h3 className="text-xl font-bold text-gray-400 mb-1">{market.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{market.city}</p>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-sm font-medium rounded-full">
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">How It Works</h2>
            <p className="text-gray-500 text-center mb-10">From your phone to the showroom in minutes</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {[
                { icon: '🔍', step: 'Search', desc: 'Filter by make, model, price and specs from home' },
                { icon: '📍', step: 'Locate', desc: 'See exactly which showroom has your car' },
                { icon: '🗺️', step: 'Navigate', desc: 'Get the showroom number and walk straight there' },
                { icon: '🤝', step: 'Deal', desc: 'Arrive informed with market price data in hand' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{item.step}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8 text-center">
          <p className="text-sm">© 2026 Virtual Car Land. Built for UAE car markets.</p>
        </footer>

      </div>
    </>
  );
}

