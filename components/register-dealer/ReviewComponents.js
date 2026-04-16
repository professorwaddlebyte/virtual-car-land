// components/register-dealer/ReviewComponents.js
// Review step components

import { LIGHT_BG, DARK_TEAL } from './constants';

export function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-semibold">{value}</span>
    </div>
  );
}

export function ReviewCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
      <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: LIGHT_BG, color: DARK_TEAL }}>
        {title}
      </div>
      <div className="px-4 py-1 bg-white">{children}</div>
    </div>
  );
}




