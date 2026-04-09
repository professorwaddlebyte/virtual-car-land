// pages/api/vehicles/[id]/price-analysis.js
import { query } from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;

  try {
    // 1. Fetch the target vehicle
    const vehicles = await query(
      `SELECT id, make, model, year, price_aed, mileage_km, specs, description
       FROM vehicles WHERE id = $1 AND status = 'active'`,
      [id]
    );
    if (!vehicles.length) return res.status(404).json({ error: 'Vehicle not found' });
    const car = vehicles[0];

    // 2. Fetch comparables: same make+model, year ±2, mileage ±40%, active, exclude self
    const mileageLow  = Math.round(car.mileage_km * 0.6);
    const mileageHigh = Math.round(car.mileage_km * 1.4);

    const comparables = await query(
      `SELECT price_aed, year, mileage_km, specs
       FROM vehicles
       WHERE make = $1
         AND model = $2
         AND year BETWEEN $3 AND $4
         AND mileage_km BETWEEN $5 AND $6
         AND status = 'active'
         AND id != $7
       ORDER BY ABS(year - $8), ABS(mileage_km - $9)
       LIMIT 10`,
      [
        car.make, car.model,
        car.year - 2, car.year + 2,
        mileageLow, mileageHigh,
        id,
        car.year, car.mileage_km,
      ]
    );

    // 3. Build lean context for LLM — no IDs, no internal fields
    const targetSummary = {
      year:        car.year,
      price_aed:   car.price_aed,
      mileage_km:  car.mileage_km,
      gcc:         car.specs?.gcc ?? null,
      transmission:car.specs?.transmission ?? null,
      body:        car.specs?.body ?? null,
      fuel:        car.specs?.fuel ?? null,
      cylinders:   car.specs?.cylinders ?? null,
      color:       car.specs?.color ?? null,
      features:    car.specs?.features ?? [],
    };

    const comparablesSummary = comparables.map(c => ({
      year:        c.year,
      price_aed:   c.price_aed,
      mileage_km:  c.mileage_km,
      gcc:         c.specs?.gcc ?? null,
      transmission:c.specs?.transmission ?? null,
      body:        c.specs?.body ?? null,
      fuel:        c.specs?.fuel ?? null,
      cylinders:   c.specs?.cylinders ?? null,
      features:    c.specs?.features ?? [],
    }));

    // 4. If no comparables, return a graceful fallback without calling LLM
    if (comparablesSummary.length === 0) {
      return res.status(200).json({
        verdict:             'Insufficient Data',
        badge_color:         'gray',
        bullets:             [
          'No comparable vehicles found in the market right now.',
          'This may be a rare model or unique trim.',
          'Consider checking broader market sources for pricing reference.',
        ],
        negotiation_margin:  'Unknown — no comparables available',
        comparables_count:   0,
      });
    }

    // 5. Call OpenRouter
    const prompt = `
You are a UAE used car pricing expert with deep knowledge of the Dubai auto market.
Analyze the target car's price against the comparables below and return ONLY a JSON object — no explanation, no markdown, no preamble.

TARGET CAR:
${JSON.stringify(targetSummary, null, 2)}

COMPARABLE CARS IN SAME MARKET (${comparablesSummary.length} listings):
${JSON.stringify(comparablesSummary, null, 2)}

Important UAE market context:
- GCC spec cars command a premium of 5-15% over non-GCC (import) spec
- Dubai market is active and price-sensitive
- Features like panoramic sunroof, leather seats, AWD significantly affect value
- Mileage above 150,000 km reduces value noticeably

Return this exact JSON structure:
{
  "verdict": "one of: Great Deal | Fair Price | Slightly Overpriced | Overpriced",
  "badge_color": "one of: green | teal | yellow | red",
  "bullets": [
    "first insight about price position vs comparables (mention AED figures)",
    "second insight about specs, mileage, or GCC status impact",
    "third insight about what specifically justifies or undermines this price"
  ],
  "negotiation_margin": "a short string like 'AED 3,000–5,000 room to negotiate' or 'Priced competitively — minimal room' or 'AED 8,000–12,000 negotiation potential'"
}
`.trim();

    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://uae-car-marketplace.vercel.app',
        'X-Title': 'Dawirny Price Analysis',
      },
      body: JSON.stringify({
        models: [
          'openai/gpt-4o-mini',
          'anthropic/claude-3-haiku',
          'nvidia/nemotron-3-super-120b-a12b:free',
        ],
        route: 'fallback',
        max_tokens: 400,
        temperature: 0.3,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error('OpenRouter error:', errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const llmData = await llmRes.json();
    const rawText = llmData.choices?.[0]?.message?.content || '';

    // 6. Parse JSON — strip any accidental markdown fences
    const clean = rawText.replace(/```json|```/g, '').trim();
    let analysis;
    try {
      analysis = JSON.parse(clean);
    } catch {
      console.error('LLM JSON parse failed:', rawText);
      return res.status(500).json({ error: 'Could not parse AI response' });
    }

    // 7. Sanitize output before returning
    const safeVerdict = ['Great Deal', 'Fair Price', 'Slightly Overpriced', 'Overpriced'].includes(analysis.verdict)
      ? analysis.verdict : 'Fair Price';
    const safeBadge = ['green', 'teal', 'yellow', 'red'].includes(analysis.badge_color)
      ? analysis.badge_color : 'gray';

    return res.status(200).json({
      verdict:            safeVerdict,
      badge_color:        safeBadge,
      bullets:            Array.isArray(analysis.bullets) ? analysis.bullets.slice(0, 3) : [],
      negotiation_margin: analysis.negotiation_margin || '',
      comparables_count:  comparablesSummary.length,
    });

  } catch (e) {
    console.error('price-analysis error:', e);
    return res.status(500).json({ error: e.message });
  }
}



