// pages/api/ai-search.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query: userQuery } = req.body;
  if (!userQuery || !userQuery.trim()) return res.status(400).json({ error: 'Query is required' });

  const prompt = `
You are a UAE used car search assistant. Extract structured search filters from the user's natural language query.

USER QUERY: "${userQuery.trim()}"

RULES:
- "makes": array of brand names. Resolve categories: 
  - "Japanese" → ["Toyota", "Nissan", "Honda", "Mitsubishi", "Lexus", "Infiniti"]
  - "German" → ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Porsche"]
  - "American" → ["Ford", "Chevrolet", "Dodge", "Jeep", "GMC", "Cadillac"]
  - "Korean" → ["Hyundai", "Kia", "Genesis"]
  - "Luxury" → ["BMW", "Mercedes-Benz", "Lexus", "Infiniti", "Porsche", "Audi", "Bentley", "Rolls-Royce"]

- "price_min" / "price_max": Extract AED numbers. "100k to 150k" → min: 100000, max: 150000. "under 50k" → max: 50000. "above 200k" → min: 200000. "Between 30k to 150k" → max: 150000 and → min: 30000

- "year_min" / "year_max": 4-digit years. "between 2015 and 2020" → min: 2015, max: 2020. "newer than 2022" → min: 2022. "recent/new" → min: 2021.

- "mileage_max": in km. "low mileage" → 60000. "very low" → 30000.

- "gcc": true if "GCC" or "local" mentioned. 
- "gcc": false ONLY if the user explicitly says "import", "non-gcc", or "spec" (e.g., "american spec", "japanese spec"). 
- IMPORTANT: Do not set to false just because a brand (like Toyota) or a region (like Japanese) is mentioned. Default to null if unsure.

- "body": SUV, Sedan, Pickup, Hatchback, Coupe, Van, Minivan, Convertible. 

- "specs": This is a JSON object that MUST contain:
  - "features": array of strings. Include only those features that user is asking for Map user in their intent:
    ['Leather seats','Heated seats','Cooled seats','Massage seats','Third-row seating','Premium interior',
     'Sunroof','Panoramic sunroof','Panoramic glass roof',
     'Apple CarPlay','Touchscreen audio','Wireless charging','Autopilot',
     'Bose sound system','Burmester sound system','Bang & Olufsen sound',
     'Adaptive cruise control','Cruise control','Lane keep assist','Backup camera','Heads-up display','Keyless-go',
     '4WD','Four-wheel drive','Quattro AWD','Sport mode','Sport suspension','M Sport package',
     'Crawl control','Multi-terrain select','Tow hitch','Hybrid efficiency']
  - "fuel": "petrol", "diesel", "electric", or "hybrid"
  - "cylinders": number (e.g., 4, 6, 8)
  - "color": single primary color string
  - "transmission": "automatic" or "manual"
  - "gcc": boolean (match top-level gcc)

Respond ONLY with a JSON object.

{
  "makes": [],
  "model": null,
  "body": null,
  "colors": [],
  "price_min": null,
  "price_max": null,
  "year_min": null,
  "year_max": null,
  "mileage_max": null,
  "gcc": null,
  "transmission": null,
  "specs": {
    "features": [],
    "fuel": null,
    "cylinders": null,
    "color": null,
    "transmission": null,
    "gcc": null
  }
}
`.trim();

  try {
    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        models: ['google/gemma-3-12b-it', 'mistralai/mistral-7b-instruct'],
        route: 'fallback',
        max_tokens: 400,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!llmRes.ok) return res.status(200).json({ filters: {}, fallback: true });

    const llmData = await llmRes.json();
    const clean = (llmData.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();
    const f = JSON.parse(clean);

    // Deep Sanitization
    const safe = {
      makes:        Array.isArray(f.makes) ? f.makes : [],
      model:        typeof f.model === 'string' ? f.model : null,
      body:         ['SUV','Sedan','Pickup','Hatchback','Coupe','Van','Minivan','Convertible'].includes(f.body) ? f.body : null,
      colors:       Array.isArray(f.colors) ? f.colors : [],
      price_min:    Number(f.price_min) || null,
      price_max:    Number(f.price_max) || null,
      year_min:     Number(f.year_min) || null,
      year_max:     Number(f.year_max) || null,
      mileage_max:  Number(f.mileage_max) || null,
      gcc:          typeof f.gcc === 'boolean' ? f.gcc : null,
      transmission: ['automatic','manual'].includes(f.transmission) ? f.transmission : null,
      specs: {
        features:   Array.isArray(f.specs?.features) ? f.specs.features : [],
        fuel:       ['petrol','diesel','electric','hybrid'].includes(f.specs?.fuel) ? f.specs.fuel : null,
        cylinders:  Number(f.specs?.cylinders) || null,
        color:      f.specs?.color || null,
        transmission: f.specs?.transmission || f.transmission || null,
        gcc:        f.specs?.gcc ?? f.gcc ?? null
      }
    };

    return res.status(200).json({ filters: safe, fallback: false });
  } catch (e) {
    return res.status(200).json({ filters: {}, fallback: true });
  }
}



