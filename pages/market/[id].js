import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Footer from '../../components/Footer';

export default function MarketPage() {
  const router = useRouter();
  const { id, make, model, year } = router.query;
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [market, setMarket] = useState(null);
  const [selectedShowroom, setSelectedShowroom] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id, make, model, year, selectedShowroom]);

  async function fetchData() {
    setLoading(true);
    try {
      const vRes = await fetch(`/api/markets/${id}/vehicles?${new URLSearchParams(router.query).toString()}${selectedShowroom ? `&showroom_id=${selectedShowroom}` : ''}`);
      const vData = await vRes.json();
      setVehicles(vData.vehicles || []);
      
      const sRes = await fetch(`/api/markets/${id}/showrooms`);
      const sData = await sRes.json();
      setShowrooms(sData.showrooms || []);
      setMarket(sData.market);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Head><title>{market?.name || 'Market'} | Dawirny Directory</title></Head>
      
      <nav className="bg-white border-b px-4 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black" style={{ background: '#1A9988' }}>d</div>
            <span className="font-bold text-xl tracking-tight" style={{ color: '#1A9988' }}>dawirny</span>
          </Link>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{market?.name}</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full p-4 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR: FILTERS & DIRECTORY */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Showroom Directory
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
              {showrooms.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedShowroom === s.id ? 'border-teal-500 bg-teal-50/50' : 'border-gray-50 bg-white hover:border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-gray-900 uppercase leading-none mb-1">{s.showroom_number}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{s.dealer_name}</p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-gray-100">{s.active_vehicles} cars</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT: VEHICLE GRID */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tight">
              {selectedShowroom ? `Showroom ${showrooms.find(s=>s.id===selectedShowroom)?.showroom_number}` : 'Live Listings'}
              <span className="ml-3 text-sm text-gray-400 font-medium">({vehicles.length} found)</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center text-gray-400 font-bold animate-pulse">Loading listings...</div>
            ) : vehicles.map(v => (
              <Link key={v.id} href={`/vehicle/${v.id}`} className="group bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="aspect-video bg-gray-100 relative">
                  <img src={v.photos?.[0] || '/placeholder-car.png'} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    Showroom {v.showroom_number}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-lg text-gray-900 uppercase leading-tight group-hover:text-teal-600 transition-colors">
                      {v.year} {v.make} {v.model}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <span>{Number(v.mileage_km).toLocaleString()} KM</span>
                    <span>•</span>
                    <span>{v.specs?.gcc ? 'GCC' : 'Import'}</span>
                  </div>
                  <div className="text-2xl font-black" style={{ color: '#1A9988' }}>
                    AED {Number(v.price_aed).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}




