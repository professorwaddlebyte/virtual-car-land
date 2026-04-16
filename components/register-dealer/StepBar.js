// components/register-dealer/StepBar.js
// Step indicator component for dealer registration

import { TEAL } from './constants';

export function StepBar({ current, total }) {
  const labels = ['Business', 'Showroom', 'Contact', 'Emirates ID', 'Review'];
  
  return (
    <>
      {/* Desktop step bar */}
      <div className="hidden sm:flex items-center justify-center mb-8">
        {labels.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
                  style={{
                    backgroundColor: done ? '#16a34a' : active ? TEAL : 'white',
                    borderColor: done ? '#16a34a' : active ? TEAL : '#d1d5db',
                    color: done || active ? 'white' : '#9ca3af',
                  }}
                >
                  {done ? '✓' : step}
                </div>
                <span className="text-xs mt-1 font-medium" style={{ color: active ? TEAL : done ? '#16a34a' : '#9ca3af' }}>
                  {label}
                </span>
              </div>
              {i < total - 1 && (
                <div className="w-10 h-0.5 mx-1 mb-5" style={{ backgroundColor: done ? '#16a34a' : '#e5e7eb' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile step bar — compact dots + active label */}
      <div className="flex sm:hidden flex-col items-center mb-6 gap-2">
        <div className="flex items-center gap-1.5">
          {labels.map((label, i) => {
            const step = i + 1;
            const done = step < current;
            const active = step === current;
            return (
              <div key={step} className="flex items-center gap-1.5">
                <div
                  className="rounded-full flex items-center justify-center font-bold border-2 transition-all"
                  style={{
                    width: active ? 32 : 22,
                    height: active ? 32 : 22,
                    fontSize: active ? 13 : 11,
                    backgroundColor: done ? '#16a34a' : active ? TEAL : 'white',
                    borderColor: done ? '#16a34a' : active ? TEAL : '#d1d5db',
                    color: done || active ? 'white' : '#9ca3af',
                  }}
                >
                  {done ? '✓' : step}
                </div>
                {i < total - 1 && (
                  <div className="w-5 h-0.5" style={{ backgroundColor: done ? '#16a34a' : '#e5e7eb' }} />
                )}
              </div>
            );
          })}
        </div>
        <span className="text-sm font-semibold" style={{ color: TEAL }}>
          Step {current} of {total}: {labels[current - 1]}
        </span>
      </div>
    </>
  );
}





