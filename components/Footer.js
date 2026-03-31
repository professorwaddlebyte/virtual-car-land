import DawirnyLogo from './DawirnyLogo';

export default function Footer() {
  return (
    <footer style={{ background: '#1A9988' }} className="py-8 text-center mt-8 w-full">
      <div className="flex justify-center mb-3">
        <DawirnyLogo size="sm" white={true} />
      </div>
      <p className="text-white text-sm">
        © 2026 dawirny. UAE's smart car marketplace.
      </p>
      <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-xs mt-1">
        Dubai Auto Market — Ras Al Khor, Dubai
      </p>
    </footer>
  );
}



