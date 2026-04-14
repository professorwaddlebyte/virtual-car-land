// pages/api/ai-search.js
// CHANGED: nationality→makes mapping is now built dynamically from car_makes table.
// The hardcoded "Japanese → [Toyota,...]" block is gone.
// Everything else (regex pre-pass, color groups, buildSafeFilters) is unchanged.

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// COLOR GROUPS — resolved before LLM call (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const COLOR_GROUPS = {
  bright:   ['red', 'orange', 'yellow'],
  vibrant:  ['red', 'orange', 'yellow'],
  colorful: ['red', 'orange', 'yellow', 'blue', 'green'],
  dark:     ['black', 'navy', 'dark grey'],
  neutral:  ['white', 'silver', 'beige', 'grey'],
  light:    ['white', 'silver', 'beige'],
  any:      [],
  all:      [],
  every:    [],
};

/**
 * Pre-process the raw query string with regex before sending to LLM.
 * Unchanged from original.
 */
function regexPrePass(q) {
  const result = {};
  const s = q.toLowerCase();

  // ── Price ──────────────────────────────────────────────────────────────────
  const priceRangePat =
    /(?:price\s+)?(?:between\s+)?(\d[\d,]*k)\s*(?:to|and|-)\s*(\d[\d,]*k?)(?:\s*aed)?/;
  const rangeMatch = s.match(priceRangePat);
  if (rangeMatch) {
    const parseVal = v => {
      const n = parseFloat(v.replace(/,/g, '').replace(/k$/, ''));
      return /k$/.test(v) ? n * 1000 : n;
    };
    const a = parseVal(rangeMatch[1]);
    const b = parseVal(rangeMatch[2]);
    result.price_min = Math.min(a, b);
    result.price_max = Math.max(a, b);
  } else {
    const maxPat = /(?:under|below|less than|max(?:imum)?|up to|no more than)\s+(\d[\d,]*k?)(?:\s*aed)?/;
    const maxMatch = s.match(maxPat);
    if (maxMatch) {
      const v = maxMatch[1];
      const n = parseFloat(v.replace(/,/g, '').replace(/k$/, ''));
      result.price_max = /k$/.test(v) ? n * 1000 : n < 1000 ? n * 1000 : n;
    }
    const minPat = /(?:price\s+)?(?:above|over|more than|min(?:imum)?|starting(?:\s+from)?|at least)\s+(\d[\d,]*k?)(?:\s*aed)?/;
    const minMatch = s.match(minPat);
    if (minMatch) {
      const v = minMatch[1];
      const n = parseFloat(v.replace(/,/g, '').replace(/k$/, ''));
      const val = /k$/.test(v) ? n * 1000 : n < 1000 ? n * 1000 : n;
      if (val < 2000 || val > 2030) result.price_min = val;
    }
    const approxPat = /(?:around|approximately|about|~)\s+(\d[\d,]*k?)(?:\s*aed)?/;
    const approxMatch = s.match(approxPat);
    if (approxMatch && !result.price_max) {
      const v = approxMatch[1];
      const n = parseFloat(v.replace(/,/g, '').replace(/k$/, ''));
      const center = /k$/.test(v) ? n * 1000 : n < 1000 ? n * 1000 : n;
      if (center < 2000 || center > 2030) {
        result.price_min = Math.round(center * 0.8);
        result.price_max = Math.round(center * 1.2);
      }
    }
  }

  // ── Mileage ────────────────────────────────────────────────────────────────
  if (/very low mileage|very low km/.test(s))    { result.mileage_max = 30000; }
  else if (/\blow mileage\b|\blow km\b/.test(s)) { result.mileage_max = 60000; }
  else {
    const milPat = /(?:under|below|less than|max(?:imum)?)\s+(\d[\d,]*k?)(?:\s*km)/;
    const milMatch = s.match(milPat);
    if (milMatch) {
      const v = milMatch[1];
      const n = parseFloat(v.replace(/,/g, '').replace(/k$/, ''));
      result.mileage_max = /k$/.test(v) ? n * 1000 : n;
    }
  }

  // ── Year ───────────────────────────────────────────────────────────────────
  const yearRangePat = /(?:between\s+)?(20\d{2})\s*(?:to|and|-)\s*(20\d{2})/;
  const yearRangeMatch = s.match(yearRangePat);
  if (yearRangeMatch) {
    result.year_min = parseInt(yearRangeMatch[1]);
    result.year_max = parseInt(yearRangeMatch[2]);
  } else {
    const exactYearPat = /(?:^|[\s.,])(?:model\s+)?year\s+(20\d{2})\b|\b(20\d{2})\s+model\b/;
    const exactMatch = s.match(exactYearPat);
    if (exactMatch) {
      const yr = parseInt(exactMatch[1] || exactMatch[2]);
      result.year_min = yr;
      result.year_max = yr;
    } else {
      const minYearPat = /\b(20\d{2})\s*(?:and\s+above|and\s+up|or\s+newer|or\s+above|onwards|onward|\+)|(?:newer\s+than|after|from|since)\s+(20\d{2})/;
      const minYearMatch = s.match(minYearPat);
      if (minYearMatch) result.year_min = parseInt(minYearMatch[1] || minYearMatch[2]);

      const maxYearPat = /(?:older\s+than|before|up\s+to|until)\s+(20\d{2})/;
      const maxYearMatch = s.match(maxYearPat);
      if (maxYearMatch) result.year_max = parseInt(maxYearMatch[1]);

      if (/\b(?:recent|latest|modern|newest)\b/.test(s) && !result.year_min) {
        result.year_min = 2021;
      }
    }
  }

  // ── Color groups ───────────────────────────────────────────────────────────
  for (const [keyword, colors] of Object.entries(COLOR_GROUPS)) {
    const pat = new RegExp(
      `\\b${keyword}\\s+colou?rs?\\b|\\bcolou?rs?\\s+${keyword}\\b|\\ball\\s+colou?rs?\\b|\\bany\\s+colou?r?\\b`
    );
    if (pat.test(s)) {
      result.colors = colors;
      result.colorsResolved = true;
      break;
    }
    if (['bright','vibrant','colorful','dark','neutral','light'].includes(keyword)) {
      const bare = new RegExp(`\\b${keyword}\\s+colou?r(?:ed)?\\b`);
      if (bare.test(s)) {
        result.colors = colors;
        result.colorsResolved = true;
        break;
      }
    }
  }

  return result;
}

