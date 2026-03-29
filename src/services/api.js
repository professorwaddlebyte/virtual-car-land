// API Client Service for UAE Car Marketplace
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

class CarMarketplaceAPI {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Quiz-based matching
  async getQuizMatches(answers, culturalPreferences = { weight: 0.3 }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/match/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          culturalPreferences
        }),
      });

      if (!response.ok) {
        throw new Error(`Quiz API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Quiz match API error:', error);
      throw error;
    }
  }

  // Filter-based matching
  async getFilterMatches(filters) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/match/filters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`Filter API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Filter match API error:', error);
      throw error;
    }
  }

  // Get cultural preferences
  async getCulturalPreferences(nationality) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/match/cultural/${encodeURIComponent(nationality)}`);

      if (!response.ok) {
        throw new Error(`Cultural preferences API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cultural preferences API error:', error);
      throw error;
    }
  }

  // Get similar vehicles
  async getSimilarVehicles(vehicleId, limit = 5) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/match/similar/${vehicleId}?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`Similar vehicles API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Similar vehicles API error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }

  // Mock data fallback for development
  getMockQuizMatches() {
    return {
      success: true,
      count: 5,
      matches: [
        {
          id: 'V005',
          make: 'Range Rover',
          model: 'Sport',
          year: 2023,
          price: 350000,
          bodyType: 'SUV',
          color: 'White',
          matchScore: 87,
          matchPercentage: '87%',
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
          matchScore: 82,
          matchPercentage: '82%',
          mileage: 20000,
          location: 'Abu Dhabi',
          features: ['Leather seats', 'Advanced safety', 'Massage seats', 'Heads-up display', 'Burmester sound system'],
          description: 'Executive luxury sedan in pristine condition'
        },
        {
          id: 'V001',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          price: 85000,
          bodyType: 'Sedan',
          color: 'Silver',
          matchScore: 76,
          matchPercentage: '76%',
          mileage: 25000,
          location: 'Dubai',
          features: ['Apple CarPlay', 'Leather seats', 'Advanced safety', 'Sunroof'],
          description: 'Well-maintained family sedan with low mileage'
        },
        {
          id: 'V017',
          make: 'Toyota Land Cruiser',
          model: 'LC300',
          year: 2022,
          price: 210000,
          bodyType: '4x4',
          color: 'White',
          matchScore: 71,
          matchPercentage: '71%',
          mileage: 30000,
          location: 'Dubai',
          features: ['Four-wheel drive', 'Multi-terrain select', 'Crawl control', 'Tow hitch'],
          description: 'Legendary off-road capability with luxury interior'
        },
        {
          id: 'V013',
          make: 'Tesla',
          model: 'Model Y',
          year: 2023,
          price: 195000,
          bodyType: 'Electric SUV',
          color: 'White',
          matchScore: 68,
          matchPercentage: '68%',
          mileage: 8000,
          location: 'Dubai',
          features: ['Autopilot', 'Premium interior', 'Panoramic glass roof', 'Over-the-air updates'],
          description: 'Fully electric SUV with latest tech'
        }
      ]
    };
  }

  getMockFilterMatches() {
    return {
      success: true,
      totalCount: 25,
      pageCount: 10,
      hasMore: true,
      vehicles: [
        {
          id: 'V001',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          price: 85000,
          bodyType: 'Sedan',
          mileage: 25000,
          location: 'Dubai',
          features: ['Apple CarPlay', 'Leather seats', 'Advanced safety'],
          description: 'Well-maintained family sedan with low mileage'
        },
        {
          id: 'V002',
          make: 'Toyota',
          model: 'Land Cruiser',
          year: 2021,
          price: 220000,
          bodyType: 'SUV',
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
          mileage: 15000,
          location: 'Sharjah',
          features: ['Apple CarPlay', 'Climate control', 'Backup camera'],
          description: 'Brand new condition, perfect for daily commute'
        }
      ]
    };
  }
}

// Singleton instance
const api = new CarMarketplaceAPI();

export default api;