
// pages/api/ai-search.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query: userQuery } = req.body;
  if (!userQuery || !userQuery.trim()) return res.status(400).json({ error: 'Query is required' });

  const prompt = `
You are a UAE used car search assistant. Extract structured search filters from the user's natural language query.

USER QUERY: "${userQuery.trim()}"

RULES:
- "makes" must be an array of exact car brand names. Resolve categories:
  - "Japanese cars" → ["Toyota", "Nissan", "Honda", "Mitsubishi", "Lexus", "Infiniti"]
  - "German cars" → ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Porsche"]
  - "American cars" → ["Ford", "Chevrolet", "Dodge", "Jeep", "GMC", "Cadillac"]
  - "Korean cars" → ["Hyundai", "Kia", "Genesis"]
  - "European cars" → ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Peugeot", "Renault"]
  - "luxury cars" → ["BMW", "Mercedes-Benz", "Lexus", "Infiniti", "Porsche", "Audi", "Cadillac"]
  - If a specific brand is named, use just that: ["Toyota"]
  - If no make preference, return []
- "body" must be one of: SUV, Sedan, Pickup, Hatchback, Coupe, Van, Minivan, Convertible, or null
  - "family car" or "for a family" or "7 seats" → SUV or Minivan
  - "sporty" → Coupe or Sedan
  - "off-road" → SUV or Pickup
- "colors" must be an array of color strings. Resolve intent:
  - "bright colors" or "vibrant" → ["red", "yellow", "orange", "blue"]
  - "dark colors" → ["black", "grey", "navy", "dark blue"]
  - "neutral" or "safe" → ["white", "silver", "grey", "beige"]
  - specific color → ["white"] etc.
  - If not mentioned, return []
- "price_max": extract number in AED. "100k" = 100000, "half a million" = 500000. null if not mentioned.
- "price_min": null if not mentioned.
- "year_min": null if not mentioned. "new" or "recent" → 2021. "old" or "classic" → null.
- "year_max": null if not mentioned.
- "mileage_max": in km. "low mileage" → 60000. "very low" → 30000. null if not mentioned.
- "gcc": true if "GCC spec" or "local spec" mentioned. false if "import" mentioned. null otherwise.
- "transmission": "automatic" or "manual" or null.
- "model": specific model name string or null. e.g. "Camry", "Land Cruiser", "Patrol".

Respond ONLY with a JSON object. No explanation, no markdown, no preamble.

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
  "transmission": null
}
`.trim();

  try {
    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://uae-car-marketplace.vercel.app',
        'X-Title': 'Dawirny AI Search',
      },
      body: JSON.stringify({
        models: [
          'google/gemma-3-12b-it',
          'mistralai/mistral-7b-instruct',
          'nvidia/nemotron-3-super-120b-a12b:free',
        ],
        route: 'fallback',
        max_tokens: 250,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!llmRes.ok) {
      console.error('OpenRouter error:', await llmRes.text());
      return res.status(200).json({ filters: {}, fallback: true });
    }

    const llmData = await llmRes.json();
    const rawText = llmData.choices?.[0]?.message?.content || '';
    const clean = rawText.replace(/```json|```/g, '').trim();

    let filters;
    try {
      filters = JSON.parse(clean);
    } catch {
      console.error('LLM JSON parse failed:', rawText);
      return res.status(200).json({ filters: {}, fallback: true });
    }

    // Sanitize
    const safe = {
      makes:        Array.isArray(filters.makes) ? filters.makes.filter(m => typeof m === 'string') : [],
      model:        typeof filters.model === 'string' ? filters.model : null,
      body:         ['SUV','Sedan','Pickup','Hatchback','Coupe','Van','Minivan','Convertible'].includes(filters.body) ? filters.body : null,
      colors:       Array.isArray(filters.colors) ? filters.colors.filter(c => typeof c === 'string') : [],
      price_min:    typeof filters.price_min === 'number' ? filters.price_min : null,
      price_max:    typeof filters.price_max === 'number' ? filters.price_max : null,
      year_min:     typeof filters.year_min === 'number' ? filters.year_min : null,
      year_max:     typeof filters.year_max === 'number' ? filters.year_max : null,
      mileage_max:  typeof filters.mileage_max === 'number' ? filters.mileage_max : null,
      gcc:          typeof filters.gcc === 'boolean' ? filters.gcc : null,
      transmission: ['automatic','manual'].includes(filters.transmission) ? filters.transmission : null,
    };

    return res.status(200).json({ filters: safe, fallback: false });

  } catch (e) {
    console.error('ai-search error:', e);
    return res.status(200).json({ filters: {}, fallback: true });
  }
}




