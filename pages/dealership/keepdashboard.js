// pages/dealership/dashboard.js
// MERGED: DB-driven makes/colors/features (from new version)
//       + ManagePhotosModal, Delete, Search, Click-to-navigate actions,
//         per-car stats/flags/quality/expiry, 5-KPI header, demandMode toggle
//         (all restored from old version)

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Footer from '../../components/Footer';

const TIER_COLORS = {
  Platinum: 'bg-purple-100 text-purple-700 border-purple-200',
  Gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Silver: 'bg-gray-100 text-gray-600 border-gray-200',
  Unrated: 'bg-gray-50 text-gray-400 border-gray-100'
};
const FLAG_COLORS = {
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500'  },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400'   },
};
const PRIORITY_COLORS = {
  high:   'border-l-red-400 bg-red-50',
  medium: 'border-l-orange-400 bg-orange-50',
  low:    'border-l-blue-400 bg-blue-50'
};

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
      <div className="absolute left-0 top-0 h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color || '#1A9988' }} />
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

// ── FeaturesSelector — DB-driven via featureGroups prop ──────────────────────
function FeaturesSelector({ selected, onChange, featureGroups }) {
  function toggle(feature) {
    if (selected.includes(feature)) onChange(selected.filter(f => f !== feature));
    else onChange([...selected, feature]);
  }
  return (
    <div className="space-y-3">
      {featureGroups.map(group => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.features.map(f => {
              const active = selected.includes(f);
              return (
                <button key={f} type="button" onClick={() => toggle(f)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition-all"
                  style={{
                    background:   active ? '#f0faf9' : 'white',
                    color:        active ? '#1A9988' : '#6b7280',
                    borderColor:  active ? '#1A9988' : '#e5e7eb',
                  }}>
                  {active && <span className="mr-1">✓</span>}{f}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AddCarModal — makes/colors/features DB-driven ────────────────────────────
function AddCarModal({ onClose, onSave, makes, colors, featureGroups }) {
  const [form, setForm] = useState({
    make: '', model: '', year: '', price_aed: '', mileage_km: '',
    color: '', transmission: 'automatic', fuel: 'petrol', body: '',
    cylinders: '', gcc: true, description: ''
  });
  const [features, setFeatures] = useState([]);
  const [photos, setPhotos]     = useState([]);
  const [saving, setSaving]     = useState(false);

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
    if (!form.make || !form.model || !form.year || !form.price_aed) {
      alert('Make, Model, Year and Price are required.');
      return;
    }
    setSaving(true);
    const token = localStorage.getItem('token');

    let uploadedPhotos = [];
    try {
      for (const photo of photos) {
        const res = await fetch('/api/vehicles/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ image_base64: photo })
        });
        const data = await res.json();
        if (data.url) uploadedPhotos.push(data.url);
        else console.error('Cloudinary upload failed for one image:', data.error);
      }
    } catch (err) {
      console.error('Photo upload loop crashed:', err);
    }

    try {
      const res = await fetch('/api/vehicles/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          specs: {
            color: form.color, transmission: form.transmission, fuel: form.fuel,
            body: form.body, cylinders: form.cylinders, gcc: form.gcc, features
          },
          photos: uploadedPhotos
        })
      });
      const data = await res.json();
      setSaving(false);
      if (data.ok) {
        if (photos.length > 0 && uploadedPhotos.length === 0) {
          alert('Car added, but photos failed to upload. It is currently "Active" without photos.');
        }
        onSave();
        onClose();
      } else {
        alert('Failed to save vehicle: ' + data.error);
      }
    } catch (err) {
      setSaving(false);
      alert('Network error while adding vehicle.');
    }
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
              <select value={form.make} onChange={e => setForm({...form, make: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select Make</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Model *</label>
              <input value={form.model} onChange={e => setForm({...form, model: e.target.value})}
                placeholder="e.g. Camry"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Year *</label>
              <input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})}
                placeholder="2020"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Price (AED) *</label>
              <input type="number" value={form.price_aed} onChange={e => setForm({...form, price_aed: e.target.value})}
                placeholder="85000"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Mileage (km)</label>
              <input type="number" value={form.mileage_km} onChange={e => setForm({...form, mileage_km: e.target.value})}
                placeholder="45000"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Color</label>
              <select value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select Color</option>
                {colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Transmission</label>
              <select value={form.transmission} onChange={e => setForm({...form, transmission: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Fuel</label>
              <select value={form.fuel} onChange={e => setForm({...form, fuel: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Body Type</label>
              <select value={form.body} onChange={e => setForm({...form, body: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select Body</option>
                {bodies.map(b => <option key={b} value={b.toLowerCase()}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Cylinders</label>
              <select value={form.cylinders} onChange={e => setForm({...form, cylinders: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                {['4','6','8','12'].map(c => <option key={c} value={c}>{c} cylinders</option>)}
              </select>
            </div>

          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <label className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">Specs Type</label>
            <div className="flex gap-2">
              <button onClick={() => setForm({...form, gcc: true})}
                className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors"
                style={{ background: form.gcc ? '#1A9988' : 'white', color: form.gcc ? 'white' : '#6b7280', borderColor: form.gcc ? '#1A9988' : '#e5e7eb' }}>
                GCC
              </button>
              <button onClick={() => setForm({...form, gcc: false})}
                className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors"
                style={{ background: !form.gcc ? '#1A9988' : 'white', color: !form.gcc ? 'white' : '#6b7280', borderColor: !form.gcc ? '#1A9988' : '#e5e7eb' }}>
                Non-GCC
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Features & Options {features.length > 0 && <span className="normal-case text-teal-600 font-normal">({features.length} selected)</span>}
            </label>
            <div className="border border-gray-200 rounded-xl p-3 max-h-56 overflow-y-auto bg-gray-50">
              {featureGroups.length > 0
                ? <FeaturesSelector selected={features} onChange={setFeatures} featureGroups={featureGroups} />
                : <p className="text-xs text-gray-400 text-center py-4">Loading features...</p>
              }
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Seller's Notes</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
              placeholder="e.g. Excellent condition, single owner, company maintained..."
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Photos</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="w-full mt-1 text-sm text-gray-500" />
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative">
                    <img src={p} className="w-16 h-16 object-cover rounded-lg" />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold"
            style={{ background: '#1A9988', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding...' : 'Add Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditModal — colors/features DB-driven ────────────────────────────────────
function EditModal({ vehicle, onClose, onSave, colors, featureGroups }) {
  const [form, setForm] = useState({
    price_aed:    vehicle.price_aed || '',
    mileage_km:   vehicle.mileage_km || '',
    description:  vehicle.description || '',
    color:        vehicle.specs?.color || '',
    transmission: vehicle.specs?.transmission || 'automatic',
    fuel:         vehicle.specs?.fuel || 'petrol',
    body:         vehicle.specs?.body || '',
    cylinders:    vehicle.specs?.cylinders || '',
    gcc:          vehicle.specs?.gcc ?? true,
  });
  const [features, setFeatures] = useState(vehicle.specs?.features || []);
  const [saving, setSaving]     = useState(false);

  const bodies = ['SUV','Sedan','Pickup','Coupe','Hatchback','Van','Truck'];

  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        price_aed:  parseInt(form.price_aed),
        mileage_km: parseInt(form.mileage_km),
        description: form.description,
        specs: {
          ...vehicle.specs,
          color: form.color, transmission: form.transmission, fuel: form.fuel,
          body: form.body, cylinders: form.cylinders, gcc: form.gcc, features
        }
      })
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { onSave(data.vehicle); onClose(); }
    else alert('Failed to update: ' + data.error);
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
              <input type="number" value={form.price_aed} onChange={e => setForm({...form, price_aed: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Mileage (km)</label>
              <input type="number" value={form.mileage_km} onChange={e => setForm({...form, mileage_km: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Color</label>
              <select value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select Color</option>
                {colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Transmission</label>
              <select value={form.transmission} onChange={e => setForm({...form, transmission: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Fuel</label>
              <select value={form.fuel} onChange={e => setForm({...form, fuel: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Body Type</label>
              <select value={form.body} onChange={e => setForm({...form, body: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select Body</option>
                {bodies.map(b => <option key={b} value={b.toLowerCase()}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Cylinders</label>
              <select value={form.cylinders} onChange={e => setForm({...form, cylinders: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                {['4','6','8','12'].map(c => <option key={c} value={c}>{c} cylinders</option>)}
              </select>
            </div>

          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <label className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">Specs Type</label>
            <div className="flex gap-2">
              <button onClick={() => setForm({...form, gcc: true})}
                className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors"
                style={{ background: form.gcc ? '#1A9988' : 'white', color: form.gcc ? 'white' : '#6b7280', borderColor: form.gcc ? '#1A9988' : '#e5e7eb' }}>
                GCC
              </button>
              <button onClick={() => setForm({...form, gcc: false})}
                className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors"
                style={{ background: !form.gcc ? '#1A9988' : 'white', color: !form.gcc ? 'white' : '#6b7280', borderColor: !form.gcc ? '#1A9988' : '#e5e7eb' }}>
                Non-GCC
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Features & Options {features.length > 0 && <span className="normal-case text-teal-600 font-normal">({features.length} selected)</span>}
            </label>
            <div className="border border-gray-200 rounded-xl p-3 max-h-56 overflow-y-auto bg-gray-50">
              {featureGroups.length > 0
                ? <FeaturesSelector selected={features} onChange={setFeatures} featureGroups={featureGroups} />
                : <p className="text-xs text-gray-400 text-center py-4">Loading features...</p>
              }
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Seller's Notes</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
              placeholder="e.g. Excellent condition, single owner, company maintained..."
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold"
            style={{ background: '#1A9988', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ManagePhotosModal — fully restored from old version ──────────────────────
function ManagePhotosModal({ vehicle, onClose, onSave }) {
  const [photos, setPhotos]     = useState(vehicle.photos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]     = useState(false);

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    setUploading(true);
    const token = localStorage.getItem('token');
    for (const file of files) {
      const reader = new FileReader();
      await new Promise(resolve => {
        reader.onload = async ev => {
          try {
            const res = await fetch(`/api/vehicles/${vehicle.id}/photos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ image_base64: ev.target.result })
            });
            const data = await res.json();
            if (data.photos) setPhotos(data.photos);
          } catch {}
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setUploading(false);
  }

  function promoteToMain(index) {
    setPhotos([photos[index], ...photos.filter((_, i) => i !== index)]);
  }

  function removePhoto(index) {
    if (!confirm('Remove this photo?')) return;
    setPhotos(photos.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/vehicles/${vehicle.id}/photos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ photos })
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { onSave(photos); onClose(); }
    else alert('Failed: ' + data.error);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">📷 Manage Photos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{vehicle.year} {vehicle.make} {vehicle.model}</p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Add More Photos</label>
            <input type="file" accept="image/*" multiple onChange={handleUpload}
              disabled={uploading}
              className="w-full mt-1 text-sm text-gray-500" />
            {uploading && <p className="text-xs text-teal-600 mt-1">⬆️ Uploading to Cloudinary...</p>}
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <div className="text-3xl mb-2">📷</div>
              <p className="text-sm text-gray-400">No photos yet. Upload some above.</p>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                Current Photos — first photo is the main display image
              </label>
              <div className="space-y-2">
                {photos.map((photo, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl border-2"
                    style={{ borderColor: i === 0 ? '#1A9988' : '#f3f4f6', background: i === 0 ? '#f0faf9' : 'white' }}>
                    <img src={photo} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {i === 0 && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white mb-1" style={{ background: '#1A9988' }}>
                          ★ Main Photo
                        </span>
                      )}
                      <p className="text-xs text-gray-400 truncate">{photo.split('/').pop()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {i !== 0 && (
                        <button onClick={() => promoteToMain(i)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors"
                          style={{ borderColor: '#1A9988', color: '#1A9988' }}>
                          ★ Set Main
                        </button>
                      )}
                      <button onClick={() => removePhoto(i)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl text-white font-bold"
            style={{ background: '#1A9988', opacity: (saving || uploading) ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DealerDashboard() {
  const router = useRouter();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [localVehicles, setLocalVehicles] = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]               = useState('actions');
  const [showAddModal, setShowAddModal]         = useState(false);
  const [editingVehicle, setEditingVehicle]     = useState(null);
  const [managingPhotos, setManagingPhotos]     = useState(null);
  const [highlightedVehicles, setHighlightedVehicles] = useState([]);
  const [searchQuery, setSearchQuery]           = useState('');
  const [soldSearch, setSoldSearch]             = useState('');
  const [demandMode, setDemandMode]             = useState('both'); // 'views' | 'sold' | 'both'

  // ── Intelligence (lazy-loaded on Pricing / Demand / Rank / Reputation) ──────
  const [intelligence, setIntelligence] = useState(null);
  const [intLoading, setIntLoading]     = useState(false);

  // ── DB-driven lookup data ───────────────────────────────────────────────────
  const [makes, setMakes]                 = useState([]);
  const [colors, setColors]               = useState([]);
  const [featureGroups, setFeatureGroups] = useState([]);

  useEffect(() => {
    fetch('/api/lookup')
      .then(r => r.json())
      .then(d => {
        if (d.makes)         setMakes(d.makes.map(m => m.name));
        if (d.colors)        setColors(d.colors.map(c => c.name));
        if (d.featureGroups) setFeatureGroups(d.featureGroups);
      })
      .catch(() => {});
  }, []);

  // ── Auth + initial load ─────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData(token);
  }, []);

  function loadData(token) {
    const t = token || localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    fetch('/api/dealer/intelligence', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => {
        if (d) {
          setData(d);
          setLocalVehicles(d.vehicles || []);
          // seed intelligence from the same response so Pricing/Demand/Rank work immediately
          setIntelligence(d);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }

  async function loadIntelligence() {
    if (intelligence) return; // already loaded
    setIntLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch('/api/dealer/intelligence', { headers: { Authorization: `Bearer ${token}` } });
      const d    = await res.json();
      setIntelligence(d);
    } catch (e) {
      console.error('Intelligence load failed:', e);
    }
    setIntLoading(false);
  }

  // ── Vehicle actions ─────────────────────────────────────────────────────────
  async function handleMarkSold(vehicleId) {
    if (!confirm('Mark this car as sold?')) return;
    const token = localStorage.getItem('token');
    const res   = await fetch(`/api/vehicles/${vehicleId}/sold`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d     = await res.json();
    if (d.ok) {
      setLocalVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status: 'sold', sold_at: new Date().toISOString() } : v));
      alert('✅ Marked as sold!');
    } else {
      alert('Failed: ' + d.error);
    }
  }

  async function handleDelete(vehicleId, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('token');
    const res   = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const d     = await res.json();
    if (d.ok) setLocalVehicles(prev => prev.filter(v => v.id !== vehicleId));
    else alert('Failed: ' + d.error);
  }

  function handleEditSave(updated) {
    if (updated) setLocalVehicles(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v));
    else loadData(); // fallback: reload everything
    setEditingVehicle(null);
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-500">Loading your intelligence dashboard...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { dealer, stats, market_demand = [], price_ranges = [], body_type_demand = [], competitive = {}, reputation = {}, actions = [] } = data;

  const soldVehicles   = localVehicles.filter(v => v.sold_at != null);
  const activeVehicles = localVehicles.filter(v => v.sold_at == null && v.status === 'active');
  const draftVehicles  = localVehicles.filter(v => v.sold_at == null && v.status === 'draft');

  const filteredActive = activeVehicles.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.make?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q) ||
           v.year?.toString().includes(q) || v.price_aed?.toString().includes(q) ||
           v.specs?.color?.toLowerCase().includes(q);
  });

  const filteredSold = soldVehicles.filter(v => {
    if (!soldSearch) return true;
    const q = soldSearch.toLowerCase();
    return v.make?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q) || v.year?.toString().includes(q);
  });

  const filteredDemand = market_demand.filter(d => {
    if (demandMode === 'views') return parseInt(d.views) > 0;
    if (demandMode === 'sold')  return parseInt(d.sold)  > 0;
    return true;
  });

  const TABS = [
    { id: 'actions',    label: '🎯 Actions',   badge: actions.length },
    { id: 'inventory',  label: '🚗 Active',    badge: 0 },
    { id: 'sold',       label: '✅ Sold',       badge: soldVehicles.length },
    { id: 'pricing',    label: '💰 Pricing' },
    { id: 'demand',     label: '📈 Demand' },
    { id: 'competitive',label: '🏆 Rank' },
    { id: 'reputation', label: '⭐ Rep' },
  ];

  return (
    <>
      <Head><title>{dealer.business_name} — Intelligence Dashboard</title></Head>

      {/* Modals */}
      {showAddModal && (
        <AddCarModal
          onClose={() => setShowAddModal(false)}
          onSave={() => { setShowAddModal(false); loadData(); }}
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
            setLocalVehicles(prev => prev.map(v => v.id === managingPhotos.id ? { ...v, photos } : v));
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
                  <p className="font-bold text-gray-900 leading-none">{dealer.business_name}</p>
                  <p className="text-xs text-gray-500">Showroom {dealer.showroom_number} — {dealer.market_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${TIER_COLORS[dealer.score_tier] || TIER_COLORS.Unrated}`}>
                  {dealer.score_tier} — {dealer.listing_integrity_score}/100
                </span>
                <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
                  className="text-sm text-gray-400 hover:text-gray-600">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 flex-1 w-full">

          {/* KPI — 5 cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon="🚗" label="Active Listings" value={stats?.active_count ?? activeVehicles.length}  color="#1A9988" />
            <StatCard icon="✅" label="Sold"             value={stats?.sold_count ?? soldVehicles.length}
              sub={stats?.avg_days_to_sell > 0 ? `Avg ${Math.round(stats.avg_days_to_sell)}d` : null}        color="#16a34a" />
            <StatCard icon="👁" label="Total Views"      value={parseInt(stats?.total_views || 0).toLocaleString()} color="#374151" />
            <StatCard icon="💬" label="WhatsApp"         value={stats?.total_whatsapp ?? 0}                    color="#25D366" />
            <StatCard icon="⭐" label="Saves"            value={stats?.total_saves ?? 0}                       color="#d97706" />
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (['pricing','demand','competitive','reputation'].includes(tab.id)) loadIntelligence();
                }}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                style={activeTab === tab.id ? { background: '#1A9988', color: 'white' } : { color: '#6b7280' }}>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={activeTab === tab.id ? { background: 'white', color: '#1A9988' } : { background: '#ef4444', color: 'white' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── ACTIONS TAB ── */}
          {activeTab === 'actions' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-1">Recommended Actions</h2>
                <p className="text-sm text-gray-500 mb-4">Based on your current inventory and market data</p>
                {actions.length === 0
                  ? <EmptyState icon="🎉" text="No actions needed. Your inventory is performing well." />
                  : (
                    <div className="space-y-3">
                      {actions.map((a, i) => (
                        <div key={i}
                          onClick={() => {
                            const ids = a.vehicle_ids || [];
                            setHighlightedVehicles(ids);
                            setActiveTab('inventory');
                            setTimeout(() => {
                              if (ids.length > 0) {
                                const el = document.getElementById(`vehicle-${ids[0]}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 300);
                          }}
                          className={`border-l-4 p-4 rounded-r-xl cursor-pointer hover:opacity-80 transition-opacity ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.low}`}>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{a.icon} {a.text}</p>
                            {a.vehicle_ids?.length > 0 && (
                              <span className="flex-shrink-0 ml-3 text-xs font-bold px-2 py-1 rounded-lg bg-white bg-opacity-70"
                                style={{ color: '#1A9988' }}>
                                View {a.vehicle_ids.length} car{a.vehicle_ids.length > 1 ? 's' : ''} →
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 uppercase mt-1 inline-block">{a.priority} priority</span>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>

              {/* Quick stats summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Sell Speed</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#1A9988' }}>
                    {stats?.avg_days_to_sell > 0 ? `${Math.round(stats.avg_days_to_sell)}d` : '—'}
                  </div>
                  <p className="text-sm text-gray-500">Your avg days to sell</p>
                  {competitive?.market_avg_days_to_sell > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Market avg: {competitive.market_avg_days_to_sell}d</p>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Conversion Rate</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#16a34a' }}>
                    {parseInt(stats?.total_views || 0) > 0
                      ? `${Math.round((parseInt(stats.total_whatsapp) / parseInt(stats.total_views)) * 100)}%`
                      : '—'}
                  </div>
                  <p className="text-sm text-gray-500">Views to WhatsApp</p>
                  <p className="text-xs text-gray-400 mt-1">Market benchmark: ~8%</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Market Rank</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#d97706' }}>
                    #{competitive?.my_rank} <span className="text-lg text-gray-400">of {competitive?.total_dealers}</span>
                  </div>
                  <p className="text-sm text-gray-500">By integrity score</p>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVE INVENTORY TAB ── */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              {/* Search + Add */}
              <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 items-center">
                <input type="text" placeholder="🔍  Search by make, model, year, color, price..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button onClick={() => setShowAddModal(true)}
                  className="flex-shrink-0 px-4 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2"
                  style={{ background: '#1A9988' }}>
                  + Add Car
                </button>
              </div>
              {searchQuery && (
                <p className="text-xs text-gray-400 px-1">{filteredActive.length} of {activeVehicles.length} listings</p>
              )}

              {/* Draft / pending section */}
              {draftVehicles.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3">⏳ Pending Approval ({draftVehicles.length})</p>
                  <div className="space-y-2">
                    {draftVehicles.map(v => (
                      <div key={v.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-amber-100">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{v.year} {v.make} {v.model}</p>
                          <p className="text-xs text-gray-400">AED {v.price_aed?.toLocaleString()}</p>
                        </div>
                        <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">Awaiting</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredActive.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm">
                  <EmptyState
                    icon={searchQuery ? '🔍' : '🚗'}
                    text={searchQuery ? 'No cars match your search.' : 'No active listings. Use + Add Car or @NURDealsBot on Telegram.'} />
                </div>
              ) : filteredActive.map(v => {
                const flags       = Array.isArray(v.ai_flag) ? v.ai_flag : (v.ai_flag ? [v.ai_flag] : []);
                const daysLeft    = Math.floor(parseFloat(v.days_until_expiry || 0));
                const daysListed  = Math.floor(parseFloat(v.days_listed || 0));
                const isHighlighted = highlightedVehicles.includes(v.id);

                return (
                  <div key={v.id} id={`vehicle-${v.id}`}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all"
                    style={isHighlighted ? { outline: '4px solid #1A9988', outlineOffset: '3px', background: '#f0faf9' } : {}}>

                    <div className="flex gap-4 p-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {v.photos?.length > 0
                          ? <img src={v.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900">{v.year} {v.make} {v.model}</h3>
                          <div className="flex flex-wrap gap-1">
                            {flags.filter(Boolean).map((f, fi) => {
                              const fs = FLAG_COLORS[f.color] || FLAG_COLORS.blue;
                              return (
                                <span key={fi} className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${fs.bg} ${fs.text} ${fs.border}`}>
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${fs.dot}`} />
                                  {f.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          AED {v.price_aed?.toLocaleString()} • {v.mileage_km?.toLocaleString()} km • {v.specs?.gcc ? 'GCC' : 'Non-GCC'}
                        </p>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {[
                            { label: 'Views',    value: v.views_count },
                            { label: 'WhatsApp', value: v.whatsapp_clicks },
                            { label: 'Saves',    value: v.saves_count },
                            { label: 'Engage',   value: v.engagement_score },
                          ].map((s, i) => (
                            <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
                              <p className="font-bold text-gray-900 text-sm">{s.value ?? 0}</p>
                              <p className="text-xs text-gray-400">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI flag action hints */}
                    {flags.filter(f => f && f.label !== 'Active').map((f, fi) => {
                      const fs = FLAG_COLORS[f.color] || FLAG_COLORS.blue;
                      return (
                        <div key={fi} className={`px-4 py-3 border-t ${fs.bg}`}>
                          <p className={`text-xs ${fs.text}`}>💡 {f.action}</p>
                        </div>
                      );
                    })}

                    {/* Seller's notes */}
                    {v.description && (
                      <div className="px-4 py-3 border-t border-gray-50 bg-gray-50">
                        <p className="text-sm text-gray-700 font-medium italic">"{v.description}"</p>
                      </div>
                    )}

                    {/* Days listed / expiry / quality */}
                    <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex gap-4">
                        <span className="text-xs text-gray-400">{daysListed}d listed</span>
                        <span className={`text-xs font-medium ${daysLeft <= 3 ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-gray-400'}`}>
                          {daysLeft}d until expiry
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Quality:</span>
                        <div className="w-16">
                          <ScoreBar
                            value={v.listing_quality_score || 0}
                            color={v.listing_quality_score >= 70 ? '#16a34a' : v.listing_quality_score >= 40 ? '#d97706' : '#ef4444'} />
                        </div>
                        <span className="text-xs text-gray-500">{v.listing_quality_score || 0}%</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                      <button onClick={() => setEditingVehicle(v)}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
                        ✏️ Edit
                      </button>
                      <button onClick={() => setManagingPhotos(v)}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ background: '#1A9988' }}>
                        📷 Photos
                      </button>
                      <button onClick={() => handleMarkSold(v.id)}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ background: '#16a34a' }}>
                        ✅ Sold
                      </button>
                      <button onClick={() => handleDelete(v.id, `${v.year} ${v.make} ${v.model}`)}
                        className="py-2 px-3 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100">
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SOLD TAB ── */}
          {activeTab === 'sold' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <input type="text" placeholder="🔍  Search sold cars..."
                  value={soldSearch} onChange={e => setSoldSearch(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              {filteredSold.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm">
                  <EmptyState icon="✅" text={soldSearch ? 'No sold cars match your search.' : 'No sold cars yet.'} />
                </div>
              ) : filteredSold.map(v => (
                <div key={v.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {v.photos?.length > 0
                        ? <img src={v.photos[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">🚗</div>}
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
                        {v.sold_at      && <span className="text-xs text-gray-400">{new Date(v.sold_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PRICING TAB ── */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              {intLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h2 className="font-bold text-gray-900 mb-1">Market Price Intelligence</h2>
                  <p className="text-sm text-gray-500 mb-4">How each listing compares to similar cars in the market</p>
                  {activeVehicles.length === 0
                    ? <EmptyState icon="💰" text="No active listings to analyse." />
                    : activeVehicles.map(v => {
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
                                <p className="text-xl font-bold mt-0.5" style={{ color: '#1A9988' }}>AED {v.price_aed?.toLocaleString()}</p>
                              </div>
                              <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${pct > 0 ? 'bg-red-50 text-red-600' : pct < 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
                                {pct === 0 ? 'At market' : pct > 0 ? `+${pct}% above` : `${pct}% below`}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-sm font-bold text-gray-900">AED {intel.min_price?.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">Lowest</p>
                              </div>
                              <div className="text-center p-2 rounded-lg" style={{ background: '#f0faf9' }}>
                                <p className="text-sm font-bold" style={{ color: '#1A9988' }}>AED {intel.median_price?.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">Median</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded-lg">
                                <p className="text-sm font-bold text-gray-900">AED {intel.max_price?.toLocaleString()}</p>
                                <p className="text-xs text-gray-400">Highest</p>
                              </div>
                            </div>
                            {intel.recommended_min && (
                              <div className={`p-3 rounded-lg ${intel.in_competitive_range ? 'bg-green-50' : 'bg-orange-50'}`}>
                                <p className={`text-xs font-medium ${intel.in_competitive_range ? 'text-green-700' : 'text-orange-700'}`}>
                                  {intel.in_competitive_range
                                    ? '✅ Price is within competitive range'
                                    : `💡 Recommended: AED ${intel.recommended_min?.toLocaleString()} — ${intel.recommended_max?.toLocaleString()}`}
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">{intel.similar_count} similar cars</p>
                          </div>
                        );
                      })
                  }
                </div>
              )}
            </div>
          )}

          {/* ── DEMAND TAB ── */}
          {activeTab === 'demand' && (
            <div className="space-y-4">
              {intLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="font-bold text-gray-900">Market Demand Heat</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Last 30 days — by make, model & year</p>
                      </div>
                      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                        {[['both','All'],['views','👁 Views'],['sold','✅ Sold']].map(([mode, label]) => (
                          <button key={mode} onClick={() => setDemandMode(mode)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={demandMode === mode ? { background: '#1A9988', color: 'white' } : { color: '#6b7280' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {filteredDemand.length === 0
                      ? <EmptyState icon="📈" text="Not enough data for this filter yet." />
                      : (
                        <div className="space-y-3">
                          {filteredDemand.map((d, i) => {
                            const hasStock = activeVehicles.some(v =>
                              v.make?.toLowerCase() === d.make?.toLowerCase() &&
                              v.model?.toLowerCase() === d.model?.toLowerCase()
                            );
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                                  style={{ background: '#1A9988' }}>{i + 1}</span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900">{d.make} {d.model} {d.year ? `(${d.year})` : ''}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${hasStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                      {hasStock ? '✓ In stock' : '✗ Not stocked'}
                                    </span>
                                  </div>
                                  <ScoreBar value={d.score} max={filteredDemand[0]?.score || 1} color={hasStock ? '#16a34a' : '#1A9988'} />
                                  <div className="flex gap-4 mt-1">
                                    {d.views > 0 && <span className="text-xs text-gray-400">👁 {d.views} views</span>}
                                    {d.sold  > 0 && <span className="text-xs text-gray-400">✅ {d.sold} sold</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    }
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">Body Type Demand</h3>
                      {body_type_demand.length === 0
                        ? <EmptyState icon="🚗" text="Not enough data yet." />
                        : body_type_demand.map((d, i) => (
                          <div key={i} className="flex items-center gap-3 mb-3">
                            <span className="text-sm capitalize text-gray-700 w-20">{d.body_type || 'Other'}</span>
                            <div className="flex-1">
                              <ScoreBar value={d.view_count} max={body_type_demand[0].view_count} color="#1A9988" />
                            </div>
                            <span className="text-xs text-gray-400 w-12 text-right">{d.view_count}</span>
                          </div>
                        ))
                      }
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">Price Range Demand</h3>
                      {price_ranges.length === 0
                        ? <EmptyState icon="💰" text="Not enough data yet." />
                        : price_ranges.map((d, i) => (
                          <div key={i} className="flex items-center gap-3 mb-3">
                            <span className="text-sm text-gray-700 w-24 flex-shrink-0">{d.range}</span>
                            <div className="flex-1">
                              <ScoreBar value={d.view_count} max={price_ranges[0].view_count} color="#d97706" />
                            </div>
                            <span className="text-xs text-gray-400 w-12 text-right">{d.view_count}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── RANK (COMPETITIVE) TAB ── */}
          {activeTab === 'competitive' && (
            <div className="space-y-4">
              {intLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                      <p className="text-sm text-gray-500 mb-1">Your Market Rank</p>
                      <div className="text-4xl font-bold" style={{ color: '#1A9988' }}>#{competitive?.my_rank}</div>
                      <p className="text-sm text-gray-400">out of {competitive?.total_dealers} dealers</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                      <p className="text-sm text-gray-500 mb-1">Your Avg Days to Sell</p>
                      <div className="text-4xl font-bold"
                        style={{ color: competitive?.my_avg_days_to_sell <= competitive?.market_avg_days_to_sell ? '#16a34a' : '#ef4444' }}>
                        {competitive?.my_avg_days_to_sell > 0 ? `${competitive.my_avg_days_to_sell}d` : '—'}
                      </div>
                      <p className="text-sm text-gray-400">
                        Market avg: {competitive?.market_avg_days_to_sell > 0 ? `${competitive.market_avg_days_to_sell}d` : '—'}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                      <p className="text-sm text-gray-500 mb-1">Your Views vs Top 10</p>
                      <div className="text-4xl font-bold" style={{ color: '#d97706' }}>{competitive?.my_total_views}</div>
                      <p className="text-sm text-gray-400">Top 10 avg: {Math.round(competitive?.top10_avg_views || 0)}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <h2 className="font-bold text-gray-900 mb-4">Dealer Leaderboard</h2>
                    <div className="space-y-2">
                      {competitive?.all_dealers?.map((d, i) => {
                        const isMe = d.id === dealer.id;
                        return (
                          <div key={d.id}
                            className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'border-2 border-teal-400 bg-teal-50' : 'bg-gray-50'}`}>
                            <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${
                              i === 0 ? 'bg-yellow-400 text-white' :
                              i === 1 ? 'bg-gray-300 text-white' :
                              i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {d.business_name} {isMe && <span className="text-teal-600 text-xs">(You)</span>}
                              </p>
                              <div className="flex gap-3 mt-0.5">
                                <span className="text-xs text-gray-400">{d.active_count} active</span>
                                <span className="text-xs text-gray-400">{d.total_sold} sold</span>
                                <span className="text-xs text-gray-400">{d.total_views} views</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold" style={{ color: '#1A9988' }}>{d.listing_integrity_score}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${TIER_COLORS[d.score_tier]?.split(' ')[0]} ${TIER_COLORS[d.score_tier]?.split(' ')[1]}`}>
                                {d.score_tier}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── REPUTATION TAB ── */}
          {activeTab === 'reputation' && (
            <div className="space-y-4">
              {intLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                      <div className="text-3xl font-bold mb-1" style={{ color: '#1A9988' }}>{reputation?.avg_quality_score}%</div>
                      <p className="text-xs text-gray-500">Avg Listing Quality</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                      <div className="text-3xl font-bold mb-1" style={{ color: '#16a34a' }}>{reputation?.photo_rate}%</div>
                      <p className="text-xs text-gray-500">Listings With Photos</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                      <div className="text-3xl font-bold mb-1" style={{ color: '#d97706' }}>{reputation?.quality_rate}%</div>
                      <p className="text-xs text-gray-500">Full Spec Listings</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                      <div className="text-3xl font-bold mb-1" style={{ color: '#7c3aed' }}>{reputation?.listing_integrity_score}</div>
                      <p className="text-xs text-gray-500">Integrity Score</p>
                    </div>
                  </div>

                  {/* Per-vehicle quality breakdown */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <h2 className="font-bold text-gray-900 mb-4">Listing Quality Breakdown</h2>
                    {activeVehicles.length === 0
                      ? <EmptyState icon="⭐" text="No active listings to evaluate." />
                      : activeVehicles.map(v => (
                        <div key={v.id} className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900">{v.year} {v.make} {v.model}</p>
                            <span className="text-sm font-bold"
                              style={{ color: v.listing_quality_score >= 70 ? '#16a34a' : v.listing_quality_score >= 40 ? '#d97706' : '#ef4444' }}>
                              {v.listing_quality_score}%
                            </span>
                          </div>
                          <ScoreBar
                            value={v.listing_quality_score || 0}
                            color={v.listing_quality_score >= 70 ? '#16a34a' : v.listing_quality_score >= 40 ? '#d97706' : '#ef4444'} />
                          <div className="flex gap-3 mt-1">
                            <span className={`text-xs ${v.photos?.length > 0 ? 'text-green-600' : 'text-red-400'}`}>
                              {v.photos?.length > 0 ? `✓ ${v.photos.length} photos` : '✗ No photos'}
                            </span>
                            <span className={`text-xs ${v.specs?.color        ? 'text-green-600' : 'text-gray-400'}`}>{v.specs?.color        ? '✓ Color'        : '✗ Color'}</span>
                            <span className={`text-xs ${v.specs?.transmission ? 'text-green-600' : 'text-gray-400'}`}>{v.specs?.transmission ? '✓ Transmission'  : '✗ Transmission'}</span>
                            <span className={`text-xs ${v.specs?.body        ? 'text-green-600' : 'text-gray-400'}`}>{v.specs?.body        ? '✓ Body type'     : '✗ Body type'}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Integrity score card */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <h2 className="font-bold text-gray-900 mb-2">Integrity Score</h2>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">Current score</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${TIER_COLORS[dealer.score_tier] || TIER_COLORS.Unrated}`}>
                        {dealer.score_tier}
                      </span>
                    </div>
                    <ScoreBar
                      value={dealer.listing_integrity_score || 0}
                      color={
                        dealer.listing_integrity_score >= 85 ? '#7c3aed' :
                        dealer.listing_integrity_score >= 70 ? '#FFD700' :
                        dealer.listing_integrity_score >= 50 ? '#9ca3af' : '#ef4444'
                      } />
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>0</span>
                      <span className="font-bold text-gray-700">{dealer.listing_integrity_score}/100</span>
                      <span>100</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        <Footer />
      </div>
    </>
  );
}




