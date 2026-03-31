export default function DawirnyLogo({ size = 'md', white = false }) {
  const heights = { sm: 32, md: 40, lg: 52 };
  const h = heights[size] || 40;

  if (white) {
    // On dark backgrounds — white pill background so logo colors don't wash out
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img src="/dawirny-logo.svg" alt="dawirny" style={{ height: h * 0.75, width: 'auto' }} />
        </div>
        <span style={{
          fontSize: h * 0.55,
          fontWeight: '700',
          color: 'white',
          letterSpacing: '-0.5px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          dawirny
        </span>
      </div>
    );
  }

  // On white/light backgrounds — logo directly, teal text
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <img src="/dawirny-logo.svg" alt="dawirny" style={{ height: h, width: 'auto' }} />
      <span style={{
        fontSize: h * 0.55,
        fontWeight: '700',
        color: '#1A9988',
        letterSpacing: '-0.5px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        dawirny
      </span>
    </div>
  );
}




