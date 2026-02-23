import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function VehicleFeatures() {
  const [features, setFeatures] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', feature: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [fRes, vRes] = await Promise.all([
      fetch('/api/admin/features'),
      fetch('/api/admin/vehicles')
    ]);
    const [fData, vData] = await Promise.all([fRes.json(), vRes.json()]);
    if (fData.success) setFeatures(fData.features);
    if (vData.success) setVehicles(vData.vehicles);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/admin/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setShowForm(false);
    setForm({ vehicleId: '', feature: '' });
    fetchData();
  };

  const handleDelete = async (vehicleId, feature) => {
    if (!confirm(`Remove "${feature}" from ${vehicleId}?`)) return;
    await fetch(`/api/admin/features?vehicleId=${vehicleId}&feature=${feature}`, { method: 'DELETE' });
    fetchData();
  };

  const grouped = features.reduce((acc, f) => {
    if (!acc[f.vehicle_id]) acc[f.vehicle_id] = { make: f.make, model: f.model, features: [] };
    acc[f.vehicle_id].features.push(f.feature);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Vehicle Features - Admin</title></Head>
      <header className="bg-[#0055A4] text-black font-bold p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-white hover:underline">← Admin</Link>
            <h1 className="text-2xl font-bold">Vehicle Features</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-white text-[#0055A4] px-4 py-2 rounded font-semibold">+ Add Feature</button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Add Feature to Vehicle</h3>
            <form onSubmit={handleSubmit} className="flex gap-4">
              <select value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} className="flex-1 p-2 border rounded" required>
                <option value="">Select Vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.id})</option>)}
              </select>
              <input placeholder="Feature (e.g., Sunroof)" value={form.feature} onChange={e => setForm({...form, feature: e.target.value})} className="flex-1 p-2 border rounded" required />
              <button type="submit" className="bg-green-600 text-black font-bold px-4 py-2 rounded">Add</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
            </form>
          </div>
        )}
        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([vid, data]) => (
              <div key={vid} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{data.make} {data.model}</h3>
                  <span className="text-gray-500 text-sm">{vid}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.features.map(f => (
                    <span key={f} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                      {f}
                      <button onClick={() => handleDelete(vid, f)} className="ml-2 text-red-500 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}