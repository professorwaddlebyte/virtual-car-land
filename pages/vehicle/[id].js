import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { query } from '../../lib/db';
import Footer from '../../components/Footer';
import VehicleSpecsFeatures from '../../components/VehicleSpecsFeatures';

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
          price_vs_market_pct: priceDiff,
        },
      },
    };
  } catch (e) {
    return { notFound: true };
  }
}

export default function VehicleDetail({ vehicle, market_intelligence }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [priceAnalysis, setPriceAnalysis] = useState(null); // null | 'loading' | { verdict, ... }
  const [priceAnalysisError, setPriceAnalysisError] = useState(null);

  const handleAnalyzePrice = async () => {
    if (priceAnalysis && priceAnalysis !== 'loading') return;
    setPriceAnalysis('loading');
    setPriceAnalysisError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/price-analysis`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setPriceAnalysis(data);
    } catch (e) {
      setPriceAnalysisError(e.message);
      setPriceAnalysis(null);
    }
  };

  const photos = vehicle.photos || ['/placeholder-car.png'];
  const specs = vehicle.specs || {};

  const priceDiff = market_intelligence?.price_vs_market_pct;

  const similarUrl = `/market/${vehicle.market_id}?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&year=${vehicle.year}`;
  const lowestUrl = `/market/${vehicle.market_id}?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&year=${vehicle.year}&price_max=${(market_intelligence?.min_price || 0) + 1000}`;

  const handleWhatsApp = () => {
    const msg = `Hi, I am interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model} (AED ${vehicle.price_aed?.toLocaleString()}) on Dawirny.`;
    window.open(`https://wa.me/${vehicle.dealer_phone?.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Head>
        <title>{`${vehicle.year} ${vehicle.make} ${vehicle.model} | Dawirny UAE`}</title>
        <meta name="description" content={`${vehicle.year} ${vehicle.make} ${vehicle.model}, ${Number(vehicle.mileage_km).toLocaleString()} km, AED ${Number(vehicle.price_aed).toLocaleString()}. Showroom ${vehicle.showroom_number}, ${vehicle.market_name}, Dubai.`} />
      </Head>

      {/* NAV */}
      <nav className="bg-white border-b sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black" style={{ background: '#1A9988' }}>d</div>
            <span className="font-bold text-xl tracking-tight" style={{ color: '#1A9988' }}>dawirny</span>
          </Link>
          <Link href={`/market/${vehicle.market_id}`} className="text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors">
            ← Back to Market
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-6">

            {/* GALLERY */}
            <section className="bg-black rounded-3xl overflow-hidden shadow-xl">
              <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                <img
                  src={photos[activePhoto]}
                  alt={vehicle.model}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
                  {activePhoto + 1} / {photos.length}
                </div>
              </div>
              <div className="flex gap-2 p-3 overflow-x-auto bg-gray-900/40 no-scrollbar">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`relative flex-shrink-0 w-20 sm:w-24 aspect-video rounded-lg overflow-hidden border-2 transition-all ${activePhoto === i ? 'border-teal-400 scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={p} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>

            {/* VEHICLE MAIN INFO */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 uppercase leading-tight">
                    {vehicle.year} {vehicle.make} <span style={{ color: '#1A9988' }}>{vehicle.model}</span>
                  </h1>
                  <div className="text-3xl font-black text-gray-900 mt-1">
                    {Number(vehicle.mileage_km).toLocaleString()} km
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-gray-500 font-medium flex items-center gap-2">📍 {vehicle.market_name}</p>
                    <p className="text-teal-600 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                      🏬 Showroom {vehicle.showroom_number}
                    </p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-4xl font-black" style={{ color: '#1A9988' }}>
                    AED {Number(vehicle.price_aed).toLocaleString()}
                  </div>
                  {/* Price vs market badge */}
                  {priceDiff !== null && priceDiff !== undefined && (
                    <span className={`inline-block mt-2 px-3 py-1 rounded-xl text-xs font-bold ${
                      priceDiff < 0 ? 'bg-green-100 text-green-700' :
                      priceDiff > 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {priceDiff < 0
                        ? `${Math.abs(priceDiff)}% below market`
                        : priceDiff > 0
                        ? `${priceDiff}% above market`
                        : 'At market price'}
                    </span>
                  )}
                  {market_intelligence?.avg_price > 0 && (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Market Avg: AED {Number(market_intelligence.avg_price).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* MARKET INTELLIGENCE */}
            {market_intelligence && market_intelligence.avg_price > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span> Market Intelligence
                </h2>
                <p className="text-xs mb-5 ml-4" style={{ color: '#1A9988' }}>
                  Based on {market_intelligence.similar_count} similar {vehicle.make} {vehicle.model} {vehicle.year} listing{market_intelligence.similar_count !== 1 ? 's' : ''} in this market
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-base font-black text-gray-900">AED {Number(market_intelligence.avg_price).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wide">Market Avg</p>
                  </div>
                  <Link href={lowestUrl} className="p-4 rounded-2xl border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors block">
                    <p className="text-base font-black text-teal-700">AED {Number(market_intelligence.min_price).toLocaleString()}</p>
                    <p className="text-xs text-teal-500 mt-1 font-medium uppercase tracking-wide">Lowest →</p>
                  </Link>
                  <Link href={similarUrl} className="p-4 rounded-2xl border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors block">
                    <p className="text-base font-black text-teal-700">{market_intelligence.similar_count}</p>
                    <p className="text-xs text-teal-500 mt-1 font-medium uppercase tracking-wide">Similar Cars →</p>
                  </Link>
                </div>
              </div>
            )}

            {/* SELLER NOTES */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span> Seller's Notes
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {vehicle.description || "The dealer has not provided additional notes for this vehicle."}
              </p>
            </div>

            {/* SPECIFICATIONS GRID */}
            <VehicleSpecsFeatures vehicle={vehicle} />

            {/* AI PRICE ANALYSIS */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span> AI Price Analysis
              </h2>
              <p className="text-xs text-gray-400 ml-4 mb-5">
                Compares this car against active equivalents in the market
              </p>

              {/* Button — hidden once result is shown */}
              {!priceAnalysis && !priceAnalysisError && (
                <button
                  onClick={handleAnalyzePrice}
                  className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                  style={{ background: '#1A9988' }}
                >
                  <span>🔍</span> Analyze Price
                </button>
              )}

              {/* Loading state */}
              {priceAnalysis === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-400 font-medium">Analyzing market data…</p>
                </div>
              )}

              {/* Error state */}
              {priceAnalysisError && (
                <div className="p-4 bg-red-50 rounded-2xl text-sm text-red-600 font-medium text-center">
                  {priceAnalysisError}
                  <button
                    onClick={() => { setPriceAnalysisError(null); }}
                    className="block mx-auto mt-2 text-xs underline text-red-400"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Result */}
              {priceAnalysis && priceAnalysis !== 'loading' && (() => {
                const badgeStyles = {
                  green:  { bg: 'bg-green-100',  text: 'text-green-700',  icon: '✅' },
                  teal:   { bg: 'bg-teal-100',   text: 'text-teal-700',   icon: '💎' },
                  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⚠️' },
                  red:    { bg: 'bg-red-100',    text: 'text-red-700',    icon: '❌' },
                  gray:   { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: '🔎' },
                };
                const style = badgeStyles[priceAnalysis.badge_color] || badgeStyles.gray;
                return (
                  <div className="space-y-4">
                    {/* Verdict badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm uppercase tracking-wide ${style.bg} ${style.text}`}>
                      <span>{style.icon}</span>
                      {priceAnalysis.verdict}
                    </div>

                    {/* Bullets */}
                    <ul className="space-y-2">
                      {priceAnalysis.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                          <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: '#f0faf9', color: '#1A9988' }}>
                            {i + 1}
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>

                    {/* Negotiation margin */}
                    {priceAnalysis.negotiation_margin && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#f0faf9' }}>
                        <span className="text-lg">💬</span>
                        <span className="text-sm font-bold" style={{ color: '#0d6b5e' }}>
                          {priceAnalysis.negotiation_margin}
                        </span>
                      </div>
                    )}

                    {/* Meta */}
                    <p className="text-[10px] text-gray-300 font-medium text-right uppercase tracking-widest">
                      Based on {priceAnalysis.comparables_count} comparable listing{priceAnalysis.comparables_count !== 1 ? 's' : ''} · Powered by AI
                    </p>
                  </div>
                );
              })()}
            </div>

          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-teal-50 sticky top-24">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-50">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 text-2xl font-bold">
                  {vehicle.dealer_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 leading-tight uppercase">{vehicle.dealer_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      vehicle.score_tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                      vehicle.score_tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {vehicle.score_tier} Dealer
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleWhatsApp}
                  className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-green-200"
                  style={{ background: '#25D366' }}
                >
                  <span className="text-2xl">💬</span> WhatsApp Dealer
                </button>
                {vehicle.dealer_phone && (
                  <a
                    href={`tel:${vehicle.dealer_phone}`}
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-lg border-2 transition-all hover:bg-gray-50 active:scale-95"
                    style={{ borderColor: '#1A9988', color: '#1A9988' }}
                  >
                    <span>📞</span> Call Seller
                  </a>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-gray-400">Location</span>
                  <span className="text-gray-900">{vehicle.market_name}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium mt-2">
                  <span className="text-gray-400">Showroom</span>
                  <span className="text-gray-900"># {vehicle.showroom_number}</span>
                </div>
                <div className="bg-teal-50 text-teal-700 text-[10px] font-bold uppercase p-2 rounded-lg mt-4 text-center tracking-widest">
                  Verified Listing • Dawirny Secured
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

function SpecItem({ label, value, emoji }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-lg grayscale group-hover:grayscale-0">{emoji}</span>
        <span className="text-sm font-bold text-gray-400 uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-800">{value}</span>
    </div>
  );
}




