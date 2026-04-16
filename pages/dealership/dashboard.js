// pages/dealership/dashboard.js
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Footer from "../../components/Footer";

// Components
import StatCard from "../../components/dealership/StatCard";
import EmptyState from "../../components/dealership/EmptyState";
import AddCarModal from "../../components/dealership/AddCarModal";
import EditModal from "../../components/dealership/EditModal";
import ManagePhotosModal from "../../components/dealership/ManagePhotosModal";
import InventoryTab from "../../components/dealership/InventoryTab";
import SoldTab from "../../components/dealership/SoldTab";
import ActionsTab from "../../components/dealership/ActionsTab";
import PricingTab from "../../components/dealership/PricingTab";
import DemandTab from "../../components/dealership/DemandTab";
import CompetitiveTab from "../../components/dealership/CompetitiveTab";
import ReputationTab from "../../components/dealership/ReputationTab";

const TIER_COLORS = {
  Platinum: "bg-purple-100 text-purple-700 border-purple-200",
  Gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Silver: "bg-gray-100 text-gray-600 border-gray-200",
  Unrated: "bg-gray-50 text-gray-400 border-gray-100",
};

const TABS = [
  { id: "actions", label: "🎯 Actions" },
  { id: "inventory", label: "🚗 Active" },
  { id: "sold", label: "✅ Sold" },
  { id: "pricing", label: "💰 Pricing" },
  { id: "demand", label: "📈 Demand" },
  { id: "competitive", label: "🏆 Rank" },
  { id: "reputation", label: "⭐ Rep" },
];

