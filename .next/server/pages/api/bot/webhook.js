"use strict";(()=>{var e={};e.id=850,e.ids=[850],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},7794:(e,a,t)=>{t.a(e,async(e,s)=>{try{t.r(a),t.d(a,{config:()=>c,default:()=>d,routeModule:()=>u});var i=t(1802),r=t(7153),n=t(6249),l=t(6974),o=e([l]);l=(o.then?(await o)():o)[0];let d=(0,n.l)(l,"default"),c=(0,n.l)(l,"config"),u=new i.PagesAPIRouteModule({definition:{kind:r.x.PAGES_API,page:"/api/bot/webhook",pathname:"/api/bot/webhook",bundlePath:"",filename:""},userland:l});s()}catch(e){s(e)}})},4637:(e,a,t)=>{t.a(e,async(e,s)=>{try{t.r(a),t.d(a,{default:()=>l,query:()=>query});var i=t(8048),r=e([i]);if(i=(r.then?(await r)():r)[0],!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is not set");let n=(0,i.neon)(process.env.DATABASE_URL);async function query(e,a=[]){return a.length>0?n.query(e,a):n.query(e)}let l=n;s()}catch(e){s(e)}})},6974:(e,a,t)=>{t.a(e,async(e,s)=>{try{t.r(a),t.d(a,{default:()=>handler});var i=t(4637),r=e([i]);async function handler(e,a){if("POST"!==e.method)return a.status(405).json({error:"Method not allowed"});let t=e.body;try{let e=t.message||t.callback_query?.message,s=e?.chat?.id?.toString(),r=t.message?.text||"",n=t.callback_query?.data;if(!s)return a.status(200).json({ok:!0});let l=(await (0,i.query)(`
      SELECT * 
      FROM dealer_bot_sessions 
      WHERE telegram_chat_id = $1
    `,[s]))[0]||null;return"/start"===r?await handleStart(s,l):"/mylistings"===r?await handleMyListings(s,l):"/confirm"===r?await handleConfirm(s,l):r?.startsWith("/sold")?await handleSold(s,r,l):n?await handleCallback(s,n,l,t.callback_query.id):l?.current_step==="awaiting_vehicle_input"?await handleVehicleInput(s,r,l):l?.current_step==="awaiting_phone"?await handlePhoneRegistration(s,r):await sendMessage(s,`I didn't understand that. Here are your options:

 + /mylistings — View your active listings
 + /confirm — Confirm listings still available
 + /sold [number] — Mark a car as sold

 + Or just type car details to add a new listing:
 + _Example: 2013 Toyota Camry, GCC, silver, automatic, 145k km, 28500_`),a.status(200).json({ok:!0})}catch(e){return console.error("Bot error:",e),a.status(200).json({ok:!0})}}async function handleStart(e,a){if(a?.dealer_id){let t=await (0,i.query)(`
      SELECT d.*, s.showroom_number, s.section, s.location_hint
      FROM dealers d
      LEFT JOIN showrooms s ON d.id = s.dealer_id
      WHERE d.id = $1
    `,[a.dealer_id]),s=t[0];await sendMessage(e,`Welcome back, *${s.business_name}*! 👋

 + 📍 Showroom: *${s.showroom_number}* — ${s.location_hint}
 + ⭐ Score: *${s.listing_integrity_score}/100* (${s.score_tier})

 + What would you like to do?

 + /mylistings — View active inventory
 + /confirm — Confirm listings still available
 + /sold [number] — Mark car as sold

 + Or type car details to add a new listing.`)}else await sendMessage(e,`Welcome to *NURDeals* 🚗

 + The smart inventory system for UAE car markets.

 + To get started, please send your registered phone number.
 + Example: _+971501111111_`),await upsertSession(e,null,"awaiting_phone")}async function handleMyListings(e,a){if(!a?.dealer_id){await sendMessage(e,"Please register first by sending /start");return}let t=await (0,i.query)(`
    SELECT 
      id, make, model, year, price_aed, mileage_km, views_count, created_at, expires_at,
      EXTRACT(DAY FROM (expires_at - NOW())) as days_left
    FROM vehicles 
    WHERE dealer_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 10
  `,[a.dealer_id]);if(!t.length){await sendMessage(e,"You have no active listings.\n\nType car details to add one!");return}let s=`*Your Active Listings* (${t.length})

`;t.forEach((e,a)=>{let t=Math.floor(e.days_left);s+=`${a+1}. *${e.year} ${e.make} ${e.model}*
💰 AED ${e.price_aed.toLocaleString()}
👁 ${e.views_count} views ${t<=3?"\uD83D\uDD34":t<=7?"\uD83D\uDFE1":"\uD83D\uDFE2"} ${t}d left

`}),s+="To mark sold: /sold 1 (use listing number above)",await sendMessage(e,s)}async function handleConfirm(e,a){if(!a?.dealer_id){await sendMessage(e,"Please register first by sending /start");return}let t=await (0,i.query)(`
    UPDATE vehicles 
    SET confirmed_at = NOW(), expires_at = NOW() + INTERVAL '14 days'
    WHERE dealer_id = $1 AND status = 'active'
    RETURNING id
  `,[a.dealer_id]);await (0,i.query)(`
    UPDATE dealers 
    SET listing_integrity_score = LEAST(100, listing_integrity_score + 2)
    WHERE id = $1
  `,[a.dealer_id]),await sendMessage(e,`✅ *${t.length} listings confirmed!*

 + All your cars are marked as available for another 14 days.
 + Your integrity score has been updated. Keep it up! 💪`)}async function handleSold(e,a,t){if(!t?.dealer_id){await sendMessage(e,"Please register first by sending /start");return}let s=a.split(" "),r=parseInt(s[1]);if(!r){await sendMessage(e,`Please specify a listing number.
Example: /sold 2

Use /mylistings to see your listing numbers.`);return}let n=await (0,i.query)(`
    SELECT id, make, model, year, price_aed, created_at
    FROM vehicles 
    WHERE dealer_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 10
  `,[t.dealer_id]),l=n[r-1];if(!l){await sendMessage(e,`Listing #${r} not found. Use /mylistings to see your listings.`);return}let o=Math.floor((new Date-new Date(l.created_at))/864e5);await (0,i.query)(`
    UPDATE vehicles 
    SET status = 'sold', sold_at = NOW(), days_to_sell = $1
    WHERE id = $2
  `,[o,l.id]),await (0,i.query)(`
    UPDATE dealers 
    SET total_sold = total_sold + 1, listing_integrity_score = LEAST(100, listing_integrity_score + 5)
    WHERE id = $1
  `,[t.dealer_id]),await sendMessage(e,`🎉 *Sold! Congratulations!*

 + ${l.year} ${l.make} ${l.model}
 + AED ${l.price_aed.toLocaleString()} — sold in ${o} days

 + Your integrity score has been boosted! ⭐`)}async function handleVehicleInput(e,a,t){let s=parseVehicleText(a);if(!s.make||!s.model||!s.year||!s.price){await sendMessage(e,`I couldn't extract all the details. Please include:

 + • Year, Make, Model
 + • Price in AED
 + • Mileage (optional)

 + Example: _2013 Toyota Camry, GCC, silver, automatic, 145k km, 28500_`);return}await upsertSession(e,t?.dealer_id,"awaiting_confirmation",{parsed:s,raw_text:a}),await sendMessageWithButtons(e,`I found these details:

 + 🚗 *${s.year} ${s.make} ${s.model}*
 + 💰 AED ${parseInt(s.price).toLocaleString()}
 + 📍 ${s.gcc?"GCC Specs":"Non-GCC"}
 + 🎨 ${s.color||"Not specified"}
 + ⚙️ ${s.transmission||"Not specified"}
 + 🔢 ${s.mileage?s.mileage.toLocaleString()+" km":"Not specified"}

 + Is this correct?`,[{text:"✅ Yes, Add Listing",callback_data:"confirm_add"},{text:"❌ Cancel",callback_data:"cancel_add"}])}async function handleCallback(e,a,t,s){if(await answerCallback(s),"confirm_add"===a){if(!t?.dealer_id){await sendMessage(e,"Session expired. Please send /start");return}let a=t.session_state?.parsed;if(!a){await sendMessage(e,"Session expired. Please try again.");return}let s=await (0,i.query)(`
      SELECT id, market_id 
      FROM showrooms 
      WHERE dealer_id = $1 
      LIMIT 1
    `,[t.dealer_id]),r=s[0];await (0,i.query)(`
      INSERT INTO vehicles (
        dealer_id, showroom_id, market_id,
        make, model, year, price_aed, mileage_km,
        specs, status, raw_input_text,
        ai_processed_at, confirmed_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, NOW(), NOW(), NOW() + INTERVAL '14 days')
    `,[t.dealer_id,r?.id||null,r?.market_id||null,a.make,a.model,a.year,a.price,a.mileage||null,JSON.stringify({gcc:a.gcc,color:a.color||null,transmission:a.transmission||null,fuel:"petrol",body:a.body||null}),t.session_state?.raw_text]),await (0,i.query)(`
      UPDATE dealers 
      SET total_listings = total_listings + 1
      WHERE id = $1
    `,[t.dealer_id]),await upsertSession(e,t.dealer_id,"awaiting_vehicle_input",{}),await sendMessage(e,`✅ *Listing Added Successfully!*

 + ${a.year} ${a.make} ${a.model} — AED ${parseInt(a.price).toLocaleString()}

 + Your car is now live on Virtual Car Land 🚗

 + Send another car or use /mylistings to see your inventory.`)}else"cancel_add"===a&&(await upsertSession(e,t?.dealer_id,"awaiting_vehicle_input",{}),await sendMessage(e,"Cancelled. Send car details again whenever you're ready."))}async function handlePhoneRegistration(e,a){let t=a.trim().replace(/\s/g,""),s=await (0,i.query)(`
    SELECT d.*, u.full_name
    FROM dealers d
    JOIN users u ON d.user_id = u.id
    WHERE d.phone = $1 OR u.phone = $1
  `,[t]);if(!s.length){await sendMessage(e,`Phone number not found. Please contact support to register your dealership.

 + Support: @NURDealsSupport`);return}let r=s[0];await (0,i.query)(`
    UPDATE dealers 
    SET telegram_chat_id = $1
    WHERE id = $2
  `,[e,r.id]),await upsertSession(e,r.id,"awaiting_vehicle_input",{}),await sendMessage(e,`✅ *Welcome, ${r.full_name}!*

 + You're now connected to NURDeals.

 + ⭐ Integrity Score: *${r.listing_integrity_score}/100* (${r.score_tier})

 + To add a car, just type the details:
 + _Example: 2019 Nissan Patrol, GCC, white, automatic, 41k km, 198000_

 + /mylistings — View inventory
 + /confirm — Confirm listings available
 + /sold [number] — Mark as sold`)}function parseVehicleText(e){let a=e.toLowerCase(),t={},s=e.match(/\b(19|20)\d{2}\b/);t.year=s?parseInt(s[0]):null;let i=e.match(/\b(\d{4,6})\s*(?:aed)?$/i)||e.match(/(?:aed|price)[\s:]*(\d{4,6})/i)||e.match(/,\s*(\d{4,6})\s*$/);t.price=i?parseInt(i[1]):null;let r=e.match(/(\d+(?:\.\d+)?)\s*k?\s*km/i);if(r){let e=parseFloat(r[1]);t.mileage=a.includes("k km")||r[0].toLowerCase().includes("k")?Math.round(1e3*e):Math.round(e)}for(let[e,s]of(t.gcc=a.includes("gcc")&&!a.includes("non-gcc")&&!a.includes("non gcc"),a.includes("automatic")||a.includes("auto")?t.transmission="automatic":a.includes("manual")&&(t.transmission="manual"),t.color=["white","black","silver","grey","gray","red","blue","green","brown","beige","gold","orange"].find(e=>a.includes(e))||null,t.body=["suv","sedan","pickup","coupe","hatchback","van","truck"].find(e=>a.includes(e))||null,Object.entries({toyota:["land cruiser","landcruiser","camry","prado","fortuner","hilux","corolla","yaris","rav4"],nissan:["patrol","pathfinder","altima","maxima","sunny","x-trail","navara"],honda:["accord","civic","cr-v","crv","pilot","odyssey"],mitsubishi:["pajero","outlander","eclipse","lancer"],hyundai:["sonata","elantra","tucson","santa fe","accent"],kia:["sportage","sorento","cerato","optima","carnival"],ford:["explorer","edge","f-150","mustang","escape"],chevrolet:["tahoe","suburban","malibu","camaro","traverse"],bmw:["3 series","5 series","7 series","x5","x6","x3"],"mercedes-benz":["c200","e200","s500","gle","glc","gls"],lexus:["lx570","lx 570","rx350","rx 350","es350"],infiniti:["qx80","qx60","fx35","q50"],dodge:["charger","challenger","durango","ram"],jeep:["wrangler","grand cherokee","commander"]})))if(a.includes(e)){t.make=e.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join("-");let i=s.find(e=>a.includes(e));i&&(t.model=i.split(" ").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" "));break}return t}async function sendMessage(e,a){let t=process.env.TELEGRAM_BOT_TOKEN;await fetch(`https://api.telegram.org/bot${t}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:e,text:a,parse_mode:"Markdown"})})}async function sendMessageWithButtons(e,a,t){let s=process.env.TELEGRAM_BOT_TOKEN;await fetch(`https://api.telegram.org/bot${s}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:e,text:a,parse_mode:"Markdown",reply_markup:{inline_keyboard:[t]}})})}async function answerCallback(e){let a=process.env.TELEGRAM_BOT_TOKEN;await fetch(`https://api.telegram.org/bot${a}/answerCallbackQuery`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({callback_query_id:e})})}async function upsertSession(e,a,t,s={}){await (0,i.query)(`
    INSERT INTO dealer_bot_sessions (telegram_chat_id, dealer_id, current_step, session_state, last_active)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (telegram_chat_id)
    DO UPDATE SET 
      dealer_id = EXCLUDED.dealer_id,
      current_step = EXCLUDED.current_step,
      session_state = EXCLUDED.session_state,
      last_active = NOW()
  `,[e,a,t,JSON.stringify(s)])}i=(r.then?(await r)():r)[0],s()}catch(e){s(e)}})}};var a=require("../../../webpack-api-runtime.js");a.C(e);var __webpack_exec__=e=>a(a.s=e),t=a.X(0,[222],()=>__webpack_exec__(7794));module.exports=t})();