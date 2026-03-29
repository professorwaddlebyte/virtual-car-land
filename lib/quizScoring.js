// Quiz Scoring Service for UAE Car Marketplace
// AI-powered matching algorithm with cultural preferences

// Cultural preference database (simplified version - would come from DB in production)
const CULTURAL_PREFERENCES = {
    'Emirati': {
        preferredMakes: ['Range Rover', 'Mercedes-Benz', 'Lexus', 'BMW'],
        preferredBodyTypes: ['SUV', 'Luxury Sedan'],
        preferredColors: ['White', 'Black', 'Beige'],
        typicalBudgetRange: { min: 150000, max: 500000 },
        weight: 0.3
    },
    'South Asian': {
        preferredMakes: ['Toyota', 'Honda', 'Nissan', 'Hyundai'],
        preferredBodyTypes: ['Sedan', 'SUV', 'MPV'],
        preferredColors: ['Silver', 'White', 'Grey'],
        typicalBudgetRange: { min: 50000, max: 150000 },
        weight: 0.3
    },
    'European': {
        preferredMakes: ['BMW', 'Audi', 'Mercedes-Benz', 'Volvo'],
        preferredBodyTypes: ['Sport Sedan', 'Coupe', 'Convertible'],
        preferredColors: ['Black', 'Blue', 'Red'],
        typicalBudgetRange: { min: 100000, max: 300000 },
        weight: 0.3
    },
    'East Asian': {
        preferredMakes: ['Toyota', 'Tesla', 'Hyundai', 'Kia'],
        preferredBodyTypes: ['Hybrid', 'Electric', 'Compact SUV'],
        preferredColors: ['White', 'Silver', 'Grey'],
        typicalBudgetRange: { min: 80000, max: 200000 },
        weight: 0.3
    },
    'African': {
        preferredMakes: ['Toyota Land Cruiser', 'Nissan Patrol', 'Mitsubishi Pajero'],
        preferredBodyTypes: ['4x4', 'SUV', 'Pickup'],
        preferredColors: ['White', 'Black', 'Green'],
        typicalBudgetRange: { min: 70000, max: 250000 },
        weight: 0.3
    }
};

// Quiz answer mappings to weighted feature vectors
const ANSWER_MAPPINGS = {
    // Q1: Primary Use Case
    'family_daily_driver': {
        bodyType: ['SUV', 'Minivan'],
        minSeats: 7,
        weight: 0.8
    },
    'luxury_statement': {
        makes: ['Range Rover', 'Mercedes-Benz', 'BMW', 'Audi', 'Lexus'],
        weight: 0.9
    },
    'fuel_efficient_commute': {
        fuelType: ['Hybrid', 'Electric'],
        weight: 0.7
    },
    'off_road_desert': {
        drivetrain: '4WD',
        minGroundClearance: 200, // mm
        weight: 0.85
    },
    'business_corporate': {
        bodyType: ['Sedan', 'Luxury Sedan'],
        requires: ['Leather seats', 'Advanced safety'],
        weight: 0.75
    },
    
    // Q2: Features that matter most
    'safety': {
        features: ['5-star safety', 'Advanced safety', 'Lane keep assist', 'Blind spot detection'],
        weight: 0.6
    },
    'technology': {
        features: ['Apple CarPlay', 'Android Auto', '360 camera', 'Head-up display'],
        weight: 0.5
    },
    'comfort': {
        features: ['Leather seats', 'Climate control', 'Heated seats', 'Massage seats'],
        weight: 0.5
    },
    'performance': {
        features: ['Sport mode', 'Turbo engine', 'Fast acceleration'],
        weight: 0.5
    },
    'fuel_economy': {
        features: ['Hybrid', 'Electric', 'Eco mode'],
        weight: 0.5
    },
    'resale_value': {
        makes: ['Toyota', 'Honda', 'Lexus'], // Good resale value brands
        weight: 0.5
    },
    
    // Q3: Cultural Preference (maps to nationality)
    'emirati_luxury': {
        nationality: 'Emirati',
        weight: 1.0
    },
    'south_asian_reliability': {
        nationality: 'South Asian',
        weight: 1.0
    },
    'european_performance': {
        nationality: 'European',
        weight: 1.0
    },
    'hybrid_electric_focus': {
        nationality: 'East Asian',
        weight: 1.0
    },
    'robust_4x4_off_road': {
        nationality: 'African',
        weight: 1.0
    },
    
    // Q5: Body Type (multi-select)
    'sedan': {
        bodyType: ['Sedan'],
        weight: 1.0
    },
    'suv': {
        bodyType: ['SUV'],
        weight: 1.0
    },
    'coupe': {
        bodyType: ['Coupe'],
        weight: 1.0
    },
    'convertible': {
        bodyType: ['Convertible'],
        weight: 1.0
    },
    'pickup': {
        bodyType: ['Pickup'],
        weight: 1.0
    },
    'minivan': {
        bodyType: ['Minivan'],
        weight: 1.0
    },
    
    // Q6: Must-Have Features
    'sunroof': {
        features: ['Sunroof', 'Panoramic roof'],
        weight: 0.8
    },
    'leather_seats': {
        features: ['Leather seats'],
        weight: 0.7
    },
    'advanced_safety': {
        features: ['Lane keep assist', 'Blind spot detection', 'Adaptive cruise control'],
        weight: 0.8
    },
    'apple_carplay': {
        features: ['Apple CarPlay', 'Android Auto'],
        weight: 0.6
    },
    'third_row_seating': {
        features: ['Third-row seating'],
        minSeats: 7,
        weight: 0.7
    },
    'tow_hitch': {
        features: ['Tow hitch', 'Trailer package'],
        weight: 0.6
    }
};

