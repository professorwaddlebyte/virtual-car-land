// pages/api/auth/me.js
// Get current user info from token

const { getUserFromToken, findDealershipById } = require('../../../lib/auth');

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Get user from token
    const user = getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account suspended' });
    }

    // Get profile info
    let profile = null;
    if (user.role === 'dealership') {
      profile = findDealershipById(user.profile_id);
    }

    // Build response
    const { password_hash, ...userWithoutPassword } = user;

    return res.status(200).json({
      user: {
        ...userWithoutPassword,
        profile: profile ? {
          id: profile.id,
          business_name: profile.business_name,
          phone: profile.phone,
          address: profile.address,
          status: profile.status,
          trade_license_number: profile.trade_license_number,
        } : null,
      },
    });

  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
