import EmptyState from "./EmptyState";

const PRIORITY_COLORS = {
  high: "border-l-red-400 bg-red-50",
  medium: "border-l-orange-400 bg-orange-50",
  low: "border-l-blue-400 bg-blue-50",
};

export default function ActionsTab({ actions, stats, competitive, setHighlightedVehicles, setActiveTab }) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-1">Recommended Actions</h2>
        <p className="text-sm text-gray-500 mb-4">Based on your current inventory and market data</p>
        {actions.length === 0 ? (<EmptyState icon="🎉" text="No actions needed. Your inventory is performing well." />) : (<div className="space-y-3">{actions.map((a, i) => (<div key={i} onClick={() => { const ids = a.vehicle_ids || []; setHighlightedVehicles(ids); setActiveTab("inventory"); setTimeout(() => { if (ids.length > 0) { const el = document.getElementById(`vehicle-${ids[0]}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); } }, 300); }} className={`border-l-4 p-4 rounded-r-xl cursor-pointer hover:opacity-80 transition-opacity ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.low}`}><div className="flex items-center justify-between"><p className="font-medium text-gray-900">{a.icon} {a.text}</p>{a.vehicle_ids?.length > 0 && (<span className="flex-shrink-0 ml-3 text-xs font-bold px-2 py-1 rounded-lg bg-white bg-opacity-70" style={{ color: "#1A9988" }}>View {a.vehicle_ids.length} car{a.vehicle_ids.length > 1 ? "s" : ""} →</span>)}</div><span className="text-xs text-gray-400 uppercase mt-1 inline-block">{a.priority} priority</span></div>))}</div>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm"><h3 className="font-bold text-gray-900 mb-3">Sell Speed</h3><div className="text-3xl font-bold mb-1" style={{ color: "#1A9988" }}>{stats?.avg_days_to_sell > 0 ? `${Math.round(stats.avg_days_to_sell)}d` : "—"}</div><p className="text-sm text-gray-500">Your avg days to sell</p>{competitive?.market_avg_days_to_sell > 0 && (<p className="text-xs text-gray-400 mt-1">Market avg: {competitive.market_avg_days_to_sell}d</p>)}</div>
        <div className="bg-white rounded-2xl p-5 shadow-sm"><h3 className="font-bold text-gray-900 mb-3">Conversion Rate</h3><div className="text-3xl font-bold mb-1" style={{ color: "#16a34a" }}>{parseInt(stats?.total_views || 0) > 0 ? `${Math.round((parseInt(stats.total_whatsapp) / parseInt(stats.total_views)) * 100)}%` : "—"}</div><p className="text-sm text-gray-500">Views to WhatsApp</p><p className="text-xs text-gray-400 mt-1">Market benchmark: ~8%</p></div>
        <div className="bg-white rounded-2xl p-5 shadow-sm"><h3 className="font-bold text-gray-900 mb-3">Market Rank</h3><div className="text-3xl font-bold mb-1" style={{ color: "#d97706" }}>#{competitive?.my_rank} <span className="text-lg text-gray-400">of {competitive?.total_dealers}</span></div><p className="text-sm text-gray-500">By integrity score</p></div>
      </div>
    </div>
  );
}



