const { pool } = require('../../../lib/db');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT vf.*, v.make, v.model 
        FROM vehicle_features vf 
        JOIN vehicles v ON vf.vehicle_id = v.id 
        ORDER BY vf.vehicle_id, vf.feature
      `);
      return res.status(200).json({ success: true, features: result.rows });
    }

    if (req.method === 'POST') {
      const { vehicleId, feature } = req.body;
      await pool.query(
        'INSERT INTO vehicle_features (vehicle_id, feature) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [vehicleId, feature]
      );
      return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { vehicleId, feature } = req.query;
      await pool.query('DELETE FROM vehicle_features WHERE vehicle_id=$1 AND feature=$2', [vehicleId, feature]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Features API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}