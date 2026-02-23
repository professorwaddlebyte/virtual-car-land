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
 + /confirm — Confirm listings are still available
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

  let message = `📋 *Your Active Listings*\n\n`;
  vehicles.forEach((v, i) => {
    message += `${i + 1}. ${v.year} ${v.make} ${v.model} — AED ${v.price_aed.toLocaleString()}
   ⏳ ${Math.max(0, Math.floor(v.days_left))} days left • 👁 ${v.views_count} views

`;
  });

  await sendMessage(chatId, message);
}

async function handleConfirm(chatId, session) {
  if (!session?.dealer_id) {
    await sendMessage(chatId, 'Please register first by sending /start');
    return;
  }

  await query(`
    UPDATE vehicles 
    SET expires_at = NOW() + INTERVAL '14 days'
    WHERE dealer_id = $1 AND status = 'active' AND expires_at < NOW() + INTERVAL '7 days'
  `, [session.dealer_id]);

  await sendMessage(chatId, '✅ All your listings have been extended!\n\nThey will now stay active for 14 more days.');
}

async function handleSold(chatId, text, session) {
  if (!session?.dealer_id) {
    await sendMessage(chatId, 'Please register first by sending /start');
    return;
  }

  const vehicleId = text.split(' ')[1];
  if (!vehicleId) {
    await sendMessage(chatId, 'Please specify which car is sold.\n\nExample: /sold 12345');
    return;
  }

  const result = await query(`
    UPDATE vehicles 
    SET status = 'sold', sold_at = NOW()
    WHERE id = $1 AND dealer_id = $2 AND status = 'active'
    RETURNING id
  `, [vehicleId, session.dealer_id]);

  if (result.length) {
    await sendMessage(chatId, '🚗 Marked as sold!\n\nListing removed from marketplace.');
  } else {
    await sendMessage(chatId, '❌ Could not mark as sold.\n\nEither the ID is wrong or this car isn\'t yours.');
  }
}

async function handleCallback(chatId, callbackData, session, callbackQueryId) {
  // Handle callback queries from inline buttons
  await answerCallbackQuery(callbackQueryId, 'Processing...');
}

async function handleVehicleInput(chatId, text, session) {
  if (!session?.dealer_id) {
    await sendMessage(chatId, 'Please register first by sending /start');
    return;
  }

  // Parse vehicle details from text
  const parsed = parseVehicleDetails(text);
  if (!parsed) {
    await sendMessage(chatId, '❌ Could not understand that.\n\nPlease format like:\n_2013 Toyota Camry, GCC, silver, automatic, 145k km, 28500_');
    return;
  }

  // Insert vehicle into database
  const vehicleId = await insertVehicle(parsed, session.dealer_id);
  
  if (vehicleId) {
    await sendMessage(chatId, `✅ Added your *${parsed.year} ${parsed.make} ${parsed.model}*!\n\nIt will appear in the marketplace shortly.`);
    await upsertSession(chatId, session.dealer_id, null);
  } else {
    await sendMessage(chatId, '❌ Failed to add vehicle. Please try again.');
  }
}

async function handlePhoneRegistration(chatId, text) {
  const phoneRegex = /^[\+]?[0-9\s]{10,}$/;
  if (!phoneRegex.test(text)) {
    await sendMessage(chatId, '❌ Invalid phone number.\n\nPlease send a valid UAE number.\nExample: _+971501111111_');
    return;
  }

  const dealers = await query(`
    SELECT id FROM dealers WHERE phone = $1
  `, [text]);

  if (!dealers.length) {
    await sendMessage(chatId, '❌ No dealer found with that number.\n\nPlease use your registered business phone.');
    return;
  }

  const dealerId = dealers[0].id;
  await upsertSession(chatId, dealerId, null);
  
  const dealerInfo = await query(`
    SELECT business_name FROM dealers WHERE id = $1
  `, [dealerId]);
  
  await sendMessage(chatId, `✅ Registered successfully!\n\nWelcome, *${dealerInfo[0].business_name}*.\n\nYou can now manage your inventory.`);
}

// Helper functions
async function upsertSession(chatId, dealerId, step) {
  await query(`
    INSERT INTO dealer_bot_sessions (telegram_chat_id, dealer_id, current_step)
    VALUES ($1, $2, $3)
    ON CONFLICT (telegram_chat_id)
    DO UPDATE SET dealer_id = $2, current_step = $3, updated_at = NOW()
  `, [chatId, dealerId, step]);
}

function parseVehicleDetails(text) {
  // Simple parser for vehicle details
  const parts = text.split(',').map(p => p.trim());
  if (parts.length < 4) return null;

  // Extract year and make/model
  const yearMatch = parts[0].match(/(\d{4})\s+(.+?)\s+(.+)/);
  if (!yearMatch) return null;

  const [, year, make, model] = yearMatch;
  
  // Find price (should be a number at the end)
  let price = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    const num = parts[i].match(/(\d+)/);
    if (num) {
      price = parseInt(num[1]);
      break;
    }
  }

  return {
    year: parseInt(year),
    make,
    model,
    price_aed: price,
    specs: {
      gcc: parts.some(p => p.toLowerCase().includes('gcc')),
      transmission: parts.find(p => p.toLowerCase().includes('automatic') || p.toLowerCase().includes('manual')) || 'unknown',
      color: parts.find(p => ['white', 'black', 'silver', 'grey', 'red', 'blue', 'green'].includes(p.toLowerCase())) || 'unknown'
    }
  };
}

async function insertVehicle(vehicle, dealerId) {
  try {
    const result = await query(`
      INSERT INTO vehicles (
        dealer_id, make, model, year, price_aed, specs, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW() + INTERVAL '14 days')
      RETURNING id
    `, [
      dealerId,
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.price_aed,
      JSON.stringify(vehicle.specs)
    ]);
    
    return result[0]?.id || null;
  } catch (error) {
    console.error('Insert vehicle error:', error);
    return null;
  }
}

async function sendMessage(chatId, text) {
  const TelegramBot = require('node-telegram-bot-api');
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  
  try {
    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error('Send message error:', error);
  }
}

async function answerCallbackQuery(callbackQueryId, text) {
  const TelegramBot = require('node-telegram-bot-api');
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  
  try {
    await bot.answerCallbackQuery(callbackQueryId, text);
  } catch (error) {
    console.error('Answer callback error:', error);
  }
}