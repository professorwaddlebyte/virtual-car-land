import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function VehiclePage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shortlist, setShortlist] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/vehicles/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    setShortlist(saved);
  }, [id]);

  function toggleShortlist() {
    if (!data?.vehicle) return;
    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    const exists = saved.find(v => v.id === data.vehicle.id);
    let updated;
    if (exists) {
      updated = saved.filter(v => v.id !== data.vehicle.id);
    } else {
      if (saved.length >= 5) { alert('Shortlist is full.'); return; }
      updated = [...saved, data.vehicle];
    }
    localStorage.setItem('shortlist', JSON.stringify(updated));
    setShortlist(updated);
  }

  function handleWhatsApp() {
    if (!data?.vehicle) return;
    const v = data.vehicle;
    const msg = encodeURIComponent(`Hi, I'm interested in your ${v.year} ${v.make} ${v.model} listed at AED ${v.price_aed?.toLocaleString()} on Virtual Car Land. Is it still available?`);
    const phone = v.dealer_phone?.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    fetch(`/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: id, inquiry_type: 'whatsapp_click' })
    });
  }

  const tierColors = {
    Platinum: 'bg-purple-100 text-purple-700',
    Gold: 'bg-yellow-100 text-yellow-700',
    Silver: 'bg-gray-100 text-gray-600',
    Unrated: 'bg-gray-50 text-gray-400'
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🚗</div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );

  if (!data?.vehicle) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-gray-500">Vehicle not found</p>
        <Link href="/" className="text-blue-600 text-sm mt-2 block">← Back to home</Link>
      </div>
    </div>
  );

  const { vehicle, price_history, market_intelligence } = data;
  const isShortlisted = shortlist.some(v => v.id === vehicle.id);
  const priceDiff = market_intelligence?.price_vs_market_pct;

  return (
    <>
      <Head>
        <title>{vehicle.year} {vehicle.make} {vehicle.model} — Virtual Car Land</title>
      </Head>

      <div className="min-h-screen bg-gray-50">

        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">
                ← Back
              </button>
              <span className="font-bold text-lg" style={{color: '#0055A4'}}>Vehicle Details</span>
              <button onClick={toggleShortlist} className="text-2xl">
                {isShortlisted ? '⭐' : '☆'}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

          {/* Photo */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              {vehicle.photos?.length > 0 ? (
                <img src={vehicle.photos[0]} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-8xl">🚗</span>
              )}
            </div>
          </div>

          {/* Title + Price */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-gray-500 mt-1">
                  {vehicle.mileage_km ? `${vehicle.mileage_km.toLocaleString()} km` : 'Mileage N/A'} •{' '}
                  {vehicle.specs?.color || 'Color N/A'} •{' '}
                  {vehicle.specs?.transmission || 'Auto'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${vehicle.specs?.gcc ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {vehicle.specs?.gcc ? 'GCC' : 'Non-GCC'}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="text-3xl font-bold" style={{color: '#0055A4'}}>
                AED {vehicle.price_aed?.toLocaleString()}
              </div>
              {priceDiff !== null && priceDiff !== undefined && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${priceDiff < 0 ? 'bg-green-100 text-green-700' : priceDiff > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {priceDiff < 0 ? `${Math.abs(priceDiff)}% below market` : priceDiff > 0 ? `${priceDiff}% above market` : 'At market price'}
                </span>
              )}
            </div>
          </div>

          {/* Market Intelligence */}
          {market_intelligence && market_intelligence.similar_count > 1 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">📊 Market Intelligence</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900">AED {market_intelligence.avg_price?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Market Average</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900">AED {market_intelligence.min_price?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Lowest Listed</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-lg font-bold text-gray-900">{market_intelligence.similar_count}</p>
                  <p className="text-xs text-gray-500 mt-1">Similar Cars</p>
                </div>
              </div>
            </div>
          )}

          {/* Specs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">🔧 Specifications</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Make', value: vehicle.make },
                { label: 'Model', value: vehicle.model },
                { label: 'Year', value: vehicle.year },
                { label: 'Color', value: vehicle.specs?.color || 'N/A' },
                { label: 'Transmission', value: vehicle.specs?.transmission || 'N/A' },
                { label: 'Fuel', value: vehicle.specs?.fuel || 'N/A' },
                { label: 'Body Type', value: vehicle.specs?.body || 'N/A' },
                { label: 'Cylinders', value: vehicle.specs?.cylinders || 'N/A' },
                { label: 'Mileage', value: vehicle.mileage_km ? `${vehicle.mileage_km.toLocaleString()} km` : 'N/A' },
                { label: 'Specs', value: vehicle.specs?.gcc ? 'GCC' : 'Non-GCC' },
              ].map((spec, i) => (
                <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">{spec.label}</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Showroom */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">📍 Find This Car</h2>
            <div className="p-4 rounded-xl" style={{background: 'linear-gradient(135deg, #0055A4/10, #FFD700/10)', border: '2px solid #0055A4'}}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500">Showroom</p>
                  <p className="text-2xl font-bold" style={{color: '#0055A4'}}>{vehicle.showroom_number}</p>
                  <p className="text-sm text-gray-600">{vehicle.location_hint}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{vehicle.dealer_name}</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${tierColors[vehicle.score_tier] || tierColors.Unrated}`}>
                    {vehicle.score_tier}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {vehicle.market_name} • Listed {vehicle.views_count} views
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">📞 Contact Dealer</h2>
            <div className="space-y-3">
              <button
                onClick={handleWhatsApp}
                className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                style={{background: '#25D366'}}
              >
                <span>💬</span> WhatsApp Dealer
              </button>
              {vehicle.dealer_phone && (
                
                  href={`tel:${vehicle.dealer_phone}`}
                  className="block w-full py-4 rounded-xl font-bold text-center border-2"
                  style={{borderColor: '#0055A4', color: '#0055A4'}}
                >
                  📞 Call {vehicle.dealer_phone}
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

