import quizScoring from '../../../lib/quizScoring';

// Mock vehicle data (shared with quiz endpoint)
const MOCK_VEHICLES = [
  // Toyota models (popular with South Asian buyers)
  {
      id: 'V001',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      price: 85000,
      bodyType: 'Sedan',
      color: 'Silver',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 25000,
      location: 'Dubai',
      features: ['Apple CarPlay', 'Leather seats', 'Advanced safety', 'Sunroof'],
      description: 'Well-maintained family sedan with low mileage'
  },
  {
      id: 'V002',
      make: 'Toyota',
      model: 'Land Cruiser',
      year: 2021,
      price: 220000,
      bodyType: 'SUV',
      color: 'White',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 45000,
      location: 'Abu Dhabi',
      features: ['Third-row seating', 'Panoramic roof', 'Apple CarPlay', 'Advanced safety', 'Tow hitch'],
      description: 'Powerful SUV perfect for desert driving'
  },
  {
      id: 'V003',
      make: 'Toyota',
      model: 'Corolla',
      year: 2023,
      price: 75000,
      bodyType: 'Sedan',
      color: 'Grey',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 15000,
      location: 'Sharjah',
      features: ['Apple CarPlay', 'Climate control', 'Backup camera'],
      description: 'Brand new condition, perfect for daily commute'
  },
  {
      id: 'V004',
      make: 'Toyota',
      model: 'Fortuner',
      year: 2020,
      price: 95000,
      bodyType: 'SUV',
      color: 'Black',
      fuelType: 'Diesel',
      transmission: 'Automatic',
      mileage: 60000,
      location: 'Dubai',
      features: ['Leather seats', 'Sunroof', 'Third-row seating'],
      description: 'Reliable family SUV with diesel efficiency'
  },
  
  // Luxury models (popular with Emirati buyers)
  {
      id: 'V005',
      make: 'Range Rover',
      model: 'Sport',
      year: 2023,
      price: 350000,
      bodyType: 'SUV',
      color: 'White',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 10000,
      location: 'Dubai',
      features: ['Panoramic roof', 'Massage seats', 'Advanced safety', 'Apple CarPlay', 'Heated seats', 'Cooled seats'],
      description: 'Luxury SUV with all premium features'
  },
  {
      id: 'V006',
      make: 'Mercedes-Benz',
      model: 'S-Class',
      year: 2022,
      price: 280000,
      bodyType: 'Luxury Sedan',
      color: 'Black',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 20000,
      location: 'Abu Dhabi',
      features: ['Leather seats', 'Advanced safety', 'Massage seats', 'Heads-up display', 'Burmester sound system'],
      description: 'Executive luxury sedan in pristine condition'
  },
  {
      id: 'V007',
      make: 'Lexus',
      model: 'LX570',
      year: 2021,
      price: 310000,
      bodyType: 'SUV',
      color: 'Beige',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 35000,
      location: 'Dubai',
      features: ['Third-row seating', 'Panoramic roof', 'Advanced safety', 'Mark Levinson sound'],
      description: 'Luxury SUV with excellent off-road capabilities'
  },
  {
      id: 'V008',
      make: 'BMW',
      model: '7 Series',
      year: 2023,
      price: 320000,
      bodyType: 'Luxury Sedan',
      color: 'Black',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 5000,
      location: 'Dubai',
      features: ['Apple CarPlay', 'Massage seats', 'Gesture control', 'Bowers & Wilkins sound'],
      description: 'Top-of-the-line luxury sedan'
  },
  
  // European performance models
  {
      id: 'V009',
      make: 'BMW',
      model: '3 Series',
      year: 2022,
      price: 180000,
      bodyType: 'Sport Sedan',
      color: 'Blue',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 30000,
      location: 'Dubai',
      features: ['Apple CarPlay', 'Sport mode', 'Heated seats', 'M Sport package'],
      description: 'Sporty sedan with excellent handling'
  },
  {
      id: 'V010',
      make: 'Audi',
      model: 'A4',
      year: 2023,
      price: 165000,
      bodyType: 'Sport Sedan',
      color: 'Red',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 12000,
      location: 'Abu Dhabi',
      features: ['Virtual cockpit', 'Apple CarPlay', 'Quattro AWD', 'Sport suspension'],
      description: 'Premium German sedan with quattro drive'
  },
  {
      id: 'V011',
      make: 'Mercedes-Benz',
      model: 'C-Class',
      year: 2022,
      price: 195000,
      bodyType: 'Coupe',
      color: 'Black',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 25000,
      location: 'Dubai',
      features: ['MBUX infotainment', 'Burmester sound', 'Panoramic roof', 'Keyless-go'],
      description: 'Elegant coupe with premium features'
  },
  {
      id: 'V012',
      make: 'Porsche',
      model: '911',
      year: 2021,
      price: 420000,
      bodyType: 'Coupe',
      color: 'Red',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 15000,
      location: 'Dubai',
      features: ['Sport Chrono', 'PDK transmission', 'Sport exhaust', 'Carbon fiber interior'],
      description: 'Iconic sports car in excellent condition'
  },
  
  // Hybrid/Electric models (popular with East Asian buyers)
  {
      id: 'V013',
      make: 'Tesla',
      model: 'Model Y',
      year: 2023,
      price: 195000,
      bodyType: 'Electric SUV',
      color: 'White',
      fuelType: 'Electric',
      transmission: 'Automatic',
      mileage: 8000,
      location: 'Dubai',
      features: ['Autopilot', 'Premium interior', 'Panoramic glass roof', 'Over-the-air updates'],
      description: 'Fully electric SUV with latest tech'
  },
  {
      id: 'V014',
      make: 'Toyota',
      model: 'Prius',
      year: 2022,
      price: 95000,
      bodyType: 'Hybrid',
      color: 'Grey',
      fuelType: 'Hybrid',
      transmission: 'Automatic',
      mileage: 35000,
      location: 'Sharjah',
      features: ['Hybrid efficiency', 'Apple CarPlay', 'Lane keep assist', 'Adaptive cruise control'],
      description: 'Fuel-efficient hybrid perfect for city driving'
  },
  {
      id: 'V015',
      make: 'Hyundai',
      model: 'Ioniq 5',
      year: 2023,
      price: 135000,
      bodyType: 'Electric',
      color: 'Silver',
      fuelType: 'Electric',
      transmission: 'Automatic',
      mileage: 12000,
      location: 'Dubai',
      features: ['Ultra-fast charging', 'Augmented reality HUD', 'Solar roof', 'V2L capability'],
      description: 'Modern electric crossover with cutting-edge tech'
  },
  {
      id: 'V016',
      make: 'Kia',
      model: 'EV6',
      year: 2023,
      price: 145000,
      bodyType: 'Electric',
      color: 'White',
      fuelType: 'Electric',
      transmission: 'Automatic',
      mileage: 10000,
      location: 'Abu Dhabi',
      features: ['800V architecture', 'Apple CarPlay', 'Heated/cooled seats', 'Head-up display'],
      description: 'High-tech electric vehicle with fast charging'
  },
  
  // 4x4/Off-road models (popular with African buyers)
  {
      id: 'V017',
      make: 'Toyota Land Cruiser',
      model: 'LC300',
      year: 2022,
      price: 210000,
      bodyType: '4x4',
      color: 'White',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 30000,
      location: 'Dubai',
      features: ['Four-wheel drive', 'Multi-terrain select', 'Crawl control', 'Tow hitch'],
      description: 'Legendary off-road capability with luxury interior'
  },
  {
      id: 'V018',
      make: 'Nissan',
      model: 'Patrol',
      year: 2021,
      price: 185000,
      bodyType: 'SUV',
      color: 'Black',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 45000,
      location: 'Abu Dhabi',
      features: ['4WD', 'Hydraulic body motion control', 'Bose sound system', 'Heated seats'],
      description: 'Powerful SUV with excellent desert performance'
  },
  {
      id: 'V019',
      make: 'Mitsubishi',
      model: 'Pajero',
      year: 2020,
      price: 125000,
      bodyType: 'SUV',
      color: 'Green',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: 55000,
      location: 'Sharjah',
      features: ['Super Select 4WD', 'Rockford sound system', 'Third-row seating', 'Sunroof'],
      description: 'Reliable off-roader with great value'
  },
  {
      id: 'V020',
      make: 'Ford',
      model: 'Ranger Raptor',
      year: 2023,
      price: 155000,
      bodyType: 'Pickup',
      color: 'White',
      fuelType: 'Diesel',
      transmission: 'Automatic',
      mileage: 20000,
      location: 'Dubai',
      features: ['Fox shocks', 'Baja mode', 'Ford Performance package', 'Trail control'],
      description: 'High-performance pickup truck for desert adventures'
  }
];

