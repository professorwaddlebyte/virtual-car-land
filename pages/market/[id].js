import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../../components/DawirnyLogo';
import Footer from '../../components/Footer';

export default function MarketPage() {
  const router = useRouter();
  const mainSectionRef = useRef(null);
  const { id, make, model, year, price_min, price_max, gcc } = router.query;

  const [market, setMarket] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShowroom, setSelectedShowroom] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [filters, setFilters] = useState({ make: '', model: '', year: '', price_min: '', price_max: '', gcc: '' });

  useEffect(() => {
    if (!id) return;
    
    // Sync filters with URL (coming from landing page)
    const urlFilters = { 
        make: make || '', 
        model: model || '', 
        year: year || '', 
        price_min: price_min || '', 
        price_max: price_max || '', 
        gcc: gcc || '' 
    };
    setFilters(urlFilters);
    
    fetchMarket();
    fetchVehicles(urlFilters, 1);
    setShortlist(JSON.parse(localStorage.getItem('shortlist') || '[]'));
  }, [id, make, model, year]); // Re-run if URL query changes

  async function fetchMarket() {
    const res = await fetch(`/api/markets/${id}`);
    const data = await res.json();
    setMarket(data.market);
    setShowrooms(data.showrooms || []);
  }

  async function fetchVehicles(activeFilters, page = 1) {
    setLoading(true);
    const f = activeFilters || filters;
    const params = new URLSearchParams({ market_id: id, page, limit: 20 });
    
    if (f.make) params.set('make', f.make);
    if (f.model) params.set('model', f.model);
    if (f.year) { params.set('year_min', f.year); params.set('year_max', f.year); }
    if (f.price_min) params.set('price_min', f.price_min);
    if (f.price_max) params.set('price_max', f.price_max);
    if (f.gcc !== '') params.set('gcc', f.gcc);

    const res = await fetch(`/api/vehicles?${params}`);
    const data = await res.json();
    setVehicles(data.vehicles || []);
    setPagination(data.pagination);
    setLoading(false);
  }

  function handleApplyFilters() { fetchVehicles(filters, 1); }
  
  function toggleShortlist(vehicle) {
    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    const exists = saved.find(v => v.id === vehicle.id);
    let updated = exists ? saved.filter(v => v.id !== vehicle.id) : [...saved, vehicle].slice(0, 5);
    localStorage.setItem('shortlist', JSON.stringify(updated));
    setShortlist(updated);
  }

  const makes = ['Toyota','Nissan','Honda','Mitsubishi','Hyundai','Kia','Ford','Chevrolet','BMW','Mercedes-Benz','Lexus','Infiniti','Dodge','Jeep'];
  const years = Array.from({ length: 25 }, (_, i) => 2026 - i);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Head><title>{market?.name || 'Market'} | Dawirny</title></Head>

      <header className="bg-white border-b sticky top-0 z-50 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/"><DawirnyLogo size="sm" /></Link>
          <span className="text-gray-200">/</span>
          <span className="font-black uppercase text-sm tracking-widest text-teal-600">{market?.name}</span>
        </div>
        <Link href="/shortlist" className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${shortlist.length > 0 ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-100' : 'bg-gray-100 text-gray-400'}`}>
          ⭐ Shortlist ({shortlist.length})
        </Link>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FILTERS SIDEBAR */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-teal-500 rounded-full"></span> Filters
            </h3>
            
            <div className="space-y-4">
              <FilterGroup label="Make">
                <select value={filters.make} onChange={e => setFilters({...filters, make: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-teal-500">
                  <option value="">All Makes</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FilterGroup>

              <FilterGroup label="Model">
                <input type="text" value={filters.model} onChange={e => setFilters({...filters, model: e.target.value})} placeholder="Any model..." className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-teal-500" />
              </FilterGroup>

              <FilterGroup label="Year">
                <select value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-teal-500">
                  <option value="">Any Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </FilterGroup>

              <div className="pt-4 space-y-2">
                <button onClick={handleApplyFilters} className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-sm uppercase tracking-widest transition-transform active:scale-95">
                  Apply Results
                </button>
                <button onClick={() => { const r = {make:'', model:'', year:'', price_min:'', price_max:'', gcc:''}; setFilters(r); fetchVehicles(r, 1); }} className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600">
                  Reset All
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* VEHICLE GRID */}
        <section ref={mainSectionRef} className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-gray-100 shadow-sm">
            <span className="text-sm font-bold text-gray-400">Showing <span className="text-gray-900">{pagination?.total || 0}</span> vehicles in Ras Al Khor</span>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => <div key={i} className="h-80 bg-gray-200 rounded-[32px]"></div>)}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicles.map(v => (
                <div key={v.id} className="group bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all relative">
                  <Link href={`/vehicle/${v.id}`} className="block">
                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                      <img src={v.photos?.[0] || '/placeholder-car.png'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute top-4 left-4 flex gap-2">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${v.specs?.gcc ? 'bg-teal-500 text-white' : 'bg-orange-500 text-white'}`}>
                            {v.specs?.gcc ? 'GCC Specs' : 'Import'}
                         </span>
                      </div>
                    </div>
                  </Link>

                  <button 
                    onClick={() => toggleShortlist(v)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-xl z-10"
                  >
                    {shortlist.some(s => s.id === v.id) ? '⭐' : '☆'}
                  </button>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xl font-black text-gray-900 uppercase leading-tight truncate">
                        {v.year} {v.make} <span className="text-teal-600">{v.model}</span>
                      </h3>
                    </div>
                    <p className="text-sm font-bold text-gray-400 mb-4">{Number(v.mileage_km).toLocaleString()} KM</p>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Price</p>
                        <p className="text-2xl font-black text-gray-900">AED {Number(v.price_aed).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Showroom {v.showroom_number}</p>
                         <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">{v.score_tier}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {pagination?.pages > 1 && (
            <div className="flex justify-center gap-2 py-8">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchVehicles(filters, i + 1)}
                  className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${pagination.page === i + 1 ? 'bg-teal-600 text-white' : 'bg-white text-gray-400 border border-gray-100 hover:border-teal-200'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}




