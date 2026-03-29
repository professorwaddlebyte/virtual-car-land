import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function VehiclesAdmin() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [form, setForm] = useState({
    make: '', model: '', year: 2024, price: '', bodyType: '',
    color: '', fuelType: 'Petrol', transmission: 'Automatic',
    mileage: '', location: 'Dubai', description: '', imageUrl: '', id: ''
  });

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vehicles');
      const data = await res.json();
      if (data.success) setVehicles(data.vehicles);
    } catch (err) { setMessage('Failed to load'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...form, year: parseInt(form.year), price: parseFloat(form.price), mileage: parseInt(form.mileage) };
    const url = editing ? `/api/admin/vehicles?id=${editing}` : '/api/admin/vehicles';
    const method = editing ? 'PUT' : 'POST';
    
    try {
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setMessage(editing ? 'Updated!' : 'Added!');
      setShowForm(false); setEditing(null);
      setForm({ make: '', model: '', year: 2024, price: '', bodyType: '', color: '', fuelType: 'Petrol', transmission: 'Automatic', mileage: '', location: 'Dubai', description: '', imageUrl: '', id: '' });
      fetchVehicles();
    } catch (err) { setMessage('Error saving'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    await fetch(`/api/admin/vehicles?id=${id}`, { method: 'DELETE' });
    setMessage('Deleted!');
    fetchVehicles();
  };

  const startEdit = (v) => {
    setEditing(v.id);
    setForm({ ...v, year: v.year.toString(), price: v.price.toString(), mileage: v.mileage.toString() });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head><title>Vehicles - Admin</title></Head>
      
      <header className="bg-[#0055A4] text-black font-bold p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-white hover:underline">← Admin Menu</Link>
            <h1 className="text-2xl font-bold">Vehicle Management</h1>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); }} className="bg-white text-[#0055A4] px-4 py-2 rounded font-semibold">+ Add Vehicle</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {message && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">{message}</div>}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'Add'} Vehicle</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {!editing && <input placeholder="ID (e.g., V031)" value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="p-2 border rounded" required />}
              <input placeholder="Make" value={form.make} onChange={e => setForm({...form, make: e.target.value})} className="p-2 border rounded" required />
              <input placeholder="Model" value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="p-2 border rounded" required />
              <input type="number" placeholder="Year" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="p-2 border rounded" />
              <input type="number" placeholder="Price (AED)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="p-2 border rounded" required />
              <select value={form.bodyType} onChange={e => setForm({...form, bodyType: e.target.value})} className="p-2 border rounded" required>
                <option value="">Body Type</option><option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Coupe">Coupe</option><option value="Pickup">Pickup</option><option value="Minivan">Minivan</option><option value="Luxury Sedan">Luxury Sedan</option>
              </select>
              <input placeholder="Color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="p-2 border rounded" />
              <select value={form.fuelType} onChange={e => setForm({...form, fuelType: e.target.value})} className="p-2 border rounded">
                <option value="Petrol">Petrol</option><option value="Diesel">Diesel</option><option value="Electric">Electric</option><option value="Hybrid">Hybrid</option>
              </select>
              <input placeholder="Mileage" value={form.mileage} onChange={e => setForm({...form, mileage: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Image URL" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="p-2 border rounded md:col-span-2" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="p-2 border rounded md:col-span-3" rows="2" />
              <div className="md:col-span-3">
                <button type="submit" className="bg-green-600 text-black font-bold px-4 py-2 rounded mr-2">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <p>Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => (
              <div key={v.id} className="bg-white rounded-lg shadow overflow-hidden">
                {v.imageUrl && <img src={v.imageUrl} alt={`${v.make} ${v.model}`} className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{v.make} {v.model}</h3>
                      <p className="text-gray-600">{v.year} • AED {v.price?.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{v.bodyType} • {v.fuelType}</p>
                      <p className="text-xs text-gray-400 mt-1">{v.id}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEdit(v)} className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm">Edit</button>
                    <button onClick={() => handleDelete(v.id)} className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}