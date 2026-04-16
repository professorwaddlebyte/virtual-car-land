// components/register-dealer/Buttons.js
// Button components

import { TEAL, DARK_TEAL } from './constants';

export function PrimaryBtn({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      style={{ backgroundColor: disabled ? '#9ca3af' : TEAL }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = DARK_TEAL; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = TEAL; }}
    >
      {children}
    </button>
  );
}




