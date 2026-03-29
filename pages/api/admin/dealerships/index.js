// pages/api/admin/dealerships/index.js
// Admin CRUD operations for dealerships

const { hashPassword } = require('../../../../lib/auth');
const { mockData } = require('../../../../lib/db');
const { withAdmin } = require('../../../../lib/middleware');

// Generate random password
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-10) + 'A1!';
};

// GET - List all dealerships
const getDealerships = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let dealerships = [...mockData.dealerships];
    
    // Filter by status
    if (status) {
      dealerships = dealerships.filter(d => d.status === status);
    }
    
    // Pagination
    const start = (page - 1) * limit;
    const paginated = dealerships.slice(start, start + parseInt(limit));
    
    // Remove password hashes from response
    const safeDealerships = paginated.map(({ password_hash, ...dealer }) => dealer);
    
    return res.status(200).json({
      dealerships: safeDealerships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: dealerships.length,
        pages: Math.ceil(dealerships.length / limit),
      },
    });
  } catch (error) {
    console.error('Get dealerships error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST - Create new dealership
const createDealership = async (req, res) => {
  try {
    const { 
      business_name, 
      business_email, 
      phone, 
      address, 
      trade_license_number,
      username,
    } = req.body;
    
    // Validation
    if (!business_name || !business_email || !username) {
      return res.status(400).json({ 
        error: 'Business name, email, and username required' 
      });
    }
    
    // Check for duplicates
    const emailExists = mockData.dealerships.find(
      d => d.business_email.toLowerCase() === business_email.toLowerCase()
    );
    if (emailExists) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    const usernameExists = mockData.dealerships.find(
      d => d.username.toLowerCase() === username.toLowerCase()
    );
    if (usernameExists) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    // Generate temp password
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    
    // Create dealership
    const newDealership = {
      id: `dealer-${Date.now()}`,
      business_name,
      business_email: business_email.toLowerCase(),
      phone: phone || null,
      address: address || null,
      trade_license_number: trade_license_number || null,
      username: username.toLowerCase(),
      password_hash: passwordHash,
      status: 'active', // Auto-approve per requirements
      admin_id: req.user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockData.dealerships.push(newDealership);
    
    // Create corresponding user account
    const newUser = {
      id: `user-${newDealership.id}`,
      email: newDealership.business_email,
      password_hash: passwordHash,
      role: 'dealership',
      profile_id: newDealership.id,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    
    mockData.users.push(newUser);
    
    // Return without password hash
    const { password_hash, ...dealershipSafe } = newDealership;
    
    return res.status(201).json({
      message: 'Dealership created successfully',
      dealership: dealershipSafe,
      temp_password: tempPassword, // Only shown once at creation
    });
    
  } catch (error) {
    console.error('Create dealership error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Main handler
export default async function handler(req, res) {
  // Route based on method
  if (req.method === 'GET') {
    return withAdmin(getDealerships)(req, res);
  }
  
  if (req.method === 'POST') {
    return withAdmin(createDealership)(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
