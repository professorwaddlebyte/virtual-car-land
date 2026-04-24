// pages/index.js
// FIXED: "-- OR --" color is now properly yellow

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import DawirnyLogo from "../components/DawirnyLogo";
import Footer from "../components/Footer";

// Debug toggle - set to false to disable console.log messages
const DEBUG = false; // Change to false to silence all [AI Search] logs

// Custom debug logger
function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

const MARKET_ID = "00000000-0000-0000-0000-000000000010";

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    year_min: "",
    year_max: "",
  });

  // AI search state
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // DB-driven makes
  const [makes, setMakes] = useState([]);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});

    fetch("/api/lookup")
      .then((r) => r.json())
      .then((d) => {
        if (d.makes) setMakes(d.makes.map((m) => m.name));
      })
      .catch(() => {});
  }, []);

  const years = Array.from({ length: 25 }, (_, i) => 2025 - i);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.make) params.set("make", filters.make);
    if (filters.model) params.set("model", filters.model);
    if (filters.year_min) params.set("year_min", filters.year_min);
    if (filters.year_max) params.set("year_max", filters.year_max);
    router.push(`/market/${MARKET_ID}?${params}`);
  }

  // In index.js, update the handleAiSearch function (around line 70-110):

  async function handleAiSearch(e) {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    debugLog("[AI Search] Starting search with query:", aiQuery);
    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });

      debugLog("[AI Search] Response status:", res.status);

      const data = await res.json();

      // Log the full response for debugging
      debugLog("[AI Search] Full response:", JSON.stringify(data, null, 2));
      debugLog("[AI Search] Filters:", data.filters);
      debugLog("[AI Search] Unmatched terms:", data.unmatched_terms);

      // Build params from whatever filters we got
      const f = data.filters || {};
      const unmatched = data.unmatched_terms || [];

      // Build params
      const params = new URLSearchParams();

      if (f.makes && f.makes.length > 0) {
        debugLog("[AI Search] Adding makes:", f.makes);
        f.makes.forEach((m) => params.append("makes", m));
      }
      if (f.model) {
        debugLog("[AI Search] Adding model:", f.model);
        params.set("model", f.model);
      }
      if (f.body_type) {
        debugLog("[AI Search] Adding body_type:", f.body_type);
        params.set("body", f.body_type);
      }
      if (f.year_min) {
        debugLog("[AI Search] Adding year_min:", f.year_min);
        params.set("year_min", f.year_min);
      }
      if (f.year_max) {
        debugLog("[AI Search] Adding year_max:", f.year_max);
        params.set("year_max", f.year_max);
      }
      if (f.price_min) {
        debugLog("[AI Search] Adding price_min:", f.price_min);
        params.set("price_min", f.price_min);
      }
      if (f.price_max) {
        debugLog("[AI Search] Adding price_max:", f.price_max);
        params.set("price_max", f.price_max);
      }
      if (f.mileage_max_km) {
        debugLog("[AI Search] Adding mileage_max_km:", f.mileage_max_km);
        params.set("mileage_max", f.mileage_max_km);
      }
      if (f.gcc_spec !== null && f.gcc_spec !== undefined) {
        debugLog("[AI Search] Adding gcc_spec:", f.gcc_spec);
        params.set("gcc", f.gcc_spec);
      }
      if (f.transmission) {
        debugLog("[AI Search] Adding transmission:", f.transmission);
        params.set("transmission", f.transmission);
      }
      if (f.fuel_type) {
        debugLog("[AI Search] Adding fuel_type:", f.fuel_type);
        params.set("fuel", f.fuel_type); // Important: mapping fuel_type to fuel
      }
      if (f.cylinders) {
        debugLog("[AI Search] Adding cylinders:", f.cylinders);
        params.set("cylinders", f.cylinders);
      }
      if (f.colors && f.colors.length > 0) {
        debugLog("[AI Search] Adding colors:", f.colors);
        f.colors.forEach((c) => params.append("colors", c));
      }
      if (f.features && f.features.length > 0) {
        debugLog("[AI Search] Adding features:", f.features);
        f.features.forEach((feat) => params.append("features", feat));
      }

      if (unmatched.length > 0) {
        debugLog("[AI Search] Adding unmatched terms:", unmatched);
        params.set("unmatched", JSON.stringify(unmatched));
      }

      const finalUrl = `/market/${MARKET_ID}?${params}`;
      debugLog("[AI Search] Redirecting to:", finalUrl);
      router.push(finalUrl);
    } catch (err) {
      debugLog("[AI Search] Error:", err);
      setAiError("Connection error. Please try again.");
      setAiLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>dawirny — UAE Car Markets</title>
        <meta
          name="description"
          content="Browse every dealer at UAE Auto Markets. Find the exact car. Walk straight to the showroom."
        />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <DawirnyLogo size="sm" />
            <div className="flex items-center">
              <Link
                href="/login"
                className="px-6 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                style={{ background: "#1A9988" }}
              >
                Dealer Login
              </Link>
            </div>
          </div>
        </nav>

        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0d6b5e 0%, #1A9988 100%)",
          }}
        >
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div
            className="max-w-5xl mx-auto px-4 text-center relative z-10"
            style={{ paddingTop: "30px", paddingBottom: "30px" }}
          >
            <p className="text-xl sm:text-2xl font-medium text-white opacity-90 mb-2">
              The Smart Way to
            </p>
            <h1
              className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.1]"
              style={{ marginBottom: "24px" }}
            >
              Buy Cars in <br />
              UAE.
            </h1>
            <p
              className="text-lg sm:text-xl font-bold max-w-2xl mx-auto"
              style={{ color: "#FFD700", marginBottom: "40px" }}
            >
              Search live inventory across UAE auto markets. No more endless
              walking.
            </p>

            {/* Standard filter search */}
            <form
              onSubmit={handleSearch}
              className="bg-white p-2 rounded-[28px] shadow-2xl mx-auto border-4"
              style={{ maxWidth: "900px", borderColor: "#1A9988" }}
            >
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  value={filters.make}
                  onChange={(e) =>
                    setFilters({ ...filters, make: e.target.value })
                  }
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="">All Makes</option>
                  {makes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Model..."
                  value={filters.model}
                  onChange={(e) =>
                    setFilters({ ...filters, model: e.target.value })
                  }
                  className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 focus:border-[#1A9988] outline-none"
                />

                <select
                  value={filters.year_min}
                  onChange={(e) =>
                    setFilters({ ...filters, year_min: e.target.value })
                  }
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="">From Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.year_max}
                  onChange={(e) =>
                    setFilters({ ...filters, year_max: e.target.value })
                  }
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="">To Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="flex-shrink-0 w-full md:w-fit px-10 py-4 rounded-[20px] text-white font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-lg"
                  style={{ background: "#1A9988" }}
                >
                  Search
                </button>
              </div>
            </form>

            {/* AI Search */}
            <div className="mx-auto mt-4" style={{ maxWidth: "900px" }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-white/20" />
                <span
                  className="text-[#FFD700] text-base sm:text-lg font-black uppercase tracking-wider"
                  style={{ color: "#FFD700 !important" }}
                >
                  -- OR --
                </span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <form onSubmit={handleAiSearch}>
                <div
                  className="bg-white p-2 rounded-[28px] shadow-2xl border-4"
                  style={{ borderColor: "#1A9988" }}
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => {
                        setAiQuery(e.target.value);
                        if (aiError) setAiError("");
                      }}
                      placeholder="e.g. Japanese SUV for a family, bright color, under 120k..."
                      disabled={aiLoading}
                      className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-[20px] px-6 py-4 text-sm font-bold text-gray-800 placeholder-gray-400 focus:border-[#1A9988] outline-none disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading || !aiQuery.trim()}
                      className="flex-shrink-0 md:w-fit flex items-center justify-center gap-2 px-12 py-4 rounded-[20px] text-white font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                      style={{ background: "#1A9988", color: "white" }}
                    >
                      {aiLoading ? (
                        <>
                          <span
                            className="inline-block mr-2 ml-2 w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                            style={{ animation: "spin 0.8s linear infinite" }}
                          />
                          <span className="leading-none">Thinking...</span>
                        </>
                      ) : (
                        <>
                          <span className="leading-none ml-2">✨</span>
                          <span className="leading-none">Get help from AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {aiError && (
                <p className="mt-3 text-center text-sm font-bold text-red-300">
                  ⚠️ {aiError}
                </p>
              )}

              {!aiLoading && !aiError && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {[
                    "Japanese SUV under 150k",
                    "Family car, 7 seats",
                    "Low mileage automatic sedan",
                    "GCC spec, bright color",
                  ].map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      onClick={() => setAiQuery(hint)}
                      className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all hover:bg-white/20 active:scale-95"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div className="bg-gray-50 h-16 w-full"></div>

        <div className="bg-white py-20 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                  Browse by Market
                </h2>
                <p className="text-gray-500 font-bold mt-2">
                  Every showroom in the UAE, indexed and searchable.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Ras Al Khor",
                  location: "Dubai",
                  count: stats?.active_vehicles || "...",
                  id: MARKET_ID,
                },
                {
                  name: "Souq Al Haraj",
                  location: "Sharjah",
                  count: "Coming Soon",
                  id: null,
                },
                {
                  name: "Motor World",
                  location: "Abu Dhabi",
                  count: "Coming Soon",
                  id: null,
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className={`group relative rounded-[40px] p-8 border-2 transition-all ${m.id ? "border-gray-100 hover:border-[#1A9988] cursor-pointer" : "border-dashed border-gray-200 opacity-60"}`}
                >
                  {m.id && (
                    <Link
                      href={`/market/${m.id}`}
                      className="absolute inset-0 z-10"
                    />
                  )}
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-teal-50 transition-colors">
                      🏙️
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">
                      {m.location}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                    {m.name}
                  </h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    {m.count} {m.id ? "Cars Available" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 h-16 w-full"></div>

        <div className="bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center uppercase tracking-tight">
              How It Works
            </h2>
            <p className="text-gray-400 font-bold text-center mb-24 uppercase tracking-widest text-xs">
              From your phone to the showroom in minutes
            </p>
            <div className="grid grid-cols-2 mt-10 md:grid-cols-4 gap-14 text-center">
              {[
                {
                  icon: "🔍",
                  step: "Search",
                  desc: "Filter by make, model, price and specs from home",
                },
                {
                  icon: "📍",
                  step: "Locate",
                  desc: "See exactly which showroom has your car",
                },
                {
                  icon: "🗺️",
                  step: "Navigate",
                  desc: "Get the showroom number and walk straight there",
                },
                {
                  icon: "🤝",
                  step: "Deal",
                  desc: "Arrive informed with market price data in hand",
                },
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-4xl mb-4 mt-6">{item.icon}</div>
                  <h3 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-wider">
                    {item.step}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-bold leading-relaxed px-2 uppercase">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}



