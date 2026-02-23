import { query } from './db.js';

export async function runIntegrityEngine() {
  // Check if already run in last 24 hours
  const settings = await query(`
    SELECT value 
    FROM system_settings 
    WHERE key = 'last_integrity_run'
  `);
  
  const lastRun = new Date(settings[0]?.value || '2000-01-01');
  const hoursSinceLastRun = (new Date() - lastRun) / (1000 * 60 * 60);
  
  if (hoursSinceLastRun < 24) {
    return { 
      skipped: true, 
      hoursUntilNext: Math.round(24 - hoursSinceLastRun) 
    };
  }

  // Step 1 — Auto-expire stale listings
  const expired = await query(`
    UPDATE vehicles 
    SET status = 'expired' 
    WHERE status = 'active' AND expires_at < NOW() 
    RETURNING dealer_id
  `);

  // Step 2 — Penalize dealers with expired listings
  const expiredDealerIds = [...new Set(expired.map(r => r.dealer_id))];
  for (const dealerId of expiredDealerIds) {
    const count = expired.filter(r => r.dealer_id === dealerId).length;
    await query(`
      UPDATE dealers 
      SET total_expired = total_expired + $1,
          listing_integrity_score = GREATEST(0, listing_integrity_score - ($2 * 3))
      WHERE id = $3
    `, [count, count, dealerId]);
  }

  // Step 3 — Recalculate integrity score for all dealers
  const dealers = await query(`SELECT id FROM dealers`);
  
  for (const dealer of dealers) {
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'sold') as sold,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        COUNT(*) FILTER (WHERE status = 'active' AND confirmed_at > NOW() - INTERVAL '7 days') as recently_confirmed,
        COALESCE(AVG(EXTRACT(DAY FROM (expires_at - confirmed_at))), 14) as avg_freshness
      FROM vehicles 
      WHERE dealer_id = $1
    `, [dealer.id]);
    
    const s = stats[0];
    const total = parseInt(s.active) + parseInt(s.sold) + parseInt(s.expired);
    
    if (total === 0) continue;

    // Freshness score (40%) — based on confirmation rate
    const freshnessScore = total > 0 ? (parseInt(s.recently_confirmed) / Math.max(parseInt(s.active), 1)) * 40 : 20;
    
    // Sold confirmation rate (30%) — sold vs expired ratio
    const soldTotal = parseInt(s.sold) + parseInt(s.expired);
    const soldRate = soldTotal > 0 ? (parseInt(s.sold) / soldTotal) * 30 : 15;
    
    // Profile completeness (10%) — fixed for now, will expand later
    const profileScore = 10;
    
    // Response rate (20%) — placeholder until inquiry tracking matures
    const responseScore = 20;
    
    const newScore = Math.round(freshnessScore + soldRate + profileScore + responseScore);
    const clampedScore = Math.min(100, Math.max(0, newScore));
    
    const tier = clampedScore >= 85 ? 'Platinum' : 
                 clampedScore >= 70 ? 'Gold' : 
                 clampedScore >= 50 ? 'Silver' : 'Unrated';
    
    await query(`
      UPDATE dealers 
      SET listing_integrity_score = $1, score_tier = $2 
      WHERE id = $3
    `, [clampedScore, tier, dealer.id]);
  }

  // Step 4 — Send Telegram warnings for listings expiring in 3 days
  const expiringSoon = await query(`
    SELECT 
      v.id, v.make, v.model, v.year, v.price_aed,
      d.telegram_chat_id, d.id as dealer_id,
      EXTRACT(DAY FROM (v.expires_at - NOW())) as days_left
    FROM vehicles v
    JOIN dealers d ON v.dealer_id = d.id
    WHERE v.status = 'active' 
      AND v.expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
      AND d.telegram_chat_id IS NOT NULL
  `);
  
  for (const vehicle of expiringSoon) {
    const daysLeft = Math.floor(vehicle.days_left);
    await sendTelegramMessage(vehicle.telegram_chat_id, 
      `⚠️ *Listing Expiring Soon*\n\n` +
      ` + ${vehicle.year} ${vehicle.make} ${vehicle.model} — AED ${vehicle.price_aed.toLocaleString()}\n` +
      ` + Expires in *${daysLeft} day${daysLeft !== 1 ? 's' : ''}*\n\n` +
      ` + Send /confirm to keep it active and protect your score.`
    );
  }

  // Step 5 — Update last run timestamp
  await query(`
    UPDATE system_settings 
    SET value = $1, updated_at = NOW() 
    WHERE key = 'last_integrity_run'
  `, [new Date().toISOString()]);
  
  return { 
    skipped: false, 
    expired_listings: expired.length, 
    dealers_updated: dealers.length, 
    expiry_warnings_sent: expiringSoon.length 
  };
}

async function sendTelegramMessage(chatId, text) {
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