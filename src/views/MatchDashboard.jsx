import React, { useState, useEffect } from 'react';
import FilterPanel, { FilterProvider } from '../components/FilterPanel';
import QuizWizard from '../components/QuizWizard';

// Mock data for demonstration
const mockVehicles = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&auto=format&fit=crop',
    make: 'Range Rover',
    model: 'Sport',
    year: 2022,
    price: 350000,
    mileage: 15000,
    location: 'Dubai',
    matchScore: 92,
    culturalAlignment: 0.85,
    culturalBadge: 'Popular with Emirati buyers',
    features: ['Sunroof/Panoramic roof', 'Leather seats', 'Advanced safety', 'Apple CarPlay/Android Auto'],
    bodyType: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'White',
    matchReasons: [
      {
        title: 'Matches Your Budget',
        description: 'AED 350,000 is within your target range of 120k-200k AED',
        matchStrength: 'High'
      },
      {
        title: 'Cultural Alignment',
        description: 'Range Rover is a top choice for Emirati luxury buyers',
        matchStrength: 'Very High'
      },
      {
        title: 'Feature Match',
        description: 'Has all 4 of your preferred features: Sunroof, Leather seats, Advanced safety, Apple CarPlay',
        matchStrength: 'Perfect'
      },
      {
        title: 'Body Type Match',
        description: 'SUV matches your preference for family daily driving',
        matchStrength: 'High'
      }
    ]
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1494972308805-46370c1c8d56?w=800&auto=format&fit=crop',
    make: 'Toyota',
    model: 'Land Cruiser',
    year: 2021,
    price: 280000,
    mileage: 25000,
    location: 'Abu Dhabi',
    matchScore: 88,
    culturalAlignment: 0.75,
    culturalBadge: 'Top choice for African buyers',
    features: ['Advanced safety', 'Third-row seating', 'Tow hitch'],
    bodyType: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    color: 'White',
    matchReasons: [
      {
        title: 'Cultural Preference',
        description: 'Toyota Land Cruiser is highly favored by African buyers in UAE',
        matchStrength: 'High'
      },
      {
        title: 'Practical Features',
        description: 'Includes third-row seating and tow hitch for family and utility needs',
        matchStrength: 'High'
      },
      {
        title: 'Budget Fit',
        description: 'AED 280,000 aligns well with your budget range',
        matchStrength: 'Medium'
      }
    ]
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4f04?w=800&auto=format&fit=crop',
    make: 'Tesla',
    model: 'Model S',
    year: 2023,
    price: 320000,
    mileage: 5000,
    location: 'Dubai',
    matchScore: 85,
    culturalAlignment: 0.65,
    culturalBadge: 'Trending with East Asian buyers',
    features: ['Apple CarPlay/Android Auto', 'Advanced safety', 'Performance'],
    bodyType: 'Sedan',
    fuelType: 'Electric',
    transmission: 'Automatic',
    color: 'Red',
    matchReasons: [
      {
        title: 'Eco-Friendly Choice',
        description: 'Electric vehicle matches your interest in fuel efficiency',
        matchStrength: 'High'
      },
      {
        title: 'Technology Match',
        description: 'Includes Apple CarPlay and advanced safety features you wanted',
        matchStrength: 'High'
      },
      {
        title: 'Cultural Trend',
        description: 'Tesla is trending among East Asian buyers in the region',
        matchStrength: 'Medium'
      }
    ]
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228d270f?w=800&auto=format&fit=crop',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2021,
    price: 180000,
    mileage: 35000,
    location: 'Sharjah',
    matchScore: 82,
    culturalAlignment: 0.7,
    culturalBadge: 'Popular with European buyers',
    features: ['Leather seats', 'Advanced safety', 'Apple CarPlay/Android Auto'],
    bodyType: 'Sedan',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Black',
    matchReasons: [
      {
        title: 'Luxury Preference',
        description: 'Mercedes-Benz aligns with your luxury statement preference',
        matchStrength: 'High'
      },
      {
        title: 'Feature Match',
        description: 'Includes leather seats and advanced safety systems',
        matchStrength: 'High'
      },
      {
        title: 'Cultural Fit',
        description: 'Popular choice among European expats in UAE',
        matchStrength: 'Medium'
      }
    ]
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1619767886557-6a76a6be7441?w-800&auto=format&fit=crop',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    price: 85000,
    mileage: 45000,
    location: 'Dubai',
    matchScore: 78,
    culturalAlignment: 0.8,
    culturalBadge: 'Highly rated by South Asian buyers',
    features: ['Fuel economy', 'Resale value'],
    bodyType: 'Sedan',
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    color: 'Silver',
    matchReasons: [
      {
        title: 'Budget Excellent Fit',
        description: 'AED 85,000 is exactly within your 80k-120k AED range',
        matchStrength: 'Perfect'
      },
      {
        title: 'Cultural Strong Match',
        description: 'Toyota Camry is the most trusted brand among South Asian buyers',
        matchStrength: 'Very High'
      },
      {
        title: 'Practical Features',
        description: 'Excellent fuel economy and high resale value as requested',
        matchStrength: 'High'
      }
    ]
  }
];

