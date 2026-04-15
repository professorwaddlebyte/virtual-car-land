// pages/admin/index.js
// MERGED: olderindex.js (Pending, Overview, Dealers CRUD, Showrooms CRUD, Export)
//       + index.js (Makes, Colors, Specs CRUD tabs)
//       + dealerships.js (Three-tab dealer management: Pending/Active/Suspended)
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

// Helper functions for dealer expiry
function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isExpiringSoon(dateStr, days = 30) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + days);
  return d > now && d <= soon;
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function LicenseBadge({ expiry }) {
  if (!expiry) return <span className="text-gray-400 text-xs">No date</span>;
  if (isExpired(expiry)) return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
      🔴 EXPIRED {fmtDate(expiry)}
    </span>
  );
  if (isExpiringSoon(expiry)) return (
    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
      ⚠ Expiring {fmtDate(expiry)}
    </span>
  );
  return <span className="text-xs text-gray-500">Valid until {fmtDate(expiry)}</span>;
}

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

// ── Dealers Tab (Three-tab version: Pending/Active/Suspended) ─────────────────
function DealersTab({ token }) {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingDealer, setEditingDealer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadDealers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dealers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDealers(data.dealers || []);
    } catch (e) {
      console.error('Failed to fetch dealers:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDealers(); }, []);

  async function approveDealer(dealerId) {
    setActionLoading('approve');
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/approve-dealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dealer_id: dealerId, action: 'approve' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setSelectedDealer(null);
        loadDealers();
        setActiveTab('active');
      } else {
        setError(data.error);
      }
    } catch { setError('Network error'); }
    finally { setActionLoading(null); }
  }

  async function rejectDealer(dealerId) {
    if (!confirm('Reject and permanently delete this application? This cannot be undone.')) return;
    setActionLoading('reject');
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/approve-dealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dealer_id: dealerId, action: 'reject' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setSelectedDealer(null);
        loadDealers();
      } else {
        setError(data.error);
      }
    } catch { setError('Network error'); }
    finally { setActionLoading(null); }
  }

  async function suspendDealer(id) {
    if (!confirm('Suspend this dealership?')) return;
    try {
      const res = await fetch(`/api/admin/dealers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadDealers();
    } catch (err) { console.error('Suspend failed:', err); }
  }

  async function saveDealer(dealer) {
    const method = dealer.id ? 'PATCH' : 'POST';
    const url = dealer.id ? `/api/admin/dealers/${dealer.id}` : '/api/admin/dealers';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(dealer)
    });
    const d = await res.json();
    if (d.ok) { 
      setEditingDealer(null); 
      loadDealers();
      setSuccess(d.message || 'Dealer updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } else alert('Failed: ' + d.error);
  }

  const pending = dealers.filter(d => d.status === 'pending');
  const active = dealers.filter(d => d.status === 'active');
  const suspended = dealers.filter(d => d.status === 'suspended');

  const tabs = [
    { key: 'pending', label: 'Pending', count: pending.length, color: 'yellow' },
    { key: 'active', label: 'Active', count: active.length, color: 'green' },
    { key: 'suspended', label: 'Suspended', count: suspended.length, color: 'red' },
  ];

  const tabDealers = { pending, active, suspended }[activeTab] || [];

  // Pending Dealer Detail Modal
function PendingDetailModal({ dealer, onClose, onApprove, onReject, loading, token }) {
  const [showroom, setShowroom] = useState(null);
  const [fetchingShowroom, setFetchingShowroom] = useState(false);

  useEffect(() => {
    if (dealer && dealer.id) {
      setFetchingShowroom(true);
      fetch(`/api/admin/showrooms?dealer_id=${dealer.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const showroomsList = data.showrooms || [];
          setShowroom(showroomsList[0] || null);
        })
        .catch(console.error)
        .finally(() => setFetchingShowroom(false));
    }
  }, [dealer?.id]);

  if (!dealer) return null;
  const isExpiredDate = (dt) => dt && new Date(dt) < new Date();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl my-8">
        <div className="p-5 border-b flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{dealer.business_name}</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pending Registration</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          {/* License */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Trade License</p>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">License #</span><p className="font-semibold">{dealer.trade_license_number || '—'}</p></div>
              <div>
                <span className="text-gray-500">Expiry</span>
                <p className={`font-semibold ${isExpiredDate(dealer.trade_license_expiry) ? 'text-red-600' : 'text-gray-900'}`}>
                  {isExpiredDate(dealer.trade_license_expiry) ? '🔴 EXPIRED — ' : ''}{fmtDate(dealer.trade_license_expiry)}
                </p>
              </div>
            </div>
            {dealer.trade_license_url && (
              <a href={dealer.trade_license_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline" style={{ color: '#1A9988' }}>
                📄 View Trade License →
              </a>
            )}
          </div>
          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Contact Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">Contact Person</span><p className="font-semibold">{dealer.contact_person || '—'}</p></div>
              <div><span className="text-gray-500">Auth. Signatory</span><p className="font-semibold">{dealer.authorized_signatory || '—'}</p></div>
              <div><span className="text-gray-500">Mobile</span><p className="font-semibold">{dealer.phone || '—'}</p></div>
              <div><span className="text-gray-500">WhatsApp</span><p className="font-semibold">{dealer.whatsapp_number || '—'}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Email</span><p className="font-semibold">{dealer.email || '—'}</p></div>
            </div>
          </div>
          {/* Emirates ID */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Emirates ID</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div><span className="text-gray-500">ID Number</span><p className="font-semibold">{dealer.emirates_id_number || '—'}</p></div>
              <div>
                <span className="text-gray-500">Expiry</span>
                <p className={`font-semibold ${isExpiredDate(dealer.emirates_id_expiry) ? 'text-red-600' : 'text-gray-900'}`}>
                  {isExpiredDate(dealer.emirates_id_expiry) ? '🔴 EXPIRED — ' : ''}{fmtDate(dealer.emirates_id_expiry)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {dealer.emirates_id_front_url && (
                <a href={dealer.emirates_id_front_url} target="_blank" rel="noopener noreferrer" className="text-center">
                  <img src={dealer.emirates_id_front_url} alt="ID Front" className="w-36 rounded-lg border hover:opacity-80 transition object-cover" />
                  <span className="text-xs text-gray-400 mt-1 block">Front</span>
                </a>
              )}
              {dealer.emirates_id_back_url && (
                <a href={dealer.emirates_id_back_url} target="_blank" rel="noopener noreferrer" className="text-center">
                  <img src={dealer.emirates_id_back_url} alt="ID Back" className="w-36 rounded-lg border hover:opacity-80 transition object-cover" />
                  <span className="text-xs text-gray-400 mt-1 block">Back</span>
                </a>
              )}
            </div>
          </div>
          {/* Showroom - fetched from showrooms table */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Showroom</p>
            {fetchingShowroom ? (
              <div className="flex justify-center py-2">
                <div className="w-4 h-4 border-2 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
              </div>
            ) : showroom ? (
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Showroom #</span><p className="font-semibold">{showroom.showroom_number || '—'}</p></div>
                <div><span className="text-gray-500">Section</span><p className="font-semibold">{showroom.section || '—'}</p></div>
                <div className="col-span-2"><span className="text-gray-500">Location Hint</span><p className="font-semibold">{showroom.location_hint || '—'}</p></div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm">No showroom assigned yet</p>
            )}
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50">
            Close
          </button>
          <button onClick={() => onReject(dealer.id)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100">
            ✗ Reject & Delete
          </button>
          <button onClick={() => onApprove(dealer.id)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#1A9988' }}>
            {loading === 'approve' ? 'Approving...' : '✓ Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}



  // Edit Dealer Modal
  function EditDealerModal({ dealer, onClose, onSave }) {
    const [formData, setFormData] = useState({
      id: dealer?.id,
      business_name: dealer?.business_name || '',
      phone: dealer?.phone || '',
      listing_integrity_score: dealer?.listing_integrity_score || 50,
      subscription_tier: dealer?.subscription_tier || 'Basic',
    });
    const [saving, setSaving] = useState(false);

    async function handleSave() {
      setSaving(true);
      await onSave(formData);
      setSaving(false);
    }

    if (!dealer) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
          <h2 className="text-lg font-bold mb-4">{dealer.id ? '✏️ Edit Dealer' : '+ New Dealer'}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Business Name *</label>
              <input 
                type="text" 
                value={formData.business_name} 
                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971501234567"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Integrity Score (0–100)</label>
              <input 
                type="number" 
                value={formData.listing_integrity_score} 
                onChange={e => setFormData({ ...formData, listing_integrity_score: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Subscription Tier</label>
              <select 
                value={formData.subscription_tier} 
                onChange={e => setFormData({ ...formData, subscription_tier: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {['Basic', 'Gold', 'Platinum'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white font-bold"
              style={{ background: '#1A9988', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-4 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm">
          ✓ {success}
        </div>
      )}

      {/* Pending banner when on non-pending tab with pending dealers */}
      {pending.length > 0 && activeTab !== 'pending' && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-yellow-900">{pending.length} application{pending.length > 1 ? 's' : ''} awaiting approval</p>
              <p className="text-xs text-yellow-700">New dealerships have submitted registration requests</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('pending')}
            className="text-sm font-semibold text-yellow-800 bg-yellow-200 px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition">
            Review Now →
          </button>
        </div>
      )}

      {/* Header with Add button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Total: {dealers.length} dealers</p>
        <button
          onClick={() => setEditingDealer({ business_name: '', phone: '', listing_integrity_score: 50, subscription_tier: 'Basic' })}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#1A9988' }}>
          + Add Manually
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, count, color }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2
              ${activeTab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full
              ${color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                color === 'green' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Dealer list */}
      {tabDealers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">
            {activeTab === 'pending' ? '✅' : activeTab === 'active' ? '🏪' : '🚫'}
          </div>
          <p className="font-medium">No {activeTab} dealerships</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {tabDealers.map(dealer => {
              const licExpired = isExpired(dealer.trade_license_expiry);
              const idExpired = isExpired(dealer.emirates_id_expiry);
              const hasIssue = licExpired || idExpired;

              return (
                <div key={dealer.id}
                  className={`p-4 flex justify-between items-start transition
                    ${hasIssue && activeTab === 'active' ? 'bg-red-50 border-l-4 border-red-400' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 text-base">{dealer.business_name}</p>
                      {hasIssue && activeTab === 'active' && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          ⚠ Document Issue
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 flex-wrap text-sm text-gray-500 mb-2">
                      {dealer.email && <span>✉ {dealer.email}</span>}
                      {dealer.phone && <span>📞 {dealer.phone}</span>}
                      {dealer.contact_person && <span>👤 {dealer.contact_person}</span>}
                    </div>

                    <div className="flex gap-3 flex-wrap text-xs">
                      <span className="flex items-center gap-1">
                        📋 License: <LicenseBadge expiry={dealer.trade_license_expiry} />
                      </span>
                      {dealer.emirates_id_expiry && (
                        <span className="flex items-center gap-1">
                          🪪 Emirates ID: <LicenseBadge expiry={dealer.emirates_id_expiry} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    {activeTab === 'pending' && (
                      <>
                        <button onClick={() => setSelectedDealer(dealer)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
                          View Details
                        </button>
                        <button onClick={() => approveDealer(dealer.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                          style={{ background: '#1A9988' }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => rejectDealer(dealer.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100">
                          ✗ Reject
                        </button>
                      </>
                    )}

                    {activeTab === 'active' && (
                      <>
                        <button onClick={() => setEditingDealer(dealer)}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700">
                          ✏️ Edit
                        </button>
                        <button onClick={() => suspendDealer(dealer.id)}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-50 text-red-500">
                          🗑️ Suspend
                        </button>
                      </>
                    )}

                    {activeTab === 'suspended' && (
                      <span className="text-xs text-gray-400 italic">Suspended</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <PendingDetailModal
        dealer={selectedDealer}
        onClose={() => setSelectedDealer(null)}
        onApprove={approveDealer}
        onReject={rejectDealer}
        loading={actionLoading}
        token={token}
      />

      <EditDealerModal
        dealer={editingDealer}
        onClose={() => setEditingDealer(null)}
        onSave={saveDealer}
      />
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
  const [pendingDealersCount, setPendingDealersCount] = useState(0);
  const [showrooms, setShowrooms]         = useState([]);
  const [showroomSearch, setShowroomSearch] = useState('');
  const [editingShowroom, setEditingShowroom] = useState(null);

  useEffect(() => {
    const t    = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!t || user.role !== 'admin') { router.push('/login'); return; }
    setToken(t);
    loadAll(t);
  }, []);

  // Get pending dealers count for tab badge
  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/dealers', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const pendingCount = (data.dealers || []).filter(d => d.status === 'pending').length;
        setPendingDealersCount(pendingCount);
      })
      .catch(console.error);
  }, [token]);

  async function loadAll(t) {
    setLoading(true);
    const tok     = t || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${tok}` };
    try {
      const [statsRes, pendingRes, showroomsRes] = await Promise.all([
        fetch('/api/admin/stats',     { headers }),
        fetch('/api/admin/pending',   { headers }),
        fetch('/api/admin/showrooms', { headers }),
      ]);
      const [statsData, pendingData, showroomsData] = await Promise.all([
        statsRes.json(), pendingRes.json(), showroomsRes.json()
      ]);
      setData(statsData);
      setPendingVehicles(pendingData.vehicles || []);
      setShowrooms(showroomsData.showrooms || []);
      setPendingDealersCount(dealersData.dealers?.filter(d => d.status === 'pending').length || 0);
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
  const filteredShowrooms = showrooms.filter(s =>
    !showroomSearch ||
    s.showroom_number?.toLowerCase().includes(showroomSearch.toLowerCase()) ||
    s.dealer_name?.toLowerCase().includes(showroomSearch.toLowerCase())
  );

  const TABS = [
    { id: 'pending',   label: '⏳ Pending',   badge: pendingVehicles.length },
    { id: 'overview',  label: '📊 Overview' },
    { id: 'dealers',   label: '🏪 Dealers',   badge: pendingDealersCount },
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

          {/* ── DEALERS (Three-tab version) ── */}
          {activeTab === 'dealers' && <DealersTab token={token} />}

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



