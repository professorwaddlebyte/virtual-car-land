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

  if (req.method === 'POST') {
    await query(`UPDATE vehicles SET status = 'active' WHERE id = $1`, [id]);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await query(`DELETE FROM vehicles WHERE id = $1`, [id]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



