import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function CulturalPreferences() {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nationality: '', preferredMakes: '', preferredBodyTypes: '', preferredColors: '',
    typicalBudgetMin: '', typicalBudgetMax: '', weight: 0.3, sampleSize: 0
  });

  useEffect(() => { fetchPreferences(); }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/cultural');
    const data = await res.json();
    if (data.success) setPreferences(data.preferences);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editing ? `/api/admin/cultural?nationality=${editing}` : '/api/admin/cultural';
    const body = {
      nationality: form.nationality,
      preferredMakes: form.preferredMakes.split(',').map(s => s.trim()),
      preferredBodyTypes: form.preferredBodyTypes.split(',').map(s => s.trim()),
      preferredColors: form.preferredColors.split(',').map(s => s.trim()),
      typicalBudgetMin: parseFloat(form.typicalBudgetMin),
      typicalBudgetMax: parseFloat(form.typicalBudgetMax),
      weight: parseFloat(form.weight),
      sampleSize: parseInt(form.sampleSize)
    };
    await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setShowForm(false);
    setEditing(null);
    fetchPreferences();
  };

  const handleDelete = async (nationality) => {
    if (!confirm(`Delete ${nationality}?`)) return;
    await fetch(`/api/admin/cultural?nationality=${nationality}`, { method: 'DELETE' });
    fetchPreferences();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Cultural Preferences - Admin</title></Head>
      <header className="bg-[#0055A4] text-black font-bold p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-white hover:underline">← Admin</Link>
            <h1 className="text-2xl font-bold">Cultural Preferences</h1>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({nationality:'',preferredMakes:'',preferredBodyTypes:'',preferredColors:'',typicalBudgetMin:'',typicalBudgetMax:'',weight:0.3,sampleSize:0}); }} className="bg-white text-[#0055A4] px-4 py-2 rounded font-semibold">+ Add New</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Add'} Cultural Preference</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <input placeholder="Nationality" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} className="p-2 border rounded" required disabled={editing} />
              <input placeholder="Preferred Makes (comma-separated)" value={form.preferredMakes} onChange={e => setForm({...form, preferredMakes: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Preferred Body Types" value={form.preferredBodyTypes} onChange={e => setForm({...form, preferredBodyTypes: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Preferred Colors" value={form.preferredColors} onChange={e => setForm({...form, preferredColors: e.target.value})} className="p-2 border rounded" />
              <input type="number" placeholder="Budget Min (AED)" value={form.typicalBudgetMin} onChange={e => setForm({...form, typicalBudgetMin: e.target.value})} className="p-2 border rounded" />
              <input type="number" placeholder="Budget Max (AED)" value={form.typicalBudgetMax} onChange={e => setForm({...form, typicalBudgetMax: e.target.value})} className="p-2 border rounded" />
              <input type="number" step="0.01" placeholder="Weight (0-1)" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className="p-2 border rounded" />
              <input type="number" placeholder="Sample Size" value={form.sampleSize} onChange={e => setForm({...form, sampleSize: e.target.value})} className="p-2 border rounded" />
              <div className="col-span-2">
                <button type="submit" className="bg-green-600 text-black font-bold px-4 py-2 rounded mr-2">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        )}
        {loading ? <p>Loading...</p> : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100"><tr><th className="p-3 text-left">Nationality</th><th className="p-3 text-left">Makes</th><th className="p-3 text-left">Body Types</th><th className="p-3 text-left">Budget Range</th><th className="p-3 text-left">Actions</th></tr></thead>
              <tbody>
                {preferences.map(p => (
                  <tr key={p.nationality} className="border-t">
                    <td className="p-3 font-semibold">{p.nationality}</td>
                    <td className="p-3 text-sm">{p.preferredMakes?.slice(0,3).join(', ')}...</td>
                    <td className="p-3 text-sm">{p.preferredBodyTypes?.join(', ')}</td>
                    <td className="p-3 text-sm">AED {p.typicalBudgetMin?.toLocaleString()} - {p.typicalBudgetMax?.toLocaleString()}</td>
                    <td className="p-3">
                      <button onClick={() => { setEditing(p.nationality); setForm({...p, preferredMakes: p.preferredMakes?.join(', '), preferredBodyTypes: p.preferredBodyTypes?.join(', '), preferredColors: p.preferredColors?.join(', ')}); setShowForm(true); }} className="text-blue-600 mr-3">Edit</button>
                      <button onClick={() => handleDelete(p.nationality)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}