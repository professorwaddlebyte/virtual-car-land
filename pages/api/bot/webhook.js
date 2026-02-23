import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const update = req.body;

  try {
    const message = update.message || update.callback_query?.message;
    const chatId = message?.chat?.id?.toString();
    const text = update.message?.text || '';
    const callbackData = update.callback_query?.data;

    if (!chatId) {
      return res.status(200).json({ ok: true });
    }

    // Load session
    let sessions = await query(`
      SELECT * 
      FROM dealer_bot_sessions 
      WHERE telegram_chat_id = $1
    `, [chatId]);
    let session = sessions[0] || null;

    // Route to handler
    if (text === '/start') {
      await handleStart(chatId, session);
    } else if (text === '/mylistings') {
      await handleMyListings(chatId, session);
    } else if (text === '/confirm') {
      await handleConfirm(chatId, session);
    } else if (text?.startsWith('/sold')) {
      await handleSold(chatId, text, session);
    } else if (callbackData) {
      await handleCallback(chatId, callbackData, session, update.callback_query.id);
    } else if (session?.current_step === 'awaiting_vehicle_input') {
      await handleVehicleInput(chatId, text, session);
    } else if (session?.current_step === 'awaiting_phone') {
      await handlePhoneRegistration(chatId, text);
    } else {
      await sendMessage(chatId, `I didn't understand that. Here are your options:

 + /mylistings — View your active listings
 + /confirm — Confirm listings still available
 + /sold [number] — Mark a car as sold

 + Or just type car details to add a new listing:
 + _Example: 2013 Toyota Camry, GCC, silver, automatic, 145k km, 28500_`);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Bot error:', error);
    return res.status(200).json({ ok: true });
  }
}

async function handleStart(chatId, session) {
  if (session?.dealer_id) {
    const dealers = await query(`
      SELECT d.*, s.showroom_number, s.section, s.location_hint
      FROM dealers d
      LEFT JOIN showrooms s ON d.id = s.dealer_id
      WHERE d.id = $1
    `, [session.dealer_id]);
    const dealer = dealers[0];
    await sendMessage(chatId, `Welcome back, *${dealer.business_name}*! 👋

 + 📍 Showroom: *${dealer.showroom_number}* — ${dealer.location_hint}
 + ⭐ Score: *${dealer.listing_integrity_score}/100* (${dealer.score_tier})

 + What would you like to do?

 + /mylistings — View active inventory
 + /confirm — Confirm listings still available
 + /sold [number] — Mark car as sold

 + Or type car details to add a new listing.`);
  } else {
    await sendMessage(chatId, `Welcome to *NURDeals* 🚗

 + The smart inventory system for UAE car markets.

 + To get started, please send your registered phone number.
 + Example: _+971501111111_`);
    await upsertSession(chatId, null, 'awaiting_phone');
  }
}

async function handleMyListings(chatId, session) {
  if (!session?.dealer_id) {
    await sendMessage(chatId, 'Please register first by sending /start');
    return;
  }

  const vehicles = await query(`
    SELECT 
      id, make, model, year, price_aed, mileage_km, views_count, created_at, expires_at,
      EXTRACT(DAY FROM (expires_at - NOW())) as days_left
    FROM vehicles 
    WHERE dealer_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 10
  `, [session.dealer_id]);

  if (!vehicles.length) {
    await sendMessage(chatId, 'You have no active listings.\n\nType car details to add one!');
    return;
  }

  let message = `*Your Active Listings* (${vehicles.length})\n\n`;
  vehicles.forEach((v, i) => {
    const daysLeft = Math.floor(v.days_left);
    const urgency = daysLeft <= 3 ? '🔴' : daysLeft <= 7 ? '🟡' : '🟢';
    message += `${i + 1}. *${v.year} ${v.make} ${v.model}*\n`;
    message += `💰 AED ${v.price_aed.toLocaleString()}\n`;
    message += `👁 ${v.views_count} views ${urgency} ${daysLeft}d left\n\n`;
  });
  message += `To mark sold: /sold 1 (use listing number above)`;
  await sendMessage(chatId, message);
}

async function handleConfirm(chatId, session) {
  if (!session?.dealer_id) {
    await sendMessage(chatId, 'Please register first by sending /start');
    return;
  }

  const result = await query(`
    UPDATE vehicles 
    SET confirmed_at = NOW(), expires_at = NOW() + INTERVAL '14 days'
    WHERE dealer_id = $1 AND status = 'active'
    RETURNING id
  `, [session.dealer_id]);

  await query(`
    UPDATE dealers 
    SET listing_integrity_score = LEAST(100, listing_integrity_score + 2)
    WHERE id = $1
  `, [session.dealer_id]);

  await sendMessage(chatId, `✅ *${result.length} listings confirmed!*

 + All your cars are marked as available for another 14 days.
 + Your integrity score has been updated. Keep it up! 💪`);
}

