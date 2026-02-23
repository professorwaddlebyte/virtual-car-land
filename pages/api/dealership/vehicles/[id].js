// pages/api/dealership/vehicles/[id].js
// Dealership manages specific vehicle

const { withAuth } = require('../../../../lib/middleware');
const { mockData } = require('../../../../lib/db');

// GET - Get specific vehicle (ownership verified)
const getVehicle = async (req, res) => {
  try {
    const { id } = req.query;
    const dealershipId = req.user.profile_id;
    
    const vehicle = mockData.vehicles.find(
      v => v.id === id && v.dealership_id === dealershipId
    );
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found or not owned by you' });
    }
    
    return res.status(200).json({ vehicle });
  } catch (error) {
    console.error('Get vehicle error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT - Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.query;
    const dealershipId = req.user.profile_id;
    const updateData = req.body;
    
    const vehicleIndex = mockData.vehicles.findIndex(
      v => v.id === id && v.dealership_id === dealershipId
    );
    
    if (vehicleIndex === -1) {
      return res.status(404).json({ error: 'Vehicle not found or not owned by you' });
    }
    
    // Fields that can be updated
    const allowedUpdates = [
      'price',
      'mileage',
      'color',
      'description',
      'features',
      'images',
      'status',
    ];
    
    // Apply updates
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        mockData.vehicles[vehicleIndex][field] = updateData[field];
      }
    });
    
    mockData.vehicles[vehicleIndex].updated_at = new Date().toISOString();
    
    return res.status(200).json({
      message: 'Vehicle updated successfully',
      vehicle: mockData.vehicles[vehicleIndex],
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE - Remove vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.query;
    const dealershipId = req.user.profile_id;
    
    const vehicleIndex = mockData.vehicles.findIndex(
      v => v.id === id && v.dealership_id === dealershipId
    );
    
    if (vehicleIndex === -1) {
      return res.status(404).json({ error: 'Vehicle not found or not owned by you' });
    }
    
    // Remove from array
    mockData.vehicles.splice(vehicleIndex, 1);
    
    return res.status(200).json({
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Main handler
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(getVehicle, 'dealership')(req, res);
  }
  
  if (req.method === 'PUT') {
    return withAuth(updateVehicle, 'dealership')(req, res);
  }
  
  if (req.method === 'DELETE') {
    return withAuth(deleteVehicle, 'dealership')(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
