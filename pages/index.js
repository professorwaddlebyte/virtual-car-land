import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import DawirnyLogo from "../components/DawirnyLogo";
import Footer from "../components/Footer";

const MARKET_ID = "00000000-0000-0000-0000-000000000010";

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ make: "", model: "", year: "" });

  // AI search state
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiFilters, setAiFilters] = useState(null); // extracted filters to preview

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.make) params.set("make", filters.make);
    if (filters.model) params.set("model", filters.model);
    if (filters.year) params.set("year", filters.year);
    router.push(`/market/${MARKET_ID}?${params}`);
  }

  async function handleAiSearch(e) {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiError("");
    setAiFilters(null);

    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAiError("Something went wrong. Please try again.");
        setAiLoading(false);
        return;
      }

      const f = data.filters || {};

      // Build URL params from extracted filters
      const params = new URLSearchParams();

      // makes array → repeated param
      if (f.makes && f.makes.length > 0) {
        f.makes.forEach((m) => params.append("makes", m));
      }
      if (f.model)        params.set("model",       f.model);
      if (f.body)         params.set("body",         f.body);
      if (f.price_min)    params.set("price_min",    f.price_min);
      if (f.price_max)    params.set("price_max",    f.price_max);
      if (f.year_min)     params.set("year_min",     f.year_min);
      if (f.year_max)     params.set("year_max",     f.year_max);
      if (f.mileage_max)  params.set("mileage_max",  f.mileage_max);
      if (f.gcc !== null && f.gcc !== undefined) params.set("gcc", f.gcc);
      if (f.transmission) params.set("transmission", f.transmission);
      // colors array → repeated param
      if (f.colors && f.colors.length > 0) {
        f.colors.forEach((c) => params.append("colors", c));
      }

      // If fallback (LLM failed) or truly empty filters, go with no filters
      router.push(`/market/${MARKET_ID}?${params}`);

    } catch {
      setAiError("Connection error. Please try again.");
      setAiLoading(false);
    }
  }

  const makes = [
    "Toyota", "Nissan", "Honda", "Mitsubishi", "Hyundai", "Kia",
    "Ford", "Chevrolet", "BMW", "Mercedes-Benz", "Lexus", "Infiniti", "Dodge", "Jeep",
  ];
  const years = Array.from({ length: 25 }, (_, i) => 2025 - i);

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

        {/* Hero Section */}
        <div
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0d6b5e 0%, #1A9988 100%)" }}
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
              Search live inventory across UAE auto markets. No more endless walking.
            </p>

            {/* Standard filter search */}
            <form
              onSubmit={handleSearch}
              className="bg-white p-2 rounded-[28px] shadow-2xl mx-auto border-4"
              style={{ maxWidth: "800px", borderColor: "#1A9988" }}
            >
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  value={filters.make}
                  onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="">All Makes</option>
                  {makes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Model..."
                  value={filters.model}
                  onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                  className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 focus:border-[#1A9988] outline-none"
                />

                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="flex-1 bg-gray-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                >
                  <option value="">Any Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="md:w-auto px-10 py-4 rounded-[20px] text-white font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-lg"
                  style={{ background: "#1A9988" }}
                >
                  Search
                </button>
              </div>
            </form>

            {/* ── AI Search ── */}
            <div className="mx-auto mt-4" style={{ maxWidth: "800px" }}>
              {/* OR divider */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-white/50 text-xs font-black uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <form onSubmit={handleAiSearch}>
                <div
                  className="rounded-[28px] p-2 shadow-2xl border-4"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(12px)",
                  }}
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
                      className="flex-1 rounded-[20px] px-6 py-4 text-sm font-bold text-gray-800 placeholder-gray-400 outline-none border-none disabled:opacity-60"
                      style={{ background: "rgba(255,255,255,0.92)" }}
                    />
                    <button
                      type="submit"
                      disabled={aiLoading || !aiQuery.trim()}
                      className="flex items-center justify-center gap-2 px-8 py-4 rounded-[20px] text-white font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                      style={{ background: aiLoading ? "#0d6b5e" : "#FFD700", color: aiLoading ? "white" : "#1a1a1a" }}
                    >
                      {aiLoading ? (
                        <>
                          <span
                            className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                            style={{ animation: "spin 0.8s linear infinite" }}
                          />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          Get help from AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Error message */}
              {aiError && (
                <p className="mt-3 text-center text-sm font-bold text-red-300">
                  ⚠️ {aiError}
                </p>
              )}

              {/* Hint chips */}
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
            {/* ── end AI Search ── */}

            {/* Stats */}
            {stats && (
              <div className="max-w-3xl mx-auto mt-6">
                <div className="flex items-center justify-center gap-4">
                  {[
                    { value: stats.active_vehicles || 0, label: "Cars" },
                    { value: stats.dealers || 0, label: "Dealers" },
                    { value: stats.showrooms || 0, label: "Showrooms" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center justify-center px-8 py-6"
                      style={{
                        background: i === 0 ? "#FFD93D" : i === 1 ? "#FFE066" : "#FFF0A0",
                        borderRadius: "4px 4px 4px 4px",
                        boxShadow: "3px 4px 12px rgba(0,0,0,0.18), inset 0 -3px 0 rgba(0,0,0,0.08)",
                        transform: `rotate(${[-2, 1.5, -1][i]}deg)`,
                        minWidth: "130px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          background: "#cc3300",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                      />
                      <p className="text-4xl font-black leading-none mb-2" style={{ color: "#1a1a1a" }}>
                        {s.value.toLocaleString()}
                      </p>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "#4a3a00" }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spinner keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div className="bg-gray-50 h-16 w-full"></div>

        {/* Browse Markets Section */}
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
                { name: "Ras Al Khor", location: "Dubai", count: stats?.active_vehicles || "...", id: MARKET_ID },
                { name: "Souq Al Haraj", location: "Sharjah", count: "Coming Soon", id: null },
                { name: "Motor World", location: "Abu Dhabi", count: "Coming Soon", id: null },
              ].map((m, i) => (
                <div
                  key={i}
                  className={`group relative rounded-[40px] p-8 border-2 transition-all ${m.id ? "border-gray-100 hover:border-[#1A9988] cursor-pointer" : "border-dashed border-gray-200 opacity-60"}`}
                >
                  {m.id && <Link href={`/market/${m.id}`} className="absolute inset-0 z-10" />}
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-teal-50 transition-colors">
                      🏙️
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full">
                      {m.location}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{m.name}</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    {m.count} {m.id ? "Cars Available" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 h-16 w-full"></div>

        {/* How It Works Section */}
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
                { icon: "🔍", step: "Search", desc: "Filter by make, model, price and specs from home" },
                { icon: "📍", step: "Locate", desc: "See exactly which showroom has your car" },
                { icon: "🗺️", step: "Navigate", desc: "Get the showroom number and walk straight there" },
                { icon: "🤝", step: "Deal", desc: "Arrive informed with market price data in hand" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-4xl mb-4 mt-6">{item.icon}</div>
                  <h3 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-wider">{item.step}</h3>
                  <p className="text-[11px] text-gray-500 font-bold leading-relaxed px-2 uppercase">{item.desc}</p>
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






