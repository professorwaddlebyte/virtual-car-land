import quizScoring from '../../../lib/quizScoring';

// Mock vehicle data (fallback when database unavailable)
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
      description: 'Well-maintained family sedan with low mileage',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c2d7051be?w=800&q=80'
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
      description: 'Powerful SUV perfect for desert driving',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
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
      description: 'Brand new condition, perfect for daily commute',
    image: 'https://images.unsplash.com/photo-1623742629488-77c17082bc34?w=800&q=80'
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
      description: 'Reliable family SUV with diesel efficiency',
    image: 'https://images.unsplash.com/photo-1503376763036-066120622c74?w=800&q=80'
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
      description: 'Luxury SUV with all premium features',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d12931c?w=800&q=80'
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
      description: 'Executive luxury sedan in pristine condition',
    image: 'https://images.unsplash.com/photo-1618843479313-ac8729c9ca89?w=800&q=80'
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
      description: 'Luxury SUV with excellent off-road capabilities',
    image: 'https://images.unsplash.com/photo-1563178406-4d6968398ba9?w=800&q=80'
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
      description: 'Top-of-the-line luxury sedan',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80'
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
      description: 'Sporty sedan with excellent handling',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80'
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
      description: 'Premium German sedan with quattro drive',
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80'
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
      description: 'Elegant coupe with premium features',
    image: 'https://images.unsplash.com/photo-1618843479313-ac8729c9ca89?w=800&q=80'
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
      description: 'Iconic sports car in excellent condition',
    image: 'https://images.unsplash.com/photo-1503376763036-066120622c74?w=800&q=80'
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
      description: 'Fully electric SUV with latest tech',
    image: 'https://images.unsplash.com/photo-1560958089-b8a0a45f9bd4?w=800&q=80'
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
      description: 'Fuel-efficient hybrid perfect for city driving',
    image: 'https://images.unsplash.com/photo-1623742629488-77c17082bc34?w=800&q=80'
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
      description: 'Modern electric crossover with cutting-edge tech',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80'
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
      description: 'High-tech electric vehicle with fast charging',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80'
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
      description: 'Legendary off-road capability with luxury interior',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
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
      description: 'Powerful SUV with excellent desert performance',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
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
      description: 'Reliable off-roader with great value',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
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
      description: 'High-performance pickup truck for desert adventures',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
}
];

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
    const { answers, culturalPreferences } = req.body;
    
    // Validate request
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Quiz answers are required and must be an object'
      });
    }
    
    if (Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Quiz answers cannot be empty'
      });
    }
    
    // Calculate scores for all vehicles
    const scoredVehicles = MOCK_VEHICLES.map(vehicle => {
      const score = quizScoring.calculateQuizScore(answers, vehicle, culturalPreferences);
      return {
        ...vehicle,
        matchScore: score,
        matchPercentage: `${score}%`
      };
    });
    
    // Sort by score descending and take top 5
    const topMatches = scoredVehicles
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
    
    return res.status(200).json({
      success: true,
      count: topMatches.length,
      matches: topMatches
    });
    
  } catch (error) {
    console.error('Quiz matching error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate matches',
      message: error.message
    });
  }
}