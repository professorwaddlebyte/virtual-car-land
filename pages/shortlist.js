import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ShortlistPage() {
  const [shortlist, setShortlist] = useState([]);
  const [routeOrder, setRouteOrder] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    setShortlist(saved);
    setRouteOrder(saved.map((_, i) => i));
  }, []);

  function removeFromShortlist(vehicleId) {
    const updated = shortlist.filter(v => v.id !== vehicleId);
    localStorage.setItem('shortlist', JSON.stringify(updated));
    setShortlist(updated);
    setRouteOrder(updated.map((_, i) => i));
  }

  function trackSave(vehicleId) {
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: vehicleId, inquiry_type: 'save' })
    }).catch(() => {});
    fetch(`/api/vehicles/${vehicleId}/save`, { method: 'POST' }).catch(() => {});
  }

  function planRoute() {
    if (shortlist.length < 2) { alert('Add at least 2 cars to plan a route.'); return; }
    const sorted = [...shortlist]
      .map((v, i) => ({ ...v, originalIndex: i }))
      .sort((a, b) => (parseFloat(a.map_x) || 50) - (parseFloat(b.map_x) || 50));
    setRouteOrder(sorted.map(v => v.originalIndex));
  }

  function clearShortlist() {
    localStorage.setItem('shortlist', '[]');
    setShortlist([]);
    setRouteOrder([]);
  }

  const tierColors = {
    Platinum: 'bg-purple-100 text-purple-700',
    Gold: 'bg-yellow-100 text-yellow-700',
    Silver: 'bg-gray-100 text-gray-600',
    Unrated: 'bg-gray-50 text-gray-400'
  };

  const orderedShortlist = routeOrder.length === shortlist.length
    ? routeOrder.map(i => shortlist[i]).filter(Boolean)
    : shortlist;

  return (
    <>
      <Head><title>My Shortlist — Virtual Car Land</title></Head>
      <div className="min-h-screen bg-gray-50">

        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Home</Link>
              <span className="font-bold text-lg" style={{ color: '#0055A4' }}>My Shortlist</span>
              {shortlist.length > 0 && (
                <button onClick={clearShortlist} className="text-sm text-red-400 hover:text-red-600">Clear All</button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {shortlist.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">⭐</div>
              <h2 className="font-bold text-gray-900 mb-2">Your shortlist is empty</h2>
              <p className="text-gray-500 text-sm mb-6">Save up to 5 cars to compare and plan your visit</p>
              <Link href="/market/00000000-0000-0000-0000-000000000010" className="inline-block px-6 py-3 rounded-xl text-white font-medium" style={{ background: '#0055A4' }}>
                Browse Cars →
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">🗺️ Route Planner</h2>
                    <p className="text-sm text-gray-500 mt-1">{shortlist.length} car{shortlist.length !== 1 ? 's' : ''} saved</p>
                  </div>
                  <button onClick={planRoute} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#0055A4' }}>
                    Plan My Route
                  </button>
                </div>
                {routeOrder.length > 0 && shortlist.length > 1 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm font-medium text-blue-900 mb-2">Optimized visiting order:</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {orderedShortlist.map((v, i) => (
                        <div key={v.id} className="flex items-center gap-1">
                          <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: '#0055A4' }}>{i + 1}</span>
                          <span className="text-sm text-blue-800 font-medium">{v.showroom_number}</span>
                          {i < orderedShortlist.length - 1 && <span className="text-blue-400">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {orderedShortlist.map((v, i) => (
                  <div key={v.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-start p-4 gap-4">
                      <div className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center flex-shrink-0" style={{ background: '#0055A4' }}>{i + 1}</div>
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {v.photos?.length > 0
                          ? <img src={v.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{v.year} {v.make} {v.model}</h3>
                        <p className="text-sm text-gray-500">{v.mileage_km ? `${v.mileage_km.toLocaleString()} km` : 'Mileage N/A'} • {v.specs?.gcc ? 'GCC' : 'Non-GCC'}</p>
                        <div className="text-lg font-bold mt-1" style={{ color: '#0055A4' }}>AED {v.price_aed?.toLocaleString()}</div>
                        <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-xs text-gray-500">Showroom</p>
                            <p className="text-sm font-bold text-gray-900">{v.showroom_number}</p>
                            <p className="text-xs text-gray-500">{v.dealer_name}</p>
                          </div>
                          <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${tierColors[v.score_tier] || tierColors.Unrated}`}>{v.score_tier}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex border-t border-gray-100">
                      <Link href={`/vehicle/${v.id}`} className="flex-1 py-3 text-center text-sm font-medium" style={{ color: '#0055A4' }}>View Details</Link>
                      <button onClick={() => removeFromShortlist(v.id)} className="flex-1 py-3 text-center text-sm font-medium text-red-400 hover:text-red-600 border-l border-gray-100">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
