// pages/api/admin/dealerships/index.js
// REWRITTEN: removed all mockData references. Now queries NeonDB directly.

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../../../../lib/db';

function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === 'admin';
  } catch { return false; }
}

function generateTempPassword() {
  return Math.random().toString(36).slice(-10) + 'A1!';
}

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  // GET — list all dealers
  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const [rows, countRes] = await Promise.all([
        query(`
          SELECT
            d.id, d.business_name, d.phone, d.showroom_number,
            d.listing_integrity_score, d.score_tier, d.subscription_tier,
            d.telegram_chat_id, d.created_at,
            u.email, u.id AS user_id
          FROM dealers d
          JOIN users u ON u.id = d.user_id
          ORDER BY d.business_name
          LIMIT $1 OFFSET $2
        `, [parseInt(limit), offset]),
        query(`SELECT COUNT(*) AS total FROM dealers`),
      ]);

      const total = parseInt(countRes[0].total);
      return res.status(200).json({
        dealers: rows,
        pagination: {
          page: parseInt(page), limit: parseInt(limit),
          total, pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error('List dealers error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST — create new dealer + user account
  if (req.method === 'POST') {
    try {
      const { business_name, email, phone, showroom_number } = req.body;
      if (!business_name || !email) {
        return res.status(400).json({ error: 'business_name and email are required' });
      }

      // Check email not taken
      const existing = await query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
      if (existing.length) return res.status(409).json({ error: 'Email already registered' });

      const tempPassword = generateTempPassword();
      const password_hash = await bcrypt.hash(tempPassword, 10);

      // Insert user
      const userRows = await query(`
        INSERT INTO users (email, password_hash, role, full_name)
        VALUES ($1, $2, 'dealer', $3)
        RETURNING id, email, role
      `, [email.toLowerCase(), password_hash, business_name]);

      const user = userRows[0];

      // Insert dealer
      const dealerRows = await query(`
        INSERT INTO dealers (user_id, business_name, phone, showroom_number)
        VALUES ($1, $2, $3, $4)
        RETURNING id, business_name, phone, showroom_number
      `, [user.id, business_name, phone || null, showroom_number || null]);

      return res.status(201).json({
        message: 'Dealer created successfully',
        dealer: dealerRows[0],
        temp_password: tempPassword,
      });
    } catch (err) {
      console.error('Create dealer error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



