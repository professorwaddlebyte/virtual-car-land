// pages/admin/dealerships.js
// Admin dealership management
// - Pending tab with approve/reject
// - Active/suspended tabs
// - Expired license highlighted in red

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

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

// Modal to view full registration details for pending dealers
function PendingDetailModal({ dealer, onClose, onApprove, onReject, loading }) {
  if (!dealer) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{dealer.business_name}</h2>
            <p className="text-sm text-gray-500">Pending Registration Application</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {/* License */}
          <div>
            <h3 className="font-semibold text-gray-700 uppercase tracking-wide text-xs mb-3">Trade License</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">License #</span><p className="font-medium">{dealer.trade_license_number || '—'}</p></div>
              <div><span className="text-gray-500">Expiry</span><p><LicenseBadge expiry={dealer.trade_license_expiry} /></p></div>
            </div>
            {dealer.trade_license_url && (
              <a href={dealer.trade_license_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-[#0055A4] text-xs hover:underline">
                📄 View Trade License →
              </a>
            )}
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-gray-700 uppercase tracking-wide text-xs mb-3">Contact Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">Contact Person</span><p className="font-medium">{dealer.contact_person || '—'}</p></div>
              <div><span className="text-gray-500">Authorized Signatory</span><p className="font-medium">{dealer.authorized_signatory || '—'}</p></div>
              <div><span className="text-gray-500">Mobile</span><p className="font-medium">{dealer.phone || '—'}</p></div>
              <div><span className="text-gray-500">WhatsApp</span><p className="font-medium">{dealer.whatsapp_number || '—'}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Email</span><p className="font-medium">{dealer.email || '—'}</p></div>
            </div>
          </div>

          {/* Emirates ID */}
          <div>
            <h3 className="font-semibold text-gray-700 uppercase tracking-wide text-xs mb-3">Emirates ID</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div><span className="text-gray-500">ID Number</span><p className="font-medium">{dealer.emirates_id_number || '—'}</p></div>
              <div><span className="text-gray-500">Expiry</span><p><LicenseBadge expiry={dealer.emirates_id_expiry} /></p></div>
            </div>
            <div className="flex gap-3">
              {dealer.emirates_id_front_url && (
                <a href={dealer.emirates_id_front_url} target="_blank" rel="noopener noreferrer">
                  <img src={dealer.emirates_id_front_url} alt="ID Front" className="w-36 rounded border hover:opacity-80 transition" />
                  <span className="text-xs text-gray-400 block text-center mt-1">Front</span>
                </a>
              )}
              {dealer.emirates_id_back_url && (
                <a href={dealer.emirates_id_back_url} target="_blank" rel="noopener noreferrer">
                  <img src={dealer.emirates_id_back_url} alt="ID Back" className="w-36 rounded border hover:opacity-80 transition" />
                  <span className="text-xs text-gray-400 block text-center mt-1">Back</span>
                </a>
              )}
            </div>
          </div>

          {/* Showroom */}
          <div>
            <h3 className="font-semibold text-gray-700 uppercase tracking-wide text-xs mb-3">Showroom</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-500">Showroom #</span><p className="font-medium">{dealer.showroom_number || '—'}</p></div>
              <div><span className="text-gray-500">Section</span><p className="font-medium">{dealer.section || '—'}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Location</span><p className="font-medium">{dealer.location_hint || '—'}</p></div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            Close
          </button>
          <button onClick={() => onReject(dealer.id)} disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
            {loading === 'reject' ? 'Rejecting...' : '✗ Reject & Delete'}
          </button>
          <button onClick={() => onApprove(dealer.id)} disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
            {loading === 'approve' ? 'Approving...' : '✓ Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDealerships() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [dealerships, setDealerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [formData, setFormData] = useState({
    business_name: '', business_email: '', phone: '',
    address: '', trade_license_number: '', username: '',
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!t || !userData) { router.push('/login'); return; }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') { router.push('/login'); return; }
    setToken(t);
    fetchDealerships(t);
  }, []);

  const fetchDealerships = async (authToken) => {
    try {
      const res = await fetch('/api/admin/dealerships', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      setDealerships(data.dealerships || []);
    } catch (e) {
      console.error('Failed to fetch dealerships:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (dealerId) => {
    setActionLoading('approve');
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/approve-dealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ dealer_id: dealerId, action: 'approve' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setSelectedDealer(null);
        fetchDealerships(token);
        setActiveTab('active');
      } else {
        setError(data.error);
      }
    } catch { setError('Network error'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (dealerId) => {
    if (!confirm('Reject and permanently delete this application?')) return;
    setActionLoading('reject');
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/approve-dealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ dealer_id: dealerId, action: 'reject' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setSelectedDealer(null);
        fetchDealerships(token);
      } else {
        setError(data.error);
      }
    } catch { setError('Network error'); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async (id) => {
    if (!confirm('Suspend this dealership?')) return;
    try {
      const res = await fetch(`/api/admin/dealerships/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) fetchDealerships(token);
    } catch (err) { console.error('Suspend failed:', err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/dealerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create dealership'); return; }
      setSuccess(`Dealership created! Temp password: ${data.temp_password}`);
      setFormData({ business_name: '', business_email: '', phone: '', address: '', trade_license_number: '', username: '' });
      setShowForm(false);
      fetchDealerships(token);
    } catch { setError('Network error'); }
  };

  const pending = dealerships.filter(d => d.status === 'pending');
  const active = dealerships.filter(d => d.status === 'active');
  const suspended = dealerships.filter(d => d.status === 'suspended');

  const tabs = [
    { key: 'pending', label: 'Pending', count: pending.length, color: 'yellow' },
    { key: 'active', label: 'Active', count: active.length, color: 'green' },
    { key: 'suspended', label: 'Suspended', count: suspended.length, color: 'red' },
  ];

  const tabDealers = { pending, active, suspended }[activeTab] || [];

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <Head><title>Manage Dealerships | Admin</title></Head>

      <PendingDetailModal
        dealer={selectedDealer}
        onClose={() => setSelectedDealer(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={actionLoading}
      />

      <div className="min-h-screen bg-gray-50">
        <nav className="bg-gray-900 text-white px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <button className="text-sm text-white hover:text-gray-300">← Dashboard</button>
              </Link>
              <h1 className="text-xl font-bold">Manage Dealerships</h1>
            </div>
            <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/login'); }}
              className="text-sm text-white hover:text-gray-300">Logout</button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          {/* Alerts */}
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{success}</div>}

          {/* Header + Add button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">All Dealerships ({dealerships.length})</h2>
            <button onClick={() => setShowForm(!showForm)}
              className="bg-[#0055A4] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#003d7a] text-sm">
              {showForm ? 'Cancel' : '+ Add Manually'}
            </button>
          </div>

          {/* Manual create form */}
          {showForm && (
            <div className="bg-white p-6 rounded-xl shadow mb-6">
              <h3 className="text-lg font-semibold mb-4">Create Dealership Manually</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                {[
                  ['Business Name', 'business_name', 'text', true],
                  ['Email', 'business_email', 'email', true],
                  ['Username', 'username', 'text', true],
                  ['Phone', 'phone', 'text', false],
                  ['Address', 'address', 'text', false],
                  ['Trade License #', 'trade_license_number', 'text', false],
                ].map(([label, key, type, req]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">{label} {req && '*'}</label>
                    <input type={type} value={formData[key]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full border text-gray-900 bg-white rounded-lg px-3 py-2 text-sm" required={req} />
                  </div>
                ))}
                <div className="col-span-2">
                  <button type="submit" className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 text-sm">
                    Create Dealership
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pending banner */}
          {pending.length > 0 && activeTab !== 'pending' && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-4 flex items-center justify-between">
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

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
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
          <div className="bg-white rounded-xl shadow">
            {tabDealers.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="text-4xl mb-3">
                  {activeTab === 'pending' ? '✅' : activeTab === 'active' ? '🏪' : '🚫'}
                </div>
                <p className="font-medium">No {activeTab} dealerships</p>
              </div>
            ) : (
              <div className="divide-y">
                {tabDealers.map(dealer => {
                  const licExpired = isExpired(dealer.trade_license_expiry);
                  const idExpired = isExpired(dealer.emirates_id_expiry);
                  const hasIssue = licExpired || idExpired;

                  return (
                    <div key={dealer.id}
                      className={`p-5 flex justify-between items-start transition
                        ${hasIssue && activeTab === 'active' ? 'bg-red-50 border-l-4 border-red-400' : ''}`}>
                      <div className="flex-1">
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
                              className="px-3 py-1.5 bg-blue-50 text-[#0055A4] rounded-lg text-xs font-semibold hover:bg-blue-100 transition">
                              View Details
                            </button>
                            <button onClick={() => handleApprove(dealer.id)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition">
                              ✓ Approve
                            </button>
                            <button onClick={() => handleReject(dealer.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition">
                              ✗ Reject
                            </button>
                          </>
                        )}

                        {activeTab === 'active' && (
                          <button onClick={() => handleSuspend(dealer.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium">
                            Suspend
                          </button>
                        )}

                        {activeTab === 'suspended' && (
                          <span className="text-xs text-gray-400 italic">Suspended</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}