/**
 * Build nationality→makes and luxury makes maps from car_makes table.
 * Returns:
 *   nationalityMap: { Japanese: ['Toyota','Nissan',...], German: [...], ... }
 *   luxuryMakes:    ['Lexus','BMW','Mercedes-Benz',...]
 *
 * Cached in module scope for the lifetime of the serverless function instance.
 * A stale cache is fine — admin changes take effect on next cold start or
 * at most after CACHE_TTL_MS.
 */
let _makesCacheTime = 0;
let _nationalityMap = {};
let _luxuryMakes    = [];
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getMakeMaps() {
  const now = Date.now();
  if (now - _makesCacheTime < CACHE_TTL_MS) {
    return { nationalityMap: _nationalityMap, luxuryMakes: _luxuryMakes };
  }

  const { rows } = await pool.query(
    `SELECT name, nationality, is_luxury FROM car_makes ORDER BY nationality, name`
  );

  const nationalityMap = {};
  const luxuryMakes    = [];

  for (const { name, nationality, is_luxury } of rows) {
    if (!nationalityMap[nationality]) nationalityMap[nationality] = [];
    nationalityMap[nationality].push(name);
    if (is_luxury) luxuryMakes.push(name);
  }

  _nationalityMap = nationalityMap;
  _luxuryMakes    = luxuryMakes;
  _makesCacheTime = now;

  return { nationalityMap, luxuryMakes };
}

/**
 * Build the MAKES section of the LLM prompt dynamically from DB data.
 * e.g.:
 *   "Japanese" → ["Toyota","Nissan","Honda",...]
 *   "German"   → ["BMW","Mercedes-Benz","Audi",...]
 *   "Luxury"   → ["Lexus","BMW","Mercedes-Benz",...]  ← cross-nationality, is_luxury flag
 */
