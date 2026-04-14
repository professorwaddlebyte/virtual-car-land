// pages/market/[id].js
// CHANGED: makes and colors dropdowns now loaded from /api/lookup (DB-driven).
// The hardcoded `makes` array and `colors` filter values are replaced.
// Everything else (filters, AI search, pagination, vehicle cards) is identical.

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../../components/DawirnyLogo';
import Footer from '../../components/Footer';

export default function MarketPage() {
  const router = useRouter();
  const mainSectionRef = useRef(null);
  const {
    id,
    make: qMake, model: qModel, year: qYear,
    price_min: qPMin, price_max: qPMax,
    gcc: qGcc, transmission: qTrans, body: qBody,
    mileage_max: qMileageMax,
    fuel: qFuel,
    cylinders: qCylinders,
  } = router.query;

  const qMakesRaw    = router.query.makes;
  const qColorsRaw   = router.query.colors;
  const qFeaturesRaw = router.query.features;

  const qMakes    = qMakesRaw    ? (Array.isArray(qMakesRaw)    ? qMakesRaw    : [qMakesRaw])    : [];
  const qColors   = qColorsRaw   ? (Array.isArray(qColorsRaw)   ? qColorsRaw   : [qColorsRaw])   : [];
  const qFeatures = qFeaturesRaw ? (Array.isArray(qFeaturesRaw) ? qFeaturesRaw : [qFeaturesRaw]) : [];

  const [market, setMarket]         = useState(null);
  const [vehicles, setVehicles]     = useState([]);
  const [showrooms, setShowrooms]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selectedShowroom, setSelectedShowroom] = useState(null);
  const [shortlist, setShortlist]   = useState([]);
  const [mapOpen, setMapOpen]       = useState(true);

  const [aiSearchActive, setAiSearchActive] = useState(false);
  const [aiParams, setAiParams] = useState({
    makes: [], colors: [], features: [], fuel: null, cylinders: null,
  });

  const [filters, setFilters] = useState({
    make: '', model: '', year: '',
    price_min: '', price_max: '',
    gcc: '', transmission: '', body: '', mileage_max: '',
  });

  // ── DB-driven lookup data ───────────────────────────────────────────────────
  const [makes, setMakes]   = useState([]);
  const [colors, setColors] = useState([]);

  useEffect(() => {
    fetch('/api/lookup')
      .then(r => r.json())
      .then(d => {
        if (d.makes)  setMakes(d.makes.map(m => m.name));
        if (d.colors) setColors(d.colors.map(c => c.name));
      })
      .catch(() => {});
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;

    const qYearMin = router.query.year_min || '';
    const qYearMax = router.query.year_max || '';

    const hasAiParams = qMakes.length > 0 || qColors.length > 0 || qFeatures.length > 0 ||
                        qMileageMax || qTrans || qBody || qFuel || qCylinders ||
                        qPMin || qYearMin || qYearMax;
    setAiSearchActive(hasAiParams);

    const currentAiParams = {
      makes:     qMakes,
      colors:    qColors,
      features:  qFeatures,
      fuel:      qFuel      || null,
      cylinders: qCylinders || null,
    };
    setAiParams(currentAiParams);

    const initialFilters = {
      make:         qMake    || '',
      model:        qModel   || '',
      year:         qYear    || '',
      year_min:     qYearMin,
      year_max:     qYearMax,
      price_min:    qPMin    || '',
      price_max:    qPMax    || '',
      gcc:          qGcc     || '',
      transmission: qTrans   || '',
      body:         qBody    || '',
      mileage_max:  qMileageMax || '',
    };

    setFilters(initialFilters);
    fetchMarket();
    fetchVehicles(initialFilters, 1, currentAiParams);

    const saved = JSON.parse(localStorage.getItem('shortlist') || '[]');
    setShortlist(saved);
  }, [id, router.query]);

  async function fetchMarket() {
    const res = await fetch(`/api/markets/${id}`);
    const data = await res.json();
    setMarket(data.market);
    setShowrooms(data.showrooms || []);
  }

  async function fetchVehicles(activeFilters, page = 1, overrideAiParams = null) {
    setLoading(true);
    if (mainSectionRef.current) mainSectionRef.current.scrollIntoView({ behavior: 'smooth' });

    const f = activeFilters || filters;
    const ai = overrideAiParams || aiParams;
    const { makes: makesArr = [], colors: colorsArr = [], features: featuresArr = [], fuel = null, cylinders = null } = ai;

    const params = new URLSearchParams({ market_id: id, page, limit: 40 });

    if (makesArr.length > 0) {
      makesArr.forEach(m => params.append('makes', m));
    } else if (f.make) {
      params.set('make', f.make);
    }

    if (f.model)        params.set('model',        f.model);
    if (f.year_min)     params.set('year_min',      f.year_min);
    if (f.year_max)     params.set('year_max',      f.year_max);
    if (!f.year_min && !f.year_max && f.year) {
      params.set('year_min', f.year);
      params.set('year_max', f.year);
    }
    if (f.price_min)    params.set('price_min',    f.price_min);
    if (f.price_max)    params.set('price_max',    f.price_max);
    if (f.mileage_max)  params.set('mileage_max',  f.mileage_max);
    if (f.gcc !== '')   params.set('gcc',           f.gcc);
    if (f.transmission) params.set('transmission', f.transmission);
    if (f.body)         params.set('body',          f.body);

    if (colorsArr.length > 0)   colorsArr.forEach(c => params.append('colors', c));
    if (featuresArr.length > 0) featuresArr.forEach(feat => params.append('features', feat));
    if (fuel)      params.set('fuel',      fuel);
    if (cylinders) params.set('cylinders', cylinders);

    const res = await fetch(`/api/vehicles?${params}`);
    const data = await res.json();
    setVehicles(data.vehicles || []);
    setPagination(data.pagination);
    setLoading(false);
  }

  function handleFilterChange(key, value) { setFilters(prev => ({ ...prev, [key]: value })); }

  function handleApplyFilters() {
    const emptyAi = { makes: [], colors: [], features: [], fuel: null, cylinders: null };
    setAiSearchActive(false);
    setAiParams(emptyAi);
    fetchVehicles(filters, 1, emptyAi);
  }

  function handleReset() {
    const r = { make: '', model: '', year: '', year_min: '', year_max: '', price_min: '', price_max: '', gcc: '', transmission: '', body: '', mileage_max: '' };
    const emptyAi = { makes: [], colors: [], features: [], fuel: null, cylinders: null };
    setFilters(r);
    setAiSearchActive(false);
    setAiParams(emptyAi);
    router.push(`/market/${id}`, undefined, { shallow: true });
    fetchVehicles(r, 1, emptyAi);
  }

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
    localStorage.setItem('shortlist_dirty', 'true');
    setShortlist(updated);
  }

  function isShortlisted(vehicleId) { return shortlist.some(v => v.id === vehicleId); }

  const tierColors = {
    Platinum: 'bg-purple-50 text-purple-700 border-purple-100',
    Gold:     'bg-yellow-50 text-yellow-700 border-yellow-100',
    Silver:   'bg-gray-50 text-gray-600 border-gray-100',
    Unrated:  'bg-gray-50 text-gray-400 border-gray-50',
  };

  const years = Array.from({ length: 20 }, (_, i) => 2025 - i);

  function aiFilterSummary() {
    const parts = [];
    if (qMakes.length > 0)    parts.push(qMakes.join(', '));
    if (qBody)                parts.push(qBody);
    if (qFuel)                parts.push(qFuel.charAt(0).toUpperCase() + qFuel.slice(1));
    if (qCylinders)           parts.push(`${qCylinders} Cyl`);
    if (qPMin && qPMax) {
      parts.push(`AED ${parseInt(qPMin).toLocaleString()} – ${parseInt(qPMax).toLocaleString()}`);
    } else if (qPMin) {
      parts.push(`AED ${parseInt(qPMin).toLocaleString()}+`);
    } else if (qPMax) {
      parts.push(`under AED ${parseInt(qPMax).toLocaleString()}`);
    }
    if (qMileageMax)          parts.push(`max ${parseInt(qMileageMax).toLocaleString()} km`);
    if (qColors.length > 0)   parts.push(qColors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(' / '));
    if (qFeatures.length > 0) parts.push(qFeatures.join(' · '));
    if (qGcc === 'true')      parts.push('GCC spec');
    const qYearMin = router.query.year_min;
    const qYearMax = router.query.year_max;
    if (qYearMin && qYearMax && qYearMin === qYearMax) parts.push(`${qYearMin}`);
    else if (qYearMin && qYearMax) parts.push(`${qYearMin}–${qYearMax}`);
    else if (qYearMin)  parts.push(`${qYearMin}+`);
    else if (qYearMax)  parts.push(`up to ${qYearMax}`);
    return parts.length > 0 ? parts.join(' · ') : 'AI filters applied';
  }

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
                <span className="font-black text-lg hidden sm:block uppercase tracking-tight text-[#1A9988]">
                  {market?.name || 'Loading...'}
                </span>
              </div>
              <Link href="/shortlist"
                className="flex items-center justify-center gap-2 px-6 h-11 rounded-2xl text-sm font-black transition-all active:scale-95 shadow-sm"
                style={{ background: shortlist.length > 0 ? '#FFD700' : '#ffffff', color: '#1a1a1a', border: shortlist.length > 0 ? 'none' : '1px solid #e2e8f0' }}>
                <span className="text-xl">⭐</span>
                <span className="inline-block mt-0.5">{shortlist.length}/5</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Left Column — Location & Map */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">📍 Your Location</h3>
                <input type="text" placeholder="e.g. Near Gate 2..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-teal-500 text-gray-700 mb-3" />
                <button className="w-full py-4 rounded-2xl text-white text-sm font-black uppercase tracking-wider transition-all hover:brightness-105" style={{ background: '#1A9988' }}>
                  Find Nearby
                </button>
              </div>

              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => setMapOpen(!mapOpen)} className="w-full flex items-center justify-between p-6">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">🗺️ Market Map</h3>
                  <span className={`transition-transform duration-300 ${mapOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {mapOpen && (
                  <div className="px-6 pb-6">
                    <div className="relative bg-gray-100 rounded-[24px] overflow-hidden border border-gray-100" style={{ paddingBottom: '60%' }}>
                      {market?.map_image_url && <img src={market.map_image_url} alt="Map" className="absolute inset-0 w-full h-full object-cover" />}
                      {showrooms.map(s => (
                        <button key={s.id} onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white font-black"
                          style={{ left: `${s.map_x}%`, top: `${s.map_y}%`, background: s.id === selectedShowroom ? '#FFD700' : '#1A9988', color: s.id === selectedShowroom ? '#1a1a1a' : 'white', fontSize: '10px' }}>
                          {s.showroom_number}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column — Filters & Results */}
            <div className="lg:col-span-3 space-y-6" ref={mainSectionRef}>

              {/* Filter Bar */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">🔍 Refine Results</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                  {/* Make — DB-driven */}
                  <select value={filters.make} onChange={e => handleFilterChange('make', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer">
                    <option value="">All Makes</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>

                  <input type="text" placeholder="Model..." value={filters.model}
                    onChange={e => handleFilterChange('model', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0" />

                  <select value={filters.year} onChange={e => handleFilterChange('year', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer">
                    <option value="">Any Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>

                  <input type="number" placeholder="Min Price (AED)" value={filters.price_min}
                    onChange={e => handleFilterChange('price_min', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0" />

                  <input type="number" placeholder="Max Price (AED)" value={filters.price_max}
                    onChange={e => handleFilterChange('price_max', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0" />

                  <input type="number" placeholder="Max Mileage (km)" value={filters.mileage_max}
                    onChange={e => handleFilterChange('mileage_max', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0" />

                  <select value={filters.body} onChange={e => handleFilterChange('body', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer">
                    <option value="">All Body Types</option>
                    {['SUV','Sedan','Pickup','Hatchback','Coupe','Van','Minivan','Convertible'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  <select value={filters.transmission} onChange={e => handleFilterChange('transmission', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer">
                    <option value="">Any Transmission</option>
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>

                  {/* Color — DB-driven */}
                  <select value={filters.color || ''} onChange={e => handleFilterChange('color', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer">
                    <option value="">Any Color</option>
                    {colors.map(c => (
                      <option key={c} value={c.toLowerCase()}>{c}</option>
                    ))}
                  </select>

                  <select value={filters.gcc} onChange={e => handleFilterChange('gcc', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer">
                    <option value="">Both GCC & Non-GCC</option>
                    <option value="true">GCC Specs Only</option>
                    <option value="false">Non-GCC Only</option>
                  </select>

                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button onClick={handleReset}
                    className="flex-1 py-4 rounded-2xl text-gray-500 text-sm font-black uppercase tracking-wider border-2 border-gray-100 hover:bg-gray-50 transition-all">
                    Reset
                  </button>
                  <button onClick={handleApplyFilters}
                    className="flex-[2] py-4 rounded-2xl text-white text-sm font-black uppercase tracking-wider transition-all hover:brightness-110 shadow-lg shadow-teal-900/10"
                    style={{ background: '#1A9988' }}>
                    Apply Filters
                  </button>
                </div>
              </div>

              {/* AI Search Badge */}
              {aiSearchActive && (
                <div className="mb-6 flex items-center justify-between gap-4 px-6 py-4 rounded-[20px] border"
                  style={{ background: '#f0faf9', borderColor: '#1A9988' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">✨</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-0.5">AI Search Active</p>
                      <p className="text-sm font-bold text-gray-700 truncate">{aiFilterSummary()}</p>
                    </div>
                  </div>
                  <button onClick={handleReset}
                    className="shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-teal-200 text-teal-700 hover:bg-teal-100 transition-all">
                    Clear
                  </button>
                </div>
              )}

              {/* Vehicle Results Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="w-10 h-10 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
                </div>
              ) : vehicles.length === 0 ? (
                <div className="bg-white rounded-[32px] p-16 shadow-sm border border-gray-100 text-center">
                  <p className="text-4xl mb-4">🔍</p>
                  <p className="text-lg font-black text-gray-900 mb-2 uppercase">No results found</p>
                  <p className="text-sm font-bold text-gray-400">Try adjusting your filters or clearing the AI search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vehicles.map(v => (
                    <div key={v.id} className="group bg-white rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden flex flex-col">
                      <div className="relative h-64 overflow-hidden">
                        {v.photos?.[0]
                          ? <img src={v.photos[0]} alt={v.make} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl">🚗</div>
                        }
                        <button onClick={() => toggleShortlist(v)}
                          className="absolute top-4 right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-transform active:scale-75 border-2 border-gray-300">
                          <span>{isShortlisted(v.id) ? '⭐' : '☆'}</span>
                        </button>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-black uppercase leading-tight" style={{ color: '#1A9988' }}>
                            {v.year} {v.make}
                            <span className="block text-gray-900">{v.model}</span>
                          </h3>
                          <div className="text-2xl font-black text-gray-900">
                            <span className="text-[10px] text-gray-400 mr-1 uppercase">AED</span>
                            {v.price_aed?.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-lg font-black text-gray-700 uppercase tracking-tight">
                            {v.mileage_km?.toLocaleString()} KM
                          </span>
                          <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase border ${v.specs?.gcc ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {v.specs?.gcc ? 'GCC Specs' : 'Import'}
                          </span>
                        </div>
                        <div className="mt-auto p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Showroom {v.showroom_number}</p>
                            <p className="text-sm font-black text-gray-800 truncate max-w-[140px]">{v.dealer_name}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${tierColors[v.score_tier] || tierColors.Unrated}`}>{v.score_tier}</span>
                        </div>
                        <Link href={`/vehicle/${v.id}`}
                          className="mt-4 block w-full py-4 rounded-2xl text-center text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-900/10 transition-all hover:brightness-110 active:scale-[0.98]"
                          style={{ background: '#1A9988' }}>
                          View Listing
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center">
                  <div className="flex gap-3">
                    {pagination.page > 1 && (
                      <button onClick={() => fetchVehicles(filters, pagination.page - 1)}
                        className="w-14 h-14 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-xl font-black hover:bg-gray-50">←</button>
                    )}
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button key={i} onClick={() => fetchVehicles(filters, i + 1)}
                        className={`w-14 h-14 rounded-2xl text-lg font-black transition-all ${pagination.page === i + 1 ? 'text-white shadow-xl' : 'bg-white text-gray-400 border border-gray-100'}`}
                        style={pagination.page === i + 1 ? { background: '#1A9988' } : {}}>
                        {i + 1}
                      </button>
                    ))}
                    {pagination.page < pagination.pages && (
                      <button onClick={() => fetchVehicles(filters, pagination.page + 1)}
                        className="w-14 h-14 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-xl font-black hover:bg-gray-50">→</button>
                    )}
                  </div>
                </div>
              )}

              {/* Showrooms Section */}
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">🏪 Market Showrooms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showrooms.map(s => (
                    <button key={s.id} onClick={() => setSelectedShowroom(s.id === selectedShowroom ? null : s.id)}
                      className={`text-left p-6 rounded-[24px] border-2 transition-all ${s.id === selectedShowroom ? 'bg-teal-50 border-[#1A9988]' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xl font-black text-gray-900 mb-1">{s.showroom_number}</p>
                          <p className="text-sm font-bold text-gray-600 mb-3">{s.dealer_name}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase">{s.active_vehicles} cars</span>
                            <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${tierColors[s.score_tier] || tierColors.Unrated}`}>{s.score_tier}</span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">🏬</div>
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



