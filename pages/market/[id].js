import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Footer from '../../components/Footer';

export default function MarketPage() {
  const router = useRouter();
  const mainSectionRef = useRef(null);
  
  // 1. Extracting router state
  const { isReady, query } = router;
  const { id } = query; // The Market ID from the URL path

  const [market, setMarket] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowroom, setSelectedShowroom] = useState(null);
  
  // Local state for the filter inputs
  const [filters, setFilters] = useState({ 
    make: '', 
    model: '', 
    year: '' 
  });

  // 2. Main Data Fetcher
  const fetchData = async (currentParams) => {
    setLoading(true);
    try {
      const marketId = id || router.query.id;
      if (!marketId) return;

      const searchParams = new URLSearchParams(currentParams);
      if (selectedShowroom) searchParams.set('showroom_id', selectedShowroom);

      // Fetch Vehicles
      const vRes = await fetch(`/api/markets/${marketId}/vehicles?${searchParams.toString()}`);
      const vData = await vRes.json();
      setVehicles(vData.vehicles || []);
      
      // Fetch Market/Showroom Directory (Only once)
      if (!market) {
        const sRes = await fetch(`/api/markets/${marketId}/showrooms`);
        const sData = await sRes.json();
        setShowrooms(sData.showrooms || []);
        setMarket(sData.market);
      }
    } catch (e) {
      console.error("Market Data Error:", e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Sync URL to State & Trigger Fetch
  useEffect(() => {
    if (!isReady) return;

    // Sync the search inputs with whatever is in the URL
    setFilters({
      make: query.make || '',
      model: query.model || '',
      year: query.year || ''
    });

    fetchData(query);
  }, [isReady, id, query.make, query.model, query.year, selectedShowroom]);

  // 4. Update URL when user types/selects
  const handleFilterChange = (key, value) => {
    const newQuery = { ...router.query };
    if (value) newQuery[key] = value;
    else delete newQuery[key];
    
    router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Head>
        <title>{market?.name || 'Car Market'} | Dawirny UAE</title>
      </Head>
      
      <nav className="bg-white border-b px-4 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black" style={{ background: '#1A9988' }}>d</div>
            <span className="font-bold text-xl tracking-tight" style={{ color: '#1A9988' }}>dawirny</span>
          </Link>
          <div className="hidden md:block text-xs font-black uppercase text-gray-400 tracking-widest">
             {market?.name || 'Loading Market Directory...'}
          </div>
        </div>
      </nav>

      <main ref={mainSectionRef} className="max-w-7xl mx-auto w-full p-4 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Search Filters
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Make</label>
                <select 
                  value={filters.make} 
                  onChange={(e) => handleFilterChange('make', e.target.value)}
                  className="w-full mt-1 p-3 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all appearance-none"
                >
                  <option value="">All Makes</option>
                  {['Toyota','Nissan','BMW','Mercedes-Benz','Lexus','Ford','Land Rover'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Model</label>
                <input 
                  type="text" 
                  placeholder="e.g. Patrol" 
                  value={filters.model}
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  className="w-full mt-1 p-3 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Showrooms
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
              {showrooms.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedShowroom === s.id ? 'border-teal-500 bg-teal-50/50' : 'border-gray-50 bg-white hover:border-gray-200'}`}
                >
                  <p className="font-black text-gray-900 uppercase leading-none mb-1">{s.showroom_number}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{s.dealer_name}</p>
                    <span className="text-[10px] font-black text-teal-600">{s.active_vehicles} cars</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8 px-2">
            <h1 className="text-2xl font-black uppercase tracking-tight">
              {selectedShowroom ? `Showroom ${showrooms.find(s=>s.id===selectedShowroom)?.showroom_number}` : 'Available Cars'}
              {!loading && <span className="ml-3 text-sm text-gray-400 font-bold">({vehicles.length})</span>}
            </h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-80 bg-gray-100 rounded-[32px] animate-pulse" />)}
            </div>
          ) : vehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicles.map(v => (
                <Link key={v.id} href={`/vehicle/${v.id}`} className="group bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="aspect-video bg-gray-200 relative overflow-hidden">
                    <img src={v.photos?.[0] || '/placeholder-car.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">
                      #{v.showroom_number}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-lg text-gray-900 uppercase leading-tight group-hover:text-teal-600 transition-colors">
                      {v.year} {v.make} {v.model}
                    </h3>
                    <div className="text-lg font-black text-gray-900 mt-1 mb-4">
                      {v.mileage_km ? `${Number(v.mileage_km).toLocaleString()} km` : 'New'}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="text-2xl font-black" style={{ color: '#1A9988' }}>
                        AED {Number(v.price_aed).toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {v.specs?.gcc ? 'GCC' : 'Import'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-20 text-center border-2 border-dashed border-gray-100">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-xl font-black text-gray-900 uppercase">No Matches Found</h3>
              <p className="text-gray-500 font-medium mt-2">Try clearing your filters to see more results in this market.</p>
              <button 
                onClick={() => router.push(`/market/${id}`)}
                className="mt-6 px-8 py-3 bg-teal-600 text-white rounded-full font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-100"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}