// Budget range mappings from Q4
const BUDGET_RANGES = {
    '30k_50k': { min: 30000, max: 50000 },
    '50k_80k': { min: 50000, max: 80000 },
    '80k_120k': { min: 80000, max: 120000 },
    '120k_200k': { min: 120000, max: 200000 },
    '200k_plus': { min: 200000, max: 1000000 }
};

// Helper function: Price match (0-1)
function priceMatch(userBudgetRange, vehiclePrice) {
    if (!userBudgetRange || !vehiclePrice) return 0.5;
    
    const { min, max } = userBudgetRange;
    
    if (vehiclePrice >= min && vehiclePrice <= max) {
        return 1.0; // Perfect match
    } else if (vehiclePrice < min) {
        // Below budget - good but not perfect
        const distance = min - vehiclePrice;
        return Math.max(0.7, 1 - (distance / min)); // Scale from 0.7 to 1
    } else {
        // Above budget - not ideal
        const distance = vehiclePrice - max;
        const maxOver = max * 1.5; // Consider up to 50% over budget
        return Math.max(0.3, 1 - (distance / (maxOver - max))); // Scale from 0.3 to 0.7
    }
}

// Helper function: Year match (0-1)
function yearMatch(userYearRange, vehicleYear) {
    if (!userYearRange || !vehicleYear) return 0.5;
    
    const { minYear, maxYear } = userYearRange;
    
    if (vehicleYear >= minYear && vehicleYear <= maxYear) {
        return 1.0; // Perfect match
    } else if (vehicleYear < minYear) {
        // Older than preferred - not ideal
        const yearsOld = minYear - vehicleYear;
        return Math.max(0.2, 1 - (yearsOld / 10)); // Lose 0.1 per year older
    } else {
        // Newer than preferred - better but not perfect
        const yearsNew = vehicleYear - maxYear;
        return Math.max(0.7, 1 - (yearsNew / 5)); // Lose 0.2 per year newer
    }
}

// Helper function: Body type match (0-1)
function bodyTypeMatch(userBodyTypes, vehicleBodyType) {
    if (!userBodyTypes || !vehicleBodyType) return 0.5;
    
    // Check direct match first
    if (userBodyTypes.includes(vehicleBodyType)) {
        return 1.0;
    }
    
    // Check category matches (e.g., "Luxury Sedan" matches "Sedan")
    const bodyTypeCategories = {
        'Sedan': ['Sedan', 'Luxury Sedan', 'Sport Sedan'],
        'SUV': ['SUV', 'Compact SUV', 'Luxury SUV'],
        'Coupe': ['Coupe'],
        'Convertible': ['Convertible'],
        'Pickup': ['Pickup'],
        'Minivan': ['Minivan', 'MPV'],
        '4x4': ['4x4', 'SUV', 'Pickup']
    };
    
    for (const category in bodyTypeCategories) {
        if (userBodyTypes.includes(category) && 
            bodyTypeCategories[category].includes(vehicleBodyType)) {
            return 0.8; // Partial match
        }
    }
    
    return 0.3; // Poor match
}

