import { query } from '../../../lib/db';
import jwt from 'jsonwebtoken';

function getAdmin(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user.role === 'admin' ? user : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  if (!getAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const [vehicles, dealers, showrooms, activity] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM vehicles WHERE status = 'active'`),
      query(`SELECT COUNT(*) as count FROM dealers`),
      query(`SELECT COUNT(*) as count FROM showrooms`),
      query(`
        SELECT
          COALESCE(SUM(views_count), 0) as views_30d,
          COALESCE(SUM(whatsapp_clicks), 0) as whatsapp_30d,
          COUNT(*) FILTER (WHERE status = 'sold' AND sold_at > NOW() - INTERVAL '30 days') as sold_this_month
        FROM vehicles
      `)
    ]);
    return res.status(200).json({
      active_vehicles: parseInt(vehicles[0].count),
      dealers: parseInt(dealers[0].count),
      showrooms: parseInt(showrooms[0].count),
      views_30d: parseInt(activity[0].views_30d),
      whatsapp_30d: parseInt(activity[0].whatsapp_30d),
      sold_this_month: parseInt(activity[0].sold_this_month),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}



