import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;
  try {
    await query(`UPDATE vehicles SET saves_count = saves_count + 1 WHERE id = $1`, [id]);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
