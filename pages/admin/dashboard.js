import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/admin/analytics', {
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
    Platinum: 'bg-purple-100 text-purple-700',
    Gold: 'bg-yellow-100 text-yellow-700',
    Silver: 'bg-gray-100 text-gray-600',
    Unrated: 'bg-gray-50 text-gray-400'
  };

  const subColors = {
    Platinum: 'bg-purple-100 text-purple-700',
    Gold: 'bg-yellow-100 text-yellow-700',
    Basic: 'bg-gray-100 text-gray-500'
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⚙️</div>
        <p className="text-gray-500">Loading admin panel...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { overview, dealers, markets, recent_inquiries, tier_distribution } = data;

  return (
    <>
      <Head>
        <title>Admin Panel — Virtual Car Land</title>
      </Head>

      <div className="min-h-screen bg-gray-50">

        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <span className="font-bold text-gray-900">Admin Panel</span>
                <span className="text-xs text-gray-400">Virtual Car Land</span>
              </div>
              <button
                onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Active Cars', value: overview.active_vehicles, icon: '🚗' },
              { label: 'Cars Sold', value: overview.sold_vehicles, icon: '✅' },
              { label: 'Total Dealers', value: overview.total_dealers, icon: '🏪' },
              { label: 'Paid Dealers', value: overview.paid_dealers, icon: '💰' },
              { label: 'Total Views', value: parseInt(overview.total_views).toLocaleString(), icon: '👁' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Weekly Activity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-4xl font-bold" style={{color: '#0055A4'}}>{overview.inquiries_7d}</p>
              <p className="text-sm text-gray-500 mt-1">Inquiries this week</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-4xl font-bold" style={{color: '#25D366'}}>{overview.whatsapp_7d}</p>
              <p className="text-sm text-gray-500 mt-1">WhatsApp clicks this week</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
            {['overview', 'dealers', 'markets', 'activity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
                style={activeTab === tab ? {background: '#0055A4', color: 'white'} : {color: '#6b7280'}}
              >
                {tab === 'overview' ? '📊 Overview' :
                 tab === 'dealers' ? '🏪 Dealers' :
                 tab === 'markets' ? '🗺️ Markets' : '📋 Activity'}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">

              {/* Tier Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Dealer Tier Distribution</h2>
                <div className="space-y-3">
                  {tier_distribution.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium w-20 text-center ${tierColors[t.score_tier] || tierColors.Unrated}`}>
                        {t.score_tier}
                      </span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(t.count / dealers.length) * 100}%`,
                            background: t.score_tier === 'Platinum' ? '#7c3aed' :
                                        t.score_tier === 'Gold' ? '#FFD700' :
                                        t.score_tier === 'Silver' ? '#9ca3af' : '#e5e7eb'
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Markets Overview */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Markets</h2>
                <div className="space-y-3">
                  {markets.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.city} — {m.address}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium text-gray-900">{m.active_vehicles} cars</p>
                        <p className="text-xs text-gray-400">{m.dealer_count} dealers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Dealers Tab */}
          {activeTab === 'dealers' && (
            <div className="space-y-3">
              {dealers.map(d => (
                <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{d.business_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[d.score_tier] || tierColors.Unrated}`}>
                          {d.score_tier}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${subColors[d.subscription_tier] || subColors.Basic}`}>
                          {d.subscription_tier}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Showroom {d.showroom_number} — {d.market_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {d.phone} {d.telegram_chat_id ? '• ✅ Bot connected' : '• ⚠️ Bot not connected'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{color: '#0055A4'}}>{d.listing_integrity_score}</p>
                      <p className="text-xs text-gray-400">score</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[
                      { label: 'Active', value: d.active_vehicles },
                      { label: 'Sold', value: d.total_sold },
                      { label: 'Expired', value: d.total_expired },
                      { label: 'Views', value: parseInt(d.total_views).toLocaleString() },
                    ].map((stat, i) => (
                      <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="font-bold text-gray-900 text-sm">{stat.value}</p>
                        <p className="text-xs text-gray-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Markets Tab */}
          {activeTab === 'markets' && (
            <div className="space-y-4">
              {markets.map(m => (
                <div key={m.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{m.name}</h3>
                      <p className="text-sm text-gray-500">{m.address}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="font-bold text-gray-900">{m.showroom_count}</p>
                      <p className="text-xs text-gray-400">Showrooms</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="font-bold text-gray-900">{m.dealer_count}</p>
                      <p className="text-xs text-gray-400">Dealers</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="font-bold text-gray-900">{m.active_vehicles}</p>
                      <p className="text-xs text-gray-400">Active Cars</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 font-medium">Map Image URL</p>
                    <p className="text-xs text-gray-500 mt-1 break-all">
                      {m.map_image_url || 'No map uploaded yet — upload via NeonDB or admin API'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Recent Inquiries</h2>
              </div>
              {recent_inquiries.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400">No inquiries yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recent_inquiries.map((inq, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {inq.year} {inq.make} {inq.model}
                        </p>
                        <p className="text-xs text-gray-500">{inq.dealer_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inq.inquiry_type === 'whatsapp_click' ? 'bg-green-100 text-green-700' :
                          inq.inquiry_type === 'view' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {inq.inquiry_type.replace('_', ' ')}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(inq.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

