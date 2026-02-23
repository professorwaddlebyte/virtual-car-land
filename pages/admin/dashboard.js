// pages/admin/dashboard.js
// Admin dashboard for managing dealerships

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [dealerships, setDealerships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    setToken(token);
    fetchDealerships(token);
  }, []);

  const fetchDealerships = async (authToken) => {
    try {
      const res = await fetch('/api/admin/dealerships', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      setDealerships(data.dealerships || []);
    } catch (error) {
      console.error('Failed to fetch dealerships:', error);
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
    total: dealerships.length,
    active: dealerships.filter(d => d.status === 'active').length,
    pending: dealerships.filter(d => d.status === 'pending').length,
    suspended: dealerships.filter(d => d.status === 'suspended').length,
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <>
      <Head>
        <title>Admin Dashboard | UAE Car Marketplace</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-gray-900 text-white px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-gray-400">UAE Car Marketplace</p>
            </div>
            <button onClick={handleLogout} className="text-sm text-white hover:text-gray-300">
              Logout
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Total Dealerships</p>
              <p className="text-3xl font-bold text-[#0055A4]">{stats.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Suspended</p>
              <p className="text-3xl font-bold text-red-600">{stats.suspended}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <Link href="/admin/dealerships">
              <button className="bg-[#0055A4] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#003d7a]">
                Manage Dealerships
              </button>
            </Link>
            <Link href="/">
              <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300">
                View Site
              </button>
            </Link>
          </div>

          {/* Recent Dealerships */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Recent Dealerships</h2>
            </div>
            <div className="p-6">
              {dealerships.length === 0 ? (
                <p className="text-gray-500">No dealerships yet.</p>
              ) : (
                <div className="space-y-4">
                  {dealerships.slice(0, 5).map(dealer => (
                    <div key={dealer.id} className="flex justify-between items-center p-4 border rounded hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{dealer.business_name}</p>
                        <p className="text-sm text-gray-500">{dealer.business_email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        dealer.status === 'active' ? 'bg-green-100 text-green-800' :
                        dealer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dealer.status}
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
