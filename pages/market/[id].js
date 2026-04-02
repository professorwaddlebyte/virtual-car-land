import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../../components/DawirnyLogo';
import Footer from '../../components/Footer';

export default function MarketPage() {
  const router = useRouter();
  const mainSectionRef = useRef(null);
  const { id, make: qMake, model: qModel, year: qYear, price_min: qPMin, price_max: qPMax, gcc: qGcc } = router.query;

  const [market, setMarket] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShowroom, setSelectedShowroom] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [mapOpen, setMapOpen] = useState(true);
  const [filters, setFilters] = useState({ make: '', model: '', year: '', price_min: '', price_max: '', gcc: '' });

  useEffect(() => {
    if (!id) return;
    const initialFilters = { make: qMake || '', model: qModel || '', year: qYear || '', price_min: qPMin || '', price_max: qPMax || '', gcc: qGcc || '' };
    setFilters(initialFilters);
    fetchMarket();
    fetchVehicles(initialFilters, 1);
    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    setShortlist(saved);
  }, [id]);

  async function fetchMarket() {
    const res = await fetch(`/api/markets/${id}`);
    const data = await res.json();
    setMarket(data.market);
    setShowrooms(data.showrooms || []);
  }

  async function fetchVehicles(activeFilters, page = 1) {
    setLoading(true);
    if (mainSectionRef.current) {
      mainSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    const f = activeFilters || filters;
    const params = new URLSearchParams({ market_id: id, page, limit: 40 });
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
  function handleFilterChange(key, value) { setFilters(prev => ({ ...prev, [key]: value })); }

  function toggleShortlist(vehicle) {
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

  function isShortlisted(vehicleId) { return shortlist.some(v => v.id === vehicleId); }

  const tierColors = { Platinum: 'bg-purple-50 text-purple-700 border-purple-100', Gold: 'bg-yellow-50 text-yellow-700 border-yellow-100', Silver: 'bg-gray-50 text-gray-600 border-gray-100', Unrated: 'bg-gray-50 text-gray-400 border-gray-50' };
  const makes = ['Toyota','Nissan','Honda','Mitsubishi','Hyundai','Kia','Ford','Chevrolet','BMW','Mercedes-Benz','Lexus','Infiniti','Dodge','Jeep'];
  const years = Array.from({ length: 20 }, (_, i) => 2025 - i);

  return (
    <>
      <Head><title>{market?.name || 'Market'} — dawirny</title></Head>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">

        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <Link href="/"><DawirnyLogo size="sm" /></Link>
                <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>
                <span className="font-black text-lg hidden sm:block uppercase tracking-tight" style={{ color: '#1A9988' }}>
                  {market?.name || 'Loading...'}
                </span>
              </div>
              <Link href="/shortlist" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-sm"
                style={{ background: shortlist.length > 0 ? '#FFD700' : '#ffffff', color: '#1a1a1a', border: shortlist.length > 0 ? 'none' : '1px solid #e2e8f0' }}>
                <span className="text-lg">⭐</span> {shortlist.length}/5
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">📍 Your Location</h3>
                <div className="relative mb-3">
                  <input type="text" placeholder="e.g. Near Gate 2..."
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-teal-500 text-gray-700" />
                </div>
                <button className="w-full py-4 rounded-2xl text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-teal-900/10 transition-all hover:brightness-105" style={{ background: '#1A9988' }}>
                  Find Nearby
                </button>
              </div>

              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => setMapOpen(!mapOpen)} className="w-full flex items-center justify-between p-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">🗺️ Market Map</h3>
                  <span className={`transition-transform duration-300 ${mapOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {mapOpen && (
                  <div className="px-6 pb-6">
                    <div className="relative bg-gray-50 rounded-[24px] overflow-hidden border border-gray-100" style={{ paddingBottom: '60%' }}>
                      <div className="absolute inset-0">
                        {market?.map_image_url ? (
                          <img src={market.map_image_url} alt="Market map" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <div className="text-center"><div className="text-4xl mb-2">🗺️</div><p className="text-[10px] font-bold uppercase tracking-widest">Generating Map...</p></div>
                          </div>
                        )}
                        {showrooms.map(s => (
                          <button key={s.id} onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white font-black transition-all hover:scale-110 active:scale-90"
                            style={{ left: `${s.map_x}%`, top: `${s.map_y}%`, background: s.id === selectedShowroom ? '#FFD700' : '#1A9988', fontSize: '10px' }}>
                            {s.showroom_number?.split('-')[1] || '•'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {selectedShowroom && (() => {
                      const s = showrooms.find(x => x.id === selectedShowroom);
                      return s ? (
                        <div className="mt-4 p-4 rounded-2xl border border-teal-100 animate-in fade-in slide-in-from-top-2" style={{ background: '#f0faf9' }}>
                          <p className="font-black text-sm uppercase" style={{ color: '#0d6b5e' }}>{s.showroom_number}</p>
                          <p className="text-xs font-bold text-teal-600 mt-0.5">{s.dealer_name}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-teal-200/30">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">{s.active_vehicles} cars</p>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase ${tierColors[s.score_tier] || tierColors.Unrated}`}>{s.score_tier}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Main Section */}
            <div ref={mainSectionRef} className="lg:col-span-3 space-y-6">
              
              {/* Filter Glassmorphism Box */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Make', type: 'select', key: 'make', options: makes },
                    { label: 'Model', type: 'input', key: 'model', placeholder: 'Any model' },
                    { label: 'Year', type: 'select', key: 'year', options: years },
                    { label: 'Min Price', type: 'input', key: 'price_min', placeholder: 'AED' },
                    { label: 'Max Price', type: 'input', key: 'price_max', placeholder: 'AED' },
                    { label: 'Specs', type: 'select', key: 'gcc', options: [{v: 'true', l: 'GCC Only'}, {v: 'false', l: 'Non-GCC Only'}], isGcc: true }
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[1.5px] ml-1">{f.label}</label>
                      {f.type === 'select' ? (
                        <select value={filters[f.key]} onChange={e => handleFilterChange(f.key, e.target.value)}
                          className="bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer">
                          <option value="">{f.isGcc ? 'All Specs' : `Any ${f.label}`}</option>
                          {f.options.map(opt => <option key={opt.v || opt} value={opt.v || opt}>{opt.l || opt}</option>)}
                        </select>
                      ) : (
                        <input type={f.key.includes('price') ? 'number' : 'text'} placeholder={f.placeholder} value={filters[f.key]}
                          onChange={e => handleFilterChange(f.key, e.target.value)}
                          className="bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-teal-500" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-50">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">
                    {pagination ? <><span className="text-gray-900 font-black">{pagination.total}</span> Results</> : '...'}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => { const r = { make: '', model: '', year: '', price_min: '', price_max: '', gcc: '' }; setFilters(r); fetchVehicles(r, 1); }}
                      className="px-6 py-3 rounded-2xl text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">Reset</button>
                    <button onClick={handleApplyFilters} className="px-8 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-900/10 transition-all hover:scale-[1.02]" style={{ background: '#1A9988' }}>Apply</button>
                  </div>
                </div>
              </div>

              {/* Vehicle Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-[32px] h-[400px] animate-pulse border border-gray-100"></div>
                  ))}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 text-center border border-dashed border-gray-200">
                  <div className="text-6xl mb-6">🔍</div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">No Match Found</h3>
                  <p className="text-gray-400 font-medium italic">Try broadening your search filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vehicles.map(v => (
                    <div key={v.id} className="group bg-white rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden flex flex-col">
                      <div className="relative h-56 overflow-hidden">
                        {v.photos && v.photos.length > 0 ? (
                          <img src={v.photos[0]} alt={`${v.make}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl">🚗</div>}
                        <button onClick={() => toggleShortlist(v)} className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-transform active:scale-75">
                          {isShortlisted(v.id) ? '⭐' : '☆'}
                        </button>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-black text-gray-900 uppercase leading-tight">{v.year} {v.make} <span style={{ color: '#1A9988' }}>{v.model}</span></h3>
                          <div className="text-2xl font-black text-gray-900">
                            <span className="text-[10px] text-gray-400 mr-1 uppercase">AED</span>
                            {v.price_aed?.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-xs font-bold text-gray-500 uppercase">{v.mileage_km?.toLocaleString()} KM</span>
                          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase border ${v.specs?.gcc ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {v.specs?.gcc ? 'GCC Specs' : 'Import'}
                          </span>
                        </div>

                        <div className="mt-auto p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Showroom {v.showroom_number}</p>
                            <p className="text-sm font-black text-gray-800 truncate max-w-[150px]">{v.dealer_name}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${tierColors[v.score_tier] || tierColors.Unrated}`}>{v.score_tier}</span>
                        </div>
                        
                        <Link href={`/vehicle/${v.id}`} className="mt-4 block w-full py-4 rounded-2xl text-center text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-900/10 transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: '#1A9988' }}>
                          View Listing
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col items-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Page {pagination.page} of {pagination.pages}</p>
                  <div className="flex gap-2">
                    {pagination.page > 1 && <button onClick={() => fetchVehicles(filters, pagination.page - 1)} className="w-12 h-12 rounded-2xl border-2 border-gray-100 flex items-center justify-center font-black hover:bg-gray-50">←</button>}
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button key={i} onClick={() => fetchVehicles(filters, i + 1)}
                        className={`w-12 h-12 rounded-2xl text-sm font-black transition-all ${pagination.page === i + 1 ? 'text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
                        style={pagination.page === i + 1 ? { background: '#1A9988' } : {}}>
                        {i + 1}
                      </button>
                    ))}
                    {pagination.page < pagination.pages && <button onClick={() => fetchVehicles(filters, pagination.page + 1)} className="w-12 h-12 rounded-2xl border-2 border-gray-100 flex items-center justify-center font-black hover:bg-gray-50">→</button>}
                  </div>
                </div>
              )}

              {/* Showroom Directory */}
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Showroom Directory</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {showrooms.map(s => (
                    <button key={s.id} onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                      className={`group flex items-center text-left p-4 rounded-2xl border-2 transition-all ${s.id === selectedShowroom ? 'bg-teal-50 border-teal-500' : 'bg-white border-gray-50 hover:border-teal-200 shadow-sm'}`}>
                      <div className="flex-1 text-right pr-4 border-r border-gray-100">
                        <p className="text-base font-black text-gray-900">{s.showroom_number}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase truncate tracking-tighter">{s.dealer_name}</p>
                      </div>
                      <div className="flex-1 pl-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase ${tierColors[s.score_tier] || tierColors.Unrated}`}>{s.score_tier}</span>
                        <p className="text-[10px] font-black text-teal-600 mt-1 uppercase">{s.active_vehicles} listings</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}



