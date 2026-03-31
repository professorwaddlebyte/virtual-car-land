import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { query } from '../../lib/db';
import Footer from '../../components/Footer';

export async function getServerSideProps({ params }) {
  try {
    const vehicles = await query(`
      SELECT v.*, d.business_name as dealer_name, d.listing_integrity_score, d.score_tier,
        d.phone as dealer_phone, s.showroom_number, s.section, s.location_hint,
        s.map_x, s.map_y, m.name as market_name, m.id as market_id
      FROM vehicles v
      LEFT JOIN dealers d ON v.dealer_id = d.id
      LEFT JOIN showrooms s ON v.showroom_id = s.id
      LEFT JOIN markets m ON v.market_id = m.id
      WHERE v.id = $1
    `, [params.id]);
    if (!vehicles.length) return { notFound: true };
    const vehicle = vehicles[0];

    const marketAvg = await query(`
      SELECT ROUND(AVG(price_aed)) as avg_price, COUNT(*) as similar_count,
        MIN(price_aed) as min_price, MAX(price_aed) as max_price
      FROM vehicles
      WHERE make = $1 AND model = $2 AND year = $3 AND status = 'active'
    `, [vehicle.make, vehicle.model, vehicle.year]);

    const avg = marketAvg[0];
    const priceDiff = avg?.avg_price
      ? Math.round(((vehicle.price_aed - avg.avg_price) / avg.avg_price) * 100) : null;

    return {
      props: {
        vehicle: JSON.parse(JSON.stringify(vehicle)),
        market_intelligence: {
          avg_price: parseInt(avg?.avg_price || 0),
          similar_count: parseInt(avg?.similar_count || 0),
          min_price: parseInt(avg?.min_price || 0),
          max_price: parseInt(avg?.max_price || 0),
          price_vs_market_pct: priceDiff
        }
      }
    };
  } catch (e) { return { notFound: true }; }
}