export default function DealerDashboard() {
  const router = useRouter();

  // Data state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localVehicles, setLocalVehicles] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState("actions");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [managingPhotos, setManagingPhotos] = useState(null);
  const [highlightedVehicles, setHighlightedVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [soldSearch, setSoldSearch] = useState("");

  // Intelligence
  const [intelligence, setIntelligence] = useState(null);
  const [intLoading, setIntLoading] = useState(false);

  // DB-driven lookup data
  const [makes, setMakes] = useState([]);
  const [colors, setColors] = useState([]);
  const [featureGroups, setFeatureGroups] = useState([]);

  useEffect(() => {
    fetch("/api/lookup")
      .then((r) => r.json())
      .then((d) => {
        if (d.makes) setMakes(d.makes.map((m) => m.name));
        if (d.colors) setColors(d.colors.map((c) => c.name));
        if (d.featureGroups) setFeatureGroups(d.featureGroups);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadData(token);
  }, []);

  function loadData(token) {
    const t = token || localStorage.getItem("token");
    if (!t) {
      router.push("/login");
      return;
    }
    fetch("/api/dealer/intelligence", {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setData(d);
          setLocalVehicles(d.vehicles || []);
          setIntelligence(d);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }

  async function loadIntelligence() {
    if (intelligence) return;
    setIntLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/dealer/intelligence", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setIntelligence(d);
    } catch (e) {
      console.error("Intelligence load failed:", e);
    }
    setIntLoading(false);
  }

  async function handleMarkSold(vehicleId) {
    if (!confirm("Mark this car as sold?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/vehicles/${vehicleId}/sold`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await res.json();
    if (d.ok) {
      setLocalVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, status: "sold", sold_at: new Date().toISOString() }
            : v
        )
      );
      alert("✅ Marked as sold!");
    } else {
      alert("Failed: " + d.error);
    }
  }

  async function handleDelete(vehicleId, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/vehicles/${vehicleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await res.json();
    if (d.ok)
      setLocalVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    else alert("Failed: " + d.error);
  }

  function handleEditSave(updated) {
    if (updated)
      setLocalVehicles((prev) =>
        prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v))
      );
    else loadData();
    setEditingVehicle(null);
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">Loading your intelligence dashboard...</p>
        </div>
      </div>
    );

  if (!data) return null;

  const {
    dealer,
    stats,
    market_demand = [],
    price_ranges = [],
    body_type_demand = [],
    competitive = {},
    reputation = {},
    actions = [],
  } = data;

  const soldVehicles = localVehicles.filter((v) => v.sold_at != null);
  const activeVehicles = localVehicles.filter(
    (v) => v.sold_at == null && v.status === "active"
  );
  const draftVehicles = localVehicles.filter(
    (v) => v.sold_at == null && v.status === "draft"
  );

  const filteredActive = activeVehicles.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.year?.toString().includes(q) ||
      v.price_aed?.toString().includes(q) ||
      v.specs?.color?.toLowerCase().includes(q)
    );
  });

  const filteredSold = soldVehicles.filter((v) => {
    if (!soldSearch) return true;
    const q = soldSearch.toLowerCase();
    return (
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.year?.toString().includes(q)
    );
  });

  return (
    <>
      <Head>
        <title>{dealer.business_name} — Intelligence Dashboard</title>
      </Head>

      {/* Modals */}
      {showAddModal && (
        <AddCarModal
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadData();
          }}
          makes={makes}
          colors={colors}
          featureGroups={featureGroups}
        />
      )}
      {editingVehicle && (
        <EditModal
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSave={handleEditSave}
          colors={colors}
          featureGroups={featureGroups}
        />
      )}
      {managingPhotos && (
        <ManagePhotosModal
          vehicle={managingPhotos}
          onClose={() => setManagingPhotos(null)}
          onSave={(photos) => {
            setLocalVehicles((prev) =>
              prev.map((v) =>
                v.id === managingPhotos.id ? { ...v, photos } : v
              )
            );
            setManagingPhotos(null);
          }}
        />
      )}

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-bold text-gray-900 leading-none">
                    {dealer.business_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Showroom {dealer.showroom_number} — {dealer.market_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    TIER_COLORS[dealer.score_tier] || TIER_COLORS.Unrated
                  }`}
                >
                  {dealer.score_tier} — {dealer.listing_integrity_score}/100
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    router.push("/login");
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 flex-1 w-full">
          {/* KPI — 5 cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              icon="🚗"
              label="Active Listings"
              value={stats?.active_count ?? activeVehicles.length}
              color="#1A9988"
            />
            <StatCard
              icon="✅"
              label="Sold"
              value={stats?.sold_count ?? soldVehicles.length}
              sub={
                stats?.avg_days_to_sell > 0
                  ? `Avg ${Math.round(stats.avg_days_to_sell)}d`
                  : null
              }
              color="#16a34a"
            />
            <StatCard
              icon="👁"
              label="Total Views"
              value={parseInt(stats?.total_views || 0).toLocaleString()}
              color="#374151"
            />
            <StatCard
              icon="💬"
              label="WhatsApp"
              value={stats?.total_whatsapp ?? 0}
              color="#25D366"
            />
            <StatCard
              icon="⭐"
              label="Saves"
              value={stats?.total_saves ?? 0}
              color="#d97706"
            />
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (
                    ["pricing", "demand", "competitive", "reputation"].includes(
                      tab.id
                    )
                  )
                    loadIntelligence();
                }}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                style={
                  activeTab === tab.id
                    ? { background: "#1A9988", color: "white" }
                    : { color: "#6b7280" }
                }
              >
                {tab.label}
                {tab.id === "actions" && actions.length > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={
                      activeTab === tab.id
                        ? { background: "white", color: "#1A9988" }
                        : { background: "#ef4444", color: "white" }
                    }
                  >
                    {actions.length}
                  </span>
                )}
                {tab.id === "sold" && soldVehicles.length > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={
                      activeTab === tab.id
                        ? { background: "white", color: "#1A9988" }
                        : { background: "#ef4444", color: "white" }
                    }
                  >
                    {soldVehicles.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "actions" && (
            <ActionsTab
              actions={actions}
              stats={stats}
              competitive={competitive}
              setHighlightedVehicles={setHighlightedVehicles}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryTab
              activeVehicles={activeVehicles}
              draftVehicles={draftVehicles}
              filteredActive={filteredActive}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setShowAddModal={setShowAddModal}
              setEditingVehicle={setEditingVehicle}
              setManagingPhotos={setManagingPhotos}
              handleMarkSold={handleMarkSold}
              handleDelete={handleDelete}
              highlightedVehicles={highlightedVehicles}
            />
          )}

          {activeTab === "sold" && (
            <SoldTab
              filteredSold={filteredSold}
              soldSearch={soldSearch}
              setSoldSearch={setSoldSearch}
            />
          )}

          {activeTab === "pricing" && (
            <PricingTab activeVehicles={activeVehicles} intLoading={intLoading} />
          )}

          {activeTab === "demand" && (
            <DemandTab
              market_demand={market_demand}
              body_type_demand={body_type_demand}
              price_ranges={price_ranges}
              activeVehicles={activeVehicles}
              intLoading={intLoading}
            />
          )}

          {activeTab === "competitive" && (
            <CompetitiveTab competitive={competitive} dealer={dealer} intLoading={intLoading} />
          )}

          {activeTab === "reputation" && (
            <ReputationTab
              reputation={reputation}
              dealer={dealer}
              activeVehicles={activeVehicles}
              intLoading={intLoading}
            />
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}