// Helper function: Feature match (0-1)
function featureMatch(userFeatures, vehicleFeatures) {
    if (!userFeatures || !vehicleFeatures || userFeatures.length === 0) return 0.5;
    
    const matches = userFeatures.filter(feature => 
        vehicleFeatures.includes(feature)
    ).length;
    
    // Score based on percentage of matches
    return matches / userFeatures.length;
}

// Helper function: Make alignment (cultural)
function makeAlignment(nationality, vehicleMake) {
    if (!nationality || !vehicleMake || !CULTURAL_PREFERENCES[nationality]) return 0;
    
    const preferredMakes = CULTURAL_PREFERENCES[nationality].preferredMakes;
    
    if (preferredMakes.includes(vehicleMake)) {
        return 1.0;
    }
    
    // Partial matches (e.g., "Toyota Land Cruiser" contains "Toyota")
    for (const preferredMake of preferredMakes) {
        if (vehicleMake.includes(preferredMake) || preferredMake.includes(vehicleMake)) {
            return 0.7;
        }
    }
    
    return 0;
}

// Helper function: Color alignment (cultural)
function colorAlignment(nationality, vehicleColor) {
    if (!nationality || !vehicleColor || !CULTURAL_PREFERENCES[nationality]) return 0;
    
    const preferredColors = CULTURAL_PREFERENCES[nationality].preferredColors;
    
    if (preferredColors.includes(vehicleColor)) {
        return 1.0;
    }
    
    // Color normalization (basic - would be more sophisticated in production)
    const normalizedColor = vehicleColor.toLowerCase();
    for (const preferredColor of preferredColors) {
        if (normalizedColor.includes(preferredColor.toLowerCase()) || 
            preferredColor.toLowerCase().includes(normalizedColor)) {
            return 0.8;
        }
    }
    
    return 0;
}

// Helper function: Body type alignment (cultural)
function bodyTypeAlignment(nationality, vehicleBodyType) {
    if (!nationality || !vehicleBodyType || !CULTURAL_PREFERENCES[nationality]) return 0;
    
    const preferredBodyTypes = CULTURAL_PREFERENCES[nationality].preferredBodyTypes;
    
    if (preferredBodyTypes.includes(vehicleBodyType)) {
        return 1.0;
    }
    
    // Check category matches
    const bodyTypeCategories = {
        'SUV': ['SUV', 'Compact SUV', 'Luxury SUV', '4x4'],
        'Sedan': ['Sedan', 'Luxury Sedan', 'Sport Sedan'],
        'MPV': ['MPV', 'Minivan'],
        'Coupe': ['Coupe'],
        'Convertible': ['Convertible'],
        'Pickup': ['Pickup'],
        '4x4': ['4x4', 'SUV', 'Pickup']
    };
    
    for (const preferredType of preferredBodyTypes) {
        const categories = bodyTypeCategories[preferredType] || [preferredType];
        if (categories.includes(vehicleBodyType)) {
            return 0.8;
        }
    }
    
    return 0;
}

// Helper function: Cultural alignment score (0-1)
function culturalAlignment(nationality, vehicle) {
    if (!nationality || !vehicle || !CULTURAL_PREFERENCES[nationality]) return 0;
    
    const makeScore = makeAlignment(nationality, vehicle.make) * 0.15;
    const colorScore = colorAlignment(nationality, vehicle.color) * 0.10;
    const bodyTypeScore = bodyTypeAlignment(nationality, vehicle.bodyType) * 0.05;
    
    return makeScore + colorScore + bodyTypeScore;
}

