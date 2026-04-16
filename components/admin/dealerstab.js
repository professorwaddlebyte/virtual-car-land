import { useState, useEffect } from "react";
import { isExpired, fmtDate, LicenseBadge } from "./adminutils";

function PendingDetailModal({ dealer, onClose, onApprove, onReject, loading, token }) {
  const [showroom, setShowroom] = useState(null);
  const [fetchingShowroom, setFetchingShowroom] = useState(false);

  useEffect(() => {
    if (dealer && dealer.id) {
      setFetchingShowroom(true);
      fetch(`/api/admin/showrooms?dealer_id=${dealer.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
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
            <h2 className="text-lg font-bold text-gray-900">
              {dealer.business_name}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              Pending Registration
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          {/* License */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Trade License
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">License #</span>
                <p className="font-semibold">
                  {dealer.trade_license_number || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Expiry</span>
                <p
                  className={`font-semibold ${isExpiredDate(dealer.trade_license_expiry) ? "text-red-600" : "text-gray-900"}`}
                >
                  {isExpiredDate(dealer.trade_license_expiry)
                    ? "🔴 EXPIRED — "
                    : ""}
                  {fmtDate(dealer.trade_license_expiry)}
                </p>
              </div>
            </div>
            {dealer.trade_license_url && (
              <a
                href={dealer.trade_license_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline"
                style={{ color: "#1A9988" }}
              >
                📄 View Trade License →
              </a>
            )}
          </div>
          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Contact Details
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Contact Person</span>
                <p className="font-semibold">
                  {dealer.contact_person || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Auth. Signatory</span>
                <p className="font-semibold">
                  {dealer.authorized_signatory || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Mobile</span>
                <p className="font-semibold">{dealer.phone || "—"}</p>
              </div>
              <div>
                <span className="text-gray-500">WhatsApp</span>
                <p className="font-semibold">
                  {dealer.whatsapp_number || "—"}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Email</span>
                <p className="font-semibold">{dealer.email || "—"}</p>
              </div>
            </div>
          </div>
          {/* Emirates ID */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Emirates ID
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <span className="text-gray-500">ID Number</span>
                <p className="font-semibold">
                  {dealer.emirates_id_number || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Expiry</span>
                <p
                  className={`font-semibold ${isExpiredDate(dealer.emirates_id_expiry) ? "text-red-600" : "text-gray-900"}`}
                >
                  {isExpiredDate(dealer.emirates_id_expiry)
                    ? "🔴 EXPIRED — "
                    : ""}
                  {fmtDate(dealer.emirates_id_expiry)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {dealer.emirates_id_front_url && (
                <a
                  href={dealer.emirates_id_front_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center"
                >
                  <img
                    src={dealer.emirates_id_front_url}
                    alt="ID Front"
                    className="w-36 rounded-lg border hover:opacity-80 transition object-cover"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">
                    Front
                  </span>
                </a>
              )}
              {dealer.emirates_id_back_url && (
                <a
                  href={dealer.emirates_id_back_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center"
                >
                  <img
                    src={dealer.emirates_id_back_url}
                    alt="ID Back"
                    className="w-36 rounded-lg border hover:opacity-80 transition object-cover"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">
                    Back
                  </span>
                </a>
              )}
            </div>
          </div>
          {/* Showroom */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Showroom
            </p>
            {fetchingShowroom ? (
              <div className="flex justify-center py-2">
                <div className="w-4 h-4 border-2 border-teal-100 border-t-[#1A9988] rounded-full animate-spin" />
              </div>
            ) : showroom ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Showroom #</span>
                  <p className="font-semibold">
                    {showroom.showroom_number || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Section</span>
                  <p className="font-semibold">{showroom.section || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Location Hint</span>
                  <p className="font-semibold">
                    {showroom.location_hint || "—"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-sm">
                No showroom assigned yet
              </p>
            )}
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => onReject(dealer.id)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100"
          >
            ✗ Reject & Delete
          </button>
          <button
            onClick={() => onApprove(dealer.id)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "#1A9988" }}
          >
            {loading === "approve" ? "Approving..." : "✓ Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditDealerModal({ dealer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: dealer?.id,
    business_name: dealer?.business_name || "",
    phone: dealer?.phone || "",
    listing_integrity_score: dealer?.listing_integrity_score || 50,
    subscription_tier: dealer?.subscription_tier || "Basic",
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
        <h2 className="text-lg font-bold mb-4">
          {dealer.id ? "✏️ Edit Dealer" : "+ New Dealer"}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) =>
                setFormData({ ...formData, business_name: e.target.value })
              }
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+971501234567"
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Integrity Score (0–100)
            </label>
            <input
              type="number"
              value={formData.listing_integrity_score}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  listing_integrity_score: parseInt(e.target.value) || 0,
                })
              }
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Subscription Tier
            </label>
            <select
              value={formData.subscription_tier}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subscription_tier: e.target.value,
                })
              }
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {["Basic", "Gold", "Platinum"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-gray-600 font-semibold bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white font-bold"
            style={{ background: "#1A9988", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DealersTab({ token }) {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingDealer, setEditingDealer] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDealers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dealers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDealers(data.dealers || []);
    } catch (e) {
      console.error("Failed to fetch dealers:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDealers();
  }, []);

  async function approveDealer(dealerId) {
    setActionLoading("approve");
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/approve-dealer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dealer_id: dealerId, action: "approve" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setSelectedDealer(null);
        loadDealers();
        setActiveTab("active");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectDealer(dealerId) {
    if (
      !confirm(
        "Reject and permanently delete this application? This cannot be undone.",
      )
    )
      return;
    setActionLoading("reject");
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/approve-dealer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dealer_id: dealerId, action: "reject" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setSelectedDealer(null);
        loadDealers();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function suspendDealer(id) {
    if (!confirm("Suspend this dealership?")) return;
    try {
      const res = await fetch(`/api/admin/dealers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadDealers();
    } catch (err) {
      console.error("Suspend failed:", err);
    }
  }

  async function saveDealer(dealer) {
    const method = dealer.id ? "PATCH" : "POST";
    const url = dealer.id
      ? `/api/admin/dealers/${dealer.id}`
      : "/api/admin/dealers";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dealer),
    });
    const d = await res.json();
    if (d.ok) {
      setEditingDealer(null);
      loadDealers();
      setSuccess(d.message || "Dealer updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } else alert("Failed: " + d.error);
  }

  const pending = dealers.filter((d) => d.status === "pending");
  const active = dealers.filter((d) => d.status === "active");
  const suspended = dealers.filter((d) => d.status === "suspended");

  const tabs = [
    { key: "pending", label: "Pending", count: pending.length, color: "yellow" },
    { key: "active", label: "Active", count: active.length, color: "green" },
    { key: "suspended", label: "Suspended", count: suspended.length, color: "red" },
  ];

  const tabDealers = { pending, active, suspended }[activeTab] || [];

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

      {/* Pending banner when on non-pending tab */}
      {pending.length > 0 && activeTab !== "pending" && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-yellow-900">
                {pending.length} application{pending.length > 1 ? "s" : ""}{" "}
                awaiting approval
              </p>
              <p className="text-xs text-yellow-700">
                New dealerships have submitted registration requests
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("pending")}
            className="text-sm font-semibold text-yellow-800 bg-yellow-200 px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition"
          >
            Review Now →
          </button>
        </div>
      )}

      {/* Header with Add button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Total: {dealers.length} dealers</p>
        <button
          onClick={() =>
            setEditingDealer({
              business_name: "",
              phone: "",
              listing_integrity_score: 50,
              subscription_tier: "Basic",
            })
          }
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: "#1A9988" }}
        >
          + Add Manually
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2
              ${activeTab === key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full
              ${
                color === "yellow"
                  ? "bg-yellow-100 text-yellow-700"
                  : color === "green"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Dealer list */}
      {tabDealers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">
            {activeTab === "pending"
              ? "✅"
              : activeTab === "active"
                ? "🏪"
                : "🚫"}
          </div>
          <p className="font-medium">No {activeTab} dealerships</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {tabDealers.map((dealer) => {
              const licExpired = isExpired(dealer.trade_license_expiry);
              const idExpired = isExpired(dealer.emirates_id_expiry);
              const hasIssue = licExpired || idExpired;

              return (
                <div
                  key={dealer.id}
                  className={`p-4 flex justify-between items-start transition
                    ${hasIssue && activeTab === "active" ? "bg-red-50 border-l-4 border-red-400" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 text-base">
                        {dealer.business_name}
                      </p>
                      {hasIssue && activeTab === "active" && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          ⚠ Document Issue
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 flex-wrap text-sm text-gray-500 mb-2">
                      {dealer.email && <span>✉ {dealer.email}</span>}
                      {dealer.phone && <span>📞 {dealer.phone}</span>}
                      {dealer.contact_person && (
                        <span>👤 {dealer.contact_person}</span>
                      )}
                    </div>

                    <div className="flex gap-3 flex-wrap text-xs">
                      <span className="flex items-center gap-1">
                        📋 License:{" "}
                        <LicenseBadge expiry={dealer.trade_license_expiry} />
                      </span>
                      {dealer.emirates_id_expiry && (
                        <span className="flex items-center gap-1">
                          🪪 Emirates ID:{" "}
                          <LicenseBadge expiry={dealer.emirates_id_expiry} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    {activeTab === "pending" && (
                      <>
                        <button
                          onClick={() => setSelectedDealer(dealer)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => approveDealer(dealer.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                          style={{ background: "#1A9988" }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => rejectDealer(dealer.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}

                    {activeTab === "active" && (
                      <>
                        <button
                          onClick={() => setEditingDealer(dealer)}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => suspendDealer(dealer.id)}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-50 text-red-500"
                        >
                          🗑️ Suspend
                        </button>
                      </>
                    )}

                    {activeTab === "suspended" && (
                      <span className="text-xs text-gray-400 italic">
                        Suspended
                      </span>
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



