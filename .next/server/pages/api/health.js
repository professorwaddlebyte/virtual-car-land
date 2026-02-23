"use strict";(()=>{var e={};e.id=9837,e.ids=[9837],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},8281:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{config:()=>c,default:()=>l,routeModule:()=>u});var s=a(1802),i=a(7153),n=a(6249),d=a(3249),o=e([d]);d=(o.then?(await o)():o)[0];let l=(0,n.l)(d,"default"),c=(0,n.l)(d,"config"),u=new s.PagesAPIRouteModule({definition:{kind:i.x.PAGES_API,page:"/api/health",pathname:"/api/health",bundlePath:"",filename:""},userland:d});r()}catch(e){r(e)}})},4637:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{default:()=>d,query:()=>query});var s=a(8048),i=e([s]);if(s=(i.then?(await i)():i)[0],!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is not set");let n=(0,s.neon)(process.env.DATABASE_URL);async function query(e,t=[]){return t.length>0?n.query(e,t):n.query(e)}let d=n;r()}catch(e){r(e)}})},2928:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.d(t,{R:()=>runIntegrityEngine});var s=a(4637),i=e([s]);async function runIntegrityEngine(){let e=await (0,s.query)(`
    SELECT value 
    FROM system_settings 
    WHERE key = 'last_integrity_run'
  `),t=new Date(e[0]?.value||"2000-01-01"),a=(new Date-t)/36e5;if(a<24)return{skipped:!0,hoursUntilNext:Math.round(24-a)};let r=await (0,s.query)(`
    UPDATE vehicles 
    SET status = 'expired' 
    WHERE status = 'active' AND expires_at < NOW() 
    RETURNING dealer_id
  `),i=[...new Set(r.map(e=>e.dealer_id))];for(let e of i){let t=r.filter(t=>t.dealer_id===e).length;await (0,s.query)(`
      UPDATE dealers 
      SET total_expired = total_expired + $1,
          listing_integrity_score = GREATEST(0, listing_integrity_score - ($2 * 3))
      WHERE id = $3
    `,[t,t,e])}let n=await (0,s.query)("SELECT id FROM dealers");for(let e of n){let t=await (0,s.query)(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'sold') as sold,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        COUNT(*) FILTER (WHERE status = 'active' AND confirmed_at > NOW() - INTERVAL '7 days') as recently_confirmed,
        COALESCE(AVG(EXTRACT(DAY FROM (expires_at - confirmed_at))), 14) as avg_freshness
      FROM vehicles 
      WHERE dealer_id = $1
    `,[e.id]),a=t[0],r=parseInt(a.active)+parseInt(a.sold)+parseInt(a.expired);if(0===r)continue;let i=r>0?parseInt(a.recently_confirmed)/Math.max(parseInt(a.active),1)*40:20,n=parseInt(a.sold)+parseInt(a.expired),d=n>0?parseInt(a.sold)/n*30:15,o=Math.round(i+d+10+20),l=Math.min(100,Math.max(0,o)),c=l>=85?"Platinum":l>=70?"Gold":l>=50?"Silver":"Unrated";await (0,s.query)(`
      UPDATE dealers 
      SET listing_integrity_score = $1, score_tier = $2 
      WHERE id = $3
    `,[l,c,e.id])}let d=await (0,s.query)(`
    SELECT 
      v.id, v.make, v.model, v.year, v.price_aed,
      d.telegram_chat_id, d.id as dealer_id,
      EXTRACT(DAY FROM (v.expires_at - NOW())) as days_left
    FROM vehicles v
    JOIN dealers d ON v.dealer_id = d.id
    WHERE v.status = 'active' 
      AND v.expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
      AND d.telegram_chat_id IS NOT NULL
  `);for(let e of d){let t=Math.floor(e.days_left);await sendTelegramMessage(e.telegram_chat_id,`⚠️ *Listing Expiring Soon*

 + ${e.year} ${e.make} ${e.model} — AED ${e.price_aed.toLocaleString()}
 + Expires in *${t} day${1!==t?"s":""}*

 + Send /confirm to keep it active and protect your score.`)}return await (0,s.query)(`
    UPDATE system_settings 
    SET value = $1, updated_at = NOW() 
    WHERE key = 'last_integrity_run'
  `,[new Date().toISOString()]),{skipped:!1,expired_listings:r.length,dealers_updated:n.length,expiry_warnings_sent:d.length}}async function sendTelegramMessage(e,t){let a=process.env.TELEGRAM_BOT_TOKEN;await fetch(`https://api.telegram.org/bot${a}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:e,text:t,parse_mode:"Markdown"})})}s=(i.then?(await i)():i)[0],r()}catch(e){r(e)}})},3249:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{default:()=>handler});var s=a(4637),i=a(2928),n=e([s,i]);async function handler(e,t){if("GET"!==e.method)return t.status(405).json({error:"Method not allowed"});try{let e=await (0,s.query)("SELECT id, name, city FROM markets LIMIT 5"),a=await (0,s.query)("SELECT COUNT(*) as count FROM vehicles WHERE status = 'active'"),r=await (0,s.query)("SELECT COUNT(*) as count FROM dealers"),n=await (0,s.query)("SELECT COUNT(*) as count FROM showrooms"),d=await (0,i.R)();return t.status(200).json({status:"healthy",database:"connected",data:{markets:e,active_vehicles:parseInt(a[0]?.count||0),dealers:parseInt(r[0]?.count||0),showrooms:parseInt(n[0]?.count||0)},integrity_engine:d})}catch(e){return t.status(500).json({status:"error",database:"disconnected",message:e.message})}}[s,i]=n.then?(await n)():n,r()}catch(e){r(e)}})}};var t=require("../../webpack-api-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),a=t.X(0,[4222],()=>__webpack_exec__(8281));module.exports=a})();