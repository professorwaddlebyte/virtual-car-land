import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const users = await query(`
      SELECT 
        u.*,
        d.id as dealer_id,
        d.business_name,
        d.listing_integrity_score,
        d.score_tier,
        d.subscription_tier,
        d.telegram_chat_id
      FROM users u
      LEFT JOIN dealers d ON u.id = d.user_id
      WHERE u.email = $1
    `, [email]);

    if (!users.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query(`
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = $1
    `, [user.id]);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        dealerId: user.dealer_id || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        dealer_id: user.dealer_id,
        business_name: user.business_name,
        score_tier: user.score_tier,
        subscription_tier: user.subscription_tier,
        telegram_chat_id: user.telegram_chat_id
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}