async function handleSold(chatId, text, session) {
  if (!session?.dealer_id) {
    await sendMessage(chatId, 'Please register first by sending /start');
    return;
  }

  const parts = text.split(' ');
  const listingNumber = parseInt(parts[1]);
  if (!listingNumber) {
    await sendMessage(chatId, `Please specify a listing number.
Example: /sold 2

Use /mylistings to see your listing numbers.`);
    return;
  }

  const vehicles = await query(`
    SELECT id, make, model, year, price_aed, created_at
    FROM vehicles 
    WHERE dealer_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 10
  `, [session.dealer_id]);

  const vehicle = vehicles[listingNumber - 1];
  if (!vehicle) {
    await sendMessage(chatId, `Listing #${listingNumber} not found. Use /mylistings to see your listings.`);
    return;
  }

  const daysToSell = Math.floor((new Date() - new Date(vehicle.created_at)) / (1000 * 60 * 60 * 24));

  await query(`
    UPDATE vehicles 
    SET status = 'sold', sold_at = NOW(), days_to_sell = $1
    WHERE id = $2
  `, [daysToSell, vehicle.id]);

  await query(`
    UPDATE dealers 
    SET total_sold = total_sold + 1, listing_integrity_score = LEAST(100, listing_integrity_score + 5)
    WHERE id = $1
  `, [session.dealer_id]);

  await sendMessage(chatId, `🎉 *Sold! Congratulations!*

 + ${vehicle.year} ${vehicle.make} ${vehicle.model}
 + AED ${vehicle.price_aed.toLocaleString()} — sold in ${daysToSell} days

 + Your integrity score has been boosted! ⭐`);
}

async function handleVehicleInput(chatId, text, session) {
  const parsed = parseVehicleText(text);
  if (!parsed.make || !parsed.model || !parsed.year || !parsed.price) {
    await sendMessage(chatId, `I couldn't extract all the details. Please include:

 + • Year, Make, Model
 + • Price in AED
 + • Mileage (optional)

 + Example: _2013 Toyota Camry, GCC, silver, automatic, 145k km, 28500_`);
    return;
  }

  await upsertSession(chatId, session?.dealer_id, 'awaiting_confirmation', { parsed, raw_text: text });

  await sendMessageWithButtons(chatId, `I found these details:

 + 🚗 *${parsed.year} ${parsed.make} ${parsed.model}*
 + 💰 AED ${parseInt(parsed.price).toLocaleString()}
 + 📍 ${parsed.gcc ? 'GCC Specs' : 'Non-GCC'}
 + 🎨 ${parsed.color || 'Not specified'}
 + ⚙️ ${parsed.transmission || 'Not specified'}
 + 🔢 ${parsed.mileage ? parsed.mileage.toLocaleString() + ' km' : 'Not specified'}

 + Is this correct?`, [
    { text: '✅ Yes, Add Listing', callback_data: 'confirm_add' },
    { text: '❌ Cancel', callback_data: 'cancel_add' }
  ]);
}

async function handleCallback(chatId, callbackData, session, callbackQueryId) {
  await answerCallback(callbackQueryId);

  if (callbackData === 'confirm_add') {
    if (!session?.dealer_id) {
      await sendMessage(chatId, 'Session expired. Please send /start');
      return;
    }

    const parsed = session.session_state?.parsed;
    if (!parsed) {
      await sendMessage(chatId, 'Session expired. Please try again.');
      return;
    }

    const showrooms = await query(`
      SELECT id, market_id 
      FROM showrooms 
      WHERE dealer_id = $1 
      LIMIT 1
    `, [session.dealer_id]);
    const showroom = showrooms[0];

    await query(`
      INSERT INTO vehicles (
        dealer_id, showroom_id, market_id,
        make, model, year, price_aed, mileage_km,
        specs, status, raw_input_text,
        ai_processed_at, confirmed_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, NOW(), NOW(), NOW() + INTERVAL '14 days')
    `, [
      session.dealer_id,
      showroom?.id || null,
      showroom?.market_id || null,
      parsed.make,
      parsed.model,
      parsed.year,
      parsed.price,
      parsed.mileage || null,
      JSON.stringify({
        gcc: parsed.gcc,
        color: parsed.color || null,
        transmission: parsed.transmission || null,
        fuel: 'petrol',
        body: parsed.body || null
      }),
      session.session_state?.raw_text
    ]);

    await query(`
      UPDATE dealers 
      SET total_listings = total_listings + 1
      WHERE id = $1
    `, [session.dealer_id]);

    await upsertSession(chatId, session.dealer_id, 'awaiting_vehicle_input', {});

    await sendMessage(chatId, `✅ *Listing Added Successfully!*

 + ${parsed.year} ${parsed.make} ${parsed.model} — AED ${parseInt(parsed.price).toLocaleString()}

 + Your car is now live on Virtual Car Land 🚗

 + Send another car or use /mylistings to see your inventory.`);
  } else if (callbackData === 'cancel_add') {
    await upsertSession(chatId, session?.dealer_id, 'awaiting_vehicle_input', {});
    await sendMessage(chatId, 'Cancelled. Send car details again whenever you\'re ready.');
  }
}

