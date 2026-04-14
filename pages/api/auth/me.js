// pages/api/auth/me.js
// FIXED: removed mock data references (findDealershipById, is_active check).
// Now decodes JWT and queries NeonDB directly for fresh dealer profile.

import jwt from 'jsonwebtoken';
import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // For dealers: fetch fresh profile from DB
    if (decoded.role === 'dealer') {
      const rows = await query(`
        SELECT
          u.id, u.email, u.role, u.full_name,
          d.id              AS dealer_id,
          d.business_name,
          d.phone,
          d.showroom_number,
          d.listing_integrity_score,
          d.score_tier,
          d.subscription_tier,
          d.telegram_chat_id
        FROM users u
        JOIN dealers d ON d.user_id = u.id
        WHERE u.id = $1
      `, [decoded.userId]);

      if (!rows.length) {
        return res.status(401).json({ error: 'User not found' });
      }

      const r = rows[0];
      return res.status(200).json({
        dealer: {
          id:                      r.dealer_id,
          user_id:                 r.id,
          email:                   r.email,
          full_name:               r.full_name,
          business_name:           r.business_name,
          phone:                   r.phone,
          showroom_number:         r.showroom_number,
          listing_integrity_score: r.listing_integrity_score,
          score_tier:              r.score_tier,
          subscription_tier:       r.subscription_tier,
          telegram_chat_id:        r.telegram_chat_id,
        }
      });
    }

    // For admin: just return token payload
    if (decoded.role === 'admin') {
      return res.status(200).json({
        user: {
          id:    decoded.userId,
          email: decoded.email,
          role:  decoded.role,
        }
      });
    }

    return res.status(403).json({ error: 'Unknown role' });

  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}




