import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { query } from '../../lib/db';

export async function getServerSideProps({ params }) {
  try {
    const vehicles = await query(`
      SELECT 
        v.*,
        d.business_name as dealer_name,
        d.listing_integrity_score,
        d.score_tier,
        d.phone as dealer_phone,
        d.telegram_username as dealer_telegram,
        s.showroom_number,
        s.section,
        s.location_hint,
        s.map_x,
        s.map_y,
        m.name as market_name,
        m.id as market_id
      FROM vehicles v
      LEFT JOIN dealers d ON v.dealer_id = d.id
      LEFT JOIN showrooms s ON v.showroom_id = s.id
      LEFT JOIN markets m ON v.market_id = m.id
      WHERE v.id = $1
    `, [params.id]);

    if (!vehicles.length) return { notFound: true };

    const vehicle = vehicles[0];

    const marketAvg = await query(`
      SELECT 
        ROUND(AVG(price_aed)) as avg_price,
        COUNT(*) as similar_count,
        MIN(price_aed) as min_price,
        MAX(price_aed) as max_price
      FROM vehicles
      WHERE make = $1 AND model = $2 AND year = $3 AND status = 'active'
    `, [vehicle.make, vehicle.model, vehicle.year]);

    const priceHistory = await query(`
      SELECT old_price, new_price, changed_at
      FROM price_history
      WHERE vehicle_id = $1
      ORDER BY changed_at ASC
    `, [params.id]);

    const avg = marketAvg[0];
    const priceDiff = avg?.avg_price
      ? Math.round(((vehicle.price_aed - avg.avg_price) / avg.avg_price) * 100)
      : null;

    return {
      props: {
        vehicle: JSON.parse(JSON.stringify(vehicle)),
        market_intelligence: {
          avg_price: parseInt(avg?.avg_price || 0),
          similar_count: parseInt(avg?.similar_count || 0),
          min_price: parseInt(avg?.min_price || 0),
          max_price: parseInt(avg?.max_price || 0),
          price_vs_market_pct: priceDiff
        },
        price_history: JSON.parse(JSON.stringify(priceHistory))
      }
    };
  } catch (e) {
    return { notFound: true };
  }
}

export default function VehiclePage({ vehicle, market_intelligence, price_history }) {
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
    if (exists) {
      updated = saved.filter(v => v.id !== vehicle.id);
    } else {
      if (saved.length >= 5) { alert('Shortlist is full.'); return; }
      updated = [...saved, vehicle];
    }
    localStorage.setItem('shortlist', JSON.stringify(updated));
    setShortlist(updated);
  }

  function handleWhatsApp() {
    const msg = encodeURIComponent(
      `Hi, I'm interested in your ${vehicle.year} ${vehicle.make} ${vehicle.model} listed at AED ${vehicle.price_aed?.toLocaleString()} on Virtual Car Land. Is it still available?`
    );
    const phone = vehicle.dealer_phone?.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: vehicle.id, inquiry_type: 'whatsapp_click' })
    }).catch(() => {});
  }

  const isShortlisted = shortlist.some(v => v.id === vehicle.id);
  const priceDiff = market_intelligence?.price_vs_market_pct;
  const photos = vehicle.photos || [];

  const tierColors = {
    Platinum: 'bg-purple-100 text-purple-700',
    Gold: 'bg-yellow-100 text-yellow-700',
    Silver: 'bg-gray-100 text-gray-600',
    Unrated: 'bg-gray-50 text-gray-400'
  };

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} — AED ${vehicle.price_aed?.toLocaleString()} | ${vehicle.market_name}`;
  const description = `${vehicle.year} ${vehicle.make} ${vehicle.model}, ${vehicle.mileage_km?.toLocaleString()} km, ${vehicle.specs?.gcc ? 'GCC specs' : 'Non-GCC'}, AED ${vehicle.price_aed?.toLocaleString()}. Located at showroom ${vehicle.showroom_number} in ${vehicle.market_name}, Dubai.`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="product" />
        {photos.length > 0 && <meta property="og:image" content={photos[0]} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              "description": description,
              "image": photos[0] || '',
              "offers": {
                "@type": "Offer",
                "price": vehicle.price_aed,
                "priceCurrency": "AED",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "AutoDealer",
                  "name": vehicle.dealer_name
                }
              }
            })
          }}
        />
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

          {/* Photo Gallery */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="relative bg-gray-100 flex items-center justify-center" style={{height: '320px'}}>
              {photos.length > 0 ? (
                <img
                  src={photos[currentPhoto]}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-8xl">🚗</span>
              )}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPhoto(p => Math.max(0, p - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCurrentPhoto(p => Math.min(photos.length - 1, p + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPhoto(i)}
                        className="w-2 h-2 rounded-full transition-colors"
                        style={{background: i === currentPhoto ? '#0055A4' : '#d1d5db'}}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors"
                    style={{borderColor: i === currentPhoto ? '#0055A4' : 'transparent'}}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ml-2 ${vehicle.specs?.gcc ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {vehicle.specs?.gcc ? 'GCC' : 'Non-GCC'}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-4 flex-wrap">
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
            <div className="p-4 rounded-xl border-2" style={{borderColor: '#0055A4', background: '#f0f7ff'}}>
              <div className="flex items-center justify-between mb-2">
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
              <p className="text-xs text-gray-400 mt-2">
                {vehicle.market_name} • {vehicle.views_count} views
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
          <a
                
                  href={`tel:${vehicle.dealer_phone}`}
                  className="block w-full py-4 rounded-xl font-bold text-center border-2"
                  style={{borderColor: '#0055A4', color: '#0055A4'}}
                >
                  📞 Call {vehicle.dealer_phone}
                </a>
              )}
            </div>
          </div>

          <Link
            href={`/market/${vehicle.market_id}`}
            className="block w-full py-3 rounded-xl text-center text-sm font-medium bg-white shadow-sm"
            style={{color: '#0055A4'}}
          >
            ← Back to {vehicle.market_name}
          </Link>

        </div>
      </div>
    </>
  );
}
