// pages/api/auth/login.js
// Unified login endpoint with role detection

const { comparePassword, generateToken, findUserByEmail, findUserByUsername, findDealershipById, verifyToken } = require('../../../lib/auth');
const { mockData } = require('../../../lib/db');

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, username, password } = req.body;

    // Validation
    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Email/username and password required' });
    }

    // Find user by email or username
    let user = null;
    if (email) {
      user = findUserByEmail(email);
    } else if (username) {
      user = findUserByUsername(username);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if active
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account suspended' });
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.last_login = new Date().toISOString();

    // Get additional profile info based on role
    let profile = null;
    if (user.role === 'dealership') {
      profile = findDealershipById(user.profile_id);
    }

    // Generate token
    const token = generateToken(user);

    // Build response
    const { password_hash, ...userWithoutPassword } = user;

    const response = {
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        profile: profile ? {
          business_name: profile.business_name,
          phone: profile.phone,
          address: profile.address,
          status: profile.status,
        } : null,
      },
      token,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
