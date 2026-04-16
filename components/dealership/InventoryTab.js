import ScoreBar from "./ScoreBar";
import EmptyState from "./EmptyState";

const FLAG_COLORS = {
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-400" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-400" },
};

export default function InventoryTab({
  activeVehicles,
  draftVehicles,
  filteredActive,
  searchQuery,
  setSearchQuery,
  setShowAddModal,
  setEditingVehicle,
  setManagingPhotos,
  handleMarkSold,
  handleDelete,
  highlightedVehicles,
}) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 items-center">
        <input type="text" placeholder="🔍  Search by make, model, year, color, price..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <button onClick={() => setShowAddModal(true)} className="flex-shrink-0 px-4 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2" style={{ background: "#1A9988" }}>+ Add Car</button>
      </div>
      {searchQuery && (<p className="text-xs text-gray-400 px-1">{filteredActive.length} of {activeVehicles.length} listings</p>)}

      {draftVehicles.length > 0 && (<div className="bg-amber-50 border border-amber-200 rounded-2xl p-4"><p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3">⏳ Pending Approval ({draftVehicles.length})</p><div className="space-y-2">{draftVehicles.map((v) => (<div key={v.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-amber-100"><div><p className="text-sm font-bold text-gray-900">{v.year} {v.make} {v.model}</p><p className="text-xs text-gray-400">AED {v.price_aed?.toLocaleString()}</p></div><span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">Awaiting</span></div>))}</div></div>)}

      {filteredActive.length === 0 ? (<div className="bg-white rounded-2xl p-12 shadow-sm"><EmptyState icon={searchQuery ? "🔍" : "🚗"} text={searchQuery ? "No cars match your search." : "No active listings. Use + Add Car or @NURDealsBot on Telegram."} /></div>) : (filteredActive.map((v) => {
        const flags = Array.isArray(v.ai_flag) ? v.ai_flag : v.ai_flag ? [v.ai_flag] : [];
        const daysLeft = Math.floor(parseFloat(v.days_until_expiry || 0));
        const daysListed = Math.floor(parseFloat(v.days_listed || 0));
        const isHighlighted = highlightedVehicles.includes(v.id);

        return (<div key={v.id} id={`vehicle-${v.id}`} className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all" style={isHighlighted ? { outline: "4px solid #1A9988", outlineOffset: "3px", background: "#f0faf9" } : {}}>
          <div className="flex gap-4 p-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">{v.photos?.length > 0 ? (<img src={v.photos[0]} alt="" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-gray-900">{v.year} {v.make} {v.model}</h3><div className="flex flex-wrap gap-1">{flags.filter(Boolean).map((f, fi) => { const fs = FLAG_COLORS[f.color] || FLAG_COLORS.blue; return (<span key={fi} className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${fs.bg} ${fs.text} ${fs.border}`}><span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${fs.dot}`} />{f.label}</span>); })}</div></div>
              <p className="text-sm text-gray-500">AED {v.price_aed?.toLocaleString()} • {v.mileage_km?.toLocaleString()} km • {v.specs?.gcc ? "GCC" : "Non-GCC"}</p>
              <div className="grid grid-cols-4 gap-2 mt-3">{[{ label: "Views", value: v.views_count }, { label: "WhatsApp", value: v.whatsapp_clicks }, { label: "Saves", value: v.saves_count }, { label: "Engage", value: v.engagement_score }].map((s, i) => (<div key={i} className="text-center p-2 bg-gray-50 rounded-lg"><p className="font-bold text-gray-900 text-sm">{s.value ?? 0}</p><p className="text-xs text-gray-400">{s.label}</p></div>))}</div>
            </div>
          </div>

          {flags.filter((f) => f && f.label !== "Active").map((f, fi) => { const fs = FLAG_COLORS[f.color] || FLAG_COLORS.blue; return (<div key={fi} className={`px-4 py-3 border-t ${fs.bg}`}><p className={`text-xs ${fs.text}`}>💡 {f.action}</p></div>); })}
          {v.description && (<div className="px-4 py-3 border-t border-gray-50 bg-gray-50"><p className="text-sm text-gray-700 font-medium italic">"{v.description}"</p></div>)}
          
          <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between"><div className="flex gap-4"><span className="text-xs text-gray-400">{daysListed}d listed</span><span className={`text-xs font-medium ${daysLeft <= 3 ? "text-red-500" : daysLeft <= 7 ? "text-orange-500" : "text-gray-400"}`}>{daysLeft}d until expiry</span></div><div className="flex items-center gap-1"><span className="text-xs text-gray-400">Quality:</span><div className="w-16"><ScoreBar value={v.listing_quality_score || 0} color={v.listing_quality_score >= 70 ? "#16a34a" : v.listing_quality_score >= 40 ? "#d97706" : "#ef4444"} /></div><span className="text-xs text-gray-500">{v.listing_quality_score || 0}%</span></div></div>
          
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
            <button onClick={() => setEditingVehicle(v)} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">✏️ Edit</button>
            <button onClick={() => setManagingPhotos(v)} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#1A9988" }}>📷 Photos</button>
            <button onClick={() => handleMarkSold(v.id)} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#16a34a" }}>✅ Sold</button>
            <button onClick={() => handleDelete(v.id, `${v.year} ${v.make} ${v.model}`)} className="py-2 px-3 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100">🗑️</button>
          </div>
        </div>);
      }))}
    </div>
  );
}




