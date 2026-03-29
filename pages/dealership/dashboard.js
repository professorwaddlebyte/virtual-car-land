import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const TIER_COLORS = {
  Platinum: 'bg-purple-100 text-purple-700 border-purple-200',
  Gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Silver: 'bg-gray-100 text-gray-600 border-gray-200',
  Unrated: 'bg-gray-50 text-gray-400 border-gray-100'
};
const FLAG_COLORS = {
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400' },
};
const PRIORITY_COLORS = { high: 'border-l-red-400 bg-red-50', medium: 'border-l-orange-400 bg-orange-50', low: 'border-l-blue-400 bg-blue-50' };

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold" style={{ color: color || '#111827' }}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
function ScoreBar({ value, max = 100, color }) {
  return (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
      <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color || '#0055A4' }} />
    </div>
  );
}
function EmptyState({ icon, text }) {
  return (
    <div className="text-center py-10">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

function AddCarModal({ onClose, onSave }) {
  const [form, setForm] = useState({ make: '', model: '', year: '', price_aed: '', mileage_km: '', color: '', transmission: 'automatic', fuel: 'petrol', body: '', cylinders: '', gcc: true, description: '' });
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const makes = ['Toyota','Nissan','Honda','Mitsubishi','Hyundai','Kia','Ford','Chevrolet','BMW','Mercedes-Benz','Lexus','Infiniti','Dodge','Jeep'];
  const colors = ['White','Black','Silver','Grey','Red','Blue','Green','Brown','Beige','Gold','Orange'];
  const bodies = ['SUV','Sedan','Pickup','Coupe','Hatchback','Van','Truck'];

  function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPhotos(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  }

  async function handleSave() {
    if (!form.make || !form.model || !form.year || !form.price_aed) { alert('Make, Model, Year and Price are required.'); return; }
    setSaving(true);
    const token = localStorage.getItem('token');

    let uploadedPhotos = [];
    for (const photo of photos) {
      try {
        const res = await fetch('/api/vehicles/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ image_base64: photo })
        });
        const data = await res.json();
        if (data.url) uploadedPhotos.push(data.url);
      } catch {}
    }

    const res = await fetch('/api/vehicles/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, photos: uploadedPhotos })
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { onSave(); onClose(); }
    else alert('Failed: ' + data.error);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">🚗 Add New Listing</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Make *</label>
              <select value={form.make} onChange={e => setForm({...form, make: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Make</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Model *</label>
              <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="e.g. Camry" className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Year *</label>
              <input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} placeholder="2020" className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Price (AED) *</label>
              <input type="number" value={form.price_aed} onChange={e => setForm({...form, price_aed: e.target.value})} placeholder="85000" className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Mileage (km)</label>
              <input type="number" value={form.mileage_km} onChange={e => setForm({...form, mileage_km: e.target.value})} placeholder="45000" className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Color</label>
              <select value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Color</option>
                {colors.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Transmission</label>
              <select value={form.transmission} onChange={e => setForm({...form, transmission: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Fuel</label>
              <select value={form.fuel} onChange={e => setForm({...form, fuel: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Body Type</label>
              <select value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Body</option>
                {bodies.map(b => <option key={b} value={b.toLowerCase()}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Cylinders</label>
              <select value={form.cylinders} onChange={e => setForm({...form, cylinders: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                {['4','6','8','12'].map(c => <option key={c} value={c}>{c} cylinders</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <label className="text-sm font-semibold text-gray-700">GCC Specs</label>
            <button onClick={() => setForm({...form, gcc: !form.gcc})}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: form.gcc ? '#0055A4' : '#d1d5db' }}>
              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: form.gcc ? 'translateX(24px)' : 'translateX(0)' }} />
            </button>
            <span className={`text-sm font-medium ${form.gcc ? 'text-blue-700' : 'text-gray-400'}`}>{form.gcc ? 'GCC' : 'Non-GCC'}</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Seller's Notes</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
              placeholder="e.g. Excellent condition, single owner, company maintained..."
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Photos</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="w-full mt-1 text-sm text-gray-500" />
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p} className="w-16 h-16 object-cover rounded-lg" />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-bold" style={{ background: '#0055A4', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding...' : 'Add Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ vehicle, onClose, onSave }) {
  const [form, setForm] = useState({
    price_aed: vehicle.price_aed || '',
    mileage_km: vehicle.mileage_km || '',
    description: vehicle.description || '',
    color: vehicle.specs?.color || '',
    transmission: vehicle.specs?.transmission || 'automatic',
    fuel: vehicle.specs?.fuel || 'petrol',
    body: vehicle.specs?.body || '',
    cylinders: vehicle.specs?.cylinders || '',
    gcc: vehicle.specs?.gcc ?? true,
  });
  const [saving, setSaving] = useState(false);
  const colors = ['White','Black','Silver','Grey','Red','Blue','Green','Brown','Beige','Gold','Orange'];
  const bodies = ['SUV','Sedan','Pickup','Coupe','Hatchback','Van','Truck'];

  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        price_aed: parseInt(form.price_aed),
        mileage_km: parseInt(form.mileage_km),
        description: form.description,
        specs: { ...vehicle.specs, color: form.color, transmission: form.transmission, fuel: form.fuel, body: form.body, cylinders: form.cylinders, gcc: form.gcc }
      })
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) onSave(data.vehicle);
    else alert('Failed: ' + data.error);
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
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Price (AED)</label>
              <input type="number" value={form.price_aed} onChange={e => setForm({...form, price_aed: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Mileage (km)</label>
              <input type="number" value={form.mileage_km} onChange={e => setForm({...form, mileage_km: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Color</label>
              <select value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Color</option>
                {colors.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Transmission</label>
              <select value={form.transmission} onChange={e => setForm({...form, transmission: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Fuel</label>
              <select value={form.fuel} onChange={e => setForm({...form, fuel: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Body Type</label>
              <select value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Body</option>
                {bodies.map(b => <option key={b} value={b.toLowerCase()}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Cylinders</label>
              <select value={form.cylinders} onChange={e => setForm({...form, cylinders: e.target.value})} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                {['4','6','8','12'].map(c => <option key={c} value={c}>{c} cylinders</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <label className="text-sm font-semibold text-gray-700">GCC</label>
              <button onClick={() => setForm({...form, gcc: !form.gcc})} className="relative w-12 h-6 rounded-full transition-colors" style={{ background: form.gcc ? '#0055A4' : '#d1d5db' }}>
                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: form.gcc ? 'translateX(24px)' : 'translateX(0)' }} />
              </button>
              <span className={`text-sm font-medium ${form.gcc ? 'text-blue-700' : 'text-gray-400'}`}>{form.gcc ? 'GCC' : 'Non-GCC'}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Seller's Notes</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
              placeholder="e.g. Excellent condition, single owner, company maintained..."
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-bold" style={{ background: '#0055A4', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DealerDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('actions');
  const [highlightedVehicles, setHighlightedVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [soldSearch, setSoldSearch] = useState('');
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [localVehicles, setLocalVehicles] = useState([]);
  const [demandMode, setDemandMode] = useState('both'); // 'views' | 'sold' | 'both'

  function loadData() {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/dealer/intelligence', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) { setData(d); setLocalVehicles(d.vehicles || []); setLoading(false); } })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleMarkSold(vehicleId) {
    if (!confirm('Mark this car as sold?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/vehicles/${vehicleId}/sold`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.ok) { setLocalVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status: 'sold' } : v)); alert('✅ Marked as sold!'); }
    else alert('Failed: ' + d.error);
  }

  async function handleDelete(vehicleId, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.ok) setLocalVehicles(prev => prev.filter(v => v.id !== vehicleId));
    else alert('Failed: ' + d.error);
  }

  function handleEditSave(updated) {
    setLocalVehicles(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v));
    setEditingVehicle(null);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-4">📊</div><p className="text-gray-500">Loading your intelligence dashboard...</p></div>
    </div>
  );
  if (!data) return null;

  const { dealer, stats, market_demand, price_ranges, body_type_demand, competitive, reputation, actions } = data;
  const activeVehicles = localVehicles.filter(v => v.status === 'active');
  const soldVehicles = localVehicles.filter(v => v.status === 'sold');

  const filteredActive = activeVehicles.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.make?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q) || v.year?.toString().includes(q) || v.price_aed?.toString().includes(q) || v.specs?.color?.toLowerCase().includes(q);
  });

  const filteredSold = soldVehicles.filter(v => {
    if (!soldSearch) return true;
    const q = soldSearch.toLowerCase();
    return v.make?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q) || v.year?.toString().includes(q);
  });

  const filteredDemand = market_demand.filter(d => {
    if (demandMode === 'views') return parseInt(d.views) > 0;
    if (demandMode === 'sold') return parseInt(d.sold) > 0;
    return true;
  });

  const tabs = [
    { id: 'actions', label: '🎯 Actions', badge: actions.length },
    { id: 'inventory', label: '🚗 Active' },
    { id: 'sold', label: '✅ Sold', badge: soldVehicles.length },
    { id: 'pricing', label: '💰 Pricing' },
    { id: 'demand', label: '📈 Demand' },
    { id: 'competitive', label: '🏆 Rank' },
    { id: 'reputation', label: '⭐ Rep' },
  ];

  return (
    <>
      <Head><title>{dealer.business_name} — Intelligence Dashboard</title></Head>
      {showAddModal && <AddCarModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); loadData(); }} />}
      {editingVehicle && <EditModal vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} onSave={handleEditSave} />}

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-bold text-gray-900 leading-none">{dealer.business_name}</p>
                  <p className="text-xs text-gray-500">Showroom {dealer.showroom_number} — {dealer.market_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${TIER_COLORS[dealer.score_tier] || TIER_COLORS.Unrated}`}>
                  {dealer.score_tier} — {dealer.listing_integrity_score}/100
                </span>
                <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="text-sm text-gray-400 hover:text-gray-600">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 flex-1 w-full">

          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon="🚗" label="Active Listings" value={stats.active_count} color="#0055A4" />
            <StatCard icon="✅" label="Sold" value={stats.sold_count} sub={stats.avg_days_to_sell > 0 ? `Avg ${Math.round(stats.avg_days_to_sell)}d` : null} color="#16a34a" />
            <StatCard icon="👁" label="Total Views" value={parseInt(stats.total_views).toLocaleString()} color="#374151" />
            <StatCard icon="💬" label="WhatsApp" value={stats.total_whatsapp} color="#25D366" />
            <StatCard icon="⭐" label="Saves" value={stats.total_saves} color="#d97706" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={activeTab === tab.id ? { background: '#0055A4', color: 'white' } : { color: '#6b7280' }}>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={activeTab === tab.id ? { background: 'white', color: '#0055A4' } : { background: '#ef4444', color: 'white' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-1">Recommended Actions</h2>
                <p className="text-sm text-gray-500 mb-4">Based on your current inventory and market data</p>
                {actions.length === 0 ? <EmptyState icon="🎉" text="No actions needed. Your inventory is performing well." /> : (
                  <div className="space-y-3">
                    {actions.map((a, i) => (
                      <div key={i} onClick={() => { const ids = a.vehicle_ids || []; setHighlightedVehicles(ids); setActiveTab('inventory'); setTimeout(() => { if (ids.length > 0) { const el = document.getElementById(`vehicle-${ids[0]}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 300); }}
                        className={`border-l-4 p-4 rounded-r-xl cursor-pointer hover:opacity-80 transition-opacity ${PRIORITY_COLORS[a.priority]}`}>
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{a.icon} {a.text}</p>
                          {a.vehicle_ids?.length > 0 && (
                            <span className="flex-shrink-0 ml-3 text-xs font-bold px-2 py-1 rounded-lg bg-white bg-opacity-70" style={{ color: '#0055A4' }}>
                              View {a.vehicle_ids.length} car{a.vehicle_ids.length > 1 ? 's' : ''} →
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 uppercase mt-1 inline-block">{a.priority} priority</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Sell Speed</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#0055A4' }}>{stats.avg_days_to_sell > 0 ? `${Math.round(stats.avg_days_to_sell)}d` : '—'}</div>
                  <p className="text-sm text-gray-500">Your avg days to sell</p>
                  {competitive.market_avg_days_to_sell > 0 && <p className="text-xs text-gray-400 mt-1">Market avg: {competitive.market_avg_days_to_sell}d</p>}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Conversion Rate</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#16a34a' }}>
                    {parseInt(stats.total_views) > 0 ? `${Math.round((parseInt(stats.total_whatsapp) / parseInt(stats.total_views)) * 100)}%` : '—'}
                  </div>
                  <p className="text-sm text-gray-500">Views to WhatsApp</p>
                  <p className="text-xs text-gray-400 mt-1">Market benchmark: ~8%</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Market Rank</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#d97706' }}>#{competitive.my_rank} <span className="text-lg text-gray-400">of {competitive.total_dealers}</span></div>
                  <p className="text-sm text-gray-500">By integrity score</p>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 items-center">
                <input type="text" placeholder="🔍  Search by make, model, year, color, price..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => setShowAddModal(true)}
                  className="flex-shrink-0 px-4 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2"
                  style={{ background: '#0055A4' }}>
                  + Add Car
                </button>
              </div>
              {searchQuery && <p className="text-xs text-gray-400 px-1">{filteredActive.length} of {activeVehicles.length} listings</p>}

              {filteredActive.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm">
                  <EmptyState icon={searchQuery ? '🔍' : '🚗'} text={searchQuery ? 'No cars match your search.' : 'No active listings. Use + Add Car or @NURDealsBot on Telegram.'} />
                </div>
              ) : filteredActive.map(v => {
                const flags = Array.isArray(v.ai_flag) ? v.ai_flag : [v.ai_flag];
                const daysLeft = Math.floor(parseFloat(v.days_until_expiry));
                const daysListed = Math.floor(parseFloat(v.days_listed));
                const isHighlighted = highlightedVehicles.includes(v.id);
                return (
                  <div key={v.id} id={`vehicle-${v.id}`}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all"
                    style={isHighlighted ? { outline: '4px solid #0055A4', outlineOffset: '3px', background: '#f0f7ff' } : {}}>
                    <div className="flex gap-4 p-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {v.photos?.length > 0 ? <img src={v.photos[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900">{v.year} {v.make} {v.model}</h3>
                          <div className="flex flex-wrap gap-1">
                            {flags.filter(Boolean).map((f, fi) => {
                              const fs = FLAG_COLORS[f.color] || FLAG_COLORS.blue;
                              return <span key={fi} className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${fs.bg} ${fs.text} ${fs.border}`}><span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${fs.dot}`}></span>{f.label}</span>;
                            })}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">AED {v.price_aed?.toLocaleString()} • {v.mileage_km?.toLocaleString()} km • {v.specs?.gcc ? 'GCC' : 'Non-GCC'}</p>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {[{ label: 'Views', value: v.views_count }, { label: 'WhatsApp', value: v.whatsapp_clicks }, { label: 'Saves', value: v.saves_count }, { label: 'Engage', value: v.engagement_score }].map((s, i) => (
                            <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                              <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                              <p className="text-xs text-gray-400">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {flags.filter(f => f && f.label !== 'Active').map((f, fi) => {
                      const fs = FLAG_COLORS[f.color] || FLAG_COLORS.blue;
                      return <div key={fi} className={`px-4 py-3 border-t ${fs.bg}`}><p className={`text-xs ${fs.text}`}>💡 {f.action}</p></div>;
                    })}
                    {v.description && <div className="px-4 py-2 border-t border-gray-50"><p className="text-xs text-gray-500 italic">"{v.description}"</p></div>}
                    <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex gap-4">
                        <span className="text-xs text-gray-400">{daysListed}d listed</span>
                        <span className={`text-xs font-medium ${daysLeft <= 3 ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-gray-400'}`}>{daysLeft}d until expiry</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Quality:</span>
                        <div className="w-16"><ScoreBar value={v.listing_quality_score} color={v.listing_quality_score >= 70 ? '#16a34a' : v.listing_quality_score >= 40 ? '#d97706' : '#ef4444'} /></div>
                        <span className="text-xs text-gray-500">{v.listing_quality_score}%</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                      <button onClick={() => setEditingVehicle(v)} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">✏️ Edit</button>
                      <button onClick={() => handleMarkSold(v.id)} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#16a34a' }}>✅ Mark Sold</button>
                      <button onClick={() => handleDelete(v.id, `${v.year} ${v.make} ${v.model}`)} className="py-2 px-3 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100">🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SOLD TAB */}
          {activeTab === 'sold' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <input type="text" placeholder="🔍  Search sold cars..."
                  value={soldSearch} onChange={e => setSoldSearch(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {filteredSold.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm">
                  <EmptyState icon="✅" text={soldSearch ? 'No sold cars match your search.' : 'No sold cars yet.'} />
                </div>
              ) : filteredSold.map(v => (
                <div key={v.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {v.photos?.length > 0 ? <img src={v.photos[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🚗</div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900">{v.year} {v.make} {v.model}</h3>
                          <p className="text-sm text-gray-500">AED {v.price_aed?.toLocaleString()} • {v.mileage_km?.toLocaleString()} km</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Sold</span>
                      </div>
                      <div className="flex gap-4 mt-2">
                        {v.days_to_sell && <span className="text-xs text-gray-400">Sold in {v.days_to_sell} days</span>}
                        {v.sold_at && <span className="text-xs text-gray-400">{new Date(v.sold_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-1">Market Price Intelligence</h2>
                <p className="text-sm text-gray-500 mb-4">How each listing compares to similar cars in the market</p>
                {activeVehicles.length === 0 ? <EmptyState icon="💰" text="No active listings to analyse." /> : activeVehicles.map(v => {
                  const intel = v.price_intel;
                  if (!intel || !intel.avg_price) return (
                    <div key={v.id} className="p-4 bg-gray-50 rounded-xl mb-3">
                      <p className="font-medium text-gray-900">{v.year} {v.make} {v.model}</p>
                      <p className="text-sm text-gray-400 mt-1">Not enough similar listings to compare.</p>
                    </div>
                  );
                  const pct = intel.pct_vs_market;
                  return (
                    <div key={v.id} className="border border-gray-100 rounded-xl p-4 mb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{v.year} {v.make} {v.model}</p>
                          <p className="text-xl font-bold mt-0.5" style={{ color: '#0055A4' }}>AED {v.price_aed?.toLocaleString()}</p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${pct > 0 ? 'bg-red-50 text-red-600' : pct < 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
                          {pct === 0 ? 'At market' : pct > 0 ? `+${pct}% above` : `${pct}% below`}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-sm font-bold text-gray-900">AED {intel.min_price?.toLocaleString()}</p><p className="text-xs text-gray-400">Lowest</p></div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg"><p className="text-sm font-bold text-blue-700">AED {intel.median_price?.toLocaleString()}</p><p className="text-xs text-blue-400">Median</p></div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-sm font-bold text-gray-900">AED {intel.max_price?.toLocaleString()}</p><p className="text-xs text-gray-400">Highest</p></div>
                      </div>
                      {intel.recommended_min && (
                        <div className={`p-3 rounded-lg ${intel.in_competitive_range ? 'bg-green-50' : 'bg-orange-50'}`}>
                          <p className={`text-xs font-medium ${intel.in_competitive_range ? 'text-green-700' : 'text-orange-700'}`}>
                            {intel.in_competitive_range ? '✅ Price is within competitive range' : `💡 Recommended: AED ${intel.recommended_min?.toLocaleString()} — ${intel.recommended_max?.toLocaleString()}`}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">{intel.similar_count} similar cars</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DEMAND */}
          {activeTab === 'demand' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-gray-900">Market Demand Heat</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Last 30 days — by make, model & year</p>
                  </div>
                  {/* Demand mode toggle */}
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {[['both', 'All'], ['views', '👁 Views'], ['sold', '✅ Sold']].map(([mode, label]) => (
                      <button key={mode} onClick={() => setDemandMode(mode)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={demandMode === mode ? { background: '#0055A4', color: 'white' } : { color: '#6b7280' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredDemand.length === 0 ? <EmptyState icon="📈" text="Not enough data for this filter yet." /> : (
                  <div className="space-y-3">
                    {filteredDemand.map((d, i) => {
                      const hasStock = activeVehicles.some(v => v.make?.toLowerCase() === d.make?.toLowerCase() && v.model?.toLowerCase() === d.model?.toLowerCase());
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: '#0055A4' }}>{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{d.make} {d.model} {d.year ? `(${d.year})` : ''}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${hasStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{hasStock ? '✓ In stock' : '✗ Not stocked'}</span>
                              </div>
                            </div>
                            <ScoreBar value={d.score} max={filteredDemand[0]?.score || 1} color={hasStock ? '#16a34a' : '#0055A4'} />
                            <div className="flex gap-4 mt-1">
                              {d.views > 0 && <span className="text-xs text-gray-400">👁 {d.views} views</span>}
                              {d.sold > 0 && <span className="text-xs text-gray-400">✅ {d.sold} sold</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Body Type Demand</h3>
                  {body_type_demand.length === 0 ? <EmptyState icon="🚗" text="Not enough data yet." /> : body_type_demand.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                      <span className="text-sm capitalize text-gray-700 w-20">{d.body_type || 'Other'}</span>
                      <div className="flex-1"><ScoreBar value={d.view_count} max={body_type_demand[0].view_count} color='#0055A4' /></div>
                      <span className="text-xs text-gray-400 w-12 text-right">{d.view_count}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Price Range Demand</h3>
                  {price_ranges.length === 0 ? <EmptyState icon="💰" text="Not enough data yet." /> : price_ranges.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                      <span className="text-sm text-gray-700 w-24 flex-shrink-0">{d.range}</span>
                      <div className="flex-1"><ScoreBar value={d.view_count} max={price_ranges[0].view_count} color='#d97706' /></div>
                      <span className="text-xs text-gray-400 w-12 text-right">{d.view_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COMPETITIVE */}
          {activeTab === 'competitive' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-sm text-gray-500 mb-1">Your Market Rank</p>
                  <div className="text-4xl font-bold" style={{ color: '#0055A4' }}>#{competitive.my_rank}</div>
                  <p className="text-sm text-gray-400">out of {competitive.total_dealers} dealers</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-sm text-gray-500 mb-1">Your Avg Days to Sell</p>
                  <div className="text-4xl font-bold" style={{ color: competitive.my_avg_days_to_sell <= competitive.market_avg_days_to_sell ? '#16a34a' : '#ef4444' }}>
                    {competitive.my_avg_days_to_sell > 0 ? `${competitive.my_avg_days_to_sell}d` : '—'}
                  </div>
                  <p className="text-sm text-gray-400">Market avg: {competitive.market_avg_days_to_sell > 0 ? `${competitive.market_avg_days_to_sell}d` : '—'}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-sm text-gray-500 mb-1">Your Views vs Top 10</p>
                  <div className="text-4xl font-bold" style={{ color: '#d97706' }}>{competitive.my_total_views}</div>
                  <p className="text-sm text-gray-400">Top 10 avg: {Math.round(competitive.top10_avg_views)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Dealer Leaderboard</h2>
                <div className="space-y-2">
                  {competitive.all_dealers.map((d, i) => {
                    const isMe = d.id === dealer.id;
                    return (
                      <div key={d.id} className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'border-2 border-blue-400 bg-blue-50' : 'bg-gray-50'}`}>
                        <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{d.business_name} {isMe && <span className="text-blue-500 text-xs">(You)</span>}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-xs text-gray-400">{d.active_count} active</span>
                            <span className="text-xs text-gray-400">{d.total_sold} sold</span>
                            <span className="text-xs text-gray-400">{d.total_views} views</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: '#0055A4' }}>{d.listing_integrity_score}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${TIER_COLORS[d.score_tier]?.split(' ')[0]} ${TIER_COLORS[d.score_tier]?.split(' ')[1]}`}>{d.score_tier}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* REPUTATION */}
          {activeTab === 'reputation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center"><div className="text-3xl font-bold mb-1" style={{ color: '#0055A4' }}>{reputation.avg_quality_score}%</div><p className="text-xs text-gray-500">Avg Listing Quality</p></div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center"><div className="text-3xl font-bold mb-1" style={{ color: '#16a34a' }}>{reputation.photo_rate}%</div><p className="text-xs text-gray-500">Listings With Photos</p></div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center"><div className="text-3xl font-bold mb-1" style={{ color: '#d97706' }}>{reputation.quality_rate}%</div><p className="text-xs text-gray-500">Full Spec Listings</p></div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center"><div className="text-3xl font-bold mb-1" style={{ color: '#7c3aed' }}>{reputation.listing_integrity_score}</div><p className="text-xs text-gray-500">Integrity Score</p></div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Listing Quality Breakdown</h2>
                {activeVehicles.length === 0 ? <EmptyState icon="⭐" text="No active listings to evaluate." /> : activeVehicles.map(v => (
                  <div key={v.id} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{v.year} {v.make} {v.model}</p>
                      <span className="text-sm font-bold" style={{ color: v.listing_quality_score >= 70 ? '#16a34a' : v.listing_quality_score >= 40 ? '#d97706' : '#ef4444' }}>{v.listing_quality_score}%</span>
                    </div>
                    <ScoreBar value={v.listing_quality_score} color={v.listing_quality_score >= 70 ? '#16a34a' : v.listing_quality_score >= 40 ? '#d97706' : '#ef4444'} />
                    <div className="flex gap-3 mt-1">
                      <span className={`text-xs ${v.photos?.length > 0 ? 'text-green-600' : 'text-red-400'}`}>{v.photos?.length > 0 ? `✓ ${v.photos.length} photos` : '✗ No photos'}</span>
                      <span className={`text-xs ${v.specs?.color ? 'text-green-600' : 'text-gray-400'}`}>{v.specs?.color ? '✓ Color' : '✗ Color'}</span>
                      <span className={`text-xs ${v.specs?.transmission ? 'text-green-600' : 'text-gray-400'}`}>{v.specs?.transmission ? '✓ Transmission' : '✗ Transmission'}</span>
                      <span className={`text-xs ${v.specs?.body ? 'text-green-600' : 'text-gray-400'}`}>{v.specs?.body ? '✓ Body type' : '✗ Body type'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-2">Integrity Score</h2>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Current score</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${TIER_COLORS[dealer.score_tier]}`}>{dealer.score_tier}</span>
                </div>
                <ScoreBar value={dealer.listing_integrity_score} color={dealer.listing_integrity_score >= 85 ? '#7c3aed' : dealer.listing_integrity_score >= 70 ? '#FFD700' : dealer.listing_integrity_score >= 50 ? '#9ca3af' : '#ef4444'} />
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>0</span><span className="font-bold text-gray-700">{dealer.listing_integrity_score}/100</span><span>100</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <footer style={{ background: '#0055A4' }} className="py-8 text-center mt-8">
          <p className="text-white font-bold text-base mb-1">Virtual Car Land</p>
          <p className="text-blue-200 text-sm">© 2026 Virtual Car Land. UAE's smart car marketplace.</p>
          <p className="text-blue-300 text-xs mt-2">Dubai Auto Market — Ras Al Khor, Dubai</p>
        </footer>
      </div>
    </>
  );
}



