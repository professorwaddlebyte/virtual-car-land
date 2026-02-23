// pages/dealership/dashboard.js
// Dealership dashboard with stats

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function DealershipDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'dealership') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchVehicles(token);
  }, []);

  const fetchVehicles = async (token) => {
    try {
      const res = await fetch('/api/dealership/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    sold: vehicles.filter(v => v.status === 'sold').length,
    reserved: vehicles.filter(v => v.status === 'reserved').length,
  };

  if (loading) return <div className="p-8 text-black">Loading...</div>;

  return (
    <>
      <Head>
        <title>Dealership Dashboard | UAE Car Marketplace</title>
      </Head>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <nav className="bg-blue-800 text-white px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">UAE Car Marketplace</h1>
              <p className="text-sm">{user?.profile?.business_name}</p>
            </div>
            <button onClick={handleLogout} className="text-white hover:text-gray-200 font-bold">
              Logout
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-100 p-6 rounded-lg shadow border">
              <p className="text-gray-600 text-sm">Total Vehicles</p>
              <p className="text-3xl font-bold text-black">{stats.total}</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow border">
              <p className="text-gray-600 text-sm">Available</p>
              <p className="text-3xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow border">
              <p className="text-gray-600 text-sm">Reserved</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.reserved}</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow border">
              <p className="text-gray-600 text-sm">Sold</p>
              <p className="text-3xl font-bold text-gray-600">{stats.sold}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <Link href="/dealership/inventory">
              <button className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700">
                Manage Inventory
              </button>
            </Link>
            <Link href="/">
              <button className="bg-gray-200 text-black font-bold px-6 py-3 rounded-lg hover:bg-gray-300">
                View Marketplace
              </button>
            </Link>
          </div>

          {/* Recent Vehicles */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-black">Recent Vehicles</h2>
            </div>
            <div className="p-6">
              {vehicles.length === 0 ? (
                <p className="text-black">No vehicles yet. Add your first car!</p>
              ) : (
                <div className="space-y-4">
                  {vehicles.slice(0, 5).map(vehicle => (
                    <div key={vehicle.id} className="flex justify-between items-center p-4 border rounded hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-black">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-gray-600">AED {vehicle.price?.toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                        vehicle.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vehicle.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
