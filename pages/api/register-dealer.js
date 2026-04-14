// pages/api/register-dealer.js
// Creates a pending dealer + showroom row after document validation passes.
// No auth required — public self-registration endpoint.

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    business_name, trade_license_number, trade_license_expiry, trade_license_url,
    market_id, showroom_number, section, location_hint, map_x, map_y,
    contact_person, authorized_signatory, phone, whatsapp_number, email,
    emirates_id_number, emirates_id_expiry, emirates_id_front_url, emirates_id_back_url,
  } = req.body;

  const required = {
    business_name, trade_license_number, trade_license_expiry, trade_license_url,
    market_id, showroom_number, section,
    contact_person, authorized_signatory, phone, email,
    emirates_id_number, emirates_id_expiry, emirates_id_front_url, emirates_id_back_url,
  };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

  // Duplicate check
  try {
    const dup = await pool.query(
      `SELECT id FROM dealers WHERE email = $1 OR trade_license_number = $2 LIMIT 1`,
      [email, trade_license_number]
    );
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'A dealership with this email or trade license number already exists. Contact admin if you believe this is an error.' });
    }
  } catch (e) {
    console.error('Dup check error:', e.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const dealerResult = await client.query(
      `INSERT INTO dealers (
        business_name, status,
        contact_person, authorized_signatory,
        phone, whatsapp_number, email,
        trade_license_number, trade_license_expiry, trade_license_url,
        emirates_id_number, emirates_id_expiry, emirates_id_front_url, emirates_id_back_url,
        subscription_tier, subscription_status,
        listing_integrity_score, score_tier,
        total_listings, total_sold, total_expired, response_rate
      ) VALUES (
        $1, 'pending', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        'Basic', 'inactive', 45, 'Unrated', 0, 0, 0, '0.00'
      ) RETURNING id`,
      [
        business_name, contact_person, authorized_signatory,
        phone, whatsapp_number || null, email,
        trade_license_number, trade_license_expiry, trade_license_url,
        emirates_id_number, emirates_id_expiry, emirates_id_front_url, emirates_id_back_url,
      ]
    );

    const dealerId = dealerResult.rows[0].id;

    await client.query(
      `INSERT INTO showrooms (market_id, dealer_id, showroom_number, section, location_hint, map_x, map_y)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [market_id, dealerId, showroom_number, section, location_hint || null,
       map_x ? parseFloat(map_x) : null, map_y ? parseFloat(map_y) : null]
    );

    await client.query('COMMIT');
    return res.status(201).json({ ok: true, message: 'Registration submitted successfully. Your application is pending admin approval.' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Register dealer error:', e.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  } finally {
    client.release();
  }
}



