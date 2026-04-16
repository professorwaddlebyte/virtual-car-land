import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import DawirnyLogo from "../../components/DawirnyLogo";
import Footer from "../../components/Footer";
import { StatCard } from "../../components/admin/adminutils";
import MakesTab from "../../components/admin/makestab";
import ColorsTab from "../../components/admin/colorstab";
import SpecsTab from "../../components/admin/specstab";
import DealersTab from "../../components/admin/dealerstab";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pending");
  const [token, setToken] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [pendingDealersCount, setPendingDealersCount] = useState(0);
  const [showrooms, setShowrooms] = useState([]);
  const [showroomSearch, setShowroomSearch] = useState("");
  const [editingShowroom, setEditingShowroom] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!t || user.role !== "admin") {
      router.push("/login");
      return;
    }
    setToken(t);
    loadAll(t);
  }, []);

  // Get pending dealers count for tab badge
  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/dealers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const pendingCount = (data.dealers || []).filter(
          (d) => d.status === "pending",
        ).length;
        setPendingDealersCount(pendingCount);
      })
      .catch(console.error);
  }, [token]);

  async function loadAll(t) {
    setLoading(true);
    const tok = t || localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${tok}` };
    try {
      const [statsRes, pendingRes, showroomsRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/admin/pending", { headers }),
        fetch("/api/admin/showrooms", { headers }),
      ]);
      const [statsData, pendingData, showroomsData] = await Promise.all([
        statsRes.json(),
        pendingRes.json(),
        showroomsRes.json(),
      ]);
      setData(statsData);
      setPendingVehicles(pendingData.vehicles || []);
      setShowrooms(showroomsData.showrooms || []);
    } catch {}
    setLoading(false);
  }

  // ── Approval actions ──────────────────────────────────────────────────────
  async function approveListing(vehicleId) {
    const tok = localStorage.getItem("token");
    const res = await fetch(`/api/admin/approve/${vehicleId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
    const d = await res.json();
    if (d.ok)
      setPendingVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    else alert("Failed: " + d.error);
  }

  async function rejectListing(vehicleId) {
    if (!confirm("Reject and delete this listing?")) return;
    const tok = localStorage.getItem("token");
    const res = await fetch(`/api/admin/approve/${vehicleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tok}` },
    });
    const d = await res.json();
    if (d.ok)
      setPendingVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    else alert("Failed: " + d.error);
  }

  // ── Showroom CRUD ─────────────────────────────────────────────────────────
  async function saveShowroom(showroom) {
    const tok = localStorage.getItem("token");
    const method = showroom.id ? "PATCH" : "POST";
    const url = showroom.id
      ? `/api/admin/showrooms/${showroom.id}`
      : "/api/admin/showrooms";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tok}`,
      },
      body: JSON.stringify(showroom),
    });
    const d = await res.json();
    if (d.ok) {
      setEditingShowroom(null);
      loadAll();
    } else alert("Failed: " + d.error);
  }

  async function deleteShowroom(id) {
    if (!confirm("Delete this showroom?")) return;
    const tok = localStorage.getItem("token");
    const res = await fetch(`/api/admin/showrooms/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tok}` },
    });
    const d = await res.json();
    if (d.ok) setShowrooms((prev) => prev.filter((x) => x.id !== id));
    else alert("Failed: " + d.error);
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredShowrooms = showrooms.filter(
    (s) =>
      !showroomSearch ||
      s.showroom_number?.toLowerCase().includes(showroomSearch.toLowerCase()) ||
      s.dealer_name?.toLowerCase().includes(showroomSearch.toLowerCase()),
  );

  const TABS = [
    { id: "pending", label: "⏳ Pending", badge: pendingVehicles.length },
    { id: "overview", label: "📊 Overview" },
    { id: "dealers", label: "🏪 Dealers", badge: pendingDealersCount },
    { id: "showrooms", label: "📍 Showrooms" },
    { id: "makes", label: "🚘 Makes" },
    { id: "colors", label: "🎨 Colors" },
    { id: "specs", label: "⚙️ Specs" },
  ];

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Loading admin dashboard...</p>
        </div>
      </div>
    );

  return (
    <>
      <Head>
        <title>Admin — dawirny</title>
      </Head>

      {/* ── Edit Showroom Modal ── */}
      {editingShowroom && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <h2 className="text-lg font-bold mb-4">
              {editingShowroom.id ? "✏️ Edit Showroom" : "+ New Showroom"}
            </h2>
            <div className="space-y-3">
              {[
                {
                  key: "showroom_number",
                  label: "Showroom Number",
                  placeholder: "A-01",
                },
                { key: "section", label: "Section", placeholder: "A" },
                {
                  key: "location_hint",
                  label: "Location Hint",
                  placeholder: "Gate 1, Row A",
                },
                {
                  key: "map_x",
                  label: "Map X (%)",
                  type: "number",
                  placeholder: "15",
                },
                {
                  key: "map_y",
                  label: "Map Y (%)",
                  type: "number",
                  placeholder: "30",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    {f.label}
                  </label>
                  <input
                    type={f.type || "text"}
                    value={editingShowroom[f.key] || ""}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setEditingShowroom({
                        ...editingShowroom,
                        [f.key]: e.target.value,
                      })
                    }
                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditingShowroom(null)}
                className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => saveShowroom(editingShowroom)}
                className="flex-1 py-2.5 rounded-xl text-white font-bold"
                style={{ background: "#1A9988" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header style={{ background: "#1A9988" }} className="sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <DawirnyLogo size="sm" white={true} />
                <span className="text-white font-bold text-base">Admin</span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="text-white text-sm opacity-75 hover:opacity-100"
                >
                  ← Site
                </Link>
                <button
                  onClick={() => {
                    localStorage.clear();
                    router.push("/login");
                  }}
                  className="text-white text-sm opacity-75 hover:opacity-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 flex-1 w-full">
          {/* KPI stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              icon="🚗"
              label="Active Vehicles"
              value={data?.active_vehicles}
              color="#1A9988"
            />
            <StatCard
              icon="🏪"
              label="Dealers"
              value={data?.dealers}
              color="#374151"
            />
            <StatCard
              icon="📍"
              label="Showrooms"
              value={data?.showrooms}
              color="#374151"
            />
            <StatCard
              icon="⏳"
              label="Pending Approval"
              value={pendingVehicles.length}
              color={pendingVehicles.length > 0 ? "#d97706" : "#374151"}
            />
            <StatCard
              icon="✅"
              label="Sold This Month"
              value={data?.sold_this_month}
              color="#16a34a"
            />
          </div>

          {/* Tab bar - Updated to wrap on mobile */}
          <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                style={
                  activeTab === tab.id
                    ? { background: "#1A9988", color: "white" }
                    : { color: "#6b7280" }
                }
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={
                      activeTab === tab.id
                        ? { background: "white", color: "#1A9988" }
                        : { background: "#ef4444", color: "white" }
                    }
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── PENDING APPROVALS ── */}
          {activeTab === "pending" && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-1">
                  Pending Listing Approvals
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  New listings with photos submitted by dealers — review and
                  approve or reject
                </p>
                {pendingVehicles.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-gray-400 text-sm">
                      No pending listings.
                    </p>
                  </div>
                ) : (
                  pendingVehicles.map((v) => (
                    <div
                      key={v.id}
                      className="border border-gray-100 rounded-xl p-4 mb-3"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {v.photos?.length > 0 ? (
                            <img
                              src={v.photos[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              🚗
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-gray-900">
                                {v.year} {v.make} {v.model}
                              </h3>
                              <p className="text-sm text-gray-500">
                                AED {v.price_aed?.toLocaleString()} •{" "}
                                {v.mileage_km?.toLocaleString()} km •{" "}
                                {v.specs?.gcc ? "GCC" : "Non-GCC"}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Dealer: {v.dealer_name} — Showroom{" "}
                                {v.showroom_number}
                              </p>
                              {v.description && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  &quot;{v.description}&quot;
                                </p>
                              )}
                            </div>
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex-shrink-0">
                              Pending
                            </span>
                          </div>
                          {v.photos?.length > 1 && (
                            <div className="flex gap-1 mt-2">
                              {v.photos.slice(0, 5).map((p, i) => (
                                <img
                                  key={i}
                                  src={p}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ))}
                              {v.photos.length > 5 && (
                                <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                  +{v.photos.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => approveListing(v.id)}
                              className="flex-1 py-2 rounded-xl text-white text-sm font-bold"
                              style={{ background: "#1A9988" }}
                            >
                              ✅ Approve & Publish
                            </button>
                            <button
                              onClick={() => rejectListing(v.id)}
                              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100"
                            >
                              🗑️ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">
                  Platform Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Active Vehicles",
                      value: data?.active_vehicles,
                      icon: "🚗",
                    },
                    {
                      label: "Total Dealers",
                      value: data?.dealers,
                      icon: "🏪",
                    },
                    { label: "Showrooms", value: data?.showrooms, icon: "📍" },
                    {
                      label: "Total Views (30d)",
                      value: data?.views_30d?.toLocaleString(),
                      icon: "👁",
                    },
                    {
                      label: "WhatsApp Clicks (30d)",
                      value: data?.whatsapp_30d,
                      icon: "💬",
                    },
                    {
                      label: "Sold This Month",
                      value: data?.sold_this_month,
                      icon: "✅",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="p-4 bg-gray-50 rounded-xl text-center"
                    >
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {s.value ?? "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Quick Links</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {
                      label: "Export Vehicles CSV",
                      href: "/api/admin/export?type=vehicles",
                    },
                    {
                      label: "Export Dealers CSV",
                      href: "/api/admin/export?type=dealers",
                    },
                    {
                      label: "Export Inquiries CSV",
                      href: "/api/admin/export?type=inquiries",
                    },
                  ].map((l, i) => (
                    <a
                      key={i}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium border-2 border-gray-100 hover:border-teal-300 transition-colors"
                      style={{ color: "#1A9988" }}
                    >
                      📥 {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DEALERS ── */}
          {activeTab === "dealers" && <DealersTab token={token} />}

          {/* ── SHOWROOMS ── */}
          {activeTab === "showrooms" && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
                <input
                  type="text"
                  placeholder="🔍 Search showrooms..."
                  value={showroomSearch}
                  onChange={(e) => setShowroomSearch(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={() =>
                    setEditingShowroom({
                      showroom_number: "",
                      section: "",
                      location_hint: "",
                      map_x: "",
                      map_y: "",
                    })
                  }
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background: "#1A9988" }}
                >
                  + Add Showroom
                </button>
              </div>
              {filteredShowrooms.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {s.showroom_number} — {s.dealer_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {s.location_hint}
                      </p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          Section: {s.section}
                        </span>
                        <span className="text-xs text-gray-400">
                          Pin: ({s.map_x}%, {s.map_y}%)
                        </span>
                        <span className="text-xs text-gray-400">
                          {s.active_vehicles} active cars
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingShowroom({ ...s })}
                        className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteShowroom(s.id)}
                        className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-red-50 text-red-500"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── MAKES ── */}
          {activeTab === "makes" && <MakesTab token={token} />}

          {/* ── COLORS ── */}
          {activeTab === "colors" && <ColorsTab token={token} />}

          {/* ── SPECS ── */}
          {activeTab === "specs" && <SpecsTab token={token} />}
        </div>

        <Footer />
      </div>
    </>
  );
}




