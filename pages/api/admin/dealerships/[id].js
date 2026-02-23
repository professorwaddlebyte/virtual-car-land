// pages/api/admin/dealerships/[id].js
// Admin operations on specific dealership

const { withAdmin } = require('../../../../lib/middleware');
const { mockData } = require('../../../../lib/db');
const { findDealershipById } = require('../../../../lib/auth');

// GET - Get dealership by ID
const getDealership = async (req, res) => {
  try {
    const { id } = req.query;
    
    const dealership = findDealershipById(id);
    if (!dealership) {
      return res.status(404).json({ error: 'Dealership not found' });
    }
    
    // Remove password hash
    const { password_hash, ...safeDealership } = dealership;
    
    return res.status(200).json({ dealership: safeDealership });
  } catch (error) {
    console.error('Get dealership error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT - Update dealership
const updateDealership = async (req, res) => {
  try {
    const { id } = req.query;
    const updateData = req.body;
    
    const dealershipIndex = mockData.dealerships.findIndex(d => d.id === id);
    if (dealershipIndex === -1) {
      return res.status(404).json({ error: 'Dealership not found' });
    }
    
    // Fields that can be updated
    const allowedUpdates = [
      'business_name',
      'phone',
      'address',
      'trade_license_number',
      'status',
    ];
    
    // Apply updates
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        mockData.dealerships[dealershipIndex][field] = updateData[field];
      }
    });
    
    mockData.dealerships[dealershipIndex].updated_at = new Date().toISOString();
    
    // Remove password hash from response
    const { password_hash, ...safeDealership } = mockData.dealerships[dealershipIndex];
    
    return res.status(200).json({
      message: 'Dealership updated successfully',
      dealership: safeDealership,
    });
  } catch (error) {
    console.error('Update dealership error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE - Deactivate/suspend dealership (soft delete)
const deleteDealership = async (req, res) => {
  try {
    const { id } = req.query;
    
    const dealershipIndex = mockData.dealerships.findIndex(d => d.id === id);
    if (dealershipIndex === -1) {
      return res.status(404).json({ error: 'Dealership not found' });
    }
    
    // Soft delete - change status to suspended
    mockData.dealerships[dealershipIndex].status = 'suspended';
    mockData.dealerships[dealershipIndex].updated_at = new Date().toISOString();
    
    // Also deactivate user account
    const userIndex = mockData.users.findIndex(u => u.profile_id === id);
    if (userIndex !== -1) {
      mockData.users[userIndex].is_active = false;
    }
    
    return res.status(200).json({
      message: 'Dealership suspended successfully',
    });
  } catch (error) {
    console.error('Delete dealership error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Main handler
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return withAdmin(getDealership)(req, res);
  }
  
  if (req.method === 'PUT') {
    return withAdmin(updateDealership)(req, res);
  }
  
  if (req.method === 'DELETE') {
    return withAdmin(deleteDealership)(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
