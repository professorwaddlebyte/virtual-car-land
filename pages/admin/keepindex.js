// pages/admin/index.js
// MERGED: olderindex.js (Pending, Overview, Dealers CRUD, Showrooms CRUD, Export)
//       + index.js (Makes, Colors, Specs CRUD tabs)
// API endpoints: /api/admin/stats, /api/admin/pending, /api/admin/approve/[id],
//                /api/admin/dealers, /api/admin/dealers/[id],
//                /api/admin/showrooms, /api/admin/showrooms/[id],
//                /api/admin/makes, /api/admin/makes/[id],
//                /api/admin/colors, /api/admin/colors/[id],
//                /api/admin/specs, /api/admin/specs/[id],
//                /api/admin/export

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DawirnyLogo from '../../components/DawirnyLogo';
import Footer from '../../components/Footer';

// ── Constants ────────────────────────────────────────────────────────────────
const NATIONALITIES = [
  'Japanese','Korean','German','American','British','Italian','French','Swedish','Chinese'
];

const SPEC_GROUPS = [
  'Comfort & Seating',
  'Roof & Glass',
  'Infotainment & Tech',
  'Sound Systems',
  'Safety & Driver Assist',
  'Performance & Drivetrain',
  'Off-Road & Towing',
  'EV / Hybrid & Other',
];

// ── Shared components ─────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-bold" style={{ color: color || '#1A9988' }}>{value ?? '—'}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// Inline confirm-before-delete button used by Makes / Colors / Specs tabs
function DeleteButton({ onConfirm }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <span className="flex items-center gap-1">
      <button onClick={onConfirm}
        className="px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200">
        Confirm
      </button>
      <button onClick={() => setConfirm(false)}
        className="px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-500">
        Cancel
      </button>
    </span>
  );
  return (
    <button onClick={() => setConfirm(true)}
      className="px-2 py-1 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 border border-red-100">
      Delete
    </button>
  );
}

