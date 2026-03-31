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
            <div className="lg:col-span-1 space-y-4">
              {/* Sidebar Location/Map code... */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-3">📍 Your Location</h3>
                <input type="text" placeholder="e.g. near Gate 2, Section B..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none mb-2" />
                <button className="w-full py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#1A9988' }}>
                  Find Nearby Showrooms
                </button>
              </div>
            </div>

            <div ref={mainSectionRef} className="lg:col-span-3 space-y-4">
              {/* Filters code... */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {/* Render your filter selects/inputs here as in original code */}
                   <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Make</label>
                    <select value={filters.make} onChange={e => handleFilterChange('make', e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                      <option value="">All Makes</option>
                      {makes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  {/* ... other filters (Model, Year, Price) ... */}
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

              {/* Grid with New Star Logic */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <div key={v.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      {/* Image Area (Clean - no star here) */}
                      <div className="h-44 bg-gray-100 overflow-hidden flex items-center justify-center">
                        {v.photos && v.photos.length > 0 ? (
                          <img src={v.photos[0]} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                        ) : <span className="text-5xl">🚗</span>}
                      </div>

                      <div className="p-4">
                        {/* Title & Star Row */}
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-base font-bold text-gray-900 leading-tight pr-2">
                            {v.year} {v.make} {v.model}
                          </h3>
                          <button 
                            onClick={() => toggleShortlist(v)}
                            className="transition-transform active:scale-75"
                            style={{ fontSize: '28px', lineHeight: '1' }}
                          >
                            {isShortlisted(v.id) ? '⭐' : '☆'}
                          </button>
                        </div>

                        {/* Details */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-gray-500">{v.mileage_km ? `${v.mileage_km.toLocaleString()} km` : 'Mileage N/A'}</span>
                          <span className="text-gray-300">•</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.specs?.gcc ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {v.specs?.gcc ? 'GCC' : 'Non-GCC'}
                          </span>
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

              {/* Pagination code... */}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}



