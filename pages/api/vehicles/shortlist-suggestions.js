// pages/api/vehicles/shortlist-suggestions.js
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { shortlist } = req.body;

  if (!Array.isArray(shortlist) || shortlist.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 shortlisted cars.' });
  }

  const shortlistedIds = shortlist.map(v => v.id);

  try {
    // ── Step 1: DB pre-filter ──────────────────────────────────────────────
    // For each shortlisted car, pull up to 4 comparable active vehicles
    // (same make, year ±2, price ±35%). Deduplicate, exclude shortlisted IDs.
    // Hard cap: 20 candidates total to keep payload lean.

    const placeholders = shortlistedIds.map((_, i) => `$${i + 1}`).join(', ');

    const candidateRows = await pool.query(`
      WITH ranked AS (
        SELECT
          v.id, v.make, v.model, v.year, v.price_aed, v.mileage_km,
          v.specs, v.showroom_id, s.showroom_number, d.score_tier,
          ROW_NUMBER() OVER (
            PARTITION BY v.make
            ORDER BY ABS(v.price_aed - ref.ref_price) ASC
          ) AS rn
        FROM vehicles v
        LEFT JOIN showrooms s ON v.showroom_id = s.id
        LEFT JOIN dealers d ON v.dealer_id = d.id
        -- Cross-join with a derived table of shortlist reference points
        JOIN (
          SELECT unnest($${shortlistedIds.length + 1}::text[]) AS ref_make,
                 unnest($${shortlistedIds.length + 2}::int[])  AS ref_year,
                 unnest($${shortlistedIds.length + 3}::numeric[]) AS ref_price
        ) ref ON v.make = ref.ref_make
        WHERE v.status = 'active'
          AND v.id NOT IN (${placeholders})
          AND v.year BETWEEN ref.ref_year - 2 AND ref.ref_year + 2
          AND v.price_aed BETWEEN ref.ref_price * 0.65 AND ref.ref_price * 1.35
      )
      SELECT id, make, model, year, price_aed, mileage_km, specs,
             showroom_number, score_tier
      FROM ranked
      WHERE rn <= 4
      ORDER BY rn
      LIMIT 20
    `, [
      ...shortlistedIds,
      shortlist.map(v => v.make),
      shortlist.map(v => parseInt(v.year) || 2020),
      shortlist.map(v => parseFloat(v.price_aed) || 50000),
    ]);

    const inventory = candidateRows.rows;

    // ── Step 2: Build lean LLM payload ────────────────────────────────────
    const shortlistPayload = shortlist.map(v => ({
      id: v.id,
      label: `${v.year} ${v.make} ${v.model}`,
      price_aed: v.price_aed,
      mileage_km: v.mileage_km,
      gcc: v.specs?.gcc ?? null,
      score_tier: v.score_tier,
      showroom: v.showroom_number,
    }));

    const inventoryPayload = inventory.map(v => ({
      id: v.id,
      label: `${v.year} ${v.make} ${v.model}`,
      price_aed: v.price_aed,
      mileage_km: v.mileage_km,
      gcc: v.specs?.gcc ?? null,
      score_tier: v.score_tier,
      showroom: v.showroom_number,
    }));

    // ── Step 3: Call OpenRouter ────────────────────────────────────────────
    const systemPrompt = `You are a UAE used-car buying advisor helping a customer at Dubai Auto Market, Ras Al Khor.
The customer has shortlisted ${shortlist.length} cars. You will receive:
1. "shortlist": the cars they saved
2. "inventory": comparable active cars from the same market (NOT in their shortlist)

Your job: return a single JSON object with this exact shape — no markdown, no explanation, only JSON:
{
  "best_pick": {
    "id": "<shortlisted car id>",
    "reason": "<1 sentence, specific, mention price/mileage/tier>"
  },
  "remove_suggestions": [
    { "id": "<shortlisted car id>", "reason": "<1 sentence why it's weaker>" }
  ],
  "add_suggestions": [
    { "id": "<inventory car id>", "reason": "<1 sentence why it's worth visiting>" }
  ]
}

Rules:
- best_pick: exactly 1 winner from the shortlist
- remove_suggestions: 0–2 cars from shortlist that are clearly outclassed (omit if all are good)
- add_suggestions: 1–3 cars from inventory that are genuinely better value or lower mileage
- Be specific: mention AED amounts, mileage figures, GCC spec, dealer tier
- Never recommend a car that is already in the shortlist as an add_suggestion
- Never invent car IDs — only use IDs from the data provided
- Output ONLY the JSON object`;

    const userMessage = `shortlist: ${JSON.stringify(shortlistPayload)}
inventory: ${JSON.stringify(inventoryPayload)}`;

    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://uae-car-marketplace.vercel.app',
        'X-Title': 'Dawirny Shortlist AI',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        max_tokens: 600,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error('OpenRouter error:', errText);
      return res.status(502).json({ error: 'AI service unavailable. Try again shortly.' });
    }

    const llmData = await llmRes.json();
    const rawText = llmData.choices?.[0]?.message?.content || '';

    // ── Step 4: Parse & sanitise ──────────────────────────────────────────
    let parsed;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error('LLM parse error, raw:', rawText);
      return res.status(502).json({ error: 'AI returned an unexpected response. Try again.' });
    }

    // Validate IDs to prevent hallucinations
    const validShortlistIds = new Set(shortlistedIds);
    const validInventoryIds = new Set(inventory.map(v => v.id));

    if (!validShortlistIds.has(parsed.best_pick?.id)) {
      return res.status(502).json({ error: 'AI returned invalid data. Try again.' });
    }

    const safeRemove = (parsed.remove_suggestions || [])
      .filter(s => validShortlistIds.has(s.id))
      .slice(0, 2);

    const safeAdd = (parsed.add_suggestions || [])
      .filter(s => validInventoryIds.has(s.id))
      .slice(0, 3);

    // Enrich add_suggestions with full vehicle details for card rendering
    const inventoryMap = Object.fromEntries(inventory.map(v => [v.id, v]));
    const enrichedAdd = safeAdd.map(s => ({
      ...s,
      vehicle: inventoryMap[s.id] || null,
    }));

    return res.status(200).json({
      best_pick: parsed.best_pick,
      remove_suggestions: safeRemove,
      add_suggestions: enrichedAdd,
    });

  } catch (err) {
    console.error('Shortlist suggestions error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}



