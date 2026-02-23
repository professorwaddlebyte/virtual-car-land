import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function DealerDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/dealer/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then(d => { if (d) { setData(d); setLoading(false); } })
      .catch(() => setLoading(false));
  }, []);

  const tierColors = {
    Platinum: 'bg-purple-100 text-purple-700 border-purple-200',
    Gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Silver: 'bg-gray-100 text-gray-600 border-gray-200',
    Unrated: 'bg-gray-50 text-gray-400 border-gray-100'
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { dealer, stats, vehicles, market_demand, underperforming, expiring_soon, insights } = data;

  return (
    <>
      <Head>
        <title>{dealer.business_name} — Dealer Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-bold text-gray-900 leading-none">{dealer.business_name}</p>
                  <p className="text-xs text-gray-500">Showroom {dealer.showroom_number} — {dealer.location_hint}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${tierColors[dealer.score_tier] || tierColors.Unrated}`}>
                  ⭐ {dealer.score_tier} — {dealer.listing_integrity_score}/100
                </span>
                <button
                  onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-400">
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Listings', value: stats.active_count, icon: '🚗' },
              { label: 'Cars Sold', value: stats.sold_count, icon: '✅' },
              { label: 'Total Views', value: parseInt(stats.total_views).toLocaleString(), icon: '👁' },
              { label: 'WhatsApp Clicks', value: stats.total_whatsapp, icon: '💬' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
            {['overview', 'inventory', 'market'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
                style={activeTab === tab ? {background: '#0055A4', color: 'white'} : {color: '#6b7280'}}
              >
                {tab === 'overview' ? '📊 Overview' : tab === 'inventory' ? '🚗 Inventory' : '📈 Market'}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">

              {/* Integrity Score */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Listing Integrity Score</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${tierColors[dealer.score_tier]}`}>
                    {dealer.score_tier}
                  </span>
                </div>
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                    style={{
                      width: `${dealer.listing_integrity_score}%`,
                      background: dealer.listing_integrity_score >= 85 ? '#7c3aed' :
                                  dealer.listing_integrity_score >= 70 ? '#FFD700' :
                                  dealer.listing_integrity_score >= 50 ? '#9ca3af' : '#ef4444'
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>0</span>
                  <span className="font-bold text-gray-700">{dealer.listing_integrity_score}/100</span>
                  <span>100</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="font-bold text-gray-700">50+</p>
                    <p className="text-gray-400">Silver</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <p className="font-bold text-yellow-700">70+</p>
                    <p className="text-yellow-500">Gold</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <p className="font-bold text-purple-700">85+</p>
                    <p className="text-purple-500">Platinum</p>
                  </div>
                </div>
              </div>

              {/* Expiring Soon */}
              {expiring_soon.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-bold text-gray-900 mb-4">⏰ Expiring Soon</h2>
                  <div className="space-y-3">
                    {expiring_soon.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">{v.year} {v.make} {v.model}</p>
                          <p className="text-sm text-gray-500">AED {v.price_aed?.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">
                            {Math.floor(parseFloat(v.days_until_expiry))}d left
                          </p>
                          <p className="text-xs text-gray-400">Send /confirm on bot</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Underperforming */}
              {underperforming.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-bold text-gray-900 mb-4">📉 Underperforming Listings</h2>
                  <div className="space-y-3">
                    {underperforming.map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">{v.year} {v.make} {v.model}</p>
                          <p className="text-sm text-gray-500">AED {v.price_aed?.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{v.views_count} views</p>
                          <p className="text-xs text-gray-400">{Math.floor(parseFloat(v.days_listed))} days listed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              {vehicles.filter(v => v.status === 'active').length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <div className="text-4xl mb-4">🚗</div>
                  <p className="text-gray-500">No active listings. Add cars via the @NURDealsBot on Telegram.</p>
                </div>
              ) : (
                vehicles.filter(v => v.status === 'active').map(v => (
                  <div key={v.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{v.year} {v.make} {v.model}</h3>
                        <p className="text-sm text-gray-500">
                          AED {v.price_aed?.toLocaleString()} •{' '}
                          {v.mileage_km ? `${v.mileage_km.toLocaleString()} km` : 'N/A'} •{' '}
                          {v.specs?.gcc ? 'GCC' : 'Non-GCC'}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-400">{Math.floor(parseFloat(v.days_listed))}d listed</p>
                        <p className="text-xs text-gray-400">
                          {Math.floor(parseFloat(v.days_until_expiry))}d until expiry
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="font-bold text-gray-900">{v.views_count}</p>
                        <p className="text-xs text-gray-400">Views</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="font-bold text-gray-900">{v.whatsapp_clicks}</p>
                        <p className="text-xs text-gray-400">WhatsApp</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="font-bold text-gray-900">{v.saves_count}</p>
                        <p className="text-xs text-gray-400">Saves</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Market Tab */}
          {activeTab === 'market' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">📈 Market Demand (Last 7 Days)</h2>
                {market_demand.length === 0 ? (
                  <p className="text-gray-500 text-sm">Not enough data yet. Check back once buyers start browsing.</p>
                ) : (
                  <div className="space-y-3">
                    {market_demand.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                          style={{background: '#0055A4'}}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{d.make}</span>
                            <span className="text-sm text-gray-500">{d.search_count} views</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(d.search_count / market_demand[0].search_count) * 100}%`,
                                background: '#0055A4'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-2">💡 Your Inventory vs Demand</h2>
                <p className="text-sm text-gray-500 mb-4">Based on market views vs your current stock</p>
                {market_demand.map((d, i) => {
                  const hasStock = vehicles.some(v =>
                    v.status === 'active' && v.make.toLowerCase() === d.make.toLowerCase()
                  );
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{d.make}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${hasStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {hasStock ? '✓ In Stock' : '✗ Not Listed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
