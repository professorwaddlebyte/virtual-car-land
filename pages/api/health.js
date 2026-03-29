import { query } from '../../lib/db';
import { runIntegrityEngine } from '../../lib/integrityEngine';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const markets = await query('SELECT id, name, city FROM markets LIMIT 5');
    const vehicleCount = await query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'active'");
    const dealerCount = await query('SELECT COUNT(*) as count FROM dealers');
    const showroomCount = await query('SELECT COUNT(*) as count FROM showrooms');
    const engineResult = await runIntegrityEngine();
    return res.status(200).json({
      status: 'healthy',
      database: 'connected',
      markets,
      active_vehicles: parseInt(vehicleCount[0]?.count || 0),
      dealers: parseInt(dealerCount[0]?.count || 0),
      showrooms: parseInt(showroomCount[0]?.count || 0),
      integrity_engine: engineResult
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: error.message
    });
  }
}


