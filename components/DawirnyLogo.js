export default function DawirnyLogo({ size = 'md', white = false }) {
  const sizes = { sm: { h: 28, text: 18 }, md: { h: 36, text: 22 }, lg: { h: 48, text: 28 } };
  const s = sizes[size] || sizes.md;
  const teal = white ? 'white' : '#1A9988';
  const gray = white ? 'rgba(255,255,255,0.7)' : '#808080';
  const textColor = white ? 'white' : '#374151';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg height={s.h} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Car body */}
        <path d="M8 28 L8 22 L14 16 L36 16 L42 22 L42 28 Z" fill={teal} />
        {/* Car roof */}
        <path d="M15 16 L19 10 L31 10 L35 16 Z" fill={teal} />
        {/* Wheels */}
        <circle cx="16" cy="28" r="4" fill={white ? 'rgba(255,255,255,0.3)' : '#0d6b5e'} />
        <circle cx="16" cy="28" r="2" fill={white ? 'white' : '#f0faf9'} />
        <circle cx="34" cy="28" r="4" fill={white ? 'rgba(255,255,255,0.3)' : '#0d6b5e'} />
        <circle cx="34" cy="28" r="2" fill={white ? 'white' : '#f0faf9'} />
        {/* Location pin */}
        <circle cx="38" cy="18" r="6" fill={teal} stroke={white ? 'rgba(255,255,255,0.4)' : 'white'} strokeWidth="1.5" />
        <circle cx="38" cy="17" r="2.5" fill={white ? 'rgba(255,255,255,0.9)' : 'white'} />
        <path d="M38 22 L35.5 19 L40.5 19 Z" fill={teal} />
        {/* Wifi arcs */}
        <path d="M46 14 Q50 18 46 22" stroke={gray} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M49 11 Q55 18 49 25" stroke={gray} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M52 8 Q60 18 52 28" stroke={gray} strokeWidth="1" fill="none" strokeLinecap="round" strokeOpacity="0.5" />
      </svg>
      <span style={{ fontSize: s.text, fontWeight: '700', color: textColor, letterSpacing: '-0.5px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        dawirny
      </span>
    </div>
  );
}



