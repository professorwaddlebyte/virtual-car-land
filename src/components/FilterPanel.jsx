import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

// ============================================================================
// Filter Context for Global State Management
// ============================================================================

const FilterContext = createContext();

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children, onFilterChange }) => {
  // Initial filter state
  const [filters, setFilters] = useState({
    // Basic Filters
    makes: [],
    models: [],
    yearRange: [1990, 2026],
    priceRange: [10000, 500000],
    mileageRange: [0, 200000],
    
    // Advanced Filters
    bodyTypes: [],
    fuelTypes: [],
    transmission: [],
    colors: [],
    locations: [],
    
    // Trust Filters
    accidentFreeOnly: false,
    serviceHistoryAvailable: false,
    certifiedPreOwned: false,
    verifiedSeller: false,
  });

  // Sample data for dropdowns
  const [makeModels, setMakeModels] = useState({
    'Toyota': ['Camry', 'Corolla', 'Land Cruiser', 'Prado', 'Hilux'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLS'],
    'BMW': ['3 Series', '5 Series', '7 Series', 'X5', 'X7'],
    'Audi': ['A4', 'A6', 'Q7', 'Q8'],
    'Range Rover': ['Sport', 'Velar', 'Evoque'],
    'Lexus': ['ES', 'LS', 'RX', 'LX'],
    'Honda': ['Accord', 'Civic', 'CR-V'],
    'Nissan': ['Patrol', 'Altima', 'Sunny'],
    'Hyundai': ['Sonata', 'Elantra', 'Tucson'],
    'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  });

  const availableLocations = [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
    'Fujairah', 'Umm Al Quwain', 'Al Ain'
  ];

  const availableColors = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#000000' },
    { name: 'Silver', value: '#C0C0C0' },
    { name: 'Gray', value: '#808080' },
    { name: 'Blue', value: '#007AFF' },
    { name: 'Red', value: '#FF3B30' },
    { name: 'Green', value: '#34C759' },
    { name: 'Brown', value: '#A2845E' },
    { name: 'Gold', value: '#FFD700' },
    { name: 'Beige', value: '#F5F5DC' },
  ];

  // Update models when makes change
  useEffect(() => {
    const newModels = [];
    filters.makes.forEach(make => {
      if (makeModels[make]) {
        newModels.push(...makeModels[make]);
      }
    });
    setFilters(prev => ({ ...prev, models: [] }));
  }, [filters.makes, makeModels]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      makes: [],
      models: [],
      yearRange: [1990, 2026],
      priceRange: [10000, 500000],
      mileageRange: [0, 200000],
      bodyTypes: [],
      fuelTypes: [],
      transmission: [],
      colors: [],
      locations: [],
      accidentFreeOnly: false,
      serviceHistoryAvailable: false,
      certifiedPreOwned: false,
      verifiedSeller: false,
    });
  }, []);

  // Notify parent when filters change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const value = {
    filters,
    setFilters,
    makeModels,
    availableLocations,
    availableColors,
    resetFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

// ============================================================================
// Main FilterPanel Component
// ============================================================================

