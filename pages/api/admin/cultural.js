const { pool } = require('../../../lib/db');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM cultural_preferences ORDER BY nationality');
      const preferences = result.rows.map(row => ({
        nationality: row.nationality,
        preferredMakes: row.preferred_makes,
        preferredBodyTypes: row.preferred_body_types,
        preferredColors: row.preferred_colors,
        typicalBudgetMin: parseFloat(row.typical_budget_min),
        typicalBudgetMax: parseFloat(row.typical_budget_max),
        weight: parseFloat(row.weight),
        sampleSize: row.sample_size,
        updatedAt: row.updated_at
      }));
      return res.status(200).json({ success: true, preferences });
    }

    if (req.method === 'POST') {
      const { nationality, preferredMakes, preferredBodyTypes, preferredColors, typicalBudgetMin, typicalBudgetMax, weight, sampleSize } = req.body;
      await pool.query(
        `INSERT INTO cultural_preferences (nationality, preferred_makes, preferred_body_types, preferred_colors, typical_budget_min, typical_budget_max, weight, sample_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [nationality, preferredMakes, preferredBodyTypes, preferredColors, typicalBudgetMin, typicalBudgetMax, weight, sampleSize]
      );
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { nationality } = req.query;
      const { preferredMakes, preferredBodyTypes, preferredColors, typicalBudgetMin, typicalBudgetMax, weight, sampleSize } = req.body;
      await pool.query(
        `UPDATE cultural_preferences SET preferred_makes=$2, preferred_body_types=$3, preferred_colors=$4, typical_budget_min=$5, typical_budget_max=$6, weight=$7, sample_size=$8, updated_at=CURRENT_TIMESTAMP
         WHERE nationality=$1`,
        [nationality, preferredMakes, preferredBodyTypes, preferredColors, typicalBudgetMin, typicalBudgetMax, weight, sampleSize]
      );
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { nationality } = req.query;
      await pool.query('DELETE FROM cultural_preferences WHERE nationality=$1', [nationality]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Cultural API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}