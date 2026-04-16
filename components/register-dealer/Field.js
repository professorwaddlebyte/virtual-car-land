// components/register-dealer/Field.js
// Form field wrapper component

export function Field({ label, required, error, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-black mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs mb-1" style={{ color: '#1A9988' }}>{hint}</p>}
      {children}
      {/* Error message with inline style to force red color */}
      {error && <p className="text-xs mt-1 flex items-start gap-1" style={{ color: '#dc2626' }}><span>⚠</span>{error}</p>}
    </div>
  );
}




