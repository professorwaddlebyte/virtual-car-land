// lib/auth.js - Authentication utilities

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { mockData, initializeMockData } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-change-in-production';
const JWT_EXPIRY = '24h';
const BCRYPT_ROUNDS = 10;

// Initialize mock data
initializeMockData();

// Hash password
const hashPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

// Compare password
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    profileId: user.profile_id,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Get user from token
const getUserFromToken = (token) => {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  return mockData.users.find(u => u.id === decoded.userId);
};

// Find user by email
const findUserByEmail = (email) => {
  return mockData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

// Find user by username (dealership login)
const findUserByUsername = (username) => {
  const dealership = mockData.dealerships.find(
    d => d.username.toLowerCase() === username.toLowerCase()
  );
  if (!dealership) return null;
  return mockData.users.find(u => u.profile_id === dealership.id);
};

// Find user by ID
const findUserById = (id) => {
  return mockData.users.find(u => u.id === id);
};

// Find dealership by ID
const findDealershipById = (id) => {
  return mockData.dealerships.find(d => d.id === id);
};

// Check if user owns the dealership (for ownership verification)
const ownsDealership = (userId, dealershipId) => {
  const user = findUserById(userId);
  if (!user || user.role !== 'dealership') return false;
  return user.profile_id === dealershipId;
};

// Check if user owns the vehicle
const ownsVehicle = (userId, vehicleId) => {
  const user = findUserById(userId);
  if (!user) return false;
  
  const vehicle = mockData.vehicles.find(v => v.id === vehicleId);
  if (!vehicle) return false;
  
  // Admin owns everything
  if (user.role === 'admin') return true;
  
  // Dealership owns their vehicles
  if (user.role === 'dealership') {
    return vehicle.dealership_id === user.profile_id;
  }
  
  // Customers don't "own" vehicles in this context
  return false;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  getUserFromToken,
  findUserByEmail,
  findUserById,
  findDealershipById,
  ownsDealership,
  ownsVehicle,
  JWT_SECRET,
  JWT_EXPIRY,
};