const FilterPanel = ({ onFilterChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: true,
    trust: true,
  });

  const {
    filters,
    setFilters,
    makeModels,
    availableLocations,
    availableColors,
    resetFilters,
  } = useFilter();

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Update filter functions
  const updateBasicFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateAdvancedFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateTrustFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Remove filter chip
  const removeChip = (type, value) => {
    if (type === 'make') {
      setFilters(prev => ({
        ...prev,
        makes: prev.makes.filter(make => make !== value),
      }));
    } else if (type === 'model') {
      setFilters(prev => ({
        ...prev,
        models: prev.models.filter(model => model !== value),
      }));
    } else if (type === 'bodyType') {
      setFilters(prev => ({
        ...prev,
        bodyTypes: prev.bodyTypes.filter(bodyType => bodyType !== value),
      }));
    } else if (type === 'fuelType') {
      setFilters(prev => ({
        ...prev,
        fuelTypes: prev.fuelTypes.filter(fuelType => fuelType !== value),
      }));
    } else if (type === 'color') {
      setFilters(prev => ({
        ...prev,
        colors: prev.colors.filter(color => color !== value),
      }));
    } else if (type === 'location') {
      setFilters(prev => ({
        ...prev,
        locations: prev.locations.filter(location => location !== value),
      }));
    }
  };

  // Format number for display
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  // Get filter chips for display
  const filterChips = [
    ...filters.makes.map(make => ({ type: 'make', label: make, value: make })),
    ...filters.models.map(model => ({ type: 'model', label: model, value: model })),
    ...filters.bodyTypes.map(bodyType => ({ type: 'bodyType', label: bodyType, value: bodyType })),
    ...filters.fuelTypes.map(fuelType => ({ type: 'fuelType', label: fuelType, value: fuelType })),
    ...filters.colors.map(color => ({ type: 'color', label: color, value: color })),
    ...filters.locations.map(location => ({ type: 'location', label: location, value: location })),
    ...(filters.yearRange[0] > 1990 || filters.yearRange[1] < 2026 ? [
      { type: 'year', label: `Year: ${filters.yearRange[0]}-${filters.yearRange[1]}`, value: 'year' }
    ] : []),
    ...(filters.priceRange[0] > 10000 || filters.priceRange[1] < 500000 ? [
      { type: 'price', label: `Price: ${formatNumber(filters.priceRange[0])}-${formatNumber(filters.priceRange[1])} AED`, value: 'price' }
    ] : []),
    ...(filters.mileageRange[0] > 0 || filters.mileageRange[1] < 200000 ? [
      { type: 'mileage', label: `Mileage: ${formatNumber(filters.mileageRange[0])}-${formatNumber(filters.mileageRange[1])} km`, value: 'mileage' }
    ] : []),
    ...(filters.accidentFreeOnly ? [{ type: 'trust', label: 'Accident-Free Only', value: 'accidentFreeOnly' }] : []),
    ...(filters.serviceHistoryAvailable ? [{ type: 'trust', label: 'Service History Available', value: 'serviceHistoryAvailable' }] : []),
    ...(filters.certifiedPreOwned ? [{ type: 'trust', label: 'Certified Pre-Owned', value: 'certifiedPreOwned' }] : []),
    ...(filters.verifiedSeller ? [{ type: 'trust', label: 'Verified Seller', value: 'verifiedSeller' }] : []),
  ];

  // Toggle mobile drawer
  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleDrawer}
          className="flex items-center gap-2 bg-gradient-to-r from-dubai-blue to-dubai-gold text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <span className="text-lg">🔍</span>
          <span className="font-semibold">Filters ({filterChips.length})</span>
        </button>
      </div>

      {/* Filter Chips Display */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip, index) => (
            <div
              key={`${chip.type}-${index}`}
              className="flex items-center gap-1 bg-gradient-to-r from-dubai-blue/10 to-dubai-gold/10 text-dubai-blue px-3 py-1.5 rounded-full border border-dubai-blue/20 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => removeChip(chip.type, chip.value)}
            >
              <span className="text-sm font-medium">{chip.label}</span>
              <span className="text-dubai-blue/60 group-hover:text-dubai-blue transition-colors">×</span>
            </div>
          ))}
          {filterChips.length > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-dubai-blue px-3 py-1.5 rounded-full border border-gray-300 hover:border-dubai-blue transition-all duration-200"
            >
              <span className="text-sm">×</span>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <div className={`
        ${className}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:relative inset-y-0 left-0 z-40 w-80 lg:w-72 xl:w-80
        bg-white/95 backdrop-blur-lg lg:bg-transparent
        border-r border-gray-200 lg:border-none
        shadow-2xl lg:shadow-lg
        transition-transform duration-300 ease-in-out
        overflow-y-auto h-screen lg:h-auto
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-dubai-blue to-dubai-gold rounded-lg shadow-md">
                <span className="text-white text-xl">🔍</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Filter Cars</h2>
                <p className="text-sm text-gray-600">{filterChips.length} filters active</p>
              </div>
            </div>
            <button
              onClick={toggleDrawer}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl border border-gray-200 hover:border-dubai-blue hover:text-dubai-blue hover:bg-gradient-to-r hover:from-dubai-blue/5 hover:to-dubai-gold/5 transition-all duration-300 font-semibold"
          >
            Reset All Filters
          </button>

          {/* Basic Filters Section */}
          <div className="mb-8">
            <div
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => toggleSection('basic')}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-dubai-blue to-dubai-gold rounded-lg">
                  <span className="text-white text-lg">🚗</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Filters</h3>
              </div>
              {expandedSections.basic ? (
                <span className="text-gray-400 text-lg">▲</span>
              ) : (
                <span className="text-gray-400 text-lg">▼</span>
              )}
            </div>

            {expandedSections.basic && (
              <div className="space-y-6 pl-2">
                {/* Make Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(makeModels).map(make => (
                      <button
                        key={make}
                        onClick={() => {
                          const newMakes = filters.makes.includes(make)
                            ? filters.makes.filter(m => m !== make)
                            : [...filters.makes, make];
                          updateBasicFilter('makes', newMakes);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${filters.makes.includes(make)
                            ? 'bg-gradient-to-r from-dubai-blue to-dubai-gold text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {make}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model Selector */}
                {filters.makes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {filters.makes.flatMap(make => 
                        makeModels[make]?.map(model => (
                          <button
                            key={`${make}-${model}`}
                            onClick={() => {
                              const newModels = filters.models.includes(model)
                                ? filters.models.filter(m => m !== model)
                                : [...filters.models, model];
                              updateBasicFilter('models', newModels);
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${filters.models.includes(model)
                                ? 'bg-gradient-to-r from-dubai-blue/80 to-dubai-gold/80 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {model}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Year Range Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Range: {filters.yearRange[0]} - {filters.yearRange[1]}
                  </label>
                  <div className="relative pt-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-1 bg-gray-200 w-full rounded-full"></div>
                      <div 
                        className="absolute h-1 bg-gradient-to-r from-dubai-blue to-dubai-gold rounded-full"
                        style={{
                          left: `${((filters.yearRange[0] - 1990) / 36) * 100}%`,
                          right: `${100 - ((filters.yearRange[1] - 1990) / 36) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="relative flex justify-between">
                      <input
                        type="range"
                        min="1990"
                        max="2026"
                        value={filters.yearRange[0]}
                        onChange={(e) => updateBasicFilter('yearRange', [parseInt(e.target.value), filters.yearRange[1]])}
                        className="absolute w-full h-2 opacity-0 cursor-pointer"
                      />
                      <input
                        type="range"
                        min="1990"
                        max="2026"
                        value={filters.yearRange[1]}
                        onChange={(e) => updateBasicFilter('yearRange', [filters.yearRange[0], parseInt(e.target.value)])}
                        className="absolute w-full h-2 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between mt-4">
                      <div className="text-sm text-gray-600">1990</div>
                      <div className="text-sm text-gray-600">2026</div>
                    </div>
                  </div>
                </div>

                {/* Price Range Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range: {formatNumber(filters.priceRange[0])} - {formatNumber(filters.priceRange[1])} AED
                  </label>
                  <div className="relative pt-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-1 bg-gray-200 w-full rounded-full"></div>
                      <div 
                        className="absolute h-1 bg-gradient-to-r from-dubai-blue to-dubai-gold rounded-full"
                        style={{
                          left: `${((filters.priceRange[0] - 10000) / 490000) * 100}%`,
                          right: `${100 - ((filters.priceRange[1] - 10000) / 490000) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="relative flex justify-between">
                      <input
                        type="range"
                        min="10000"
                        max="500000"
                        step="1000"
                        value={filters.priceRange[0]}
                        onChange={(e) => updateBasicFilter('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                        className="absolute w-full h1 rounded-full opacity-0 cursor-pointer"
                      />
                      <input
                        type="range"
                        min="10000"
                        max="500000"
                        step="1000"
                        value={filters.priceRange[1]}
                        onChange={(e) => updateBasicFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                        className="absolute w-full h-2 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between mt-4">
                      <div className="text-sm text-gray-600">10K AED</div>
                      <div className="text-sm text-gray-600">500K AED</div>
                    </div>
                  </div>
                </div>

                {/* Mileage Range Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mileage: {formatNumber(filters.mileageRange[0])} - {formatNumber(filters.mileageRange[1])} km
                  </label>
                  <div className="relative pt-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-1 bg-gray-200 w-full rounded-full"></div>
                      <div 
                        className="absolute h-1 bg-gradient-to-r from-dubai-blue to-dubai-gold rounded-full"
                        style={{
                          left: `${(filters.mileageRange[0] / 200000) * 100}%`,
                          right: `${100 - (filters.mileageRange[1] / 200000) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="relative flex justify-between">
                      <input
                        type="range"
                        min="0"
                        max="200000"
                        step="1000"
                        value={filters.mileageRange[0]}
                        onChange={(e) => updateBasicFilter('mileageRange', [parseInt(e.target.value), filters.mileageRange[1]])}
                        className="absolute w-full h-2 opacity-0 cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="200000"
                        step="1000"
                        value={filters.mileageRange[1]}
                        onChange={(e) => updateBasicFilter('mileageRange', [filters.mileageRange[0], parseInt(e.target.value)])}
                        className="absolute w-full h-2 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between mt-4">
                      <div className="text-sm text-gray-600">0 km</div>
                      <div className="text-sm text-gray-600">200K km</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Filters Section */}
          <div className="mb-8">
            <div
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => toggleSection('advanced')}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-dubai-blue to-dubai-gold rounded-lg">
                  <span className="text-white text-lg">⚙️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
              </div>
              {expandedSections.advanced ? (
                <span className="text-gray-400 text-lg">▲</span>
              ) : (
                <span className="text-gray-400 text-lg">▼</span>
              )}
            </div>

            {expandedSections.advanced && (
              <div className="space-y-6 pl-2">
                {/* Body Type Checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Body Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Sedan', 'SUV', 'Coupe', 'Convertible', 'Pickup', 'Minivan'].map(bodyType => (
                      <label
                        key={bodyType}
                        className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-dubai-blue hover:bg-gradient-to-r hover:from-dubai-blue/5 hover:to-dubai-gold/5 transition-all duration-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.bodyTypes.includes(bodyType)}
                          onChange={(e) => {
                            const newBodyTypes = e.target.checked
                              ? [...filters.bodyTypes, bodyType]
                              : filters.bodyTypes.filter(type => type !== bodyType);
                            updateAdvancedFilter('bodyTypes', newBodyTypes);
                          }}
                          className="rounded border-gray-300 text-dubai-blue focus:ring-dubai-blue focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-700">{bodyType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fuel Type Checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fuel Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map(fuelType => (
                      <label
                        key={fuelType}
                        className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-dubai-blue hover:bg-gradient-to-r hover:from-dubai-blue/5 hover:to-dubai-gold/5 transition-all duration-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.fuelTypes.includes(fuelType)}
                          onChange={(e) => {
                            const newFuelTypes = e.target.checked
                              ? [...filters.fuelTypes, fuelType]
                              : filters.fuelTypes.filter(type => type !== fuelType);
                            updateAdvancedFilter('fuelTypes', newFuelTypes);
                          }}
                          className="rounded border-gray-300 text-dubai-blue focus:ring-dubai-blue focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-700">{fuelType}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Transmission Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Transmission
                  </label>
                  <div className="flex gap-2">
                    {['Automatic', 'Manual'].map(transmission => (
                      <button
                        key={transmission}
                        onClick={() => {
                          const newTransmission = filters.transmission.includes(transmission)
                            ? filters.transmission.filter(t => t !== transmission)
                            : [transmission];
                          updateAdvancedFilter('transmission', newTransmission);
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 ${filters.transmission.includes(transmission)
                            ? 'bg-gradient-to-r from-dubai-blue to-dubai-gold text-white border-transparent shadow-md'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-dubai-blue'
                          }`}
                      >
                        {transmission}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Swatch Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {availableColors.map(color => (
                      <button
                        key={color.name}
                        onClick={() => {
                          const newColors = filters.colors.includes(color.name)
                            ? filters.colors.filter(c => c !== color.name)
                            : [...filters.colors, color.name];
                          updateAdvancedFilter('colors', newColors);
                        }}
                        className="flex flex-col items-center gap-1 group"
                        title={color.name}
                      >
                        <div
                          className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${filters.colors.includes(color.name)
                              ? 'border-dubai-blue shadow-lg scale-110'
                              : 'border-gray-300 group-hover:border-dubai-blue group-hover:shadow-md'
                            }`}
                          style={{ backgroundColor: color.value }}
                        >
                          {filters.colors.includes(color.name) && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 group-hover:text-dubai-blue transition-colors">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Multi-select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableLocations.map(location => (
                      <button
                        key={location}
                        onClick={() => {
                          const newLocations = filters.locations.includes(location)
                            ? filters.locations.filter(l => l !== location)
                            : [...filters.locations, location];
                          updateAdvancedFilter('locations', newLocations);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${filters.locations.includes(location)
                            ? 'bg-gradient-to-r from-dubai-blue/80 to-dubai-gold/80 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trust Filters Section */}
          <div>
            <div
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => toggleSection('trust')}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-dubai-blue to-dubai-gold rounded-lg">
                  <span className="text-white text-lg">🛡️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Trust Filters</h3>
              </div>
              {expandedSections.trust ? (
                <span className="text-gray-400 text-lg">▲</span>
              ) : (
                <span className="text-gray-400 text-lg">▼</span>
              )}
            </div>

            {expandedSections.trust && (
              <div className="space-y-4 pl-2">
                {[
                  { key: 'accidentFreeOnly', label: 'Accident-Free Only' },
                  { key: 'serviceHistoryAvailable', label: 'Service History Available' },
                  { key: 'certifiedPreOwned', label: 'Certified Pre-Owned' },
                  { key: 'verifiedSeller', label: 'Verified Seller' },
                ].map(filter => (
                  <label
                    key={filter.key}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-dubai-blue hover:bg-gradient-to-r hover:from-dubai-blue/5 hover:to-dubai-gold/5 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${filters[filter.key]
                          ? 'bg-gradient-to-r from-dubai-blue to-dubai-gold border-transparent'
                          : 'border-gray-300 group-hover:border-dubai-blue'
                        }`}>
                        {filters[filter.key] && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{filter.label}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters[filter.key]}
                        onChange={(e) => updateTrustFilter(filter.key, e.target.checked)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`w-11 h-6 rounded-full transition-all duration-300 ${filters[filter.key]
                          ? 'bg-gradient-to-r from-dubai-blue to-dubai-gold'
                          : 'bg-gray-300'
                        }`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-300 ${filters[filter.key]
                            ? 'translate-x-5'
                            : 'translate-x-0.5'
                          }`}></div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Apply Filters Button */}
          <button
            onClick={() => onFilterChange && onFilterChange(filters)}
            className="w-full mt-8 px-4 py-3 bg-gradient-to-r from-dubai-blue to-dubai-gold text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            Apply Filters ({filterChips.length})
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default FilterPanel;

// ============================================================================
// Example Usage Component
// ============================================================================

export const ExampleUsage = () => {
  const [filteredResults, setFilteredResults] = useState([]);

  const handleFilterChange = (filters) => {
    console.log('Filters changed:', filters);
    // In a real app, you would fetch data with these filters
    setFilteredResults([]); // Reset for demo
  };

  return (
    <FilterProvider onFilterChange={handleFilterChange}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p 4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filter Panel */}
            <div className="lg:w-1/4">
              <FilterPanel onFilterChange={handleFilterChange} />
            </div>
            
            {/* Results Area */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  Car Results
                </h1>
                <p className="text-gray-600">
                  Apply filters to see matching vehicles
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FilterProvider>
  );
};