// Main scoring function
export function calculateQuizScore(userAnswers, vehicle, culturalPreferences = { weight: 0.3 }) {
    // Extract user preferences from answers
    const userPrefs = extractUserPreferences(userAnswers);
    
    // Base match components (70%)
    const baseScore = (
        priceMatch(userPrefs.budgetRange, vehicle.price) * 0.25 +
        yearMatch(userPrefs.yearRange, vehicle.year) * 0.15 +
        bodyTypeMatch(userPrefs.bodyTypes, vehicle.bodyType) * 0.10 +
        featureMatch(userPrefs.features, vehicle.features) * 0.20
    );
    
    // Cultural alignment (30%)
    let culturalScore = 0;
    if (userPrefs.nationality) {
        culturalScore = culturalAlignment(userPrefs.nationality, vehicle);
    }
    
    // Apply cultural weight (default 0.3, configurable)
    const culturalWeight = (culturalPreferences && culturalPreferences.weight) || 0.3;
    
    // Urgency boost (immediate buyers get 10% boost to base score)
    let urgencyBoost = 1.0;
    if (userPrefs.buyingTimeframe === 'immediate') {
        urgencyBoost = 1.1;
    }
    
    const boostedBaseScore = baseScore * urgencyBoost;
    
    // Final score: (base × 0.7) + (cultural × 0.3) scaled to 0-100
    const totalScore = (boostedBaseScore * (1 - culturalWeight)) + (culturalScore * culturalWeight);
    
    // Ensure score is between 0 and 1, then scale to 0-100
    const normalizedScore = Math.max(0, Math.min(1, totalScore));
    return Math.round(normalizedScore * 100);
}

// Extract user preferences from quiz answers
function extractUserPreferences(userAnswers) {
    const prefs = {
        budgetRange: null,
        yearRange: { minYear: 2018, maxYear: 2026 }, // Default reasonable range
        bodyTypes: [],
        features: [],
        nationality: null,
        buyingTimeframe: 'browsing_for_now' // Default
    };
    
    // Process each answer
    for (const [questionId, answer] of Object.entries(userAnswers)) {
        if (answer === null || answer === undefined) continue;
        
        switch (questionId) {
            case 'q1': // Primary Use Case
                const mapping = ANSWER_MAPPINGS[answer];
                if (mapping) {
                    if (mapping.bodyType) prefs.bodyTypes.push(...mapping.bodyType);
                    if (mapping.features) prefs.features.push(...mapping.features);
                    if (mapping.makes) prefs.makes = mapping.makes;
                    if (mapping.fuelType) prefs.fuelType = mapping.fuelType;
                }
                break;
                
            case 'q2': // Features that matter most (multi-select)
                if (Array.isArray(answer)) {
                    answer.forEach(ans => {
                        const mapping = ANSWER_MAPPINGS[ans];
                        if (mapping && mapping.features) {
                            prefs.features.push(...mapping.features);
                        }
                    });
                }
                break;
                
            case 'q3': // Cultural Preference
                const culturalMapping = ANSWER_MAPPINGS[answer];
                if (culturalMapping && culturalMapping.nationality) {
                    prefs.nationality = culturalMapping.nationality;
                }
                break;
                
            case 'q4': // Budget Range
                if (BUDGET_RANGES[answer]) {
                    prefs.budgetRange = BUDGET_RANGES[answer];
                }
                break;
                
            case 'q5': // Body Type (multi-select)
                if (Array.isArray(answer)) {
                    answer.forEach(ans => {
                        const mapping = ANSWER_MAPPINGS[ans];
                        if (mapping && mapping.bodyType) {
                            prefs.bodyTypes.push(...mapping.bodyType);
                        }
                    });
                }
                break;
                
            case 'q6': // Must-Have Features (multi-select)
                if (Array.isArray(answer)) {
                    answer.forEach(ans => {
                        const mapping = ANSWER_MAPPINGS[ans];
                        if (mapping && mapping.features) {
                            prefs.features.push(...mapping.features);
                        }
                    });
                }
                break;
                
            case 'q7': // Buying Timeframe
                prefs.buyingTimeframe = answer;
                break;
        }
    }
    
    // Remove duplicates
    prefs.bodyTypes = [...new Set(prefs.bodyTypes)];
    prefs.features = [...new Set(prefs.features)];
    
    return prefs;
}

// Export the main function and helpers
export default {
    calculateQuizScore,
    priceMatch,
    yearMatch,
    bodyTypeMatch,
    featureMatch,
    culturalAlignment,
    makeAlignment,
    colorAlignment,
    bodyTypeAlignment,
    extractUserPreferences,
    CULTURAL_PREFERENCES,
    ANSWER_MAPPINGS,
    BUDGET_RANGES
};