export default function VehiclePage({ vehicle, market_intelligence }) {
  const router = useRouter();
  const [shortlist, setShortlist] = useState([]);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    setShortlist(saved);
    fetch(`/api/vehicles/${vehicle.id}/view`, { method: 'POST' }).catch(() => {});
  }, []);

  function toggleShortlist() {
    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    const exists = saved.find(v => v.id === vehicle.id);
    let updated;
    if (exists) { updated = saved.filter(v => v.id !== vehicle.id); }
    else {
      if (saved.length >= 5) { alert('Shortlist is full.'); return; }
      updated = [...saved, vehicle];
    }
    localStorage.setItem('shortlist', JSON.stringify(updated));
    setShortlist(updated);
  }

  function handleWhatsApp() {
    const msg = encodeURIComponent(`Hi, I'm interested in your ${vehicle.year} ${vehicle.make} ${vehicle.model} listed at AED ${vehicle.price_aed?.toLocaleString()} on Virtual Car Land. Is it still available?`);
    const phone = vehicle.dealer_phone?.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vehicle_id: vehicle.id, inquiry_type: 'whatsapp_click' }) }).catch(() => {});
  }

  const isShortlisted = shortlist.some(v => v.id === vehicle.id);
  const priceDiff = market_intelligence?.price_vs_market_pct;
  const photos = vehicle.photos || [];
  const tierColors = { Platinum: 'bg-purple-100 text-purple-700', Gold: 'bg-yellow-100 text-yellow-700', Silver: 'bg-gray-100 text-gray-600', Unrated: 'bg-gray-50 text-gray-400' };

  const specs = [
    { label: 'Make', value: vehicle.make },
    { label: 'Model', value: vehicle.model },
    { label: 'Year', value: vehicle.year },
    { label: 'Color', value: vehicle.specs?.color },
    { label: 'Transmission', value: vehicle.specs?.transmission },
    { label: 'Fuel', value: vehicle.specs?.fuel },
    { label: 'Body Type', value: vehicle.specs?.body },
    { label: 'Cylinders', value: vehicle.specs?.cylinders },
    { label: 'Mileage', value: vehicle.mileage_km ? `${vehicle.mileage_km.toLocaleString()} km` : null },
    { label: 'Specs', value: vehicle.specs?.gcc ? 'GCC' : 'Non-GCC' },
  ].filter(s => s.value);

  const similarUrl = `/market/${vehicle.market_id}?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&year=${vehicle.year}`;
  const lowestUrl = `/market/${vehicle.market_id}?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&year=${vehicle.year}&price_max=${market_intelligence?.min_price + 1000}`;
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} — AED ${vehicle.price_aed?.toLocaleString()} | ${vehicle.market_name}`;
  const metaDesc = `${vehicle.year} ${vehicle.make} ${vehicle.model}, ${vehicle.mileage_km?.toLocaleString()} km, AED ${vehicle.price_aed?.toLocaleString()}. Showroom ${vehicle.showroom_number}, ${vehicle.market_name}, Dubai.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDesc} />
        {photos.length > 0 && <meta property="og:image" content={photos[0]} />}
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back</button>
              <span className="font-bold text-base" style={{ color: '#1A9988' }}>Vehicle Details</span>
              <button onClick={toggleShortlist} className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100">
                {isShortlisted ? '⭐' : '☆'}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 flex-1 w-full">

          {/* Photos */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="relative bg-gray-100 flex items-center justify-center" style={{ height: '300px' }}>
              {photos.length > 0 ? (
                <img src={photos[currentPhoto]} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
              ) : <span className="text-8xl">🚗</span>}
              {photos.length > 1 && (
                <>
                  <button onClick={() => setCurrentPhoto(p => Math.max(0, p - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 font-bold text-lg">‹</button>
                  <button onClick={() => setCurrentPhoto(p => Math.min(photos.length - 1, p + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 font-bold text-lg">›</button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => <button key={i} onClick={() => setCurrentPhoto(i)} className="w-2 h-2 rounded-full transition-colors" style={{ background: i === currentPhoto ? '#0055A4' : '#d1d5db' }} />)}
                  </div>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
                {photos.map((photo, i) => (
                  <button key={i} onClick={() => setCurrentPhoto(i)} className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors" style={{ borderColor: i === currentPhoto ? '#0055A4' : 'transparent' }}>
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title + Price */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {vehicle.mileage_km ? `${vehicle.mileage_km.toLocaleString()} km` : 'Mileage N/A'} • {vehicle.specs?.color || ''} • {vehicle.specs?.transmission || 'Auto'}
                </p>
              </div>
              <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold ${vehicle.specs?.gcc ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {vehicle.specs?.gcc ? 'GCC' : 'Non-GCC'}
              </span>
            </div>
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <div className="text-4xl font-bold" style={{ color: '#1A9988' }}>AED {vehicle.price_aed?.toLocaleString()}</div>
              {priceDiff !== null && priceDiff !== undefined && (
                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${priceDiff < 0 ? 'bg-green-100 text-green-700' : priceDiff > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {priceDiff < 0 ? `${Math.abs(priceDiff)}% below market` : priceDiff > 0 ? `${priceDiff}% above market` : 'At market price'}
                </span>
              )}
            </div>
          </div>

          {/* Market Intelligence — always show if data exists */}
          {market_intelligence && market_intelligence.avg_price > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1">📊 Market Intelligence</h2>
              <p className="text-xs text-gray-400 mb-4">
                Based on {market_intelligence.similar_count} similar {vehicle.make} {vehicle.model} {vehicle.year} listing{market_intelligence.similar_count !== 1 ? 's' : ''} in this market
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-base font-bold text-gray-900">AED {market_intelligence.avg_price?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Market Average</p>
                </div>
                <Link href={lowestUrl} className="p-3 bg-blue-50 rounded-xl border-2 border-blue-200 block hover:bg-blue-100 transition-colors">
                  <p className="text-base font-bold text-blue-700">AED {market_intelligence.min_price?.toLocaleString()}</p>
                  <p className="text-xs text-blue-500 mt-1">Lowest Listed →</p>
                </Link>
                <Link href={similarUrl} className="p-3 bg-blue-50 rounded-xl border-2 border-blue-200 block hover:bg-blue-100 transition-colors">
                  <p className="text-base font-bold text-blue-700">{market_intelligence.similar_count}</p>
                  <p className="text-xs text-blue-500 mt-1">Similar Cars →</p>
                </Link>
              </div>
            </div>
          )}

          {/* Specs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-400 uppercase tracking-wide mb-5">Specifications</h2>

            {/* Key specs strip — most important at a glance */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: '📅', label: 'Year', value: vehicle.year },
                { icon: '🛣️', label: 'Mileage', value: vehicle.mileage_km ? `${vehicle.mileage_km.toLocaleString()} km` : '—' },
                { icon: '⚙️', label: 'Trans.', value: vehicle.specs?.transmission || '—' },
              ].map((s, i) => (
                <div key={i} className="text-center p-3 rounded-2xl" style={{ background: '#f0faf9' }}>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-base font-bold text-gray-900 capitalize">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Full spec rows */}
            <div className="divide-y divide-gray-100">
              {[
                { label: 'Make: ', value: vehicle.make },
                { label: 'Model: ', value: vehicle.model },
                { label: 'Color: ', value: vehicle.specs?.color },
                { label: 'Fuel: ', value: vehicle.specs?.fuel },
                { label: 'Body Type: ', value: vehicle.specs?.body },
                { label: 'Cylinders: ', value: vehicle.specs?.cylinders },
                { label: 'GCC Spec: ', value: vehicle.specs?.gcc ? 'Yes - GCC' : 'No - Non-GCC' },
              ].filter(s => s.value).map((spec, i) => (
                <div key={i} className="flex items-center py-3" style={{ gap: '0' }}>
                  <span className="text-sm text-gray-400 text-right pr-3" style={{ width: '50%' }}>{spec.label}</span>
                  <span className="text-sm font-bold text-gray-800 capitalize pl-3 border-l border-gray-200" style={{ width: '50%' }}>{spec.value}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ borderLeft: '4px solid #1A9988' }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">📝 Seller's Notes</p>
              <p className="text-lg font-bold text-gray-800 leading-relaxed">{vehicle.description}</p>
            </div>
          )}

          {/* Find This Car */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📍 Find This Car</h2>
            <div className="p-4 rounded-2xl border-2" style={{ borderColor: '#0055A4', background: '#f0f7ff' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Showroom</p>
                  <p className="text-4xl font-bold leading-none" style={{ color: '#0055A4' }}>{vehicle.showroom_number}</p>
                  <p className="text-sm text-gray-600 mt-1">{vehicle.location_hint}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-gray-900">{vehicle.dealer_name}</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${tierColors[vehicle.score_tier] || tierColors.Unrated}`}>{vehicle.score_tier}</span>
                  <p className="text-xs text-gray-400 mt-2">{vehicle.views_count} views</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-blue-100">{vehicle.market_name}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📞 Contact Dealer</h2>
            <div className="space-y-3">
              <button onClick={handleWhatsApp} className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2" style={{ background: '#25D366' }}>
                💬 WhatsApp Dealer
              </button>
              {vehicle.dealer_phone && (
                <a href={`tel:${vehicle.dealer_phone}`} className="block w-full py-4 rounded-xl font-bold text-base text-center border-2" style={{ borderColor: '#0055A4', color: '#0055A4' }}>
                  📞 Call {vehicle.dealer_phone}
                </a>
              )}
            </div>
          </div>

          <Link href={`/market/${vehicle.market_id}`} className="block w-full py-3 rounded-xl text-center text-sm font-semibold bg-white shadow-sm hover:shadow-md transition-shadow" style={{ color: '#0055A4' }}>
            ← Back to {vehicle.market_name}
          </Link>
        </div>

        {/* Footer */}
        <Footer />

      </div>
    </>
  );
}


