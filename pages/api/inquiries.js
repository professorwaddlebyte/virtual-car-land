import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vehicle_id, inquiry_type, buyer_session_id } = req.body;

  if (!vehicle_id || !inquiry_type) {
    return res.status(400).json({ error: 'vehicle_id and inquiry_type required' });
  }

  try {
    const vehicles = await query(
      'SELECT dealer_id, market_id FROM vehicles WHERE id = $1',
      [vehicle_id]
    );

    if (!vehicles.length) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const { dealer_id, market_id } = vehicles[0];

    await query(`
      INSERT INTO inquiries (vehicle_id, dealer_id, buyer_session_id, inquiry_type)
      VALUES ($1, $2, $3, $4)
    `, [vehicle_id, dealer_id, buyer_session_id || null, inquiry_type]);

    if (inquiry_type === 'whatsapp_click') {
      await query(`
        UPDATE vehicles SET whatsapp_clicks = whatsapp_clicks + 1 WHERE id = $1
      `, [vehicle_id]);
    }

    await query(`
      INSERT INTO analytics_events (vehicle_id, dealer_id, market_id, event_type, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [vehicle_id, dealer_id, market_id, inquiry_type, JSON.stringify({ timestamp: new Date() })]);

    return res.status(200).json({ ok: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
