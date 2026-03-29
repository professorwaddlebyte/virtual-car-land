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
    const dealers = await query(`
      SELECT d.*, u.email,
        COUNT(v.id) FILTER (WHERE v.status = 'active') as active_listings
      FROM dealers d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON d.id = v.dealer_id
      GROUP BY d.id, u.email
      ORDER BY d.listing_integrity_score DESC
    `);
    return res.status(200).json({ dealers });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



