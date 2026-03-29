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
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { showroom_number, section, location_hint, map_x, map_y } = req.body;
    await query(`
      UPDATE showrooms SET
        showroom_number = COALESCE($1, showroom_number),
        section = COALESCE($2, section),
        location_hint = COALESCE($3, location_hint),
        map_x = COALESCE($4, map_x),
        map_y = COALESCE($5, map_y)
      WHERE id = $6
    `, [showroom_number, section, location_hint, map_x ? parseFloat(map_x) : null, map_y ? parseFloat(map_y) : null, id]);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM showrooms WHERE id = $1`, [id]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


