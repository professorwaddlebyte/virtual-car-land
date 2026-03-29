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
  const vehicles = await query(`
    SELECT v.*, d.business_name as dealer_name, s.showroom_number
    FROM vehicles v
    LEFT JOIN dealers d ON v.dealer_id = d.id
    LEFT JOIN showrooms s ON v.showroom_id = s.id
    WHERE v.status = 'pending'
    ORDER BY v.created_at DESC
  `);
  return res.status(200).json({ vehicles });
}


