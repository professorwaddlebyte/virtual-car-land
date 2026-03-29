import React, { useState } from 'react';
import FilterPanel, { FilterProvider } from './FilterPanel';
import './FilterPanel.module.css';

const FilterPanelExample = () => {
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  const handleFilterChange = (filters) => {
    console.log('Filters applied:', filters);
    setActiveFilters(filters);
    
    // In a real application, you would:
    // 1. Make API call with filter parameters
    // 2. Update search results
    // 3. Show loading state
    
    // For demo purposes, we'll just log and show a message
    const activeCount = Object.values(filters).reduce((count, value) => {
      if (Array.isArray(value)) return count + value.length;
      if (typeof value === 'object' && value !== null) return count + 1;
      if (typeof value === 'boolean' && value) return count + 1;
      return count;
    }, 0);
    
    console.log(`${activeCount} active filters`);
  };

  const mockCarData = [
    { id: 1, make: 'Toyota', model: 'Camry', year: 2022, price: 85000, mileage: 25000, location: 'Dubai', color: 'White' },
    { id: 2, make: 'Mercedes-Benz', model: 'C-Class', year: 2021, price: 180000, mileage: 15000, location: 'Abu Dhabi', color: 'Black' },
    { id: 3, make: 'Range Rover', model: 'Sport', year: 2020, price: 320000, mileage: 45000, location: 'Dubai', color: 'Silver' },
    { id: 4, make: 'BMW', model: 'X5', year: 2023, price: 280000, mileage: 10000, location: 'Sharjah', color: 'Blue' },
    { id: 5, make: 'Toyota', model: 'Land Cruiser', year: 2021, price: 220000, mileage: 35000, location: 'Dubai', color: 'White' },
    { id: 6, make: 'Audi', model: 'Q7', year: 2022, price: 290000, mileage: 20000, location: 'Abu Dhabi', color: 'Gray' },
  ];

  return (
    <FilterProvider onFilterChange={handleFilterChange}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              UAE Car Marketplace
            </h1>
            <p className="text-gray-600">
              Find your perfect car with AI-powered matching
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex justify-between items-center mb-4">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center gap-2 bg-gradient-to-r from-dubai-blue to-dubai-gold text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="text-lg">🔍</span>
              {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
            </button>
            <div className="text-sm text-gray-600">
              Showing {mockCarData.length} vehicles
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filter Panel - Desktop always visible, mobile conditional */}
            <div className={`
              ${showFilterPanel ? 'block' : 'hidden'} 
              lg:block lg:w-1/4
            `}>
              <FilterPanel 
                onFilterChange={handleFilterChange}
                className="lg:sticky lg:top-6"
              />
            </div>
            
            {/* Main Content Area */}
            <div className="lg:w-3/4">
              {/* Filter Summary */}
              <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Available Vehicles
                  </h2>
                  <div className="text-sm text-gray-600">
                    {mockCarData.length} vehicles found
                  </div>
                </div>
                
                {/* Active Filters Display */}
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Active Filters:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.makes && activeFilters.makes.length > 0 && (
                      <div className="bg-gradient-to-r from-dubai-blue/10 to-dubai-gold/10 text-dubai-blue px-3 py-1 rounded-full text-sm font-medium">
                        Makes: {activeFilters.makes.join(', ')}
                      </div>
                    )}
                    {activeFilters.yearRange && (
                      <div className="bg-gradient-to-r from-dubai-blue/10 to-dubai-gold/10 text-dubai-blue px-3 py-1 rounded-full text-sm font-medium">
                        Year: {activeFilters.yearRange[0]} - {activeFilters.yearRange[1]}
                      </div>
                    )}
                    {activeFilters.priceRange && (
                      <div className="bg-gradient-to-r from-dubai-blue/10 to-dubai-gold/10 text-dubai-blue px-3 py-1 rounded-full text-sm font-medium">
                        Price: {activeFilters.priceRange[0].toLocaleString()} - {activeFilters.priceRange[1].toLocaleString()} AED
                      </div>
                    )}
                    {activeFilters.accidentFreeOnly && (
                      <div className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Accident-Free Only
                      </div>
                    )}
                    {activeFilters.certifiedPreOwned && (
                      <div className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Certified Pre-Owned
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Car Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCarData.map(car => (
                  <div
                    key={car.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🚗</div>
                        <div className="text-gray-600 font-medium">{car.make} {car.model}</div>
                      </div>
                    </div>
                    
                    {/* Car Details */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {car.make} {car.model}
                          </h3>
                          <p className="text-gray-600 text-sm">{car.year}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-dubai-blue">
                            {car.price.toLocaleString()} AED
                          </div>
                          <div className="text-gray-600 text-sm">{car.mileage.toLocaleString()} km</div>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {car.location}
                        </div>
                        <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {car.color}
                        </div>
                        <div className="px-3 py-1 bg-gradient-to-r from-dubai-blue/10 to-dubai-gold/10 text-dubai-blue rounded-full text-sm font-medium">
                          Available
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-dubai-blue to-dubai-gold text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
                          View Details
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Demo Info */}
              <div className="mt-8 bg-gradient-to-r from-dubai-blue/5 to-dubai-gold/5 rounded-2xl p-6 border border-dubai-blue/20">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  How to use the filters:
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 w-2 h-2 bg-dubai-blue rounded-full"></div>
                    <span><strong>Basic Filters:</strong> Select car makes, models, year range, price range, and mileage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 w-2 h-2 bg-dubai-gold rounded-full"></div>
                    <span><strong>Advanced Filters:</strong> Filter by body type, fuel type, transmission, color, and location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    <span><strong>Trust Filters:</strong> Toggle accident-free, service history, certified pre-owned, and verified seller</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span><strong>Filter Chips:</strong> Selected filters appear as removable chips above the results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    <span><strong>Mobile Responsive:</strong> Filters collapse to a drawer on small screens</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-600 text-sm">
            <p>© 2026 UAE Car Marketplace. All rights reserved.</p>
            <p className="mt-1">Built with React & Tailwind CSS • Dubai Blue/Gold Theme</p>
          </div>
        </div>
      </div>
    </FilterProvider>
  );
};

export default FilterPanelExample;