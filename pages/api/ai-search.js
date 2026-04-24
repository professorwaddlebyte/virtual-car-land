// pages/api/ai-search.js
// SIMPLIFIED VERSION - Database-driven, single LLM call

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Debug toggle - set to false to disable console.log messages
const DEBUG = false; // Change to false to silence all [AI Search] logs

// Custom debug logger
function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

// Cache for searchable data (refresh every 5 minutes)
let searchableDataCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

// LLM configuration
const PRIMARY_MODEL = "google/gemini-2.0-flash-001";
const FALLBACK_MODELS = [
  "google/gemini-2.0-flash-lite-001",
  "anthropic/claude-3-haiku-20240307",
];

// pages/api/ai-search.js - Simplified getSearchableData
async function getSearchableData() {
  const now = Date.now();
  if (searchableDataCache && (now - cacheTimestamp) < CACHE_TTL) {
    return searchableDataCache;
  }

  try {
    // 1. Get makes from car_makes
    const makesResult = await pool.query(
      'SELECT name, nationality, is_luxury FROM car_makes ORDER BY sort_order'
    );
    
    // 2. Run the basic queries in parallel
    const [bodyResult, fuelResult, transmissionResult, colorResult] = await Promise.all([
      pool.query(`SELECT DISTINCT LOWER(specs->>'body') as value FROM vehicles WHERE specs->>'body' IS NOT NULL AND specs->>'body' != '' LIMIT 100`),
      pool.query(`SELECT DISTINCT LOWER(specs->>'fuel') as value FROM vehicles WHERE specs->>'fuel' IS NOT NULL AND specs->>'fuel' != '' LIMIT 100`),
      pool.query(`SELECT DISTINCT specs->>'transmission' as value FROM vehicles WHERE specs->>'transmission' IS NOT NULL AND specs->>'transmission' != '' LIMIT 100`),
      pool.query(`SELECT DISTINCT specs->>'color' as value FROM vehicles WHERE specs->>'color' IS NOT NULL AND specs->>'color' != '' LIMIT 100`)
    ]);

    const bodyTypes = bodyResult.rows.map(r => r.value).filter(Boolean);
    const fuelTypes = fuelResult.rows.map(r => r.value).filter(Boolean);
    const transmissions = transmissionResult.rows.map(r => r.value).filter(Boolean);
    const colors = colorResult.rows.map(r => r.value).filter(Boolean);

    // 3. Get features separately from car_specs table
    let features = [];
    try {
      const featuresResult = await pool.query(`
        SELECT feature_name 
        FROM car_specs 
        WHERE group_name IN (
          'Comfort & Seating', 
          'Infotainment & Tech', 
          'Safety & Driver Assist',
          'Performance & Drivetrain',
          'Off-Road & Towing',
          'Roof & Glass',
          'Sound Systems',
          'EV / Hybrid & Other'
        )
        ORDER BY sort_order
      `);
      features = featuresResult.rows.map(row => row.feature_name);
      debugLog(`[AI Search] Loaded ${features.length} features from car_specs`);
    } catch (err) {
      debugLog('[AI Search] Error loading features:', err.message);
      features = [];
    }

    // 4. Organize makes by nationality (from your existing code)
    const makesByNationality = {};
    const luxuryMakes = [];
    const allMakes = [];

    for (const row of makesResult.rows) {
      allMakes.push(row.name);
      if (row.is_luxury) luxuryMakes.push(row.name);
      
      if (!makesByNationality[row.nationality]) {
        makesByNationality[row.nationality] = [];
      }
      makesByNationality[row.nationality].push(row.name);
    }

    const searchableData = {
      makes: {
        all: allMakes,
        byNationality: makesByNationality,
        luxury: luxuryMakes
      },
      colors: colors,
      features: features,
      bodyTypes: bodyTypes,
      fuelTypes: fuelTypes,
      transmissions: transmissions,
      cylinders: [4, 6, 8]
    };

    searchableDataCache = searchableData;
    cacheTimestamp = now;
    
    debugLog('[AI Search] Searchable data loaded:', {
      makesCount: searchableData.makes.all.length,
      colorsCount: searchableData.colors.length,
      featuresCount: searchableData.features.length,
      bodyTypesCount: searchableData.bodyTypes.length,
      fuelTypesCount: searchableData.fuelTypes.length,
      transmissionsCount: searchableData.transmissions.length
    });
    
    return searchableData;
    
  } catch (dbError) {
    debugLog('[AI Search] Database error:', dbError);
    // Return fallback data structure (simplified for brevity)
    return {
      makes: { all: [], byNationality: {}, luxury: [] },
      colors: [],
      features: [],
      bodyTypes: [],
      fuelTypes: [],
      transmissions: [],
      cylinders: [4, 6, 8]
    };
  }
}



