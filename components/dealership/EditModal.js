import { useState } from "react";
import FeaturesSelector from "./FeaturesSelector";
import { BODY_TYPES, TRANSMISSIONS, FUEL_TYPES, CYLINDERS, GCC_BOOLEAN } from "../../lib/constants";

export default function EditModal({ vehicle, onClose, onSave, colors, featureGroups }) {
  const [form, setForm] = useState({
    price_aed: vehicle.price_aed || "",
    mileage_km: vehicle.mileage_km || "",
    description: vehicle.description || "",
    color: vehicle.specs?.color || "",
    transmission: vehicle.specs?.transmission || "automatic",
    fuel: vehicle.specs?.fuel || "petrol",
    body: vehicle.specs?.body || "",
    cylinders: vehicle.specs?.cylinders || "",
    gcc: vehicle.specs?.gcc ?? true,
  });
  const [features, setFeatures] = useState(vehicle.specs?.features || []);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        price_aed: parseInt(form.price_aed),
        mileage_km: parseInt(form.mileage_km),
        description: form.description,
        specs: { ...vehicle.specs, color: form.color, transmission: form.transmission, fuel: form.fuel, body: form.body, cylinders: form.cylinders, gcc: form.gcc, features },
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      onSave(data.vehicle);
      onClose();
    } else alert("Failed to update: " + data.error);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">✏️ Edit Listing</h2>
          <p className="text-sm text-gray-500 mt-0.5">{vehicle.year} {vehicle.make} {vehicle.model}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 uppercase">Price (AED)</label><input type="number" value={form.price_aed} onChange={(e) => setForm({ ...form, price_aed: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase">Mileage (km)</label><input type="number" value={form.mileage_km} onChange={(e) => setForm({ ...form, mileage_km: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase">Color</label><select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Select Color</option>{colors.map((c) => (<option key={c} value={c}>{c}</option>))}</select></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase">Transmission</label><select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">{TRANSMISSIONS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}</select></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase">Fuel</label><select value={form.fuel} onChange={(e) => setForm({ ...form, fuel: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">{FUEL_TYPES.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}</select></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase">Body Type</label><select value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Select Body</option>{BODY_TYPES.map((b) => (<option key={b} value={b.toLowerCase()}>{b}</option>))}</select></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase">Cylinders</label><select value={form.cylinders} onChange={(e) => setForm({ ...form, cylinders: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">Select</option>{CYLINDERS.map((c) => (<option key={c} value={c}>{c} cylinders</option>))}</select></div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <label className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">Specs Type</label>
            <div className="flex gap-2">
              {GCC_BOOLEAN.map((option) => (
                <button
                  key={option.label}
                  onClick={() => setForm({ ...form, gcc: option.value })}
                  className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors"
                  style={{
                    background: form.gcc === option.value ? "#1A9988" : "white",
                    color: form.gcc === option.value ? "white" : "#6b7280",
                    borderColor: form.gcc === option.value ? "#1A9988" : "#e5e7eb"
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div><label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Features & Options {features.length > 0 && (<span className="normal-case text-teal-600 font-normal">({features.length} selected)</span>)}</label><div className="border border-gray-200 rounded-xl p-3 max-h-56 overflow-y-auto bg-gray-50">{featureGroups.length > 0 ? (<FeaturesSelector selected={features} onChange={setFeatures} featureGroups={featureGroups} />) : (<p className="text-xs text-gray-400 text-center py-4">Loading features...</p>)}</div></div>

          <div><label className="text-xs font-semibold text-gray-500 uppercase">Seller's Notes</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="e.g. Excellent condition, single owner, company maintained..." className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" /></div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-bold" style={{ background: "#1A9988", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}


