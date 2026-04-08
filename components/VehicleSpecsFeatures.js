/**
 * VehicleSpecsFeatures — drop-in component for pages/vehicle/[id].js
 *
 * Usage:
 *   import VehicleSpecsFeatures from '../../components/VehicleSpecsFeatures';
 *   ...
 *   <VehicleSpecsFeatures vehicle={vehicle} />
 *
 * `vehicle` shape (all optional except id):
 *   {
 *     specs: {
 *       color, transmission, fuel, body, cylinders, gcc,
 *       features: string[]   ← array stored in specs.features
 *     },
 *     mileage_km, year, make, model
 *   }
 */

const FEATURE_GROUPS = [
  {
    label: 'Comfort & Seating',
    icon: '🪑',
    features: ['Leather seats','Heated seats','Cooled seats','Heated/cooled seats','Massage seats','Zero Gravity seats','Third-row seating','Premium interior','Carbon fiber interior'],
  },
  {
    label: 'Roof & Glass',
    icon: '☀️',
    features: ['Sunroof','Panoramic roof','Panoramic sunroof','Panoramic glass roof','Solar roof'],
  },
  {
    label: 'Infotainment & Tech',
    icon: '📱',
    features: ['Apple CarPlay','Touchscreen audio','MBUX infotainment','iDrive 7','Virtual cockpit','Gesture control','Wireless charging','Over-the-air updates','Autopilot'],
  },
  {
    label: 'Sound Systems',
    icon: '🔊',
    features: ['Bose sound system','Bowers & Wilkins sound','Burmester sound','Burmester sound system','Bang & Olufsen sound','Mark Levinson sound','Rockford sound system'],
  },
  {
    label: 'Safety & Driver Assist',
    icon: '🛡️',
    features: ['Advanced safety','Adaptive cruise control','Cruise control','Lane keep assist','Backup camera','Blind-spot view monitor','Heads-up display','Head-up display','Augmented reality HUD','Honda Sensing','ProPilot Assist','Pilot Assist','Keyless-go'],
  },
  {
    label: 'Performance & Drivetrain',
    icon: '⚙️',
    features: ['4WD','Four-wheel drive','Quattro AWD','Super Select 4WD','Sport mode','Sport suspension','Sport exhaust','Sport Chrono','PDK transmission','M Sport package','Ford Performance package','Magnetic ride control','Hydraulic body motion control','800V architecture','Fox shocks','Laser headlights'],
  },
  {
    label: 'Off-Road & Towing',
    icon: '🏔️',
    features: ['Crawl control','Multi-terrain select','Trail control','Baja mode','Tow hitch','Tow package'],
  },
  {
    label: 'EV / Hybrid & Other',
    icon: '⚡',
    features: ['Hybrid efficiency','Ultra-fast charging','V2L capability','Climate control','CleanZone air quality'],
  },
];

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function SpecPill({ label, value }) {
  if (!value && value !== false) return null;
  return (
    <div style={{ background: '#f0faf9', border: '1px solid #b2dfd9', borderRadius: 12, padding: '10px 14px', minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#5f9ea0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0d4f47' }}>{value}</div>
    </div>
  );
}

export default function VehicleSpecsFeatures({ vehicle }) {
  const specs = vehicle?.specs || {};
  const features = Array.isArray(specs.features) ? specs.features : [];

  // Build core specs list — only show what's present
  const coreSpecs = [
    specs.color        && { label: 'Color',        value: capitalize(specs.color) },
    specs.transmission && { label: 'Transmission', value: capitalize(specs.transmission) },
    specs.fuel         && { label: 'Fuel',         value: capitalize(specs.fuel) },
    specs.body         && { label: 'Body Type',    value: capitalize(specs.body) },
    specs.cylinders    && { label: 'Cylinders',    value: `${specs.cylinders} cyl` },
    vehicle?.mileage_km != null && { label: 'Mileage', value: `${Number(vehicle.mileage_km).toLocaleString()} km` },
    specs.gcc != null  && { label: 'Specs',        value: specs.gcc ? 'GCC' : 'Non-GCC' },
  ].filter(Boolean);

  // Filter feature groups to only those with at least one match
  const matchedGroups = FEATURE_GROUPS
    .map(g => ({ ...g, matched: g.features.filter(f => features.includes(f)) }))
    .filter(g => g.matched.length > 0);

  if (coreSpecs.length === 0 && features.length === 0) return null;

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* Core Specs Grid */}
      {coreSpecs.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Specifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {coreSpecs.map(s => <SpecPill key={s.label} label={s.label} value={s.value} />)}
          </div>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Features & Options</h3>
            <span style={{ background: '#1A9988', color: 'white', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 9px' }}>
              {features.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {matchedGroups.map(group => (
              <div key={group.label}>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{group.icon}</span>
                  <span>{group.label}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {group.matched.map(f => (
                    <span key={f} style={{
                      background: '#f0faf9',
                      border: '1.5px solid #1A9988',
                      color: '#0d6b5e',
                      borderRadius: 8,
                      padding: '5px 11px',
                      fontSize: 13,
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M2 6l3 3 5-5" stroke="#1A9988" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




