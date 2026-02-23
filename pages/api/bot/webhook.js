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
