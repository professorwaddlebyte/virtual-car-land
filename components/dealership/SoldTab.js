import EmptyState from "./EmptyState";

export default function SoldTab({ filteredSold, soldSearch, setSoldSearch }) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <input type="text" placeholder="🔍  Search sold cars..." value={soldSearch} onChange={(e) => setSoldSearch(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      {filteredSold.length === 0 ? (<div className="bg-white rounded-2xl p-12 shadow-sm"><EmptyState icon="✅" text={soldSearch ? "No sold cars match your search." : "No sold cars yet."} /></div>) : (filteredSold.map((v) => (<div key={v.id} className="bg-white rounded-2xl shadow-sm overflow-hidden"><div className="flex gap-4 p-4"><div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">{v.photos?.length > 0 ? (<img src={v.photos[0]} alt="" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-xl">🚗</div>)}</div><div className="flex-1"><div className="flex items-start justify-between"><div><h3 className="font-bold text-gray-900">{v.year} {v.make} {v.model}</h3><p className="text-sm text-gray-500">AED {v.price_aed?.toLocaleString()} • {v.mileage_km?.toLocaleString()} km</p></div><span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Sold</span></div><div className="flex gap-4 mt-2">{v.days_to_sell && (<span className="text-xs text-gray-400">Sold in {v.days_to_sell} days</span>)}{v.sold_at && (<span className="text-xs text-gray-400">{new Date(v.sold_at).toLocaleDateString()}</span>)}</div></div></div></div>)))}
    </div>
  );
}



