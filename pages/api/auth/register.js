// pages/api/auth/register.js
// Role-based user registration

const { hashPassword, generateToken, findUserByEmail } = require('../../../lib/auth');
const { mockData } = require('../../../lib/db');

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, role = 'customer', business_name, phone, address } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if email exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Validate role
    const validRoles = ['customer', 'dealership'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user based on role
    let profileId = null;
    let newUser = null;

    if (role === 'dealership') {
      // Validate dealership fields
      if (!business_name) {
        return res.status(400).json({ error: 'Business name required for dealership' });
      }

      // Create dealership profile
      const dealershipId = `dealer-${Date.now()}`;
      const newDealership = {
        id: dealershipId,
        business_name,
        business_email: email,
        phone: phone || null,
        address: address || null,
        trade_license_number: null,
        username: email.split('@')[0],
        password_hash: passwordHash,
        status: 'active', // Auto-approve per requirements
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockData.dealerships.push(newDealership);
      profileId = dealershipId;
    }

    // Create user record
    newUser = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: role,
      profile_id: profileId,
      is_active: true,
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockData.users.push(newUser);

    // Generate token
    const token = generateToken(newUser);

    // Return success (without password)
    const { password_hash, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: 'Registration successful',
      user: userWithoutPassword,
      token,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
