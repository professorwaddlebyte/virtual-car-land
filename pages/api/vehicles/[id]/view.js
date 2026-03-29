import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    await query(`
      UPDATE vehicles SET views_count = views_count + 1 WHERE id = $1
    `, [id]);

    const vehicles = await query(
      'SELECT dealer_id, market_id FROM vehicles WHERE id = $1', [id]
    );

    if (vehicles.length) {
      const { dealer_id, market_id } = vehicles[0];
      await query(`
        INSERT INTO analytics_events (vehicle_id, dealer_id, market_id, event_type, metadata)
        VALUES ($1, $2, $3, 'view', $4)
      `, [id, dealer_id, market_id, JSON.stringify({ timestamp: new Date() })]);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

