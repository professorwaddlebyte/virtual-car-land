import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../components/DawirnyLogo';
import Footer from '../components/Footer';

// ── Constants ─────────────────────────────────────────────────────────────────

const tierColors = {
  Platinum: 'bg-purple-100 text-purple-800',
  Gold:     'bg-yellow-100 text-yellow-800',
  Silver:   'bg-gray-100 text-gray-600',
  Unrated:  'bg-gray-100 text-gray-400',
};

const AI_MESSAGES = [
  'Scanning your shortlist…',
  'Comparing prices across market…',
  'Finding hidden gems…',
  'Checking mileage & specs…',
  'Almost ready…',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStoredShortlist() {
  try { return JSON.parse(localStorage.getItem('shortlist') || '[]'); } catch { return []; }
}

function saveShortlist(list) {
  localStorage.setItem('shortlist', JSON.stringify(list));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AiLoadingSpinner() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % AI_MESSAGES.length), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-teal-100 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-teal-500 rounded-full animate-spin" />
      </div>
      <p className="text-sm font-medium" style={{ color: '#1A9988' }}>{AI_MESSAGES[idx]}</p>
    </div>
  );
}

// Showroom number + tier badge stacked vertically so the relationship is clear
function ShowroomBlock({ showroomNumber, scoreTier }) {
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1">Showroom</p>
      <p className="text-sm font-bold text-gray-900">{showroomNumber}</p>
      <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${tierColors[scoreTier] || tierColors.Unrated}`}>
        {scoreTier || 'Unrated'}
      </span>
    </div>
  );
}

// Card for AI "Worth Adding" suggestions — two explicit buttons, no Link wrapper
function SuggestedCarCard({ suggestion, onAdd, isAdded, shortlistFull }) {
  const { vehicle, reason } = suggestion;
  if (!vehicle) return null;
  const cantAdd = isAdded || shortlistFull;
  return (
    <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <h4 className="font-black text-gray-900 text-sm leading-tight mb-2">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h4>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
          <span>{vehicle.mileage_km ? `${Number(vehicle.mileage_km).toLocaleString()} km` : 'N/A'}</span>
          <span className="text-gray-300">•</span>
          <span className="font-medium text-teal-600">{vehicle.specs?.gcc ? 'GCC' : 'Non-GCC'}</span>
        </div>
        {/* Showroom + tier stacked */}
        <div className="mb-3">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Showroom</p>
          <p className="text-xs font-bold text-gray-800 mt-0.5">{vehicle.showroom_number}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tierColors[vehicle.score_tier] || tierColors.Unrated}`}>
            {vehicle.score_tier || 'Unrated'}
          </span>
        </div>
        <div className="text-base font-black mb-3" style={{ color: '#1A9988' }}>
          AED {Number(vehicle.price_aed).toLocaleString()}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3 mb-4">
          💡 {reason}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/vehicle/${vehicle.id}`}
            className="py-2.5 rounded-xl text-center text-xs font-bold text-white transition-all active:scale-95"
            style={{ background: '#1A9988' }}
          >
            View Full Details
          </Link>
          <button
            onClick={() => onAdd(vehicle)}
            disabled={cantAdd}
            className={`py-2.5 rounded-xl text-center text-xs font-bold border-2 transition-all ${cantAdd ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-50 active:scale-95'}`}
          >
            {isAdded ? '✓ Added' : shortlistFull ? 'List Full' : '+ Shortlist'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AI Suggestions Panel ──────────────────────────────────────────────────────
// Result is cached in localStorage — persists across Next.js page navigations.
// Invalidated when:
//   (a) user removes/adds a car directly on this page (localStorage cleared inline), or
//   (b) market/[id].js sets localStorage shortlist_dirty=true on add/remove.

function AiSuggestionsPanel({ shortlist, onRemove, onAdd }) {
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedIds, setAddedIds] = useState(new Set());

  // Restore cached result on mount (unless market page dirtied the shortlist)
  useEffect(() => {
    const dirty = localStorage.getItem('shortlist_dirty') === 'true';
    if (dirty) {
      localStorage.removeItem('ai_shortlist_result');
      localStorage.removeItem('shortlist_dirty');
      return;
    }
    try {
      const cached = localStorage.getItem('ai_shortlist_result');
      if (cached) {
        setResult(JSON.parse(cached));
        setState('result');
      }
    } catch { /* ignore */ }
  }, []);

  async function fetchSuggestions() {
    setState('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/vehicles/shortlist-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortlist }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      localStorage.setItem('ai_shortlist_result', JSON.stringify(data));
      setResult(data);
      setState('result');
    } catch (e) {
      setErrorMsg(e.message);
      setState('error');
    }
  }

  const getShortlistCar = (id) => shortlist.find(v => v.id === id);
  const shortlistIdSet = new Set(shortlist.map(v => v.id));
  const shortlistFull = shortlist.length >= 5;

  function handleAdd(vehicle) {
    onAdd(vehicle);
    setAddedIds(prev => new Set([...prev, vehicle.id]));
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">

      {/* Panel header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#f0faf9' }}>
            🤖
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-lg">AI Shortlist Advisor</h2>
            <p className="text-xs text-gray-400 mt-0.5">Compares your cars against live market inventory</p>
          </div>
        </div>
      </div>

      <div className="p-5">

        {/* IDLE */}
        {state === 'idle' && (
          <button
            onClick={fetchSuggestions}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            style={{ background: '#1A9988' }}
          >
            ✨ Analyze My Shortlist
          </button>
        )}

        {/* LOADING */}
        {state === 'loading' && <AiLoadingSpinner />}

        {/* ERROR */}
        {state === 'error' && (
          <div className="p-4 bg-red-50 rounded-2xl text-center">
            <p className="text-sm text-red-600 font-medium mb-2">{errorMsg}</p>
            <button onClick={() => setState('idle')} className="text-xs text-red-400 underline">Try again</button>
          </div>
        )}

        {/* RESULT */}
        {state === 'result' && result && (() => {
          const bestCar = getShortlistCar(result.best_pick?.id);
          return (
            <div className="space-y-6">

              {/* 🏆 Best Pick */}
              <div>
                <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span>🏆</span> Best Pick from Your List
                </p>
                {bestCar && (
                  <div className="p-4 rounded-2xl border-2 border-teal-200 bg-teal-50">
                    <h3 className="font-black text-gray-900 mb-1">
                      {bestCar.year} {bestCar.make} {bestCar.model}
                    </h3>
                    <span className={`inline-block mb-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tierColors[bestCar.score_tier] || tierColors.Unrated}`}>
                      {bestCar.score_tier || 'Unrated'}
                    </span>
                    <p className="text-sm font-black mb-2" style={{ color: '#1A9988' }}>
                      AED {Number(bestCar.price_aed).toLocaleString()}
                    </p>
                    <p className="text-xs text-teal-800 leading-relaxed">✅ {result.best_pick.reason}</p>
                  </div>
                )}
              </div>

              {/* ⚠️ Consider Removing */}
              {result.remove_suggestions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <span>⚠️</span> Consider Removing
                  </p>
                  <div className="space-y-2">
                    {result.remove_suggestions.map(s => {
                      const car = getShortlistCar(s.id);
                      // Hide if already removed
                      if (!car || !shortlistIdSet.has(s.id)) return null;
                      return (
                        <div key={s.id} className="p-4 rounded-2xl border border-orange-100 bg-orange-50">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-gray-900">
                                {car.year} {car.make} {car.model}
                              </p>
                              <p className="text-sm font-black" style={{ color: '#1A9988' }}>
                                AED {Number(car.price_aed).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => onRemove(car.id)}
                              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 border border-red-200 bg-white hover:bg-red-50 transition-colors active:scale-95"
                            >
                              Remove
                            </button>
                          </div>
                          <p className="text-xs text-orange-700 leading-relaxed">{s.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 💎 Worth Adding */}
              {result.add_suggestions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <span>💎</span> Worth Adding to Your List
                  </p>
                  <div className="space-y-3">
                    {result.add_suggestions.map(s => (
                      <SuggestedCarCard
                        key={s.id}
                        suggestion={s}
                        onAdd={handleAdd}
                        isAdded={addedIds.has(s.id) || shortlistIdSet.has(s.id)}
                        shortlistFull={shortlistFull && !addedIds.has(s.id) && !shortlistIdSet.has(s.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-300 font-medium text-right uppercase tracking-widest pt-2 border-t border-gray-50">
                Based on live inventory · Powered by Dawirny AI
              </p>
              <button
                onClick={fetchSuggestions}
                className="w-full py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-200 transition-colors"
              >
                ↺ Re-analyze
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ShortlistPage() {
  const router = useRouter();
  const [shortlist, setShortlist] = useState([]);
  const [routeOrder, setRouteOrder] = useState([]);

  useEffect(() => {
    const saved = getStoredShortlist();
    setShortlist(saved);
    setRouteOrder(saved.map((_, i) => i));
  }, []);

  function removeFromShortlist(vehicleId) {
    const updated = shortlist.filter(v => v.id !== vehicleId);
    saveShortlist(updated);
    setShortlist(updated);
    setRouteOrder(updated.map((_, i) => i));
  }

  function addToShortlist(vehicle) {
    if (shortlist.length >= 5) { alert('Shortlist is full (max 5).'); return; }
    if (shortlist.find(v => v.id === vehicle.id)) return;
    const updated = [...shortlist, vehicle];
    saveShortlist(updated);
    setShortlist(updated);
    setRouteOrder(updated.map((_, i) => i));
  }

  function planRoute() {
    if (shortlist.length < 2) { alert('Add at least 2 cars to plan a route.'); return; }
    const sorted = [...shortlist]
      .map((v, i) => ({ ...v, originalIndex: i }))
      .sort((a, b) => (parseFloat(a.map_x) || 50) - (parseFloat(b.map_x) || 50));
    setRouteOrder(sorted.map(v => v.originalIndex));
  }

  function clearShortlist() {
    if (confirm('Clear all saved cars?')) {
      saveShortlist([]);
      localStorage.removeItem('ai_shortlist_result');
      setShortlist([]);
      setRouteOrder([]);
    }
  }

  const orderedShortlist = routeOrder.length === shortlist.length
    ? routeOrder.map(i => shortlist[i]).filter(Boolean)
    : shortlist;

  return (
    <>
      <Head><title>My Shortlist — dawirny</title></Head>
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link href="/"><DawirnyLogo size="sm" /></Link>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-lg" style={{ color: '#1A9988' }}>My Shortlist</span>
              </div>
              {shortlist.length > 0 && (
                <button onClick={clearShortlist} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">
                  Clear All
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
          {shortlist.length === 0 ? (

            /* Empty state */
            <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
              <div className="text-6xl mb-6">⭐</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your shortlist is empty</h2>
              <p className="text-gray-500 mb-8">Save up to 5 cars to compare prices and plan your market visit route.</p>
              <button
                onClick={() => router.back()}
                className="inline-block px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-transform hover:scale-105"
                style={{ background: '#1A9988' }}
              >
                ← Go Back to Browsing
              </button>
            </div>

          ) : (
            <>
              {/* Route Planner */}
              <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">🗺️ Route Planner</h2>
                    <p className="text-sm text-gray-500">{shortlist.length}/5 cars saved</p>
                  </div>
                  <button
                    onClick={planRoute}
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all active:scale-95"
                    style={{ background: '#1A9988' }}
                  >
                    Optimize Route
                  </button>
                </div>
                {routeOrder.length > 0 && shortlist.length > 1 && (
                  <div className="mt-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 text-center">Suggested Visiting Order</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {orderedShortlist.map((v, i) => (
                        <div key={v.id} className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-emerald-200">
                            <span className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center" style={{ background: '#1A9988' }}>{i + 1}</span>
                            <span className="text-sm text-emerald-900 font-bold">{v.showroom_number}</span>
                          </div>
                          {i < orderedShortlist.length - 1 && <span className="text-emerald-300">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Car list */}
              <div className="space-y-4">
                {orderedShortlist.map((v, i) => (
                  <div key={v.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
                    <div className="flex items-start p-4 gap-4">
                      {/* Position number */}
                      <div
                        className="w-8 h-8 rounded-full text-white text-sm font-black flex items-center justify-center flex-shrink-0 shadow-sm mt-1"
                        style={{ background: '#1A9988' }}
                      >
                        {i + 1}
                      </div>
                      {/* Photo */}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-50">
                        {v.photos?.length > 0
                          ? <img src={v.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-3xl">🚗</div>}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base leading-snug">
                          {v.year} {v.make} {v.model}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5 flex-wrap">
                          <span>{v.mileage_km ? `${Number(v.mileage_km).toLocaleString()} km` : 'N/A km'}</span>
                          <span className="text-gray-300">•</span>
                          <span className="font-medium text-teal-600">{v.specs?.gcc ? 'GCC' : 'Non-GCC'}</span>
                        </div>
                        <div className="text-xl font-black mt-1" style={{ color: '#1A9988' }}>
                          AED {Number(v.price_aed).toLocaleString()}
                        </div>
                        {/* Showroom number + tier stacked */}
                        <ShowroomBlock showroomNumber={v.showroom_number} scoreTier={v.score_tier} />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 px-4 pb-4 pt-1">
                      <Link
                        href={`/vehicle/${v.id}`}
                        className="flex-1 py-3 rounded-xl text-center text-sm font-bold text-white transition-all active:scale-95"
                        style={{ background: '#1A9988' }}
                      >
                        View Full Details
                      </Link>
                      <button
                        onClick={() => removeFromShortlist(v.id)}
                        className="flex-1 py-3 rounded-xl text-center text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors active:scale-95"
                      >
                        Remove Car
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Suggestions Panel */}
              {shortlist.length >= 2 && (
                <AiSuggestionsPanel
                  shortlist={shortlist}
                  onRemove={removeFromShortlist}
                  onAdd={addToShortlist}
                />
              )}

              <div className="mt-8 text-center">
                <button
                  onClick={() => router.back()}
                  className="text-gray-400 hover:text-[#1A9988] font-bold text-sm transition-colors"
                >
                  ← Continue Browsing
                </button>
              </div>
            </>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}




