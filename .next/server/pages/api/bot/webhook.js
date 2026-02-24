"use strict";(()=>{var e={};e.id=5850,e.ids=[5850],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},7794:(e,a,t)=>{t.a(e,async(e,i)=>{try{t.r(a),t.d(a,{config:()=>c,default:()=>d,routeModule:()=>u});var s=t(1802),r=t(7153),n=t(6249),o=t(6974),l=e([o]);o=(l.then?(await l)():l)[0];let d=(0,n.l)(o,"default"),c=(0,n.l)(o,"config"),u=new s.PagesAPIRouteModule({definition:{kind:r.x.PAGES_API,page:"/api/bot/webhook",pathname:"/api/bot/webhook",bundlePath:"",filename:""},userland:o});i()}catch(e){i(e)}})},4637:(e,a,t)=>{t.a(e,async(e,i)=>{try{t.r(a),t.d(a,{default:()=>o,query:()=>query});var s=t(8048),r=e([s]);s=(r.then?(await r)():r)[0];let n=process.env.DATABASE_URL?(0,s.neon)(process.env.DATABASE_URL):null;async function query(e,a=[]){if(!n)throw Error("Database not configured");return a.length>0?n.query(e,a):n.query(e)}let o=n;i()}catch(e){i(e)}})},6974:(e,a,t)=>{t.a(e,async(e,i)=>{try{t.r(a),t.d(a,{default:()=>handler});var s=t(4637),r=e([s]);async function handler(e,a){if("POST"!==e.method)return a.status(405).json({error:"Method not allowed"});let t=e.body;try{let e=t.message||t.callback_query?.message,i=e?.chat?.id?.toString(),r=t.message?.text||"",n=t.callback_query?.data;if(!i)return a.status(200).json({ok:!0});let o=(await (0,s.query)(`
      SELECT * 
      FROM dealer_bot_sessions 
      WHERE telegram_chat_id = $1
    `,[i]))[0]||null;return t.message?.photo?await handlePhoto(i,t.message.photo,o):"/start"===r?await handleStart(i,o):"/mylistings"===r?await handleMyListings(i,o):"/confirm"===r?await handleConfirm(i,o):r?.startsWith("/sold")?await handleSold(i,r,o):n?await handleCallback(i,n,o,t.callback_query.id):o?.current_step==="awaiting_vehicle_input"?await handleVehicleInput(i,r,o):o?.current_step==="awaiting_phone"?await handlePhoneRegistration(i,r):await sendMessage(i,`I didn't understand that. Here are your options:

 + /mylistings — View your active listings
 + /confirm — Confirm listings still available
 + /sold [number] — Mark a car as sold

 + Or just type car details to add a new listing:
 + _Example: 2013 Toyota Camry, GCC, silver, automatic, 145k km, 28500_`),a.status(200).json({ok:!0})}catch(e){return console.error("Bot error:",e),a.status(200).json({ok:!0})}}async function handleStart(e,a){if(a?.dealer_id){let t=await (0,s.query)(`
      SELECT d.*, s.showroom_number, s.section, s.location_hint
      FROM dealers d
      LEFT JOIN showrooms s ON d.id = s.dealer_id
      WHERE d.id = $1
    `,[a.dealer_id]),i=t[0];await sendMessage(e,`Welcome back, *${i.business_name}*! 👋

 + 📍 Showroom: *${i.showroom_number}* — ${i.location_hint}
 + ⭐ Score: *${i.listing_integrity_score}/100* (${i.score_tier})

 + What would you like to do?

 + /mylistings — View active inventory
 + /confirm — Confirm listings still available
 + /sold [number] — Mark car as sold

 + Or type car details to add a new listing.`)}else await sendMessage(e,`Welcome to *NURDeals* 🚗

 + The smart inventory system for UAE car markets.

 + To get started, please send your registered phone number.
 + Example: _+971501111111_`),await upsertSession(e,null,"awaiting_phone")}async function handleMyListings(e,a){if(!a?.dealer_id){await sendMessage(e,"Please register first by sending /start");return}let t=await (0,s.query)(`
    SELECT 
      id, make, model, year, price_aed, mileage_km, views_count, created_at, expires_at,
      EXTRACT(DAY FROM (expires_at - NOW())) as days_left
    FROM vehicles 
    WHERE dealer_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 10
  `,[a.dealer_id]);if(!t.length){await sendMessage(e,"You have no active listings.\n\nType car details to add one!");return}let i=`*Your Active Listings* (${t.length})

`;t.forEach((e,a)=>{let t=Math.floor(e.days_left);i+=`${a+1}. *${e.year} ${e.make} ${e.model}*
💰 AED ${e.price_aed.toLocaleString()}
👁 ${e.views_count} views ${t<=3?"\uD83D\uDD34":t<=7?"\uD83D\uDFE1":"\uD83D\uDFE2"} ${t}d left

`}),i+="To mark sold: /sold 1 (use listing number above)",await sendMessage(e,i)}async function handleConfirm(e,a){if(!a?.dealer_id){await sendMessage(e,"Please register first by sending /start");return}let t=await (0,s.query)(`
    UPDATE vehicles 
    SET confirmed_at = NOW(), expires_at = NOW() + INTERVAL '14 days'
    WHERE dealer_id = $1 AND status = 'active'
    RETURNING id
  `,[a.dealer_id]);await (0,s.query)(`
    UPDATE dealers 
    SET listing_integrity_score = LEAST(100, listing_integrity_score + 2)
    WHERE id = $1
  `,[a.dealer_id]),await sendMessage(e,`✅ *${t.length} listings confirmed!*

 + All your cars are marked as available for another 14 days.
 + Your integrity score has been updated. Keep it up! 💪`)}async function handleSold(e,a,t){if(!t?.dealer_id){await sendMessage(e,"Please register first by sending /start");return}let i=a.split(" "),r=parseInt(i[1]);if(!r){await sendMessage(e,`Please specify a listing number.
Example: /sold 2

Use /mylistings to see your listing numbers.`);return}let n=await (0,s.query)(`
    SELECT id, make, model, year, price_aed, created_at
    FROM vehicles 
    WHERE dealer_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 10
  `,[t.dealer_id]),o=n[r-1];if(!o){await sendMessage(e,`Listing #${r} not found. Use /mylistings to see your listings.`);return}let l=Math.floor((new Date-new Date(o.created_at))/864e5);await (0,s.query)(`
    UPDATE vehicles 
    SET status = 'sold', sold_at = NOW(), days_to_sell = $1
    WHERE id = $2
  `,[l,o.id]),await (0,s.query)(`
    UPDATE dealers 
    SET total_sold = total_sold + 1, listing_integrity_score = LEAST(100, listing_integrity_score + 5)
    WHERE id = $1
  `,[t.dealer_id]),await sendMessage(e,`🎉 *Sold! Congratulations!*

 + ${o.year} ${o.make} ${o.model}
 + AED ${o.price_aed.toLocaleString()} — sold in ${l} days

 + Your integrity score has been boosted! ⭐`)}async function handleVehicleInput(e,a,t){let i=parseVehicleText(a);if(!i.make||!i.model||!i.year||!i.price){await sendMessage(e,`I couldn't extract all the details. Please include:

 + • Year, Make, Model
 + • Price in AED
 + • Mileage (optional)

 + Example: _2013 Toyota Camry, GCC, silver, automatic, 145k km, 28500_`);return}await upsertSession(e,t?.dealer_id,"awaiting_confirmation",{parsed:i,raw_text:a}),await sendMessageWithButtons(e,`I found these details:

 + 🚗 *${i.year} ${i.make} ${i.model}*
 + 💰 AED ${parseInt(i.price).toLocaleString()}
 + 📍 ${i.gcc?"GCC Specs":"Non-GCC"}
 + 🎨 ${i.color||"Not specified"}
 + ⚙️ ${i.transmission||"Not specified"}
 + 🔢 ${i.mileage?i.mileage.toLocaleString()+" km":"Not specified"}

 + Is this correct?`,[{text:"✅ Yes, Add Listing",callback_data:"confirm_add"},{text:"❌ Cancel",callback_data:"cancel_add"}])}async function handleCallback(e,a,t,i){if(await answerCallback(i),"confirm_add"===a){if(!t?.dealer_id){await sendMessage(e,"Session expired. Please send /start");return}let a=t.session_state?.parsed;if(!a){await sendMessage(e,"Session expired. Please try again.");return}let i=await (0,s.query)(`
      SELECT id, market_id 
      FROM showrooms 
      WHERE dealer_id = $1 
      LIMIT 1
    `,[t.dealer_id]),r=i[0];await (0,s.query)(`
      INSERT INTO vehicles (
        dealer_id, showroom_id, market_id,
        make, model, year, price_aed, mileage_km,
        specs, status, raw_input_text,
        ai_processed_at, confirmed_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, NOW(), NOW(), NOW() + INTERVAL '14 days')
    `,[t.dealer_id,r?.id||null,r?.market_id||null,a.make,a.model,a.year,a.price,a.mileage||null,JSON.stringify({gcc:a.gcc,color:a.color||null,transmission:a.transmission||null,fuel:"petrol",body:a.body||null}),t.session_state?.raw_text]),await (0,s.query)(`
      UPDATE dealers 
      SET total_listings = total_listings + 1
      WHERE id = $1
    `,[t.dealer_id]),await upsertSession(e,t.dealer_id,"awaiting_vehicle_input",{}),await sendMessage(e,`✅ *Listing Added Successfully!*

 + ${a.year} ${a.make} ${a.model} — AED ${parseInt(a.price).toLocaleString()}

 + Your car is now live on Virtual Car Land 🚗

 + Send another car or use /mylistings to see your inventory.`)}else"cancel_add"===a&&(await upsertSession(e,t?.dealer_id,"awaiting_vehicle_input",{}),await sendMessage(e,"Cancelled. Send car details again whenever you're ready."))}async function handlePhoneRegistration(e,a){let t=a.trim().replace(/\s/g,""),i=await (0,s.query)(`
    SELECT d.*, u.full_name
    FROM dealers d
    JOIN users u ON d.user_id = u.id
    WHERE d.phone = $1 OR u.phone = $1
  `,[t]);if(!i.length){await sendMessage(e,`Phone number not found. Please contact support to register your dealership.

 + Support: @NURDealsSupport`);return}let r=i[0];await (0,s.query)(`
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
 + /sold [number] — Mark as sold`)}async function handlePhoto(e,a,t){if(!t?.dealer_id){await sendMessage(e,"Please register first by sending /start");return}let i=await (0,s.query)(`
    SELECT id, make, model, year FROM vehicles
    WHERE dealer_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `,[t.dealer_id]);if(!i.length){await sendMessage(e,`No active listings found.

Add a car first by typing its details, then send photos.`);return}let r=i[0];try{let t=process.env.TELEGRAM_BOT_TOKEN,i=a[a.length-1].file_id,n=await fetch(`https://api.telegram.org/bot${t}/getFile?file_id=${i}`),o=await n.json(),l=o.result.file_path,d=await fetch(`https://api.telegram.org/file/bot${t}/${l}`),c=await d.arrayBuffer(),u=Buffer.from(c),{uploadImage:_}=await Promise.resolve().then(function(){var e=Error("Cannot find module '../../lib/cloudinary.js'");throw e.code="MODULE_NOT_FOUND",e}),g=await _(u,{public_id:`vehicle_${r.id}_${Date.now()}`}),m=await (0,s.query)(`
      SELECT photos FROM vehicles WHERE id = $1
    `,[r.id]),p=m[0]?.photos||[],h=[...p,g.secure_url];await (0,s.query)(`
      UPDATE vehicles SET photos = $1 WHERE id = $2
    `,[h,r.id]),await sendMessage(e,`✅ *Photo added!*

${r.year} ${r.make} ${r.model} now has ${h.length} photo${1!==h.length?"s":""}.

Send more photos or type new car details to add another listing.`)}catch(a){await sendMessage(e,`Sorry, photo upload failed. Please try again.

Error: ${a.message}`)}}function parseVehicleText(e){let a=e.toLowerCase(),t={},i=e.match(/\b(19|20)\d{2}\b/);t.year=i?parseInt(i[0]):null;let s=e.match(/\b(\d{4,6})\s*(?:aed)?$/i)||e.match(/(?:aed|price)[\s:]*(\d{4,6})/i)||e.match(/,\s*(\d{4,6})\s*$/);t.price=s?parseInt(s[1]):null;let r=e.match(/(\d+(?:\.\d+)?)\s*k?\s*km/i);if(r){let e=parseFloat(r[1]);t.mileage=a.includes("k km")||r[0].toLowerCase().includes("k")?Math.round(1e3*e):Math.round(e)}for(let[e,i]of(t.gcc=a.includes("gcc")&&!a.includes("non-gcc")&&!a.includes("non gcc"),a.includes("automatic")||a.includes("auto")?t.transmission="automatic":a.includes("manual")&&(t.transmission="manual"),t.color=["white","black","silver","grey","gray","red","blue","green","brown","beige","gold","orange"].find(e=>a.includes(e))||null,t.body=["suv","sedan","pickup","coupe","hatchback","van","truck"].find(e=>a.includes(e))||null,Object.entries({toyota:["land cruiser","landcruiser","camry","prado","fortuner","hilux","corolla","yaris","rav4"],nissan:["patrol","pathfinder","altima","maxima","sunny","x-trail","navara"],honda:["accord","civic","cr-v","crv","pilot","odyssey"],mitsubishi:["pajero","outlander","eclipse","lancer"],hyundai:["sonata","elantra","tucson","santa fe","accent"],kia:["sportage","sorento","cerato","optima","carnival"],ford:["explorer","edge","f-150","mustang","escape"],chevrolet:["tahoe","suburban","malibu","camaro","traverse"],bmw:["3 series","5 series","7 series","x5","x6","x3"],"mercedes-benz":["c200","e200","s500","gle","glc","gls"],lexus:["lx570","lx 570","rx350","rx 350","es350"],infiniti:["qx80","qx60","fx35","q50"],dodge:["charger","challenger","durango","ram"],jeep:["wrangler","grand cherokee","commander"]})))if(a.includes(e)){t.make=e.split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join("-");let s=i.find(e=>a.includes(e));s&&(t.model=s.split(" ").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" "));break}return t}async function sendMessage(e,a){let t=process.env.TELEGRAM_BOT_TOKEN;await fetch(`https://api.telegram.org/bot${t}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:e,text:a,parse_mode:"Markdown"})})}async function sendMessageWithButtons(e,a,t){let i=process.env.TELEGRAM_BOT_TOKEN;await fetch(`https://api.telegram.org/bot${i}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:e,text:a,parse_mode:"Markdown",reply_markup:{inline_keyboard:[t]}})})}async function answerCallback(e){let a=process.env.TELEGRAM_BOT_TOKEN;await fetch(`https://api.telegram.org/bot${a}/answerCallbackQuery`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({callback_query_id:e})})}async function upsertSession(e,a,t,i={}){await (0,s.query)(`
    INSERT INTO dealer_bot_sessions (telegram_chat_id, dealer_id, current_step, session_state, last_active)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (telegram_chat_id)
    DO UPDATE SET 
      dealer_id = EXCLUDED.dealer_id,
      current_step = EXCLUDED.current_step,
      session_state = EXCLUDED.session_state,
      last_active = NOW()
  `,[e,a,t,JSON.stringify(i)])}s=(r.then?(await r)():r)[0],i()}catch(e){i(e)}})}};var a=require("../../../webpack-api-runtime.js");a.C(e);var __webpack_exec__=e=>a(a.s=e),t=a.X(0,[4222],()=>__webpack_exec__(7794));module.exports=t})();