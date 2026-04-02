import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../../components/DawirnyLogo';
import Footer from '../../components/Footer';

export default function MarketPage() {
  const router = useRouter();
  const { id, make: qMake, model: qModel, year: qYear } = router.query;

  const [market, setMarket] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ make: '', model: '', year: '' });

  useEffect(() => {
    if (!id) return;
    const initial = { make: qMake || '', model: qModel || '', year: qYear || '' };
    setFilters(initial);
    fetchMarket();
    fetchVehicles(initial, 1);
  }, [id, qMake, qModel, qYear]);

  async function fetchMarket() {
    const res = await fetch(`/api/markets/${id}`);
    const data = await res.json();
    setMarket(data.market);
    setShowrooms(data.showrooms || []);
  }

  async function fetchVehicles(f, page = 1) {
    setLoading(true);
    const params = new URLSearchParams({ market_id: id, page, limit: 20 });
    if (f.make) params.set('make', f.make);
    if (f.model) params.set('model', f.model);
    if (f.year) { params.set('year_min', f.year); params.set('year_max', f.year); }

    const res = await fetch(`/api/vehicles?${params}`);
    const data = await res.json();
    setVehicles(data.vehicles || []);
    setPagination(data.pagination);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Head><title>{market?.name || 'Market'} | Dawirny</title></Head>

      <header className="bg-white border-b h-16 sticky top-0 z-50 px-4 flex items-center justify-between">
        <Link href="/"><DawirnyLogo size="sm" /></Link>
        <span className="font-black uppercase text-xs tracking-widest text-teal-600">{market?.name}</span>
        <div className="w-10"></div>
      </header>

      <main className="max-w-[1600px] mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* COLUMN 1: FILTERS */}
        <aside className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-20">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-6 tracking-widest">Filters</h3>
            <div className="space-y-6">
               <FilterItem label="Make">
                  <select value={filters.make} onChange={e => setFilters({...filters, make: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl font-bold text-sm py-3">
                    <option value="">All Makes</option>
                    {['Toyota','Nissan','Honda','BMW','Mercedes-Benz'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
               </FilterItem>
               <FilterItem label="Model">
                  <input type="text" value={filters.model} onChange={e => setFilters({...filters, model: e.target.value})} placeholder="e.g. Patrol" className="w-full bg-gray-50 border-none rounded-xl font-bold text-sm py-3" />
               </FilterItem>
               <button onClick={() => fetchVehicles(filters, 1)} className="w-full bg-black text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest">Update</button>
            </div>
          </div>
        </aside>

        {/* COLUMN 2: CAR LISTINGS */}
        <section className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? <div className="col-span-full py-20 text-center font-black text-gray-300">LOADING...</div> : 
              vehicles.map(v => (
                <Link href={`/vehicle/${v.id}`} key={v.id} className="group bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="aspect-video bg-gray-100 relative">
                    <img src={v.photos?.[0]} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur text-white text-[10px] font-black rounded-full">
                       SHOWROOM {v.showroom_number}
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-black text-lg uppercase truncate">{v.year} {v.make} <span className="text-teal-600">{v.model}</span></h4>
                    <p className="text-2xl font-black text-gray-900 mt-2">AED {Number(v.price_aed).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{v.mileage_km} KM</span>
                       <span className="ml-auto text-[10px] font-black px-2 py-1 bg-teal-50 text-teal-700 rounded-lg">{v.score_tier}</span>
                    </div>
                  </div>
                </Link>
              ))
            }
          </div>
        </section>

        {/* COLUMN 3: SHOWROOMS & MAP */}
        <aside className="lg:col-span-3 space-y-6">
          {/* MAP SECTION */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
               <h3 className="text-xs font-black uppercase text-gray-900 tracking-widest">Market Map</h3>
               <span className="text-[10px] font-bold text-teal-600">RAS AL KHOR</span>
            </div>
            <div className="aspect-square bg-gray-100 relative">
               {market?.map_image_url ? (
                 <img src={market.map_image_url} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-black p-8 text-center uppercase">Drone map coming soon</div>
               )}
            </div>

            {/* SHOWROOM LIST */}
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Showrooms in this market</h4>
               {showrooms.map(s => (
                 <div key={s.id} className="p-3 bg-gray-50 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="font-black text-sm uppercase">#{s.showroom_number}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{s.dealer_name}</p>
                    </div>
                    <span className="text-[10px] font-black text-teal-600 bg-white px-2 py-1 rounded-lg border border-teal-100">{s.active_vehicles} CARS</span>
                 </div>
               ))}
            </div>
          </div>
        </aside>

      </main>
      <Footer />
    </div>
  );
}

function FilterItem({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">{label}</label>
      {children}
    </div>
  );
}




