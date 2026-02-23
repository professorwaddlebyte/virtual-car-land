// Admin API for vehicle CRUD operations
const { getAllVehicles, insertVehicle, getVehicleById } = require('../../../lib/neondb');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const vehicles = await getAllVehicles();
      return res.status(200).json({ success: true, vehicles });
    }

    if (req.method === 'POST') {
      const vehicle = await insertVehicle(req.body);
      return res.status(201).json({ success: true, vehicle });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}