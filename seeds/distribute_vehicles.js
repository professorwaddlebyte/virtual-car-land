// seeds/distribute_vehicles.js
// Distribute existing 30 vehicles among 3 mock dealerships

const fs = require('fs');
const path = require('path');

// Read existing mock vehicles from the current implementation
const mockVehicles = [
  // Original 30 vehicles - will assign 10 to each dealership
  { id: 'V001', make: 'Toyota', model: 'Camry', year: 2023, price: 95000, mileage: 15000, bodyType: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', color: 'White', description: 'Reliable family sedan with excellent fuel economy.', features: ['Bluetooth', 'Backup Camera', 'Cruise Control'], images: [] },
  { id: 'V002', make: 'Honda', model: 'Civic', year: 2022, price: 75000, mileage: 25000, bodyType: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', color: 'Silver', description: 'Compact sedan perfect for city driving.', features: ['Apple CarPlay', 'Android Auto', 'Lane Assist'], images: [] },
  { id: 'V003', make: 'BMW', model: 'X5', year: 2023, price: 280000, mileage: 8000, bodyType: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', color: 'Black', description: 'Luxury SUV with premium features.', features: ['Panoramic Sunroof', 'Leather Seats', 'Navigation', 'Parking Assist'], images: [] },
  { id: 'V004', make: 'Mercedes', model: 'C-Class', year: 2022, price: 180000, mileage: 12000, bodyType: 'Sedan', fuelType: 'Petrol', transmission: 'Automatic', color: 'Grey', description: 'Executive sedan with luxury appointments.', features: ['Heated Seats', 'Burmester Audio', 'Ambient Lighting'], images: [] },
  { id: 'V005', make: 'Toyota', model: 'Land Cruiser', year: 2023, price: 320000, mileage: 5000, bodyType: 'SUV', fuelType: 'Diesel', transmission: 'Automatic', color: 'White', description: 'Iconic off-road SUV with unmatched capability.', features: ['4WD', 'Terrain Select', 'Roof Rack'], images: [] },
  { id: 'V006', make: 'Nissan', model: 'Patrol', year: 2023, price: 300000, mileage: 6000, bodyType: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', color: 'Black', description: 'Powerful full-size SUV for families.', features: ['Premium Audio', 'Captain Seats', 'Off-road Package'], images: [] },
  { id: 'V007', make: 'Lexus', model: 'RX 350', year: 2023, price: 220000, mileage: 10000, bodyType: 'SUV', fuelType: 'Hybrid', transmission: 'Automatic', color: 'Silver', description: 'Premium hybrid SUV with refined comfort.', features: ['Hybrid Powertrain', 'Mark Levinson Audio', 'Heads-up Display'], images: [] },
  { id: 'V008', make: 'Hyundai', model: 'Tucson', year: 2023, price: 85000, mileage: 8000, bodyType: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', color: 'Blue', description: 'Modern compact SUV with bold styling.', features: ['Wireless Charging', 'Digital Cluster', 'Smart Trunk'], images: [] },
  { id: 'V009', make: 'Kia', model: 'Sportage', year: 2023, price: 78000, mileage: 9000, bodyType: 'SUV', fuelType: 'Petrol', transmission: 'Automatic', color: 'Red', description: 'Feature-packed compact SUV.', features: ['Dual Screens', 'Ventilated Seats', '360 Camera'], images: [] },
  { id: 'V010', make: 'Ford', model: 'Mustang', year: 2022, price: 190000, mileage: 15000, bodyType: 'Coupe', fuelType: 'Petrol', transmission: 'Manual', color: 'Red', description: 'American muscle car with iconic design.', features: ['V8 Engine', 'Track Mode', 'Recaro Seats'], images: [] },
];

// Assign vehicles to dealerships (10 each)
const dealerAssignments = {
  'dealer-001': mockVehicles.slice(0, 10).map((v, i) => ({ ...v, id: `V${String(i + 1).padStart(3, '0')}` })),
  'dealer-002': mockVehicles.slice(0, 10).map((v, i) => ({ ...v, id: `V${String(i + 11).padStart(3, '0')}`, make: v.make + ' ', model: 'New ' + v.model })),
  'dealer-003': mockVehicles.slice(0, 10).map((v, i) => ({ ...v, id: `V${String(i + 21).padStart(3, '0')}` })),
};

// Create distributions
const distributions = [];

Object.keys(dealerAssignments).forEach((dealerId, index) => {
  const vehicles = dealerAssignments[dealerId];
  
  const enhancedVehicles = vehicles.map((v, i) => ({
    ...v,
    id: `${dealerId}-V${String(i + 1).padStart(3, '0')}`,
    dealership_id: dealerId,
    listing_type: 'dealership',
    status: 'available',
    price: Math.floor(v.price * (0.9 + Math.random() * 0.2)), // slight price variation
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  
  distributions.push(...enhancedVehicles);
});

console.log('Vehicle Distribution:');
console.log('- Fast Motors Dubai (dealer-001): 10 vehicles');
console.log('- Prestige Auto Gallery (dealer-002): 10 vehicles');
console.log('- Al Batoul Motors (dealer-003): 10 vehicles');
console.log(`Total: ${distributions.length} vehicles distributed`);

// Export for use in main system
module.exports = {
  distributedVehicles: distributions,
  dealerAssignments,
};

console.log('\nSeed data ready for integration.');