// Sample quiz answers for demonstration
const sampleQuizAnswers = {
  1: 'family', // Family daily driver
  2: ['safety', 'technology', 'comfort'], // Preferred features
  3: 'emirati', // Cultural preference
  4: '80k-120k', // Budget range
  5: ['sedan', 'suv'], // Body types
  6: ['sunroof', 'leather'], // Must-have features
  7: 'this_month' // Buying timeframe
};

const MatchDashboard = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(mockVehicles[0]);
  const [filters, setFilters] = useState({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState(sampleQuizAnswers);
  const [vehicles, setVehicles] = useState(mockVehicles);

  // Handle filter changes from FilterPanel
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    console.log('Filters updated:', newFilters);
    
    // In a real app, this would trigger API call to backend
    // For demo, we'll just filter our mock data
    const filteredVehicles = filterVehicles(mockVehicles, newFilters);
    setVehicles(filteredVehicles);
    
    // Update selected vehicle if it's no longer in filtered list
    if (!filteredVehicles.some(v => v.id === selectedVehicle.id) && filteredVehicles.length > 0) {
      setSelectedVehicle(filteredVehicles[0]);
    }
  };

  // Simple filtering logic for demo
  const filterVehicles = (vehicles, filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      return vehicles;
    }

    return vehicles.filter(vehicle => {
      if (filters.makes && filters.makes.length > 0 && !filters.makes.includes(vehicle.make)) {
        return false;
      }
      
      if (filters.models && filters.models.length > 0 && !filters.models.includes(vehicle.model)) {
        return false;
      }
      
      if (filters.bodyTypes && filters.bodyTypes.length > 0 && !filters.bodyTypes.includes(vehicle.bodyType)) {
        return false;
      }
      
      if (filters.fuelTypes && filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(vehicle.fuelType)) {
        return false;
      }
      
      if (filters.colors && filters.colors.length > 0 && !filters.colors.includes(vehicle.color)) {
        return false;
      }
      
      if (filters.priceRange && 
          (vehicle.price < filters.priceRange[0] || vehicle.price > filters.priceRange[1])) {
        return false;
      }
      
      if (filters.yearRange && 
          (vehicle.year < filters.yearRange[0] || vehicle.year > filters.yearRange[1])) {
        return false;
      }
      
      if (filters.mileageRange && 
          (vehicle.mileage < filters.mileageRange[0] || vehicle.mileage > filters.mileageRange[1])) {
        return false;
      }
      
      return true;
    });
  };

  // Handle quiz submission
  const handleQuizSubmit = (answers) => {
    setQuizAnswers(answers);
    setShowQuiz(false);
    console.log('Quiz answers received:', answers);
    
    // In a real app, this would call /api/v1/match/quiz endpoint
    // For demo, we'll just sort vehicles by match score
    const sortedVehicles = [...mockVehicles].sort((a, b) => b.matchScore - a.matchScore);
    setVehicles(sortedVehicles);
    setSelectedVehicle(sortedVehicles[0]);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get match strength color
  const getMatchStrengthColor = (strength) => {
    switch (strength) {
      case 'Perfect': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'Very High': return 'bg-gradient-to-r from-green-400 to-green-600';
      case 'High': return 'bg-gradient-to-r from-blue-500 to-dubai-blue';
      case 'Medium': return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'Low': return 'bg-gradient-to-r from-gray-400 to-gray-600';
      default: return 'bg-gradient-to-r from-dubai-blue to-dubai-gold';
    }
  };

  return (
    <FilterProvider onFilterChange={handleFilterChange}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-dubai-blue to-dubai-gold rounded-lg shadow-md">
                  <span className="text-white text-xl">🚗</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dubai Car Marketplace</h1>
                  <p className="text-sm text-gray-600">AI-Powered Car Matching</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowQuiz(!showQuiz)}
                  className="flex items-center gap-2 bg-gradient-to-r from-dubai-blue to-dubai-gold text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span>🎯</span>
                  {showQuiz ? 'Back to Results' : 'Take Matching Quiz'}
                </button>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{vehicles.length}</span> matches found
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showQuiz ? (
            // Quiz Mode
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Find Your Perfect Match</h2>
                  <p className="text-gray-600">Answer 7 questions to get personalized recommendations</p>
                </div>
                <button
                  onClick={() => setShowQuiz(false)}
                  className="px-4 py-2 text-gray-600 hover:text-dubai-blue hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Skip Quiz
                </button>
              </div>
              
              <QuizWizard />
            </div>
          ) : (
            // Dashboard Mode (3-column layout)
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column: Filter Panel */}
              <div className="lg:w-1/4">
                <div className="sticky top-24">
                  <FilterPanel onFilterChange={handleFilterChange} className="shadow-xl rounded-2xl" />
                  
                  {/* Quiz Summary Card */}
                  <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-dubai-blue to-dubai-gold rounded-lg">
                        <span className="text-white text-lg">🎯</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Your Quiz Profile</h3>
                        <p className="text-sm text-gray-600">Based on your preferences</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Budget</span>
                        <span className="text-sm font-semibold text-dubai-blue">80k-120k AED</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Primary Use</span>
                        <span className="text-sm font-semibold text-dubai-blue">Family daily driver</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cultural Preference</span>
                        <span className="text-sm font-semibold text-dubai-blue">Emirati luxury</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Features</span>
                        <span className="text-sm font-semibold text-dubai-blue">4 selected</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowQuiz(true)}
                      className="w-full mt-6 px+4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl border border-gray-200 hover:border-dubai-blue hover:text-dubai-blue hover:bg-gradient-to-r hover:from-dubai-blue/5 hover:to-dubai-gold/5 transition-all duration-300 font-semibold"
                    >
                      Update Quiz Answers
                    </button>
                  </div>
                </div>
              </div>

              {/* Middle Column: Match Cards */}
              <div className="lg:w-2/4">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Your Top Matches</h2>
                    <div className="text-sm text-gray-600">
                      Sorted by <span className="font-semibold text-dubai-blue">Match Score</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">
                    AI-powered matches based on your preferences and cultural alignment
                  </p>
                </div>

                <div className="space-y-6">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${selectedVehicle.id === vehicle.id ? 'border-dubai-blue' : 'border-transparent'}`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Vehicle Image */}
                          <div className="md:w-1/3">
                            <div className="relative h-48 md:h-full rounded-xl overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-dubai-blue/20 to-dubai-gold/20"></div>
                              <img
                                src={vehicle.image}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                className="w-full h-full object-cover"
                              />
                              {/* Match Score Badge */}
                              <div className="absolute top-4 left-4">
                                <div className={`px-3 py-1.5 rounded-full font-bold text-white ${vehicle.matchScore >= 90 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                  : vehicle.matchScore >= 80 
                                    ? 'bg-gradient-to-r from-dubai-blue to-dubai-gold'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                }`}>
                                  {vehicle.matchScore}% Match
                                </div>
                              </div>
                              
                              {/* Cultural Badge */}
                              {vehicle.culturalAlignment > 0.6 && (
                                <div className="absolute top-4 right-4">
                                  <div className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-sm">
                                    {vehicle.culturalBadge}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vehicle Details */}
                          <div className="md:w-2/3">
                            <div className="flex flex-col md:flex-row md:items-start justify-between">
                              <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                  {vehicle.make} {vehicle.model}
                                </h3>
                                <p className="text-gray-600">{vehicle.year} • {vehicle.mileage.toLocaleString()} km • {vehicle.location}</p>
                              </div>
                              <div className="mt-4 md:mt-0">
                                <div className="text-3xl font-bold text-dubai-blue">
                                  {formatCurrency(vehicle.price)}
                                </div>
                                <p className="text-sm text-gray-600">Negotiable</p>
                              </div>
                            </div>

                            {/* Feature Highlights */}
                            <div className="mt-4">
                              <h4 className="font-semibold text-gray-900 mb-2">Feature Highlights:</h4>
                              <div className="flex flex-wrap gap-2">
                                {vehicle.features.map((feature, index) => (
                                  <div
                                    key={index}
                                    className="px-3 py-1 bg-gradient-to-r from-dubai-blue/10 to-dubai-gold/10 text-dubai-blue rounded-full text-sm font-medium border border-dubai-blue/20"
                                  >
                                    {feature}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Body Type</div>
                                <div className="font-semibold text-gray-900">{vehicle.bodyType}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Fuel Type</div>
                                <div className="font-semibold text-gray-900">{vehicle.fuelType}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Transmission</div>
                                <div className="font-semibold text-gray-900">{vehicle.transmission}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Color</div>
                                <div className="font-semibold text-gray-900">{vehicle.color}</div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex gap-3">
                              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-dubai-blue to-dubai-gold text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                                💬 Contact Seller
                              </button>
                              <button className="flex-1 px-4 py-2 bg-white text-dubai-blue rounded-xl font-semibold border-2 border-dubai-blue hover:bg-dubai-blue/5 transition-all duration-300">
                                🔍 View Details
                              </button>
                              <button className="px-4 py-2 bg-white text-gray-700 rounded-xl font-semibold border border-gray-300 hover:border-dubai-blue hover:text-dubai-blue transition-all duration-300">
                                💖 Save
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {vehicles.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                      <div className="text-5xl mb-4">🚗</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No matches found</h3>
                      <p className="text-gray-600 mb-6">Try adjusting your filters or taking the quiz</p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => setShowQuiz(true)}
                          className="px-6 py-3 bg-gradient-to-r from-dubai-blue to-dubai-gold text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Take Matching Quiz
                        </button>
                        <button
                          onClick={() => {/* Reset filters */}}
                          className="px-6 py-3 bg-white text-dubai-blue rounded-xl font-semibold border-2 border-dubai-blue hover:bg-dubai-blue/5 transition-all duration-300"
                        >
                          Reset All Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Why This Matches You */}
              <div className="lg:w-1/4">
                <div className="sticky top-24">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-dubai-blue to-dubai-gold rounded-lg">
                        <span className="text-white text-lg">🎯</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Why This Matches You</h3>
                        <p className="text-sm text-gray-600">For {selectedVehicle.make} {selectedVehicle.model}</p>
                      </div>
                    </div>

                    {/* Match Score Breakdown */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold text-gray-900">
                          Overall Match: <span className="text-dubai-blue">{selectedVehicle.matchScore}%</span>
                        </div>
                        <div className="w-16 h-16 relative">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#E5E7EB"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="3"
                              strokeDasharray={`${selectedVehicle.matchScore}, 100`}
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0055A4" />
                                <stop offset="100%" stopColor="#FFD700" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-xl font-bold">{selectedVehicle.matchScore}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-700">Cultural Alignment</span>
                            <span className="text-sm font-semibold text-dubai-blue">
                              {Math.round(selectedVehicle.culturalAlignment * 100)}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-dubai-blue to-dubai-gold rounded-full"
                              style={{ width: `${selectedVehicle.culturalAlignment * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-700">Feature Match</span>
                            <span className="text-sm font-semibold text-dubai-blue">
                              {selectedVehicle.features.length}/4 Features
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-dubai-blue to-dubai-gold rounded-full"
                              style={{ width: `${(selectedVehicle.features.length / 4) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900">Match Breakdown:</h4>
                      
                      {selectedVehicle.matchReasons.map((reason, index) => (
                        <div 
                          key={index}
                          className="p-4 rounded-xl border border-gray-200 hover:border-dubai-blue transition-all duration-300"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getMatchStrengthColor(reason.matchStrength)}`}>
                              <span className="text-white text-sm font-bold">
                                {reason.matchStrength.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">{reason.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{reason.description}</p>
                              <div className="mt-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${reason.matchStrength === 'Perfect' ? 'bg-green-100 text-green-800' :
                                                  reason.matchStrength === 'Very High' ? 'bg-green-100 text-green-800' :
                                                  reason.matchStrength === 'High' ? 'bg-blue-100 text-blue-800' :
                                                  reason.matchStrength === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                  'bg-gray-100 text-gray-800'}`}>
                                  {reason.matchStrength} Match
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Feature Checklist */}
                    <div className="mt-8">
                      <h4 className="font-bold text-gray-900 mb-4">Feature Checklist:</h4>
                      <div className="space-y-3">
                        {['Sunroof/Panoramic roof', 'Leather seats', 'Advanced safety', 'Apple CarPlay/Android Auto', 'Third-row seating', 'Tow hitch'].map((feature) => (
                          <div key={feature} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedVehicle.features.includes(feature)
                                  ? 'bg-gradient-to-r from-dubai-blue to-dubai-gold border-transparent'
                                  : 'border-gray-300'
                                }`}>
                                {selectedVehicle.features.includes(feature) && (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                              </div>
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                            <div className={`text-sm font-semibold ${selectedVehicle.features.includes(feature)
                                ? 'text-green-600'
                                : 'text-gray-400'
                              }`}>
                              {selectedVehicle.features.includes(feature) ? '✓ Included' : '✗ Not included'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cultural Insights */}
                    {selectedVehicle.culturalAlignment > 0.6 && (
                      <div className="mt-8 p-4 bg-gradient-to-r from-dubai-blue/10 to-dubai-gold/10 rounded-xl border border-dubai-blue/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-gradient-to-br from-dubai-blue to-dubai-gold rounded-lg">
                            <span className="text-white">🌍</span>
                          </div>
                          <h5 className="font-bold text-gray-900">Cultural Insight</h5>
                        </div>
                        <p className="text-sm text-gray-700">
                          This vehicle has a <span className="font-semibold text-dubai-blue">{Math.round(selectedVehicle.culturalAlignment * 100)}% cultural alignment</span> based on purchase patterns from UAE buyers. {selectedVehicle.culturalBadge}
                        </p>
                      </div>
                    )}

                    {/* Call to Action */}
                    <button className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-dubai-blue to-dubai-gold text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      💬 Contact About This Vehicle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-dubai-blue to-dubai-gold rounded-lg">
                  <span className="text-white">🚗</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dubai Car Marketplace</p>
                  <p className="text-xs text-gray-500">AI-Powered Cultural-Aware Matching System</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Showing {vehicles.length} of {mockVehicles.length} total vehicles</p>
                <p className="text-xs text-gray-500 mt-1">Match scores calculated using AI algorithms</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </FilterProvider>
  );
};

export default MatchDashboard;

// Example usage for Next.js App Router or Pages Router
export const MatchDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <MatchDashboard />
    </div>
  );
};