// Mock filtering function
function filterMockVehicles(filters) {
  let filtered = [...MOCK_VEHICLES];
  
  if (filters.make?.length > 0) {
    filtered = filtered.filter(v => filters.make.includes(v.make));
  }
  
  if (filters.minPrice) {
    filtered = filtered.filter(v => v.price >= filters.minPrice);
  }
  
  if (filters.maxPrice) {
    filtered = filtered.filter(v => v.price <= filters.maxPrice);
  }
  
  if (filters.bodyType?.length > 0) {
    filtered = filtered.filter(v => filters.bodyType.includes(v.bodyType));
  }
  
  if (filters.location?.length > 0) {
    filtered = filtered.filter(v => filters.location.includes(v.location));
  }
  
  if (filters.minYear) {
    filtered = filtered.filter(v => v.year >= filters.minYear);
  }
  
  if (filters.maxYear) {
    filtered = filtered.filter(v => v.year <= filters.maxYear);
  }
  
  if (filters.fuelType?.length > 0) {
    filtered = filtered.filter(v => filters.fuelType.includes(v.fuelType));
  }
  
  if (filters.transmission?.length > 0) {
    filtered = filtered.filter(v => filters.transmission.includes(v.transmission));
  }
  
  if (filters.maxMileage) {
    filtered = filtered.filter(v => v.mileage <= filters.maxMileage);
  }
  
  if (filters.features?.length > 0) {
    filtered = filtered.filter(v => 
      filters.features.some(feature => v.features.includes(feature))
    );
  }
  
  return filtered;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    const filters = req.body;
    
    // Validate request
    if (!filters || typeof filters !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Filters must be an object'
      });
    }
    
    // Validate pagination parameters
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;
    
    if (limit && (typeof limit !== 'number' || limit <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'limit must be a positive number'
      });
    }
    
    if (offset && (typeof offset !== 'number' || offset < 0)) {
      return res.status(400).json({
        success: false,
        error: 'offset must be a non-negative number'
      });
    }
    
    // Apply filters to mock data
    const filteredVehicles = filterMockVehicles(filters);
    const totalCount = filteredVehicles.length;
    const hasMore = offset + limit < totalCount;
    
    // Apply pagination
    const paginatedVehicles = filteredVehicles.slice(offset, offset + limit);
    
    return res.status(200).json({
      success: true,
      totalCount,
      pageCount: paginatedVehicles.length,
      hasMore,
      vehicles: paginatedVehicles.map(vehicle => ({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        bodyType: vehicle.bodyType,
        mileage: vehicle.mileage,
        location: vehicle.location,
        features: vehicle.features ? vehicle.features.slice(0, 3) : [],
        description: vehicle.description
      }))
    });
    
  } catch (error) {
    console.error('Filter matching error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to apply filters',
      message: error.message
    });
  }
}