// pages/api/auth/register.js
// REWRITTEN: removed all mockData references. Now inserts into NeonDB directly.
// Note: registration is not currently exposed in the UI — this is for future use.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, business_name, phone } = req.body;

    if (!email || !password || !business_name) {
      return res.status(400).json({ error: 'Email, password and business_name are required' });
    }

    // Check email not already used
    const existing = await query(
      `SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const userRows = await query(`
      INSERT INTO users (email, password_hash, role, full_name)
      VALUES ($1, $2, 'dealer', $3)
      RETURNING id, email, role
    `, [email.toLowerCase(), password_hash, business_name]);

    const user = userRows[0];

    // Insert dealer profile
    const dealerRows = await query(`
      INSERT INTO dealers (user_id, business_name, phone)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [user.id, business_name, phone || null]);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, dealerId: dealerRows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, business_name },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}




