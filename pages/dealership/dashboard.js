import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const TIER_COLORS = {
  Platinum: 'bg-purple-100 text-purple-700 border-purple-200',
  Gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Silver: 'bg-gray-100 text-gray-600 border-gray-200',
  Unrated: 'bg-gray-50 text-gray-400 border-gray-100'
};

const FLAG_COLORS = {
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400' },
};

const PRIORITY_COLORS = {
  high: 'border-l-red-400 bg-red-50',
  medium: 'border-l-orange-400 bg-orange-50',
  low: 'border-l-blue-400 bg-blue-50',
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold" style={{ color: color || '#111827' }}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ScoreBar({ value, max = 100, color }) {
  return (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
      <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, background: color || '#0055A4' }} />
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="text-center py-10">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

export default function DealerDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('actions');
  const [highlightedVehicles, setHighlightedVehicles] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/dealer/intelligence', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) { setData(d); setLoading(false); } })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-4">📊</div><p className="text-gray-500">Loading your intelligence dashboard...</p></div>
    </div>
  );

  if (!data) return null;

  const { dealer, stats, vehicles, market_demand, price_ranges, body_type_demand, competitive, reputation, actions } = data;
  const activeVehicles = vehicles.filter(v => v.status === 'active');
  const soldVehicles = vehicles.filter(v => v.status === 'sold');

  const tabs = [
    { id: 'actions', label: '🎯 Actions', badge: actions.length },
    { id: 'inventory', label: '🚗 Inventory' },
    { id: 'pricing', label: '💰 Pricing' },
    { id: 'demand', label: '📈 Demand' },
    { id: 'competitive', label: '🏆 Rank' },
    { id: 'reputation', label: '⭐ Reputation' },
  ];

  return (
    <>
      <Head><title>{dealer.business_name} — Intelligence Dashboard</title></Head>
      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-bold text-gray-900 leading-none">{dealer.business_name}</p>
                  <p className="text-xs text-gray-500">Showroom {dealer.showroom_number} — {dealer.market_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${TIER_COLORS[dealer.score_tier] || TIER_COLORS.Unrated}`}>
                  {dealer.score_tier} — {dealer.listing_integrity_score}/100
                </span>
                <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="text-sm text-gray-400 hover:text-gray-600">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon="🚗" label="Active Listings" value={stats.active_count} color="#0055A4" />
            <StatCard icon="✅" label="Sold" value={stats.sold_count} sub={stats.avg_days_to_sell > 0 ? `Avg ${Math.round(stats.avg_days_to_sell)}d to sell` : null} color="#16a34a" />
            <StatCard icon="👁" label="Total Views" value={parseInt(stats.total_views).toLocaleString()} color="#374151" />
            <StatCard icon="💬" label="WhatsApp Clicks" value={stats.total_whatsapp} color="#25D366" />
            <StatCard icon="⭐" label="Shortlist Saves" value={stats.total_saves} color="#d97706" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={activeTab === tab.id ? { background: '#0055A4', color: 'white' } : { color: '#6b7280' }}>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={activeTab === tab.id ? { background: 'white', color: '#0055A4' } : { background: '#ef4444', color: 'white' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: ACTIONS ── */}
          {activeTab === 'actions' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-1">Recommended Actions</h2>
                <p className="text-sm text-gray-500 mb-4">Based on your current inventory and market data</p>
                {actions.length === 0 ? (
                  <EmptyState icon="🎉" text="No actions needed right now. Your inventory is performing well." />
                ) : (
		  <div className="space-y-3">
                    {actions.map((a, i) => (
                      <div
                        key={i}
                        className={`border-l-4 p-4 rounded-r-xl cursor-pointer hover:opacity-80 transition-opacity ${PRIORITY_COLORS[a.priority]}`}
                        onClick={() => {
                          const ids = a.vehicle_ids || [];
                          setHighlightedVehicles(ids);
                          setActiveTab('inventory');
                          setTimeout(() => {
                            if (ids.length > 0) {
                              const el = document.getElementById(`vehicle-${ids[0]}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }, 300);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{a.icon} {a.text}</p>
                          {a.vehicle_ids?.length > 0 && (
                            <span className="flex-shrink-0 ml-3 text-xs font-bold px-2 py-1 rounded-lg bg-white bg-opacity-70" style={{ color: '#0055A4' }}>
                              View {a.vehicle_ids.length} car{a.vehicle_ids.length > 1 ? 's' : ''} →
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 uppercase mt-1 inline-block">{a.priority} priority</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick stats recap */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Sell Speed</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#0055A4' }}>
                    {stats.avg_days_to_sell > 0 ? `${Math.round(stats.avg_days_to_sell)}d` : '—'}
                  </div>
                  <p className="text-sm text-gray-500">Your avg days to sell</p>
                  {competitive.market_avg_days_to_sell > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Market avg: {competitive.market_avg_days_to_sell}d</p>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Conversion Rate</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#16a34a' }}>
                    {parseInt(stats.total_views) > 0
                      ? `${Math.round((parseInt(stats.total_whatsapp) / parseInt(stats.total_views)) * 100)}%`
                      : '—'}
                  </div>
                  <p className="text-sm text-gray-500">Views to WhatsApp</p>
                  <p className="text-xs text-gray-400 mt-1">Market benchmark: ~8%</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Market Rank</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#d97706' }}>
                    #{competitive.my_rank} <span className="text-lg text-gray-400">of {competitive.total_dealers}</span>
                  </div>
                  <p className="text-sm text-gray-500">By integrity score</p>
                  <p className="text-xs text-gray-400 mt-1">Score: {dealer.listing_integrity_score}/100</p>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: INVENTORY ── */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              {activeVehicles.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm">
                  <EmptyState icon="🚗" text="No active listings. Add cars via @NURDealsBot on Telegram." />
                </div>
              ) : activeVehicles.map(v => {
                const flag = v.ai_flag;
                const flagStyle = FLAG_COLORS[flag?.color] || FLAG_COLORS.blue;
                const daysLeft = Math.floor(parseFloat(v.days_until_expiry));
                const daysListed = Math.floor(parseFloat(v.days_listed));
                const isHighlighted = highlightedVehicles.includes(v.id);
                return (
                  <div
                    key={v.id}
                    id={`vehicle-${v.id}`}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all"
                    style={isHighlighted ? { outline: '4px solid #0055A4', outlineOffset: '3px', background: '#f0f7ff' } : {}}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {v.photos?.length > 0
                          ? <img src={v.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900">{v.year} {v.make} {v.model}</h3>
			  <div className="flex flex-wrap gap-1">
                            {(Array.isArray(v.ai_flag) ? v.ai_flag : [v.ai_flag]).filter(Boolean).map((f, fi) => {
                              const fs = FLAG_COLORS[f.color] || FLAG_COLORS.blue;
                              return (
                                <span key={fi} className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${fs.bg} ${fs.text} ${fs.border}`}>
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${fs.dot}`}></span>
                                  {f.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">AED {v.price_aed?.toLocaleString()} • {v.mileage_km?.toLocaleString()} km • {v.specs?.gcc ? 'GCC' : 'Non-GCC'}</p>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {[
                            { label: 'Views', value: v.views_count },
                            { label: 'WhatsApp', value: v.whatsapp_clicks },
                            { label: 'Saves', value: v.saves_count },
                            { label: 'Engage', value: `${v.engagement_score}` },
                          ].map((s, i) => (
                            <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                              <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                              <p className="text-xs text-gray-400">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
		    {(Array.isArray(v.ai_flag) ? v.ai_flag : [v.ai_flag]).filter(f => f && f.label !== 'Active').map((f, fi) => {
                      const fs = FLAG_COLORS[f.color] || FLAG_COLORS.blue;
                      return (
                        <div key={fi} className={`px-4 py-3 border-t ${fs.bg}`}>
                          <p className={`text-xs ${fs.text}`}>💡 {f.action}</p>
                        </div>
                      );
                    })}
                    <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex gap-4">
                        <span className="text-xs text-gray-400">{daysListed}d listed</span>
                        <span className={`text-xs font-medium ${daysLeft <= 3 ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-gray-400'}`}>
                          {daysLeft}d until expiry
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Quality:</span>
                        <div className="w-16"><ScoreBar value={v.listing_quality_score} color={v.listing_quality_score >= 70 ? '#16a34a' : v.listing_quality_score >= 40 ? '#d97706' : '#ef4444'} /></div>
                        <span className="text-xs text-gray-500">{v.listing_quality_score}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB: PRICING ── */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-1">Market Price Intelligence</h2>
                <p className="text-sm text-gray-500 mb-4">How each of your listings compares to similar cars in the market</p>
                {activeVehicles.length === 0 ? (
                  <EmptyState icon="💰" text="No active listings to analyse." />
                ) : activeVehicles.map(v => {
                  const intel = v.price_intel;
                  if (!intel || intel.similar_count <= 1) return (
                    <div key={v.id} className="p-4 bg-gray-50 rounded-xl mb-3">
                      <p className="font-medium text-gray-900">{v.year} {v.make} {v.model}</p>
                      <p className="text-sm text-gray-400 mt-1">Not enough similar listings to compare.</p>
                    </div>
                  );
                  const pct = intel.pct_vs_market;
                  const isAbove = pct > 0;
                  const isBelow = pct < 0;
                  return (
                    <div key={v.id} className="border border-gray-100 rounded-xl p-4 mb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{v.year} {v.make} {v.model}</p>
                          <p className="text-xl font-bold mt-0.5" style={{ color: '#0055A4' }}>AED {v.price_aed?.toLocaleString()}</p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${isAbove ? 'bg-red-50 text-red-600' : isBelow ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
                          {pct === 0 ? 'At market' : isAbove ? `+${pct}% above` : `${pct}% below`}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm font-bold text-gray-900">AED {intel.min_price?.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Lowest</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="text-sm font-bold text-blue-700">AED {intel.median_price?.toLocaleString()}</p>
                          <p className="text-xs text-blue-400">Median</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm font-bold text-gray-900">AED {intel.max_price?.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Highest</p>
                        </div>
                      </div>
                      {intel.recommended_min && (
                        <div className={`p-3 rounded-lg ${intel.in_competitive_range ? 'bg-green-50' : 'bg-orange-50'}`}>
                          <p className={`text-xs font-medium ${intel.in_competitive_range ? 'text-green-700' : 'text-orange-700'}`}>
                            {intel.in_competitive_range
                              ? '✅ Your price is within the competitive range'
                              : `💡 Recommended range: AED ${intel.recommended_min?.toLocaleString()} — ${intel.recommended_max?.toLocaleString()}`}
                          </p>
                          {!intel.in_competitive_range && (
                            <p className="text-xs text-orange-600 mt-1">
                              Reduce by AED {(v.price_aed - intel.recommended_max)?.toLocaleString()} to enter the competitive range
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">{intel.similar_count} similar cars in market</p>
                    </div>
                  );
                })}
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Price Competitiveness Score</h3>
                {competitive.price_competitiveness_score !== null ? (
                  <>
                    <div className="text-3xl font-bold mb-2" style={{ color: '#0055A4' }}>{competitive.price_competitiveness_score}%</div>
                    <ScoreBar value={competitive.price_competitiveness_score} color={competitive.price_competitiveness_score >= 70 ? '#16a34a' : '#d97706'} />
                    <p className="text-sm text-gray-500 mt-2">{competitive.price_competitiveness_score}% of your listings are within the competitive price range</p>
                  </>
                ) : <EmptyState icon="💰" text="Not enough market data yet." />}
              </div>
            </div>
          )}

          {/* ── TAB: DEMAND ── */}
          {activeTab === 'demand' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-1">Market Demand Heat</h2>
                <p className="text-sm text-gray-500 mb-4">What buyers in your market are looking at — last 30 days</p>
                {market_demand.length === 0 ? (
                  <EmptyState icon="📈" text="Not enough traffic data yet. Check back in a few weeks." />
                ) : (
                  <div className="space-y-3">
                    {market_demand.map((d, i) => {
                      const hasStock = activeVehicles.some(v => v.make?.toLowerCase() === d.make?.toLowerCase());
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: '#0055A4' }}>{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{d.make} {d.body_type ? `(${d.body_type})` : ''}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${hasStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                  {hasStock ? '✓ In stock' : '✗ Not stocked'}
                                </span>
                                <span className="text-xs text-gray-400">{d.view_count} views</span>
                              </div>
                            </div>
                            <ScoreBar value={d.view_count} max={market_demand[0].view_count} color={hasStock ? '#16a34a' : '#0055A4'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Body Type Demand</h3>
                  {body_type_demand.length === 0 ? (
                    <EmptyState icon="🚗" text="Not enough data yet." />
                  ) : body_type_demand.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                      <span className="text-sm capitalize text-gray-700 w-20">{d.body_type || 'Other'}</span>
                      <div className="flex-1"><ScoreBar value={d.view_count} max={body_type_demand[0].view_count} color='#0055A4' /></div>
                      <span className="text-xs text-gray-400 w-12 text-right">{d.view_count}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Price Range Demand</h3>
                  {price_ranges.length === 0 ? (
                    <EmptyState icon="💰" text="Not enough data yet." />
                  ) : price_ranges.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                      <span className="text-sm text-gray-700 w-24 flex-shrink-0">{d.range}</span>
                      <div className="flex-1"><ScoreBar value={d.view_count} max={price_ranges[0].view_count} color='#d97706' /></div>
                      <span className="text-xs text-gray-400 w-12 text-right">{d.view_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: COMPETITIVE ── */}
          {activeTab === 'competitive' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-sm text-gray-500 mb-1">Your Market Rank</p>
                  <div className="text-4xl font-bold" style={{ color: '#0055A4' }}>#{competitive.my_rank}</div>
                  <p className="text-sm text-gray-400">out of {competitive.total_dealers} dealers</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-sm text-gray-500 mb-1">Your Avg Days to Sell</p>
                  <div className="text-4xl font-bold" style={{ color: competitive.my_avg_days_to_sell <= competitive.market_avg_days_to_sell ? '#16a34a' : '#ef4444' }}>
                    {competitive.my_avg_days_to_sell > 0 ? `${competitive.my_avg_days_to_sell}d` : '—'}
                  </div>
                  <p className="text-sm text-gray-400">Market avg: {competitive.market_avg_days_to_sell > 0 ? `${competitive.market_avg_days_to_sell}d` : '—'}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-sm text-gray-500 mb-1">Your Views vs Top 10</p>
                  <div className="text-4xl font-bold" style={{ color: '#d97706' }}>{competitive.my_total_views}</div>
                  <p className="text-sm text-gray-400">Top 10 avg: {Math.round(competitive.top10_avg_views)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Dealer Leaderboard</h2>
                <div className="space-y-2">
                  {competitive.all_dealers.map((d, i) => {
                    const isMe = d.id === dealer.id;
                    return (
                      <div key={d.id} className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'border-2 border-blue-400 bg-blue-50' : 'bg-gray-50'}`}>
                        <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{d.business_name} {isMe && <span className="text-blue-500 text-xs">(You)</span>}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-xs text-gray-400">{d.active_count} active</span>
                            <span className="text-xs text-gray-400">{d.total_sold} sold</span>
                            <span className="text-xs text-gray-400">{d.total_views} views</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: '#0055A4' }}>{d.listing_integrity_score}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${TIER_COLORS[d.score_tier]?.split(' ')[0]} ${TIER_COLORS[d.score_tier]?.split(' ')[1]}`}>{d.score_tier}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: REPUTATION ── */}
          {activeTab === 'reputation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: '#0055A4' }}>{reputation.avg_quality_score}%</div>
                  <p className="text-xs text-gray-500">Avg Listing Quality</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: '#16a34a' }}>{reputation.photo_rate}%</div>
                  <p className="text-xs text-gray-500">Listings With Photos</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: '#d97706' }}>{reputation.quality_rate}%</div>
                  <p className="text-xs text-gray-500">Full Spec Listings</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: '#7c3aed' }}>{reputation.listing_integrity_score}</div>
                  <p className="text-xs text-gray-500">Integrity Score</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Listing Quality Breakdown</h2>
                {activeVehicles.length === 0 ? (
                  <EmptyState icon="⭐" text="No active listings to evaluate." />
                ) : activeVehicles.map(v => (
                  <div key={v.id} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{v.year} {v.make} {v.model}</p>
                      <span className="text-sm font-bold" style={{ color: v.listing_quality_score >= 70 ? '#16a34a' : v.listing_quality_score >= 40 ? '#d97706' : '#ef4444' }}>
                        {v.listing_quality_score}%
                      </span>
                    </div>
                    <ScoreBar value={v.listing_quality_score} color={v.listing_quality_score >= 70 ? '#16a34a' : v.listing_quality_score >= 40 ? '#d97706' : '#ef4444'} />
                    <div className="flex gap-3 mt-1">
                      <span className={`text-xs ${v.photos?.length > 0 ? 'text-green-600' : 'text-red-400'}`}>{v.photos?.length > 0 ? `✓ ${v.photos.length} photo${v.photos.length > 1 ? 's' : ''}` : '✗ No photos'}</span>
                      <span className={`text-xs ${v.specs?.color ? 'text-green-600' : 'text-gray-400'}`}>{v.specs?.color ? '✓ Color' : '✗ Color'}</span>
                      <span className={`text-xs ${v.specs?.transmission ? 'text-green-600' : 'text-gray-400'}`}>{v.specs?.transmission ? '✓ Transmission' : '✗ Transmission'}</span>
                      <span className={`text-xs ${v.specs?.body ? 'text-green-600' : 'text-gray-400'}`}>{v.specs?.body ? '✓ Body type' : '✗ Body type'}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-2">Integrity Score</h2>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Current score</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${TIER_COLORS[dealer.score_tier]}`}>{dealer.score_tier}</span>
                </div>
                <ScoreBar value={dealer.listing_integrity_score} color={dealer.listing_integrity_score >= 85 ? '#7c3aed' : dealer.listing_integrity_score >= 70 ? '#FFD700' : dealer.listing_integrity_score >= 50 ? '#9ca3af' : '#ef4444'} />
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>0</span>
                  <span className="font-bold text-gray-700">{dealer.listing_integrity_score}/100</span>
                  <span>100</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  {[['50+', 'Silver', '#9ca3af'], ['70+', 'Gold', '#d97706'], ['85+', 'Platinum', '#7c3aed']].map(([score, tier, color]) => (
                    <div key={tier} className="p-2 rounded-lg" style={{ background: '#f9fafb' }}>
                      <p className="font-bold" style={{ color }}>{score}</p>
                      <p className="text-gray-400">{tier}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

