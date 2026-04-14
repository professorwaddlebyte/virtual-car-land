// pages/api/validate-documents.js
// Uses Gemini Flash via OpenRouter to verify:
//   1. Trade license image matches entered business name, license#, expiry
//   2. Emirates ID (front) matches entered ID number and expiry
// No auth required — public endpoint used during self-registration

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    trade_license_url, emirates_id_front_url,
    business_name, trade_license_number, trade_license_expiry,
    emirates_id_number, emirates_id_expiry,
  } = req.body;

  const missing = ['trade_license_url','emirates_id_front_url','business_name',
    'trade_license_number','trade_license_expiry','emirates_id_number','emirates_id_expiry']
    .filter(k => !req.body[k]);
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

  function fmtDate(iso) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  const prompt = `You are a document verification assistant for a UAE car marketplace.
You will be given two document images and values a user entered in a registration form.
Check whether the document images match the entered values.

DOCUMENT CONTEXT:

DUBAI TRADE LICENSE (DED — Dubai Department of Economy and Tourism):
- Has DED logo and header
- Fields: License Number, Trade Name (English + Arabic), Legal Type, Activities, Issue Date, Expiry Date
- Trade name is the legal registered business name

EMIRATES ID (ICA — Federal Authority for Identity, Citizenship, Customs & Port Security):
- Credit-card sized blue biometric ID card
- FRONT: "United Arab Emirates" header, holder photo, Full Name (English + Arabic), ID Number format 784-YYYY-XXXXXXX-X, Nationality, Date of Birth, Expiry Date
- ID Number always starts with 784 (UAE country code)

CHECK:
1. TRADE LICENSE image:
   - Does trade name match entered business name: "${business_name}"?
   - Does license number match: "${trade_license_number}"?
   - Does expiry date match: "${fmtDate(trade_license_expiry)}"?
   - Is this actually a Dubai Trade License (not some other document)?
   - Is the license already expired?

2. EMIRATES ID (front) image:
   - Does ID number match: "${emirates_id_number}"?
   - Does expiry date match: "${fmtDate(emirates_id_expiry)}"?
   - Is this actually an Emirates ID front (not a passport or other document)?
   - Is the ID already expired?

Respond ONLY with this JSON, no markdown, no explanation:
{
  "trade_license": {
    "is_correct_document": true or false,
    "business_name_match": true or false,
    "license_number_match": true or false,
    "expiry_match": true or false,
    "actual_business_name": "what you read from document",
    "actual_license_number": "what you read from document",
    "actual_expiry": "what you read from document",
    "is_expired": true or false
  },
  "emirates_id": {
    "is_correct_document": true or false,
    "id_number_match": true or false,
    "expiry_match": true or false,
    "actual_id_number": "what you read from document",
    "actual_expiry": "what you read from document",
    "is_expired": true or false
  }
}`;

  try {
    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        max_tokens: 600,
        temperature: 0.0,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: trade_license_url, detail: 'high' } },
            { type: 'image_url', image_url: { url: emirates_id_front_url, detail: 'high' } },
          ],
        }],
      }),
    });

    if (!llmRes.ok) {
      console.error('OpenRouter error:', await llmRes.text());
      return res.status(502).json({ error: 'Document verification service unavailable. Please try again.' });
    }

    const llmData = await llmRes.json();
    const raw = llmData.choices?.[0]?.message?.content || '';
    let result;
    try {
      result = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      console.error('LLM parse error, raw:', raw);
      return res.status(502).json({ error: 'Could not read verification result. Please try again.' });
    }

    const errors = [];

    if (!result.trade_license.is_correct_document) {
      errors.push({ field: 'trade_license', message: 'The uploaded file does not appear to be a valid Dubai Trade License. Please upload your DED-issued trade license.' });
    } else {
      if (result.trade_license.is_expired) errors.push({ field: 'trade_license', message: `Your trade license has expired (shown on document: ${result.trade_license.actual_expiry}). You must have a valid license to register.` });
      if (!result.trade_license.business_name_match) errors.push({ field: 'business_name', message: `Business name mismatch. You entered "${business_name}" but the license shows "${result.trade_license.actual_business_name}". Please match exactly as printed on your license.` });
      if (!result.trade_license.license_number_match) errors.push({ field: 'trade_license_number', message: `License number mismatch. You entered "${trade_license_number}" but the document shows "${result.trade_license.actual_license_number}".` });
      if (!result.trade_license.expiry_match) errors.push({ field: 'trade_license_expiry', message: `License expiry mismatch. You entered "${fmtDate(trade_license_expiry)}" but the document shows "${result.trade_license.actual_expiry}".` });
    }

    if (!result.emirates_id.is_correct_document) {
      errors.push({ field: 'emirates_id_front', message: 'The uploaded file does not appear to be a valid Emirates ID. Please upload the front of your Emirates ID card (the blue ICA-issued card).' });
    } else {
      if (result.emirates_id.is_expired) errors.push({ field: 'emirates_id_front', message: `Your Emirates ID has expired (shown on document: ${result.emirates_id.actual_expiry}). Please renew your ID before registering.` });
      if (!result.emirates_id.id_number_match) errors.push({ field: 'emirates_id_number', message: `Emirates ID number mismatch. You entered "${emirates_id_number}" but the document shows "${result.emirates_id.actual_id_number}".` });
      if (!result.emirates_id.expiry_match) errors.push({ field: 'emirates_id_expiry', message: `Emirates ID expiry mismatch. You entered "${fmtDate(emirates_id_expiry)}" but the document shows "${result.emirates_id.actual_expiry}".` });
    }

    return res.status(200).json({ ok: errors.length === 0, errors });
  } catch (e) {
    console.error('Validate documents error:', e.message);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}