async function callLLM(prompt, attempt = 0) {
  const model = attempt === 0 ? PRIMARY_MODEL : FALLBACK_MODELS[attempt - 1];

  debugLog(
    `[AI Search] Calling LLM with model: ${model}, attempt: ${attempt}`,
  );

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 800,
          temperature: 0.0,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      },
    );

    if (response.ok) {
      return response;
    }

    const errorText = await response.text();
    debugLog(`[AI Search] LLM error (${response.status}):`, errorText);

    if (
      attempt < FALLBACK_MODELS.length &&
      (response.status === 429 ||
        response.status === 500 ||
        response.status === 503)
    ) {
      const waitTime = 1000 * (attempt + 1);
      debugLog(`[AI Search] Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return callLLM(prompt, attempt + 1);
    }

    return response;
  } catch (fetchError) {
    debugLog("[AI Search] Fetch error:", fetchError);
    throw fetchError;
  }
}

function validateFilters(filters, searchableData) {
  const validated = {
    makes: [],
    model: null,
    year_min: null,
    year_max: null,
    colors: [],
    mileage_max_km: null,
    gcc_spec: null,
    body_type: null,
    transmission: null,
    fuel_type: null,
    cylinders: null,
    features: [],
    unmatched: [],
    price_min: null,  // ADD THIS
    price_max: null   // ADD THIS
  };

  // Validate and map makes
  if (Array.isArray(filters.makes)) {
    for (const make of filters.makes) {
      if (searchableData.makes.all.includes(make)) {
        validated.makes.push(make);
      }
    }
  }

  // Handle nationality-based makes
  if (
    filters.nationality &&
    searchableData.makes.byNationality[filters.nationality]
  ) {
    validated.makes.push(
      ...searchableData.makes.byNationality[filters.nationality],
    );
  }

  // Handle luxury makes
  if (filters.luxury === true) {
    validated.makes.push(...searchableData.makes.luxury);
  }

  // Validate model
  if (
    filters.model &&
    typeof filters.model === "string" &&
    filters.model.trim()
  ) {
    validated.model = filters.model.trim();
  }

  // Validate years
  if (filters.year_min && !isNaN(parseInt(filters.year_min))) {
    validated.year_min = parseInt(filters.year_min);
  }
  if (filters.year_max && !isNaN(parseInt(filters.year_max))) {
    validated.year_max = parseInt(filters.year_max);
  }

  // Validate colors
  if (Array.isArray(filters.colors)) {
    for (const color of filters.colors) {
      const matchedColor = searchableData.colors.find(
        (c) => c.toLowerCase() === color.toLowerCase(),
      );
      if (matchedColor) {
        validated.colors.push(matchedColor);
      }
    }
  }

  // Validate mileage
  if (filters.mileage_max_km && !isNaN(parseInt(filters.mileage_max_km))) {
    validated.mileage_max_km = parseInt(filters.mileage_max_km);
  }

  // Validate price_min
  if (filters.price_min && !isNaN(parseInt(filters.price_min))) {
    validated.price_min = parseInt(filters.price_min);
  }

  // Validate price_max  
  if (filters.price_max && !isNaN(parseInt(filters.price_max))) {
    validated.price_max = parseInt(filters.price_max);
  }

  // Validate GCC spec
  if (typeof filters.gcc_spec === "boolean") {
    validated.gcc_spec = filters.gcc_spec;
  }

  // Validate body type
if (
    filters.body_type &&
    searchableData.bodyTypes.includes(filters.body_type)
  ) {
    validated.body_type = filters.body_type;
  }

  // Handle door count → body type mapping
  if (filters.doors === 2 && !validated.body_type) {
    validated.body_type = "Coupe";
  } else if (filters.doors === 4 && !validated.body_type) {
    validated.body_type = "Sedan";
  } else if (filters.doors === 5 && !validated.body_type) {
    validated.body_type = "Hatchback";
  }

  // Validate transmission
  if (
    filters.transmission &&
    searchableData.transmissions.includes(filters.transmission)
  ) {
    validated.transmission = filters.transmission;
  }

  // Validate fuel type
  if (
    filters.fuel_type &&
    searchableData.fuelTypes.includes(filters.fuel_type)
  ) {
    validated.fuel_type = filters.fuel_type;
  }

  // Validate cylinders
  if (
    filters.cylinders &&
    searchableData.cylinders.includes(parseInt(filters.cylinders))
  ) {
    validated.cylinders = parseInt(filters.cylinders);
  }

  // Validate features
  if (Array.isArray(filters.features)) {
    for (const feature of filters.features) {
      const matchedFeature = searchableData.features.find(
        (f) => f.toLowerCase() === feature.toLowerCase(),
      );
      if (matchedFeature) {
        validated.features.push(matchedFeature);
      }
    }
  }

  // Collect unmatched terms
  if (Array.isArray(filters.unmatched)) {
    validated.unmatched = filters.unmatched.filter(
      (term) => term && term.trim(),
    );
  }

  // Remove duplicates from makes
  validated.makes = [...new Set(validated.makes)];

  return validated;
}

// pages/api/ai-search.js
// Add these logging statements in the handler function (around line 200):

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query: userQuery } = req.body;
  
  debugLog('[AI Search] Received query:', userQuery);
  debugLog('[AI Search] OPENROUTER_API_KEY exists?', !!process.env.OPENROUTER_API_KEY);
  
  if (!userQuery || !userQuery.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const emptyResponse = {
    filters: {
      makes: [],
      model: null,
      year_min: null,
      year_max: null,
      colors: [],
      mileage_max_km: null,
      gcc_spec: null,
      body_type: null,
      transmission: null,
      fuel_type: null,
      cylinders: null,
      features: [],
      unmatched: []
    },
    unmatched_terms: []
  };

  try {
    const searchableData = await getSearchableData();
    debugLog('[AI Search] Searchable data loaded:', {
      makesCount: searchableData.makes.all.length,
      colorsCount: searchableData.colors.length,
      featuresCount: searchableData.features.length
    });

    const prompt = `You are a car search normalizer. Convert the user's search query into structured filters.

USER QUERY: "${userQuery}"

SEARCHABLE VALUES (use EXACTLY these strings):
- Makes: ${JSON.stringify(searchableData.makes.all)}
- Nationalities: ${JSON.stringify(Object.keys(searchableData.makes.byNationality))}
- Colors: ${JSON.stringify(searchableData.colors)}
- Body Types: ${JSON.stringify(searchableData.bodyTypes)}
- Fuel Types: ${JSON.stringify(searchableData.fuelTypes)}
- Transmissions: ${JSON.stringify(searchableData.transmissions)}
- Cylinders: ${JSON.stringify(searchableData.cylinders)}
- Features: ${JSON.stringify(searchableData.features.slice(0, 100))}

RULES:
1. "japanese", "Japanese" → set "nationality": "Japanese"
2. "german", "German" → set "nationality": "German"  
3. "luxury", "premium" → set "luxury": true
4. 'max price X', 'under X', 'less than X' → set 'price_max': X
5. 'min price X', 'over X', 'more than X' → set 'price_min': X  
6. 'price between X and Y' → set 'price_min': X, 'price_max': Y
7. For terms that don't match anything, add to "unmatched" array

Return ONLY this JSON structure (use null for missing values):
{
  "makes": [],
  "nationality": null,
  "luxury": null,
  "model": null,
  "year_min": null,
  "year_max": null,
  "colors": [],
  "mileage_max_km": null,
  "gcc_spec": null,
  "body_type": null,
  "doors": null,
  "transmission": null,
  "fuel_type": null,
  "cylinders": null,
  "features": [],
  "unmatched": []
}`;

    debugLog('[AI Search] Calling LLM with prompt length:', prompt.length);
    
    const llmResponse = await callLLM(prompt);
    
    debugLog('[AI Search] LLM response status:', llmResponse.status);
    
    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      debugLog('[AI Search] LLM error response:', errorText);
      return res.status(200).json(emptyResponse);
    }

    const llmData = await llmResponse.json();
    debugLog('[AI Search] LLM full response data:', JSON.stringify(llmData, null, 2));
    
    const rawContent = llmData.choices?.[0]?.message?.content || '{}';
    debugLog('[AI Search] Raw content from LLM:', rawContent);
    
    let parsedFilters = {};
    try {
      const cleanJson = rawContent.replace(/```json|```/g, '').trim();
      parsedFilters = JSON.parse(cleanJson);
      debugLog('[AI Search] Parsed filters:', JSON.stringify(parsedFilters, null, 2));
    } catch (parseError) {
      debugLog('[AI Search] Failed to parse LLM response:', rawContent);
      debugLog('[AI Search] Parse error:', parseError);
      return res.status(200).json(emptyResponse);
    }

    const validatedFilters = validateFilters(parsedFilters, searchableData);
    debugLog('[AI Search] Validated filters:', JSON.stringify(validatedFilters, null, 2));

    return res.status(200).json({
      filters: validatedFilters,
      unmatched_terms: validatedFilters.unmatched
    });

  } catch (error) {
    debugLog('[AI Search] Fatal error:', error);
    debugLog('[AI Search] Error stack:', error.stack);
    return res.status(200).json(emptyResponse);
  }
}


