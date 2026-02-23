// pages/dealership/inventory.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import BackButton from '../../components/BackButton';

export default function Inventory() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [token, setToken] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ make: '', model: '', year: '', price: '' });

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) return router.push('/login');
    setToken(t);
    fetch('/api/dealership/vehicles', { headers: { Authorization: `Bearer ${t}` }})
      .then(r => r.json()).then(d => setVehicles(d.vehicles || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/dealership/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    setShowForm(false);
    setFormData({ make: '', model: '', year: '', price: '' });
    fetch('/api/dealership/vehicles', { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.json()).then(d => setVehicles(d.vehicles || []));
  };

  return (
    <>
      <Head><title>Inventory</title></Head>
      <div className="p-6 bg-white min-h-screen">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-black">My Vehicles</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white font-bold px-4 py-2 rounded mb-4">
          {showForm ? 'Cancel' : '+ Add Vehicle'}
        </button>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-2 bg-gray-100 p-4 rounded">
            <input placeholder="Make" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} className="border p-2 text-black bg-white rounded" required />
            <input placeholder="Model" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="border p-2 text-black bg-white rounded" required />
            <input placeholder="Year" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="border p-2 text-black bg-white rounded" required />
            <input placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="border p-2 text-black bg-white rounded" required />
            <button type="submit" className="bg-green-600 text-white font-bold px-4 py-2 rounded">Save</button>
          </form>
        )}
        <div className="grid gap-4">
          {vehicles.map(v => (
            <div key={v.id} className="border p-4 rounded bg-gray-50">
              <p className="font-bold text-black">{v.year} {v.make} {v.model}</p>
              <p className="text-black">AED {v.price?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
