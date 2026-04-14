// pages/api/lookup.js
// Public endpoint — no auth required.
// Returns car_makes, car_colors, and car_specs (grouped) in one call.
// Used by: pages/index.js, pages/market/[id].js, pages/dealership/dashboard.js

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const [makesRes, colorsRes, specsRes] = await Promise.all([
      pool.query(`
        SELECT id, name, nationality, is_luxury
        FROM car_makes
        ORDER BY sort_order, name
      `),
      pool.query(`
        SELECT id, name
        FROM car_colors
        ORDER BY sort_order, name
      `),
      pool.query(`
        SELECT id, feature_name, group_name, sort_order
        FROM car_specs
        ORDER BY group_name, sort_order, feature_name
      `),
    ]);

    // Group specs by group_name for the FeaturesSelector component
    const specsByGroup = {};
    for (const row of specsRes.rows) {
      if (!specsByGroup[row.group_name]) {
        specsByGroup[row.group_name] = { label: row.group_name, features: [] };
      }
      specsByGroup[row.group_name].features.push(row.feature_name);
    }

    // Preserve the canonical group order
    const GROUP_ORDER = [
      'Comfort & Seating',
      'Roof & Glass',
      'Infotainment & Tech',
      'Sound Systems',
      'Safety & Driver Assist',
      'Performance & Drivetrain',
      'Off-Road & Towing',
      'EV / Hybrid & Other',
    ];
    const featureGroups = GROUP_ORDER
      .filter(g => specsByGroup[g])
      .map(g => specsByGroup[g]);

    // Also expose flat list for any component that needs it
    const allFeatures = specsRes.rows.map(r => r.feature_name);

    return res.status(200).json({
      makes:         makesRes.rows,   // [{ id, name, nationality, is_luxury }]
      colors:        colorsRes.rows,  // [{ id, name }]
      featureGroups,                  // [{ label, features: [] }]
      allFeatures,                    // flat string[]
    });

  } catch (err) {
    console.error('[lookup] DB error:', err);
    return res.status(500).json({ error: 'Failed to load lookup data' });
  }
}



