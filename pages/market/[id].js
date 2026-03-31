import { useState, useEffect, useRef } from 'react'; // Added useRef
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../../components/DawirnyLogo';
import Footer from '../../components/Footer';

export default function MarketPage() {
  const router = useRouter();
  const mainSectionRef = useRef(null); // Initialize the ref
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

    // Scroll to the "Main" section when fetching new results or pages
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

  const tierColors = { Platinum: 'bg-purple-100 text-purple-700', Gold: 'bg-yellow-100 text-yellow-700', Silver: 'bg-gray-100 text-gray-600', Unrated: 'bg-gray-50 text-gray-400' };
  const makes = ['Toyota','Nissan','Honda','Mitsubishi','Hyundai','Kia','Ford','Chevrolet','BMW','Mercedes-Benz','Lexus','Infiniti','Dodge','Jeep'];
  const years = Array.from({ length: 20 }, (_, i) => 2025 - i);

  return (
    <>
      <Head><title>{market?.name || 'Market'} — dawirny</title></Head>
      <div className="min-h-screen bg-gray-50 flex flex-col">

        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link href="/"><DawirnyLogo size="sm" /></Link>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-lg" style={{ color: '#1A9988' }}>{market?.name || 'Loading...'}</span>
              </div>
              <Link href="/shortlist" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                style={{ background: shortlist.length > 0 ? '#FFD700' : '#f3f4f6', color: shortlist.length > 0 ? '#1a1a1a' : '#9ca3af' }}>
                ⭐ {shortlist.length}/5
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-3">📍 Your Location</h3>
                <input type="text" placeholder="e.g. near Gate 2, Section B..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none mb-2" />
                <button className="w-full py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#1A9988' }}>
                  Find Nearby Showrooms
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => setMapOpen(!mapOpen)} className="w-full flex items-center justify-between p-4">
                  <h3 className="text-base font-bold text-gray-900">🗺️ Market Map</h3>
                  <span className="text-gray-400 text-sm">{mapOpen ? '▲' : '▼'}</span>
                </button>
                {mapOpen && (
                  <div className="px-4 pb-4">
                    <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ paddingBottom: '50%' }}>
                      <div className="absolute inset-0">
                        {market?.map_image_url ? (
                          <img src={market.map_image_url} alt="Market map" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center p-4"><div className="text-3xl mb-1">🗺️</div><p className="text-xs text-gray-400">Map coming soon</p></div>
                          </div>
                        )}
                        {showrooms.map(s => (
                          <button key={s.id} onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold"
                            style={{ left: `${s.map_x}%`, top: `${s.map_y}%`, background: s.id === selectedShowroom ? '#FFD700' : '#1A9988', fontSize: '9px' }}>
                            {s.showroom_number?.split('-')[1] || '•'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {selectedShowroom && (() => {
                      const s = showrooms.find(x => x.id === selectedShowroom);
                      return s ? (
                        <div className="mt-3 p-3 rounded-xl" style={{ background: '#f0faf9' }}>
                          <p className="font-bold text-sm" style={{ color: '#0d6b5e' }}>{s.showroom_number} — {s.dealer_name}</p>
                          <p className="text-xs mt-1" style={{ color: '#1A9988' }}>{s.location_hint}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">{s.active_vehicles} cars</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[s.score_tier] || tierColors.Unrated}`}>{s.score_tier}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

            </div>

            {/* Main */}
            <div ref={mainSectionRef} className="lg:col-span-3 space-y-4">
              {/* Filters — now with Year */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Make</label>
                    <select value={filters.make} onChange={e => handleFilterChange('make', e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                      <option value="">All Makes</option>
                      {makes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Model</label>
                    <input type="text" placeholder="Any model" value={filters.model}
                      onChange={e => handleFilterChange('model', e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</label>
                    <select value={filters.year} onChange={e => handleFilterChange('year', e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                      <option value="">Any Year</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Price</label>
                    <input type="number" placeholder="AED" value={filters.price_min}
                      onChange={e => handleFilterChange('price_min', e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Max Price</label>
                    <input type="number" placeholder="AED" value={filters.price_max}
                      onChange={e => handleFilterChange('price_max', e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Specs</label>
                    <select value={filters.gcc} onChange={e => handleFilterChange('gcc', e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                      <option value="">GCC & Non-GCC</option>
                      <option value="true">GCC Only</option>
                      <option value="false">Non-GCC Only</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-600">
                    {pagination ? <><span className="font-bold text-gray-900">{pagination.total}</span> cars found</> : 'Loading...'}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => { const r = { make: '', model: '', year: '', price_min: '', price_max: '', gcc: '' }; setFilters(r); fetchVehicles(r, 1); }}
                      className="px-4 py-2 rounded-xl text-gray-600 text-sm font-semibold bg-gray-100 hover:bg-gray-200">Reset</button>
                    <button onClick={handleApplyFilters} className="px-5 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#1A9988' }}>Apply Filters</button>
                  </div>
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                      <div className="h-40 bg-gray-200 rounded-xl mb-3"></div>
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No cars found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <div key={v.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center relative">
                        {v.photos && v.photos.length > 0 ? (
                          <img src={v.photos[0]} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                        ) : <span className="text-5xl">🚗</span>}
                        <button onClick={() => toggleShortlist(v)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-lg">
                          {isShortlisted(v.id) ? '⭐' : '☆'}
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-bold text-gray-900 leading-tight">{v.year} {v.make} {v.model}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-gray-500">{v.mileage_km ? `${v.mileage_km.toLocaleString()} km` : 'Mileage N/A'}</span>
                          <span className="text-gray-300">•</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.specs?.gcc ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {v.specs?.gcc ? 'GCC' : 'Non-GCC'}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500 capitalize">{v.specs?.transmission || 'Auto'}</span>
                        </div>
                        <div className="text-2xl font-bold mt-2 mb-3" style={{ color: '#1A9988' }}>AED {v.price_aed?.toLocaleString()}</div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Showroom</p>
                            <p className="text-base font-bold text-gray-900">{v.showroom_number}</p>
                            <p className="text-sm text-gray-600">{v.dealer_name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tierColors[v.score_tier] || tierColors.Unrated}`}>{v.score_tier}</span>
                        </div>
                        <Link href={`/vehicle/${v.id}`} className="block w-full py-2.5 rounded-xl text-center text-white text-sm font-bold" style={{ background: '#1A9988' }}>
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-sm text-center text-gray-500 mb-3">Page {pagination.page} of {pagination.pages} — {pagination.total} cars total</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {pagination.page > 1 && (
                      <button onClick={() => fetchVehicles(filters, pagination.page - 1)}
                        className="px-4 py-2 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600">← Prev</button>
                    )}
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button key={i} onClick={() => fetchVehicles(filters, i + 1)}
                        className="w-11 h-11 rounded-xl text-base font-bold"
                        style={pagination.page === i + 1 ? { background: '#1A9988', color: 'white' } : { background: 'white', color: '#374151', border: '2px solid #e5e7eb' }}>
                        {i + 1}
                      </button>
                    ))}
                    {pagination.page < pagination.pages && (
                      <button onClick={() => fetchVehicles(filters, pagination.page + 1)}
                        className="px-4 py-2 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600">Next →</button>
                    )}
                  </div>
                </div>
              )}


              <div className="bg-gray-100 rounded-2xl p-4 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-3">🏪 Showrooms</h3>
                <div className="space-y-2">
                  {showrooms.map(s => (
                    <button key={s.id} onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${s.id === selectedShowroom ? 'bg-teal-50' : 'border-gray-100 hover:border-gray-300 bg-white'}`}
                      style={s.id === selectedShowroom ? { borderColor: '#1A9988' } : {}}>

                      <div className="flex items-center">
                        <div style={{ width: '50%', textAlign: 'right', paddingRight: '16px' }}>
                          <p className="text-base font-bold text-gray-900">{s.showroom_number}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{s.dealer_name}</p>
                        </div>
                        <div style={{ width: '50%', textAlign: 'left', paddingLeft: '16px', borderLeft: '2px solid #e5e7eb' }}>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tierColors[s.score_tier] || tierColors.Unrated}`}>{s.score_tier}</span>
                          <p className="text-xs font-medium text-gray-500 mt-1">{s.active_vehicles} cars</p>
                        </div>
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



