import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function MarketPage() {
  const router = useRouter();
  const { id, make, model, price_min, price_max, gcc } = router.query;

  const [market, setMarket] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShowroom, setSelectedShowroom] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [locationHint, setLocationHint] = useState('');
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    price_min: '',
    price_max: '',
    gcc: ''
  });

  useEffect(() => {
    if (!id) return;
    
    setFilters({
      make: make || '',
      model: model || '',
      price_min: price_min || '',
      price_max: price_max || '',
      gcc: gcc || ''
    });

    fetchMarket();
    
    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    setShortlist(saved);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchVehicles();
  }, [id, filters]);

  async function fetchMarket() {
    const res = await fetch(`/api/markets/${id}`);
    const data = await res.json();
    setMarket(data.market);
    setShowrooms(data.showrooms || []);
  }

  async function fetchVehicles(page = 1) {
    setLoading(true);
    
    const params = new URLSearchParams({
      market_id: id,
      page,
      limit: 20
    });
    
    if (filters.make) params.set('make', filters.make);
    if (filters.model) params.set('model', filters.model);
    if (filters.price_min) params.set('price_min', filters.price_min);
    if (filters.price_max) params.set('price_max', filters.price_max);
    if (filters.gcc !== '') params.set('gcc', filters.gcc);

    const res = await fetch(`/api/vehicles?${params}`);
    const data = await res.json();
    setVehicles(data.vehicles || []);
    setPagination(data.pagination);
    setLoading(false);
  }

  function toggleShortlist(vehicle) {
    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    const exists = saved.find(v => v.id === vehicle.id);
    let updated;
    
    if (exists) {
      updated = saved.filter(v => v.id !== vehicle.id);
    } else {
      if (saved.length >= 5) {
        alert('Shortlist is full. Remove a car first.');
        return;
      }
      updated = [...saved, vehicle];
    }
    
    localStorage.setItem('shortlist', JSON.stringify(updated));
    setShortlist(updated);
  }

  function isShortlisted(vehicleId) {
    return shortlist.some(v => v.id === vehicleId);
  }

  function handleLocationSubmit(e) {
    e.preventDefault();
    if (!locationHint.trim()) return;
    alert(`Got it! Showing showrooms near "${locationHint}". This feature will highlight your nearest showrooms on the map.`);
  }

  const tierColors = {
    Platinum: 'bg-purple-100 text-purple-700',
    Gold: 'bg-yellow-100 text-yellow-700',
    Silver: 'bg-gray-100 text-gray-600',
    Unrated: 'bg-gray-50 text-gray-400'
  };

  const makes = [
    'Toyota', 'Nissan', 'Honda', 'Mitsubishi', 'Hyundai', 'Kia',
    'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Lexus', 'Infiniti',
    'Dodge', 'Jeep'
  ];

  return (
    <>
      <Head>
        <title>{market?.name || 'Market'} — Virtual Car Land</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Home</Link>
                <span className="font-bold text-lg" style={{color: '#0055A4'}}>
                  {market?.name || 'Loading...'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  href="/shortlist" 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: shortlist.length > 0 ? '#FFD700' : '#f3f4f6',
                    color: shortlist.length > 0 ? '#1a1a1a' : '#6b7280'
                  }}
                >
                  ⭐ Shortlist ({shortlist.length}/5)
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar — Filters + Map */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Location Input */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">📍 Your Location</h3>
                <form onSubmit={handleLocationSubmit}>
                  <input 
                    type="text" 
                    placeholder="e.g. near Gate 2, Section B..."
                    value={locationHint}
                    onChange={e => setLocationHint(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <button 
                    type="submit"
                    className="w-full py-2 rounded-xl text-white text-sm font-medium"
                    style={{background: '#0055A4'}}
                  >
                    Find Nearby Showrooms
                  </button>
                </form>
              </div>

              {/* Market Map */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">🗺️ Market Map</h3>
                <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{paddingBottom: '100%'}}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {market?.map_image_url ? (
                      <img src={market.map_image_url} alt="Market map" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">🗺️</div>
                        <p className="text-xs text-gray-400">Map coming soon</p>
                      </div>
                    )}
                    
                    {/* Showroom pins */}
                    {showrooms.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white text-xs font-bold flex items-center justify-center shadow-md transition-transform hover:scale-125"
                        style={{
                          left: `${s.map_x}%`,
                          top: `${s.map_y}%`,
                          background: s.id === selectedShowroom ? '#FFD700' : '#0055A4',
                          color: 'white',
                          fontSize: '8px'
                        }}
                        title={`${s.showroom_number} — ${s.dealer_name}`}
                      >
                        {s.showroom_number?.split('-')[1] || '•'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Selected Showroom Info */}
                {selectedShowroom && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                    {showrooms.find(s => s.id === selectedShowroom) && (
                      <>
                        <div className="font-medium text-gray-900">
                          {showrooms.find(s => s.id === selectedShowroom).dealer_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Showroom {showrooms.find(s => s.id === selectedShowroom).showroom_number}
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${tierColors[showrooms.find(s => s.id === selectedShowroom).tier]}`}>
                          {showrooms.find(s => s.id === selectedShowroom).tier}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Showroom List */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">🏪 Showrooms</h3>
                <div className="space-y-2">
                  {showrooms.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${s.id === selectedShowroom ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{s.showroom_number}</p>
                          <p className="text-xs text-gray-500">{s.dealer_name}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[s.score_tier] || tierColors.Unrated}`}>
                            {s.score_tier}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{s.active_vehicles} cars</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main — Filters + Results */}
            <div className="lg:col-span-3 space-y-4">
              
              {/* Filter Bar */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <select
                    value={filters.make}
                    onChange={e => setFilters({...filters, make: e.target.value})}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Makes</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Model"
                    value={filters.model}
                    onChange={e => setFilters({...filters, model: e.target.value})}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Min AED"
                    value={filters.price_min}
                    onChange={e => setFilters({...filters, price_min: e.target.value})}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max AED"
                    value={filters.price_max}
                    onChange={e => setFilters({...filters, price_max: e.target.value})}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filters.gcc}
                    onChange={e => setFilters({...filters, gcc: e.target.value})}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">GCC & Non-GCC</option>
                    <option value="true">GCC Only</option>
                    <option value="false">Non-GCC Only</option>
                  </select>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-500">
                    {pagination ? `${pagination.total} cars found` : 'Loading...'}
                  </p>
                  <button 
                    onClick={() => fetchVehicles()}
                    className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                    style={{background: '#0055A4'}}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>

              {/* Vehicle Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-xl mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="font-bold text-gray-900 mb-2">No cars found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <div 
                      key={v.id} 
                      className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border-2 ${selectedShowroom && v.showroom_id !== selectedShowroom ? 'opacity-50' : 'border-transparent'}`}
                    >
                      {/* Vehicle Photo Placeholder */}
                      <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl flex items-center justify-center">
                        <span className="text-5xl">🚗</span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {v.year} {v.make} {v.model}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {v.mileage_km ? `${v.mileage_km.toLocaleString()} km` : 'Mileage N/A'} •{' '}
                              {v.specs?.gcc ? 'GCC' : 'Non-GCC'} •{' '}
                              {v.specs?.transmission || 'Auto'}
                            </p>
                          </div>
                          <button 
                            onClick={() => toggleShortlist(v)}
                            className="text-xl ml-2 flex-shrink-0"
                            title={isShortlisted(v.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                          >
                            {isShortlisted(v.id) ? '⭐' : '☆'}
                          </button>
                        </div>
                        <div className="text-xl font-bold mb-3" style={{color: '#0055A4'}}>
                          AED {v.price_aed?.toLocaleString()}
                        </div>
                        
                        {/* Showroom Info */}
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Showroom</p>
                            <p className="text-sm font-bold text-gray-900">{v.showroom_number}</p>
                            <p className="text-xs text-gray-500">{v.dealer_name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[v.score_tier] || tierColors.Unrated}`}>
                            {v.score_tier}
                          </span>
                        </div>
                        
                        <Link 
                          href={`/vehicle/${v.id}`}
                          className="block w-full py-2 rounded-xl text-center text-white text-sm font-medium"
                          style={{background: '#0055A4'}}
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => fetchVehicles(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${pagination.page === i + 1 ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                      style={pagination.page === i + 1 ? {background: '#0055A4'} : {}}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="bg-white border-t py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">
              © 2026 Virtual Car Land. Built for UAE car markets.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}