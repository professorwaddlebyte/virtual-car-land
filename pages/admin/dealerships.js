import BackButton from "../../components/BackButton";
// pages/admin/dealerships.js
// Admin dealership management

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminDealerships() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [dealerships, setDealerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    phone: '',
    address: '',
    trade_license_number: '',
    username: '',
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/dealerships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create dealership');
        return;
      }

      setSuccess(`Dealership created! Temp password: ${data.temp_password}`);
      setFormData({
        business_name: '',
        business_email: '',
        phone: '',
        address: '',
        trade_license_number: '',
        username: '',
      });
      setShowForm(false);
      fetchDealerships(token);
    } catch (err) {
      setError('Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Suspend this dealership?')) return;

    try {
      const res = await fetch(`/api/admin/dealerships/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        fetchDealerships(token);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <>
      <Head>
        <title>Manage Dealerships | UAE Car Marketplace</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-gray-900 text-white px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <button className="text-sm text-white hover:text-gray-300">← Dashboard</button>
              </Link>
              <h1 className="text-xl font-bold">Manage Dealerships</h1>
            </div>
            <button onClick={handleLogout} className="text-sm text-white hover:text-gray-300">Logout</button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">All Dealerships ({dealerships.length})</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-[#0055A4] text-black font-bold px-4 py-2 rounded hover:bg-[#003d7a]"
            >
              {showForm ? 'Cancel' : '+ Add Dealership'}
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-3 rounded mb-4">{success}</div>}

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-4">Create New Dealership</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Name *</label>
                  <input
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="w-full border text-black bg-white rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.business_email}
                    onChange={(e) => setFormData({...formData, business_email: e.target.value})}
                    className="w-full border text-black bg-white rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Username *</label>
                  <input
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full border text-black bg-white rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border text-black bg-white rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full border text-black bg-white rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trade License</label>
                  <input
                    value={formData.trade_license_number}
                    onChange={(e) => setFormData({...formData, trade_license_number: e.target.value})}
                    className="w-full border text-black bg-white rounded px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <button type="submit" className="bg-green-600 text-black font-bold px-6 py-2 rounded hover:bg-green-700">
                    Create Dealership
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="divide-y">
              {dealerships.map(dealer => (
                <div key={dealer.id} className="p-6 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-lg">{dealer.business_name}</p>
                    <p className="text-sm text-gray-500">{dealer.business_email} | @{dealer.username}</p>
                    <p className="text-sm text-gray-400">{dealer.phone}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      dealer.status === 'active' ? 'bg-green-100 text-green-800' :
                      dealer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {dealer.status}
                    </span>
                    {dealer.status !== 'suspended' && (
                      <button
                        onClick={() => handleDelete(dealer.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
