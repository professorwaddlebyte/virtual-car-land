// pages/api/dealership/vehicles/index.js
// Dealership manages their own inventory

const { withAuth, requireOwnership } = require('../../../../lib/middleware');
const { mockData } = require('../../../../lib/db');
const { findDealershipById } = require('../../../../lib/auth');

// GET - List vehicles for this dealership
const getVehicles = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const dealershipId = req.user.profile_id;
    
    // Filter vehicles by dealership
    let vehicles = mockData.vehicles.filter(
      v => v.dealership_id === dealershipId
    );
    
    // Filter by status if provided
    if (status) {
      vehicles = vehicles.filter(v => v.status === status);
    }
    
    // Pagination
    const start = (page - 1) * limit;
    const paginated = vehicles.slice(start, start + parseInt(limit));
    
    return res.status(200).json({
      vehicles: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: vehicles.length,
        pages: Math.ceil(vehicles.length / limit),
      },
    });
  } catch (error) {
    console.error('Get dealership vehicles error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST - Add new vehicle
const createVehicle = async (req, res) => {
  try {
    const dealershipId = req.user.profile_id;
    const dealership = findDealershipById(dealershipId);
    
    if (!dealership) {
      return res.status(404).json({ error: 'Dealership not found' });
    }
    
    if (dealership.status !== 'active') {
      return res.status(403).json({ error: 'Dealership is not active' });
    }
    
    const {
      make,
      model,
      year,
      price,
      mileage,
      bodyType,
      fuelType,
      transmission,
      color,
      description,
      features = [],
      images = [],
    } = req.body;
    
    // Basic validation
    if (!make || !model || !year || !price) {
      return res.status(400).json({
        error: 'Make, model, year, and price are required'
      });
    }
    
    // Create new vehicle
    const newVehicle = {
      id: `v-${Date.now()}`,
      make,
      model,
      year: parseInt(year),
      price: parseFloat(price),
      mileage: mileage ? parseInt(mileage) : null,
      bodyType: bodyType || null,
      fuelType: fuelType || null,
      transmission: transmission || null,
      color: color || null,
      description: description || null,
      features: Array.isArray(features) ? features : [],
      images: Array.isArray(images) ? images : [],
      dealership_id: dealershipId,
      listing_type: 'dealership',
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockData.vehicles.push(newVehicle);
    
    return res.status(201).json({
      message: 'Vehicle added successfully',
      vehicle: newVehicle,
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Main handler
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(getVehicles, 'dealership')(req, res);
  }
  
  if (req.method === 'POST') {
    return withAuth(createVehicle, 'dealership')(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
