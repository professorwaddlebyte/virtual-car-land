import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
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
      SELECT ROUND(AVG(price_aed)) as avg_price, COUNT(*) as similar_count
      FROM vehicles
      WHERE make = $1 AND model = $2 AND year = $3 AND status = 'active'
    `, [vehicle.make, vehicle.model, vehicle.year]);

    return { props: { vehicle, marketData: marketAvg[0] || null } };
  } catch (e) {
    return { notFound: true };
  }
}

export default function VehicleDetail({ vehicle, marketData }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const photos = vehicle.photos || ['/placeholder-car.png'];
  const specs = vehicle.specs || {};

  const handleWhatsApp = () => {
    const msg = `Hi, I am interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model} (AED ${vehicle.price_aed}) on Dawirny.`;
    window.open(`https://wa.me/${vehicle.dealer_phone?.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Head>
        <title>{vehicle.year} {vehicle.make} {vehicle.model} | Dawirny UAE</title>
      </Head>

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
                  {/* Mileage right under title, same size, black font */}
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
                  {marketData?.avg_price && (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Market Avg: AED {Number(marketData.avg_price).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

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
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span> Vehicle Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                <SpecItem label="Transmission" value={specs.transmission} emoji="⚙️" />
                <SpecItem label="Fuel Type" value={specs.fuel} emoji="⛽" />
                <SpecItem label="Body Type" value={specs.body} emoji="🚙" />
                <SpecItem label="Cylinders" value={specs.cylinders} emoji="🔥" />
                <SpecItem label="Exterior Color" value={specs.color} emoji="🎨" />
                <SpecItem label="Regional Specs" value={specs.gcc ? 'GCC Standard' : 'Other'} emoji="🌍" />
                <SpecItem label="Model Year" value={vehicle.year} emoji="📅" />
              </div>
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




