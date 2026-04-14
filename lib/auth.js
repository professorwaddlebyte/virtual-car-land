// lib/auth.js — Authentication utilities
// Mock data references removed. All user lookups now happen in API routes via NeonDB.

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET || 'your-secret-change-in-production';
const JWT_EXPIRY  = '24h';
const BCRYPT_ROUNDS = 10;

// Hash a plaintext password
const hashPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

// Compare plaintext against a stored hash
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Sign a JWT for an authenticated user row from DB
const generateToken = (user) => {
  const payload = {
    userId:    user.id,
    email:     user.email,
    role:      user.role,
    profileId: user.profile_id,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Verify and decode a JWT — returns decoded payload or null
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

// Decode token without a DB lookup — use when you only need the payload
const getUserFromToken = (token) => {
  return verifyToken(token);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  getUserFromToken,
  JWT_SECRET,
  JWT_EXPIRY,
};



