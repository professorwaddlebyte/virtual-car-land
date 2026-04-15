// pages/api/vehicles/validate-photos.js
// Validates that uploaded photos match the claimed vehicle make/model/year/color/body type

import { uploadImage } from '../../../lib/cloudinary.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb', // Allow multiple images
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify dealer auth
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let user;
  try {
    const jwt = await import('jsonwebtoken');
    user = jwt.default.verify(token, process.env.JWT_SECRET);
    if (user.role !== 'dealer') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { images, imageUrls, vehicle } = req.body;

  if ((!images || !Array.isArray(images) || images.length === 0) &&
      (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0)) {
    return res.status(400).json({ error: 'At least one image is required' });
  }

  if (!vehicle || !vehicle.make || !vehicle.model || !vehicle.year) {
    return res.status(400).json({ error: 'Vehicle make, model, and year are required' });
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // Determine which images to analyze (URLs from Cloudinary or base64 uploads)
    // ─────────────────────────────────────────────────────────────────────────
    let urlsToAnalyze = [];
    
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      // Use existing Cloudinary URLs (from ManagePhotosModal)
      urlsToAnalyze = imageUrls.slice(0, 6);
    } else if (images && Array.isArray(images) && images.length > 0) {
      // Upload base64 images to Cloudinary temporarily (from AddCarModal)
      for (const base64Image of images.slice(0, 6)) {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const result = await uploadImage(buffer, {
          folder: 'vcarland/temp_validation',
          public_id: `temp_validate_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        });
        urlsToAnalyze.push(result.secure_url);
      }
    }

    if (urlsToAnalyze.length === 0) {
      return res.status(400).json({ error: 'No valid images to analyze' });
    }

    // Build the analysis prompt
    const prompt = buildValidationPrompt(vehicle, urlsToAnalyze.length);

    // Call OpenRouter with images
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001', // Gemini 2.0 has best vision capabilities
        max_tokens: 800,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...urlsToAnalyze.map(url => ({
                type: 'image_url',
                image_url: { url, detail: 'high' }
              }))
            ]
          }
        ]
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('LLM API error:', errorText);
      return res.status(200).json({
        valid: true, // Graceful fallback - allow save if AI fails
        confidence: 0,
        match: 'unknown',
        warning: 'AI validation temporarily unavailable. Please review photos manually.',
        discrepancies: [],
      });
    }

    const llmData = await llmResponse.json();
    const rawContent = llmData.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    let analysis;
    try {
      const cleanJson = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse LLM response:', rawContent);
      return res.status(200).json({
        valid: true,
        confidence: 0,
        match: 'unknown',
        warning: 'Could not analyze images. Please verify photos manually.',
        discrepancies: [],
        raw_response: rawContent,
      });
    }

    // Determine if vehicle is valid based on match and confidence
    const isValid = analysis.match === 'yes' || 
                    (analysis.match === 'partial' && analysis.confidence >= 70);
    
    return res.status(200).json({
      valid: isValid,
      confidence: analysis.confidence || 0,
      match: analysis.match,
      inferred_make: analysis.inferred_make,
      inferred_model: analysis.inferred_model,
      inferred_year: analysis.inferred_year,
      inferred_trim: analysis.inferred_trim,
      inferred_color: analysis.inferred_color,
      inferred_body: analysis.inferred_body,
      discrepancies: analysis.discrepancies || [],
      warning: !isValid ? analysis.summary : null,
      details: analysis,
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(200).json({
      valid: true,
      confidence: 0,
      match: 'unknown',
      warning: 'AI validation encountered an error. Please review photos manually.',
      discrepancies: [],
    });
  }
}

function buildValidationPrompt(vehicle, imageCount) {
  const { make, model, year, color, body, trim } = vehicle;
  
  return `You are a professional vehicle authentication expert. Analyze the ${imageCount} images provided (which should include front, rear, side, and interior views).

**CLAIMED VEHICLE SPECS:**
- Make: ${make}
- Model: ${model}
- Year: ${year}
- Color: ${color || 'Not specified'}
- Body Type: ${body || 'Not specified'}
- Trim Level: ${trim || 'Not specified'}

**TASK:** Determine if the images ACTUALLY show the claimed vehicle.

**ANALYSIS REQUIREMENTS:**
1. Check for visual evidence that supports OR contradicts the claimed make/model/year
2. Look for red flags: different badge, wrong taillight/headlight design, mismatched dashboard, wrong wheels, different body lines
3. Infer the actual make, model, year, color, body type, and trim from the images

**COMMON DISCREPANCIES TO DETECT:**
- Badge says different brand (e.g., "Altima" on a claimed Camry)
- Taillight shape doesn't match claimed year (e.g., rounded vs angular)
- Headlight design belongs to different generation
- Dashboard/infotainment from wrong year range
- Wheel style belongs to different trim or model
- Body lines don't match claimed model

**OUTPUT ONLY VALID JSON (no markdown, no explanation):**

{
  "match": "yes" | "partial" | "no",
  "confidence": 0-100,
  "inferred_make": "string or null",
  "inferred_model": "string or null",
  "inferred_year": number or null,
  "inferred_color": "string or null",
  "inferred_body": "string or null",
  "inferred_trim": "string or null",
  "discrepancies": [
    {
      "observed": "what you see in the image",
      "expected": "what the claimed vehicle should have",
      "severity": "critical" | "major" | "minor"
    }
  ],
  "summary": "Brief conclusion explaining the verdict"
}

**RULES:**
- "yes" = all major visual elements match the claimed specs
- "partial" = mostly matches but has minor discrepancies (different wheels, missing badge, etc.)
- "no" = significant mismatch (different brand, different generation, clearly wrong model)
- Confidence below 60% should default to "no" or "partial"
- Be specific about discrepancies with visual evidence
- If color is clearly different from claimed, flag as discrepancy
- Return null for inferred fields you cannot determine with confidence`;
}