function buildMakesPromptSection(nationalityMap, luxuryMakes) {
  const lines = Object.entries(nationalityMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nationality, makes]) => {
      const list = makes.map(m => `"${m}"`).join(',');
      return `  "${nationality}" → [${list}]`;
    });

  // Luxury is a cross-nationality group derived from is_luxury flag
  if (luxuryMakes.length) {
    const list = luxuryMakes.map(m => `"${m}"`).join(',');
    lines.push(`  "Luxury"     → [${list}]`);
  }

  return lines.join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query: userQuery } = req.body;
  if (!userQuery || !userQuery.trim()) return res.status(400).json({ error: 'Query is required' });

  const regexFilters = regexPrePass(userQuery);

  // ── Fetch dynamic makes data ───────────────────────────────────────────────
  let nationalityMap = {};
  let luxuryMakes    = [];
  try {
    ({ nationalityMap, luxuryMakes } = await getMakeMaps());
  } catch (err) {
    console.error('[ai-search] Failed to load makes from DB:', err);
    // Degrade gracefully — LLM will still run but won't have the nationality block
  }

  const makesSection = buildMakesPromptSection(nationalityMap, luxuryMakes);

  const prompt = `
You are a UAE used car search assistant. Extract structured search filters from the user's natural language query.
Respond ONLY with a single JSON object. No explanation. No markdown. No preamble. Just the JSON.

USER QUERY: "${userQuery.trim()}"

════════════════════════════════════════
MAKES
════════════════════════════════════════
Resolve nationality/category words to brand arrays using this registry:
${makesSection}
Single brand mentioned by name → wrap in array. No brand mentioned → [].

════════════════════════════════════════
PRICE (AED integers)
════════════════════════════════════════
A regex pre-processor handles: "100k to 300k", "under 150k", "above 200k", "around 150k".
Only fill price_min/price_max for vague intent NOT covered by numeric patterns:
  "budget" / "cheap" → price_max: 40000
  "affordable"       → price_max: 60000
  "mid-range"        → price_min: 60000, price_max: 150000
  "premium" / "high-end" / "luxury price" → price_min: 150000
Otherwise leave null.

════════════════════════════════════════
YEAR (4-digit integers)
════════════════════════════════════════
A regex pre-processor handles: "year 2025", "2020 and above", "between 2018 and 2022",
"newer than 2020", "from 2020", "recent". Leave null if already handled.

════════════════════════════════════════
MILEAGE
════════════════════════════════════════
Regex handles: "low mileage"→60000, "very low mileage"→30000, "under 80km".
Only fill mileage_max for: "barely driven"→20000, "not too many km"→80000, etc.

════════════════════════════════════════
BODY TYPE
════════════════════════════════════════
body: one of "SUV", "Sedan", "Pickup", "Hatchback", "Coupe", "Van", "Minivan", "Convertible".
null if unclear.

════════════════════════════════════════
GCC SPEC
════════════════════════════════════════
  true  → "GCC" / "local spec" / "khaleeji"
  false → "import" / "non-gcc" / "american spec" / "grey import"
  null  → anything else. NEVER infer from brand name.

════════════════════════════════════════
COLORS
════════════════════════════════════════
Return colors[] as lowercase strings (e.g. ["red","white","blue"]).
Regex handles: "bright colors", "dark colors", "neutral colors", "all colors".
Only fill colors[] for explicitly named colors (e.g. "red", "white and silver").
"any color" / "all colors" → return [].

════════════════════════════════════════
FEATURES — CRITICAL, DO NOT SKIP
════════════════════════════════════════
You MUST populate specs.features[] for ANY feature mentioned. Map to EXACT strings:

SEATING:
  leather / leather seats / leather interior     → "Leather seats"
  heated seats / seat heaters / warm seats        → "Heated seats"
  cooled seats / ventilated seats / cool seat     → "Cooled seats"
  massage seats / massage                         → "Massage seats"
  third row / 3rd row / 7 seater / 8 seater       → "Third-row seating"

ROOF:
  sunroof / moonroof / sun roof                   → "Sunroof"
  panoramic / pano roof / panoramic sunroof /
  panoramic roof / glass roof                     → "Panoramic sunroof"
  panoramic glass / full glass roof               → "Panoramic glass roof"

CONNECTIVITY:
  apple carplay / carplay / android auto          → "Apple CarPlay"
  touchscreen / infotainment screen               → "Touchscreen audio"
  wireless charging / wireless charger            → "Wireless charging"
  autopilot / self driving                        → "Autopilot"

AUDIO:
  bose / bose sound / bose speakers               → "Bose sound system"
  burmester                                       → "Burmester sound system"
  bang and olufsen / b&o / bang & olufsen         → "Bang & Olufsen sound"

SAFETY:
  adaptive cruise / smart cruise                  → "Adaptive cruise control"
  cruise control / cruise                         → "Cruise control"
  lane assist / lane keep / lane departure        → "Lane keep assist"
  backup camera / reverse camera / rear cam       → "Backup camera"
  heads up display / hud / heads-up               → "Heads-up display"
  keyless / keyless entry / push start            → "Keyless-go"

DRIVETRAIN:
  4wd / four wheel drive / 4x4 / awd              → "4WD"
  quattro                                         → "Quattro AWD"
  sport mode / sports mode                        → "Sport mode"
  sport suspension / lowered suspension           → "Sport suspension"
  m sport / m package / m-sport                  → "M Sport package"
  crawl control / off road mode                   → "Crawl control"
  multi terrain / terrain select                  → "Multi-terrain select"
  tow / tow hitch / towing / trailer hitch        → "Tow hitch"
  hybrid / eco mode                               → "Hybrid efficiency"

RULES:
1. ANY feature mentioned → add its exact canonical string to specs.features[].
2. Multiple features → multiple entries.
3. Strings must be character-for-character exact (case, spacing, punctuation).
4. Return [] ONLY if the user genuinely mentions zero features.

════════════════════════════════════════
OTHER SPECS
════════════════════════════════════════
transmission: "automatic" or "manual". null if not mentioned.
fuel: "petrol", "diesel", "electric", or "hybrid". null if not mentioned.
cylinders: integer (4, 6, 8). null if not mentioned.

════════════════════════════════════════
OUTPUT — ONLY THIS JSON, NOTHING ELSE:
════════════════════════════════════════
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
    "transmission": null
  }
}
`.trim();

  // Build valid makes set for sanitizing LLM output
  const allMakeNames = new Set(
    Object.values(nationalityMap).flat().concat(luxuryMakes)
  );

  try {
    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        models: [
          'google/gemini-2.0-flash-001',
          'google/gemini-flash-1.5-8b',
        ],
        route: 'fallback',
        max_tokens: 500,
        temperature: 0.0,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!llmRes.ok) {
      return res.status(200).json({ filters: buildSafeFilters({}, regexFilters), fallback: true });
    }

    const llmData = await llmRes.json();
    const raw = llmData.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let f = {};
    try { f = JSON.parse(clean); } catch { /* regex results still returned */ }

    // Validate makes against DB — reject any hallucinated brand names
    const validatedMakes = Array.isArray(f.makes)
      ? f.makes.filter(m => allMakeNames.size === 0 || allMakeNames.has(m))
      : [];

    const llmSafe = {
      makes:        validatedMakes,
      model:        typeof f.model === 'string' && f.model ? f.model : null,
      body:         ['SUV','Sedan','Pickup','Hatchback','Coupe','Van','Minivan','Convertible'].includes(f.body) ? f.body : null,
      colors:       !regexFilters.colorsResolved && Array.isArray(f.colors)
                      ? f.colors.map(c => c.toLowerCase())
                      : [],
      price_min:    Number(f.price_min) || null,
      price_max:    Number(f.price_max) || null,
      year_min:     Number(f.year_min)  || null,
      year_max:     Number(f.year_max)  || null,
      mileage_max:  Number(f.mileage_max) || null,
      gcc:          typeof f.gcc === 'boolean' ? f.gcc : null,
      transmission: ['automatic','manual'].includes(f.transmission) ? f.transmission : null,
      specs: {
        features:     Array.isArray(f.specs?.features) ? f.specs.features : [],
        fuel:         ['petrol','diesel','electric','hybrid'].includes(f.specs?.fuel) ? f.specs.fuel : null,
        cylinders:    Number(f.specs?.cylinders) || null,
        color:        f.specs?.color ? f.specs.color.toLowerCase() : null,
        transmission: f.specs?.transmission || f.transmission || null,
      }
    };

    return res.status(200).json({
      filters: buildSafeFilters(llmSafe, regexFilters),
      fallback: false,
    });

  } catch (e) {
    return res.status(200).json({ filters: buildSafeFilters({}, regexFilters), fallback: true });
  }
}

/**
 * Merge regex pre-pass (authoritative) over LLM results. Unchanged from original.
 */
function buildSafeFilters(llm, regex) {
  const merged = {
    ...llm,
    price_min:   regex.price_min   ?? llm.price_min   ?? null,
    price_max:   regex.price_max   ?? llm.price_max   ?? null,
    mileage_max: regex.mileage_max ?? llm.mileage_max ?? null,
    year_min:    regex.year_min    ?? llm.year_min    ?? null,
    year_max:    regex.year_max    ?? llm.year_max    ?? null,
  };

  if (regex.colorsResolved) {
    merged.colors = regex.colors;
  }

  return merged;
}