// ── Makes Tab ─────────────────────────────────────────────────────────────────
function MakesTab({ token }) {
  const [makes, setMakes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding]   = useState(false);
  const [newMake, setNewMake] = useState({ name: '', nationality: 'Japanese', is_luxury: false });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function load() {
    setLoading(true);
    const res  = await fetch('/api/admin/makes', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setMakes(data.makes || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!newMake.name.trim()) return;
    setSaving(true); setError('');
    const res  = await fetch('/api/admin/makes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newMake),
    });
    const data = await res.json();
    setSaving(false);
    if (data.make) { setNewMake({ name: '', nationality: 'Japanese', is_luxury: false }); setAdding(false); load(); }
    else setError(data.error || 'Failed to add');
  }

  async function handleEdit(make) {
    setSaving(true); setError('');
    const res  = await fetch(`/api/admin/makes/${make.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: make.name, nationality: make.nationality, is_luxury: make.is_luxury }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.make) { setEditing(null); load(); }
    else setError(data.error || 'Failed to save');
  }

  async function handleDelete(id) {
    await fetch(`/api/admin/makes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  const grouped = {};
  for (const m of makes) {
    if (!grouped[m.nationality]) grouped[m.nationality] = [];
    grouped[m.nationality].push(m);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{makes.length} makes</p>
        <button onClick={() => setAdding(!adding)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#1A9988' }}>
          {adding ? 'Cancel' : '+ Add Make'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {adding && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">New Make</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Brand Name *</label>
              <input value={newMake.name} onChange={e => setNewMake({...newMake, name: e.target.value})}
                placeholder="e.g. Polestar"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Nationality *</label>
              <select value={newMake.nationality} onChange={e => setNewMake({...newMake, nationality: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_luxury_new" checked={newMake.is_luxury}
              onChange={e => setNewMake({...newMake, is_luxury: e.target.checked})}
              className="w-4 h-4 accent-teal-600" />
            <label htmlFor="is_luxury_new" className="text-sm font-semibold text-gray-700">Luxury brand</label>
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="px-6 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1A9988', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding...' : 'Add Make'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
        </div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([nationality, nMakes]) => (
          <div key={nationality} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{nationality}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {nMakes.map(m => (
                <div key={m.id} className="px-4 py-3">
                  {editing?.id === m.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        <select value={editing.nationality} onChange={e => setEditing({...editing, nationality: e.target.value})}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                          {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id={`luxury_${m.id}`} checked={editing.is_luxury}
                          onChange={e => setEditing({...editing, is_luxury: e.target.checked})}
                          className="w-4 h-4 accent-teal-600" />
                        <label htmlFor={`luxury_${m.id}`} className="text-sm text-gray-700">Luxury brand</label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(editing)} disabled={saving}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: '#1A9988' }}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{m.name}</span>
                        {m.is_luxury && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-100">
                            Luxury
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditing({ ...m })}
                          className="px-2 py-1 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-100">
                          Edit
                        </button>
                        <DeleteButton onConfirm={() => handleDelete(m.id)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Colors Tab ────────────────────────────────────────────────────────────────
function ColorsTab({ token }) {
  const [colors, setColors]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding]   = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function load() {
    setLoading(true);
    const res  = await fetch('/api/admin/colors', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setColors(data.colors || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true); setError('');
    const res  = await fetch('/api/admin/colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.color) { setNewName(''); setAdding(false); load(); }
    else setError(data.error || 'Failed to add');
  }

  async function handleEdit() {
    if (!editing?.name.trim()) return;
    setSaving(true); setError('');
    const res  = await fetch(`/api/admin/colors/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editing.name }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.color) { setEditing(null); load(); }
    else setError(data.error || 'Failed to save');
  }

  async function handleDelete(id) {
    await fetch(`/api/admin/colors/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{colors.length} colors</p>
        <button onClick={() => setAdding(!adding)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#1A9988' }}>
          {adding ? 'Cancel' : '+ Add Color'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {adding && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">New Color</p>
          <div className="flex gap-3">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Midnight Blue"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <button onClick={handleAdd} disabled={saving}
              className="px-6 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: '#1A9988', opacity: saving ? 0.7 : 1 }}>
              {saving ? '...' : 'Add'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Will be stored as capitalized noun (e.g. "Midnight Blue")</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 divide-y md:divide-y-0 divide-gray-50">
            {colors.map(c => (
              <div key={c.id} className="px-4 py-3 border-b border-gray-50">
                {editing?.id === c.id ? (
                  <div className="flex gap-2 items-center">
                    <input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})}
                      className="flex-1 border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    <button onClick={handleEdit} disabled={saving}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: '#1A9988' }}>
                      {saving ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing({ ...c })}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-100">
                        Edit
                      </button>
                      <DeleteButton onConfirm={() => handleDelete(c.id)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Specs Tab ─────────────────────────────────────────────────────────────────
function SpecsTab({ token }) {
  const [specs, setSpecs]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(null);
  const [adding, setAdding]         = useState(false);
  const [newSpec, setNewSpec]       = useState({ feature_name: '', group_name: SPEC_GROUPS[0] });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [filterGroup, setFilterGroup] = useState('');

  async function load() {
    setLoading(true);
    const res  = await fetch('/api/admin/specs', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setSpecs(data.specs || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!newSpec.feature_name.trim()) return;
    setSaving(true); setError('');
    const res  = await fetch('/api/admin/specs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newSpec),
    });
    const data = await res.json();
    setSaving(false);
    if (data.spec) { setNewSpec({ feature_name: '', group_name: SPEC_GROUPS[0] }); setAdding(false); load(); }
    else setError(data.error || 'Failed to add');
  }

  async function handleEdit() {
    if (!editing?.feature_name.trim()) return;
    setSaving(true); setError('');
    const res  = await fetch(`/api/admin/specs/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ feature_name: editing.feature_name, group_name: editing.group_name }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.spec) { setEditing(null); load(); }
    else setError(data.error || 'Failed to save');
  }

  async function handleDelete(id) {
    await fetch(`/api/admin/specs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  const filteredSpecs = filterGroup ? specs.filter(s => s.group_name === filterGroup) : specs;
  const grouped = {};
  for (const s of filteredSpecs) {
    if (!grouped[s.group_name]) grouped[s.group_name] = [];
    grouped[s.group_name].push(s);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">{specs.length} features</p>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">All Groups</option>
            {SPEC_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button onClick={() => setAdding(!adding)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1A9988' }}>
            {adding ? 'Cancel' : '+ Add Feature'}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {adding && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">New Feature</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Feature Name *</label>
              <input value={newSpec.feature_name} onChange={e => setNewSpec({...newSpec, feature_name: e.target.value})}
                placeholder="e.g. Night Vision"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Group *</label>
              <select value={newSpec.group_name} onChange={e => setNewSpec({...newSpec, group_name: e.target.value})}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {SPEC_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="px-6 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1A9988', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Adding...' : 'Add Feature'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
        </div>
      ) : (
        SPEC_GROUPS.filter(g => grouped[g]).map(groupName => (
          <div key={groupName} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{groupName}</p>
              <p className="text-xs text-gray-400">{grouped[groupName]?.length || 0}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {(grouped[groupName] || []).map(s => (
                <div key={s.id} className="px-4 py-3">
                  {editing?.id === s.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={editing.feature_name} onChange={e => setEditing({...editing, feature_name: e.target.value})}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        <select value={editing.group_name} onChange={e => setEditing({...editing, group_name: e.target.value})}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                          {SPEC_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleEdit} disabled={saving}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: '#1A9988' }}>
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-800">{s.feature_name}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing({ ...s })}
                          className="px-2 py-1 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 border border-gray-100">
                          Edit
                        </button>
                        <DeleteButton onConfirm={() => handleDelete(s.id)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab]         = useState('pending');
  const [token, setToken]                 = useState('');
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [dealers, setDealers]             = useState([]);
  const [showrooms, setShowrooms]         = useState([]);
  const [editingDealer, setEditingDealer] = useState(null);
  const [editingShowroom, setEditingShowroom] = useState(null);
  const [dealerSearch, setDealerSearch]   = useState('');
  const [showroomSearch, setShowroomSearch] = useState('');

  useEffect(() => {
    const t    = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!t || user.role !== 'admin') { router.push('/login'); return; }
    setToken(t);
    loadAll(t);
  }, []);

  async function loadAll(t) {
    setLoading(true);
    const tok     = t || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${tok}` };
    try {
      const [statsRes, pendingRes, dealersRes, showroomsRes] = await Promise.all([
        fetch('/api/admin/stats',     { headers }),
        fetch('/api/admin/pending',   { headers }),
        fetch('/api/admin/dealers',   { headers }),
        fetch('/api/admin/showrooms', { headers }),
      ]);
      const [statsData, pendingData, dealersData, showroomsData] = await Promise.all([
        statsRes.json(), pendingRes.json(), dealersRes.json(), showroomsRes.json()
      ]);
      setData(statsData);
      setPendingVehicles(pendingData.vehicles || []);
      setDealers(dealersData.dealers || []);
      setShowrooms(showroomsData.showrooms || []);
    } catch {}
    setLoading(false);
  }

  // ── Approval actions ──────────────────────────────────────────────────────
  async function approveListing(vehicleId) {
    const tok = localStorage.getItem('token');
    const res = await fetch(`/api/admin/approve/${vehicleId}`, {
      method: 'POST', headers: { Authorization: `Bearer ${tok}` }
    });
    const d = await res.json();
    if (d.ok) setPendingVehicles(prev => prev.filter(v => v.id !== vehicleId));
    else alert('Failed: ' + d.error);
  }

  async function rejectListing(vehicleId) {
    if (!confirm('Reject and delete this listing?')) return;
    const tok = localStorage.getItem('token');
    const res = await fetch(`/api/admin/approve/${vehicleId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${tok}` }
    });
    const d = await res.json();
    if (d.ok) setPendingVehicles(prev => prev.filter(v => v.id !== vehicleId));
    else alert('Failed: ' + d.error);
  }

  // ── Dealer CRUD ───────────────────────────────────────────────────────────
  async function saveDealer(dealer) {
    const tok    = localStorage.getItem('token');
    const method = dealer.id ? 'PATCH' : 'POST';
    const url    = dealer.id ? `/api/admin/dealers/${dealer.id}` : '/api/admin/dealers';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify(dealer)
    });
    const d = await res.json();
    if (d.ok) { setEditingDealer(null); loadAll(); }
    else alert('Failed: ' + d.error);
  }

  async function deleteDealer(id) {
    if (!confirm('Delete this dealer and all their listings?')) return;
    const tok = localStorage.getItem('token');
    const res = await fetch(`/api/admin/dealers/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${tok}` }
    });
    const d = await res.json();
    if (d.ok) setDealers(prev => prev.filter(x => x.id !== id));
    else alert('Failed: ' + d.error);
  }

  // ── Showroom CRUD ─────────────────────────────────────────────────────────
  async function saveShowroom(showroom) {
    const tok    = localStorage.getItem('token');
    const method = showroom.id ? 'PATCH' : 'POST';
    const url    = showroom.id ? `/api/admin/showrooms/${showroom.id}` : '/api/admin/showrooms';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify(showroom)
    });
    const d = await res.json();
    if (d.ok) { setEditingShowroom(null); loadAll(); }
    else alert('Failed: ' + d.error);
  }

  async function deleteShowroom(id) {
    if (!confirm('Delete this showroom?')) return;
    const tok = localStorage.getItem('token');
    const res = await fetch(`/api/admin/showrooms/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${tok}` }
    });
    const d = await res.json();
    if (d.ok) setShowrooms(prev => prev.filter(x => x.id !== id));
    else alert('Failed: ' + d.error);
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredDealers   = dealers.filter(d =>
    !dealerSearch ||
    d.business_name?.toLowerCase().includes(dealerSearch.toLowerCase()) ||
    d.phone?.includes(dealerSearch)
  );
  const filteredShowrooms = showrooms.filter(s =>
    !showroomSearch ||
    s.showroom_number?.toLowerCase().includes(showroomSearch.toLowerCase()) ||
    s.dealer_name?.toLowerCase().includes(showroomSearch.toLowerCase())
  );

  const TABS = [
    { id: 'pending',   label: '⏳ Pending',   badge: pendingVehicles.length },
    { id: 'overview',  label: '📊 Overview' },
    { id: 'dealers',   label: '🏪 Dealers' },
    { id: 'showrooms', label: '📍 Showrooms' },
    { id: 'export',    label: '📥 Export' },
    { id: 'makes',     label: '🚘 Makes' },
    { id: 'colors',    label: '🎨 Colors' },
    { id: 'specs',     label: '⚙️ Specs' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-500">Loading admin dashboard...</p>
      </div>
    </div>
  );

  return (
    <>
      <Head><title>Admin — dawirny</title></Head>

      {/* ── Edit Dealer Modal ── */}
      {editingDealer && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <h2 className="text-lg font-bold mb-4">{editingDealer.id ? '✏️ Edit Dealer' : '+ New Dealer'}</h2>
            <div className="space-y-3">
              {[
                { key: 'business_name',           label: 'Business Name',            type: 'text' },
                { key: 'phone',                   label: 'Phone',                    type: 'text', placeholder: '+971501234567' },
                { key: 'listing_integrity_score', label: 'Integrity Score (0–100)',  type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase">{f.label}</label>
                  <input type={f.type} value={editingDealer[f.key] || ''} placeholder={f.placeholder}
                    onChange={e => setEditingDealer({ ...editingDealer, [f.key]: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Subscription Tier</label>
                <select value={editingDealer.subscription_tier || 'Basic'}
                  onChange={e => setEditingDealer({ ...editingDealer, subscription_tier: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {['Basic','Gold','Platinum'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingDealer(null)}
                className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
              <button onClick={() => saveDealer(editingDealer)}
                className="flex-1 py-2.5 rounded-xl text-white font-bold"
                style={{ background: '#1A9988' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Showroom Modal ── */}
      {editingShowroom && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <h2 className="text-lg font-bold mb-4">{editingShowroom.id ? '✏️ Edit Showroom' : '+ New Showroom'}</h2>
            <div className="space-y-3">
              {[
                { key: 'showroom_number', label: 'Showroom Number', placeholder: 'A-01' },
                { key: 'section',         label: 'Section',         placeholder: 'A' },
                { key: 'location_hint',   label: 'Location Hint',   placeholder: 'Gate 1, Row A' },
                { key: 'map_x',           label: 'Map X (%)',       type: 'number', placeholder: '15' },
                { key: 'map_y',           label: 'Map Y (%)',       type: 'number', placeholder: '30' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase">{f.label}</label>
                  <input type={f.type || 'text'} value={editingShowroom[f.key] || ''} placeholder={f.placeholder}
                    onChange={e => setEditingShowroom({ ...editingShowroom, [f.key]: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingShowroom(null)}
                className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
              <button onClick={() => saveShowroom(editingShowroom)}
                className="flex-1 py-2.5 rounded-xl text-white font-bold"
                style={{ background: '#1A9988' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* Header */}
        <header style={{ background: '#1A9988' }} className="sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <DawirnyLogo size="sm" white={true} />
                <span className="text-white font-bold text-base">Admin</span>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/" className="text-white text-sm opacity-75 hover:opacity-100">← Site</Link>
                <button onClick={() => { localStorage.clear(); router.push('/login'); }}
                  className="text-white text-sm opacity-75 hover:opacity-100">Logout</button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 flex-1 w-full">

          {/* KPI stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon="🚗" label="Active Vehicles"   value={data?.active_vehicles}  color="#1A9988" />
            <StatCard icon="🏪" label="Dealers"           value={data?.dealers}           color="#374151" />
            <StatCard icon="📍" label="Showrooms"         value={data?.showrooms}         color="#374151" />
            <StatCard icon="⏳" label="Pending Approval"  value={pendingVehicles.length}
              color={pendingVehicles.length > 0 ? '#d97706' : '#374151'} />
            <StatCard icon="✅" label="Sold This Month"   value={data?.sold_this_month}   color="#16a34a" />
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                style={activeTab === tab.id ? { background: '#1A9988', color: 'white' } : { color: '#6b7280' }}>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={activeTab === tab.id
                      ? { background: 'white', color: '#1A9988' }
                      : { background: '#ef4444', color: 'white' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── PENDING APPROVALS ── */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-1">Pending Listing Approvals</h2>
                <p className="text-sm text-gray-500 mb-4">
                  New listings with photos submitted by dealers — review and approve or reject
                </p>
                {pendingVehicles.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-gray-400 text-sm">No pending listings.</p>
                  </div>
                ) : pendingVehicles.map(v => (
                  <div key={v.id} className="border border-gray-100 rounded-xl p-4 mb-3">
                    <div className="flex gap-4">
                      <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {v.photos?.length > 0
                          ? <img src={v.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">{v.year} {v.make} {v.model}</h3>
                            <p className="text-sm text-gray-500">
                              AED {v.price_aed?.toLocaleString()} • {v.mileage_km?.toLocaleString()} km • {v.specs?.gcc ? 'GCC' : 'Non-GCC'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Dealer: {v.dealer_name} — Showroom {v.showroom_number}
                            </p>
                            {v.description && (
                              <p className="text-xs text-gray-500 mt-1 italic">"{v.description}"</p>
                            )}
                          </div>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex-shrink-0">
                            Pending
                          </span>
                        </div>
                        {v.photos?.length > 1 && (
                          <div className="flex gap-1 mt-2">
                            {v.photos.slice(0, 5).map((p, i) => (
                              <img key={i} src={p} className="w-10 h-10 rounded-lg object-cover" />
                            ))}
                            {v.photos.length > 5 && (
                              <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                +{v.photos.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => approveListing(v.id)}
                            className="flex-1 py-2 rounded-xl text-white text-sm font-bold"
                            style={{ background: '#1A9988' }}>
                            ✅ Approve & Publish
                          </button>
                          <button onClick={() => rejectListing(v.id)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100">
                            🗑️ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Platform Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Active Vehicles',       value: data?.active_vehicles,            icon: '🚗' },
                    { label: 'Total Dealers',          value: data?.dealers,                    icon: '🏪' },
                    { label: 'Showrooms',              value: data?.showrooms,                  icon: '📍' },
                    { label: 'Total Views (30d)',      value: data?.views_30d?.toLocaleString(), icon: '👁' },
                    { label: 'WhatsApp Clicks (30d)',  value: data?.whatsapp_30d,               icon: '💬' },
                    { label: 'Sold This Month',        value: data?.sold_this_month,            icon: '✅' },
                  ].map((s, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl text-center">
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-2xl font-bold text-gray-900">{s.value ?? '—'}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">Quick Links</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Export Vehicles CSV',   href: '/api/admin/export?type=vehicles'  },
                    { label: 'Export Dealers CSV',    href: '/api/admin/export?type=dealers'   },
                    { label: 'Export Inquiries CSV',  href: '/api/admin/export?type=inquiries' },
                  ].map((l, i) => (
                    <a key={i} href={l.href} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium border-2 border-gray-100 hover:border-teal-300 transition-colors"
                      style={{ color: '#1A9988' }}>
                      📥 {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DEALERS ── */}
          {activeTab === 'dealers' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
                <input type="text" placeholder="🔍 Search dealers..." value={dealerSearch}
                  onChange={e => setDealerSearch(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button
                  onClick={() => setEditingDealer({ business_name: '', phone: '', listing_integrity_score: 50, subscription_tier: 'Basic' })}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background: '#1A9988' }}>
                  + Add Dealer
                </button>
              </div>
              {filteredDealers.map(d => (
                <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{d.business_name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{d.phone} • {d.email}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="text-xs text-gray-400">Score: {d.listing_integrity_score}/100</span>
                        <span className="text-xs text-gray-400">Tier: {d.score_tier}</span>
                        <span className="text-xs text-gray-400">Sub: {d.subscription_tier}</span>
                        <span className="text-xs text-gray-400">{d.active_listings} active</span>
                        <span className="text-xs text-gray-400">Bot: {d.telegram_chat_id ? '✅' : '❌'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingDealer({ ...d })}
                        className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700">
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteDealer(d.id)}
                        className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-red-50 text-red-500">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SHOWROOMS ── */}
          {activeTab === 'showrooms' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
                <input type="text" placeholder="🔍 Search showrooms..." value={showroomSearch}
                  onChange={e => setShowroomSearch(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button
                  onClick={() => setEditingShowroom({ showroom_number: '', section: '', location_hint: '', map_x: '', map_y: '' })}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background: '#1A9988' }}>
                  + Add Showroom
                </button>
              </div>
              {filteredShowrooms.map(s => (
                <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{s.showroom_number} — {s.dealer_name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{s.location_hint}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-gray-400">Section: {s.section}</span>
                        <span className="text-xs text-gray-400">Pin: ({s.map_x}%, {s.map_y}%)</span>
                        <span className="text-xs text-gray-400">{s.active_vehicles} active cars</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingShowroom({ ...s })}
                        className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700">
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteShowroom(s.id)}
                        className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-red-50 text-red-500">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── EXPORT ── */}
          {activeTab === 'export' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Data Export</h2>
              <div className="space-y-3">
                {[
                  { label: 'All Active Vehicles', desc: 'Make, model, year, price, mileage, dealer, showroom', href: '/api/admin/export?type=vehicles'  },
                  { label: 'All Dealers',         desc: 'Business name, phone, score, tier, subscription, stats', href: '/api/admin/export?type=dealers'   },
                  { label: 'All Inquiries',       desc: 'WhatsApp clicks and saves by vehicle and dealer',        href: '/api/admin/export?type=inquiries' },
                ].map((e, i) => (
                  <a key={i} href={e.href} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-teal-300 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">📥 {e.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{e.desc}</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: '#1A9988' }}>Download CSV →</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── MAKES ── */}
          {activeTab === 'makes' && <MakesTab token={token} />}

          {/* ── COLORS ── */}
          {activeTab === 'colors' && <ColorsTab token={token} />}

          {/* ── SPECS ── */}
          {activeTab === 'specs' && <SpecsTab token={token} />}

        </div>

        <Footer />
      </div>
    </>
  );
}