async function handlePhoneRegistration(chatId, text) {
  const phone = text.trim().replace(/\s/g, '');
  const dealers = await query(`
    SELECT d.*, u.full_name
    FROM dealers d
    JOIN users u ON d.user_id = u.id
    WHERE d.phone = $1 OR u.phone = $1
  `, [phone]);

  if (!dealers.length) {
    await sendMessage(chatId, `Phone number not found. Please contact support to register your dealership.

 + Support: @NURDealsSupport`);
    return;
  }

  const dealer = dealers[0];
  
  await query(`
    UPDATE dealers 
    SET telegram_chat_id = $1
    WHERE id = $2
  `, [chatId, dealer.id]);

  await upsertSession(chatId, dealer.id, 'awaiting_vehicle_input', {});

  await sendMessage(chatId, `✅ *Welcome, ${dealer.full_name}!*

 + You're now connected to NURDeals.

 + ⭐ Integrity Score: *${dealer.listing_integrity_score}/100* (${dealer.score_tier})

 + To add a car, just type the details:
 + _Example: 2019 Nissan Patrol, GCC, white, automatic, 41k km, 198000_

 + /mylistings — View inventory
 + /confirm — Confirm listings available
 + /sold [number] — Mark as sold`);
}

function parseVehicleText(text) {
  const lower = text.toLowerCase();
  const result = {};

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  result.year = yearMatch ? parseInt(yearMatch[0]) : null;

  const priceMatch = text.match(/\b(\d{4,6})\s*(?:aed)?$/i) || text.match(/(?:aed|price)[\s:]*(\d{4,6})/i) || text.match(/,\s*(\d{4,6})\s*$/);
  result.price = priceMatch ? parseInt(priceMatch[1]) : null;

  const mileageMatch = text.match(/(\d+(?:\.\d+)?)\s*k?\s*km/i);
  if (mileageMatch) {
    const val = parseFloat(mileageMatch[1]);
    result.mileage = lower.includes('k km') || mileageMatch[0].toLowerCase().includes('k') ? Math.round(val * 1000) : Math.round(val);
  }

  result.gcc = lower.includes('gcc') && !lower.includes('non-gcc') && !lower.includes('non gcc');

  if (lower.includes('automatic') || lower.includes('auto')) result.transmission = 'automatic';
  else if (lower.includes('manual')) result.transmission = 'manual';

  const colors = ['white', 'black', 'silver', 'grey', 'gray', 'red', 'blue', 'green', 'brown', 'beige', 'gold', 'orange'];
  result.color = colors.find(c => lower.includes(c)) || null;

  const bodies = ['suv', 'sedan', 'pickup', 'coupe', 'hatchback', 'van', 'truck'];
  result.body = bodies.find(b => lower.includes(b)) || null;

  const makes = {
    'toyota': ['land cruiser', 'landcruiser', 'camry', 'prado', 'fortuner', 'hilux', 'corolla', 'yaris', 'rav4'],
    'nissan': ['patrol', 'pathfinder', 'altima', 'maxima', 'sunny', 'x-trail', 'navara'],
    'honda': ['accord', 'civic', 'cr-v', 'crv', 'pilot', 'odyssey'],
    'mitsubishi': ['pajero', 'outlander', 'eclipse', 'lancer'],
    'hyundai': ['sonata', 'elantra', 'tucson', 'santa fe', 'accent'],
    'kia': ['sportage', 'sorento', 'cerato', 'optima', 'carnival'],
    'ford': ['explorer', 'edge', 'f-150', 'mustang', 'escape'],
    'chevrolet': ['tahoe', 'suburban', 'malibu', 'camaro', 'traverse'],
    'bmw': ['3 series', '5 series', '7 series', 'x5', 'x6', 'x3'],
    'mercedes-benz': ['c200', 'e200', 's500', 'gle', 'glc', 'gls'],
    'lexus': ['lx570', 'lx 570', 'rx350', 'rx 350', 'es350'],
    'infiniti': ['qx80', 'qx60', 'fx35', 'q50'],
    'dodge': ['charger', 'challenger', 'durango', 'ram'],
    'jeep': ['wrangler', 'grand cherokee', 'commander']
  };

  for (const [make, models] of Object.entries(makes)) {
    if (lower.includes(make)) {
      result.make = make.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
      const foundModel = models.find(m => lower.includes(m));
      if (foundModel) {
        result.model = foundModel.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      break;
    }
  }

  return result;
}

async function sendMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  });
}

async function sendMessageWithButtons(chatId, text, buttons) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [buttons]
      }
    })
  });
}

async function answerCallback(callbackQueryId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId
    })
  });
}

async function upsertSession(chatId, dealerId, step, state = {}) {
  await query(`
    INSERT INTO dealer_bot_sessions (telegram_chat_id, dealer_id, current_step, session_state, last_active)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (telegram_chat_id)
    DO UPDATE SET 
      dealer_id = EXCLUDED.dealer_id,
      current_step = EXCLUDED.current_step,
      session_state = EXCLUDED.session_state,
      last_active = NOW()
  `, [chatId, dealerId, step, JSON.stringify(state)]);
}