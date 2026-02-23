const { pool } = require('../../../lib/db');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Read-only endpoint' });

  try {
    const result = await pool.query('SELECT * FROM user_quiz_answers ORDER BY created_at DESC LIMIT 100');
    const answers = result.rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      answers: row.answers,
      createdAt: row.created_at
    }));
    return res.status(200).json({ success: true, answers });
  } catch (error) {
    console.error('Quiz answers API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}