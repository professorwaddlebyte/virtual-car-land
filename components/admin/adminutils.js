import { useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

export const NATIONALITIES = [
  "Japanese",
  "Korean",
  "German",
  "American",
  "British",
  "Italian",
  "French",
  "Swedish",
  "Chinese",
];

export const SPEC_GROUPS = [
  "Comfort & Seating",
  "Roof & Glass",
  "Infotainment & Tech",
  "Sound Systems",
  "Safety & Driver Assist",
  "Performance & Drivetrain",
  "Off-Road & Towing",
  "EV / Hybrid & Other",
];

// ── Helper functions ──────────────────────────────────────────────────────────

export function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function isExpiringSoon(dateStr, days = 30) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + days);
  return d > now && d <= soon;
}

export function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Shared UI components ──────────────────────────────────────────────────────

export function LicenseBadge({ expiry }) {
  if (!expiry) return <span className="text-gray-400 text-xs">No date</span>;
  if (isExpired(expiry))
    return (
      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        🔴 EXPIRED {fmtDate(expiry)}
      </span>
    );
  if (isExpiringSoon(expiry))
    return (
      <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        ⚠ Expiring {fmtDate(expiry)}
      </span>
    );
  return (
    <span className="text-xs text-gray-500">Valid until {fmtDate(expiry)}</span>
  );
}

export function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-bold" style={{ color: color || "#1A9988" }}>
        {value ?? "—"}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export function DeleteButton({ onConfirm }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm)
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={onConfirm}
          className="px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-500"
        >
          Cancel
        </button>
      </span>
    );
  return (
    <button
      onClick={() => setConfirm(true)}
      className="px-2 py-1 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 border border-red-100"
    >
      Delete
    </button>
  );
}



