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
          <div className="max-w-4xl mx-auto px-4 text-center" style={{ paddingTop: '72px', paddingBottom: '72px' }}>

            {/* Title */}
            <h1 className="font-bold text-white leading-tight" style={{ fontSize: '2.6rem', marginBottom: '16px' }}>
              Find Your Car at<br />Dubai Auto Market
            </h1>

            {/* Subtitle — white so it's readable on blue */}
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
              Browse every dealer. Find the exact car.<br />Walk straight to the showroom.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl mx-auto" style={{ maxWidth: '560px', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select
                  value={filters.make}
                  onChange={e => setFilters({ ...filters, make: e.target.value })}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px', fontSize: '15px', color: '#374151', width: '100%' }}
                >
                  <option value="">All Makes</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  value={filters.gcc}
                  onChange={e => setFilters({ ...filters, gcc: e.target.value })}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px', fontSize: '15px', color: '#374151', width: '100%' }}
                >
                  <option value="">GCC & Non-GCC</option>
                  <option value="true">GCC Specs Only</option>
                  <option value="false">Non-GCC Only</option>
                </select>
                <button
                  type="submit"
                  style={{ background: '#0055A4', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', width: '100%' }}
                >
                  Search Cars →
                </button>
              </div>
            </form>

            {/* Stats Strip */}
            {stats && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '40px' }}>
                {[
                  { value: stats.active_vehicles || 0, label: 'Cars Listed' },
                  { value: stats.dealers || 0, label: 'Dealers' },
                  { value: stats.showrooms || 0, label: 'Showrooms' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white', lineHeight: '1' }}>{s.value}</p>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '6px' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Browse by Market */}
        <div className="max-w-7xl mx-auto px-4" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Browse by Market</h2>
          <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '15px' }}>Select a market to browse all available inventory</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>

            {/* Dubai Auto Market */}
            <Link
              href="/market/00000000-0000-0000-0000-000000000010"
              style={{ textDecoration: 'none' }}
            >
              <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', border: '2px solid transparent', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#0055A4'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ height: '5px', background: 'linear-gradient(90deg, #0055A4, #1a6ec4)' }} />
                <div style={{ padding: '24px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏪</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>Dubai Auto Market</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Ras Al Khor, Dubai</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0055A4' }}>{stats?.active_vehicles ?? '—'}</span>
                      <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '6px' }}>cars listed</span>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0055A4' }}>Browse →</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Coming Soon markets */}
            {[
              { name: 'Sharjah Auto Market', city: 'Sharjah' },
              { name: 'Abu Dhabi Auto Market', city: 'Abu Dhabi' },
            ].map((market, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: '2px dashed #e5e7eb', opacity: '0.75' }}>
                <div style={{ height: '5px', background: '#e5e7eb' }} />
                <div style={{ padding: '24px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔜</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#9ca3af', marginBottom: '4px' }}>{market.name}</h3>
                  <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>{market.city}</p>
                  <span style={{ display: 'inline-block', padding: '4px 14px', background: '#f3f4f6', color: '#6b7280', borderRadius: '999px', fontSize: '13px', fontWeight: '600' }}>
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div style={{ background: 'white', borderTop: '1px solid #f3f4f6' }}>
          <div className="max-w-7xl mx-auto px-4" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827', marginBottom: '8px', textAlign: 'center' }}>How It Works</h2>
            <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: '48px', fontSize: '15px' }}>From your phone to the showroom in minutes</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px' }}>
              {[
                { icon: '🔍', step: 'Search', desc: 'Filter by make, model, price and specs from home' },
                { icon: '📍', step: 'Locate', desc: 'See exactly which showroom has your car' },
                { icon: '🗺️', step: 'Navigate', desc: 'Get the showroom number and walk straight there' },
                { icon: '🤝', step: 'Deal', desc: 'Arrive informed with market price data in hand' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>{item.step}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ background: '#111827', padding: '32px 16px', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>© 2026 Virtual Car Land. Built for UAE car markets.</p>
        </footer>

      </div>
    </>
  );
}

