import { query } from '../../../../lib/db';
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

  if (req.method === 'GET') {
    const showrooms = await query(`
      SELECT s.*, d.business_name as dealer_name,
        COUNT(v.id) FILTER (WHERE v.status = 'active') as active_vehicles
      FROM showrooms s
      LEFT JOIN dealers d ON s.dealer_id = d.id
      LEFT JOIN vehicles v ON s.id = v.showroom_id
      GROUP BY s.id, d.business_name
      ORDER BY s.showroom_number
    `);
    return res.status(200).json({ showrooms });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


