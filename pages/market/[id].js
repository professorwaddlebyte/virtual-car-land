import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Footer from '../../components/Footer';

export default function MarketPage() {
  const router = useRouter();
  const mainSectionRef = useRef(null);
  const { id, make: qMake, model: qModel, year: qYear, price_min: qPMin, price_max: qPMax, gcc: qGcc } = router.query;

  const [market, setMarket] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowroom, setSelectedShowroom] = useState(null);
  const [filters, setFilters] = useState({ make: '', model: '', year: '', price_min: '', price_max: '', gcc: '' });

  // Sync filters with URL on load/change
  useEffect(() => {
    if (!id) return;
    setFilters({
      make: qMake || '',
      model: qModel || '',
      year: qYear || '',
      price_min: qPMin || '',
      price_max: qPMax || '',
      gcc: qGcc || ''
    });
    fetchData();
  }, [id, qMake, qModel, qYear, qPMin, qPMax, qGcc, selectedShowroom]);

  async function fetchData() {
    setLoading(true);
    try {
      // Construct query string for the API
      const params = new URLSearchParams({
        ...router.query,
        ...(selectedShowroom ? { showroom_id: selectedShowroom } : {})
      });

      const vRes = await fetch(`/api/markets/${id}/vehicles?${params.toString()}`);
      const vData = await vRes.json();
      setVehicles(vData.vehicles || []);
      
      const sRes = await fetch(`/api/markets/${id}/showrooms`);
      const sData = await sRes.json();
      setShowrooms(sData.showrooms || []);
      setMarket(sData.market);
    } catch (e) {
      console.error("Fetch error:", e);
    }
    setLoading(false);
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const params = new URLSearchParams(router.query);
    if (value) params.set(key, value);
    else params.delete(key);
    
    router.push(`/market/${id}?${params.toString()}`, undefined, { shallow: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Head><title>{market?.name || 'Market'} | Dawirny UAE</title></Head>
      
      <nav className="bg-white border-b px-4 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black" style={{ background: '#1A9988' }}>d</div>
            <span className="font-bold text-xl tracking-tight" style={{ color: '#1A9988' }}>dawirny</span>
          </Link>
          <div className="hidden md:block text-xs font-black uppercase text-gray-400 tracking-widest">
            {market?.name || 'Loading Market...'}
          </div>
        </div>
      </nav>

      <main ref={mainSectionRef} className="max-w-7xl mx-auto w-full p-4 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: FILTERS & SHOWROOMS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SEARCH FILTERS BOX */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Filter Results
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Make</label>
                <select 
                  value={filters.make} 
                  onChange={(e) => handleFilterChange('make', e.target.value)}
                  className="w-full mt-1 p-3 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                >
                  <option value="">All Makes</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Nissan">Nissan</option>
                  <option value="Lexus">Lexus</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                </select>
              </div>
              <input 
                type="text" 
                placeholder="Model (e.g. Patrol)" 
                value={filters.model}
                onChange={(e) => handleFilterChange('model', e.target.value)}
                className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          {/* SHOWROOM DIRECTORY BOX */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span> Showroom Directory
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {showrooms.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedShowroom === s.id ? 'border-teal-500 bg-teal-50/50' : 'border-gray-50 bg-white hover:border-gray-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-black text-gray-900 uppercase leading-none mb-1">{s.showroom_number}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[120px]">{s.dealer_name}</p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-gray-100 text-gray-500 uppercase">{s.active_vehicles} cars</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: LISTINGS GRID */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8 px-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              {selectedShowroom ? `Showroom ${showrooms.find(s=>s.id===selectedShowroom)?.showroom_number}` : 'Live Listings'}
              <span className="ml-3 text-sm text-gray-400 font-bold">({vehicles.length})</span>
            </h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] bg-gray-100 rounded-[32px] animate-pulse" />)}
            </div>
          ) : vehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicles.map(v => (
                <Link key={v.id} href={`/vehicle/${v.id}`} className="group bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    <img 
                      src={v.photos?.[0] || '/placeholder-car.png'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">
                      Showroom {v.showroom_number}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-lg text-gray-900 uppercase leading-tight group-hover:text-teal-600 transition-colors">
                      {v.year} {v.make} {v.model}
                    </h3>
                    <div className="text-lg font-black text-gray-900 mt-1 mb-4">
                      {Number(v.mileage_km).toLocaleString()} km
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="text-2xl font-black" style={{ color: '#1A9988' }}>
                        AED {Number(v.price_aed).toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {v.specs?.gcc ? 'GCC Specs' : 'Import'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-20 text-center border-2 border-dashed border-gray-100">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-black text-gray-900 uppercase">No cars found</h3>
              <p className="text-gray-500 font-medium mt-2">Try adjusting your filters or showroom selection.</p>
              <button 
                onClick={() => { setSelectedShowroom(null); setFilters({make:'', model:'', year:'', price_min:'', price_max:'', gcc:''}); router.push(`/market/${id}`) }}
                className="mt-6 text-teal-600 font-black uppercase text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}



