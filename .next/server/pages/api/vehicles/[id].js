"use strict";(()=>{var e={};e.id=4584,e.ids=[4584],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},1935:(e,a,r)=>{r.a(e,async(e,t)=>{try{r.r(a),r.d(a,{config:()=>o,default:()=>_,routeModule:()=>l});var i=r(1802),s=r(7153),n=r(6249),c=r(2945),d=e([c]);c=(d.then?(await d)():d)[0];let _=(0,n.l)(c,"default"),o=(0,n.l)(c,"config"),l=new i.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/vehicles/[id]",pathname:"/api/vehicles/[id]",bundlePath:"",filename:""},userland:c});t()}catch(e){t(e)}})},4637:(e,a,r)=>{r.a(e,async(e,t)=>{try{r.r(a),r.d(a,{default:()=>c,query:()=>query});var i=r(8048),s=e([i]);i=(s.then?(await s)():s)[0];let n=process.env.DATABASE_URL?(0,i.neon)(process.env.DATABASE_URL):null;async function query(e,a=[]){if(!n)throw Error("Database not configured");return a.length>0?n.query(e,a):n.query(e)}let c=n;t()}catch(e){t(e)}})},2945:(e,a,r)=>{r.a(e,async(e,t)=>{try{r.r(a),r.d(a,{default:()=>handler});var i=r(4637),s=e([i]);async function handler(e,a){let{id:r}=e.query;if("GET"!==e.method)return a.status(405).json({error:"Method not allowed"});try{let e=await (0,i.query)(`
      SELECT 
        v.*,
        d.business_name as dealer_name,
        d.listing_integrity_score,
        d.score_tier,
        d.phone as dealer_phone,
        d.telegram_username as dealer_telegram,
        s.showroom_number,
        s.section,
        s.location_hint,
        s.map_x,
        s.map_y,
        m.name as market_name,
        m.id as market_id
      FROM vehicles v
      LEFT JOIN dealers d ON v.dealer_id = d.id
      LEFT JOIN showrooms s ON v.showroom_id = s.id
      LEFT JOIN markets m ON v.market_id = m.id
      WHERE v.id = $1
    `,[r]);if(!e.length)return a.status(404).json({error:"Vehicle not found"});let t=e[0];await (0,i.query)(`
      UPDATE vehicles 
      SET views_count = views_count + 1 
      WHERE id = $1
    `,[r]),await (0,i.query)(`
      INSERT INTO analytics_events (vehicle_id, dealer_id, market_id, event_type, metadata)
      VALUES ($1, $2, $3, 'view', $4)
    `,[r,t.dealer_id,t.market_id,JSON.stringify({timestamp:new Date})]);let s=await (0,i.query)(`
      SELECT old_price, new_price, changed_at
      FROM price_history 
      WHERE vehicle_id = $1 
      ORDER BY changed_at ASC
    `,[r]),n=await (0,i.query)(`
      SELECT 
        ROUND(AVG(price_aed)) as avg_price,
        COUNT(*) as similar_count,
        MIN(price_aed) as min_price,
        MAX(price_aed) as max_price
      FROM vehicles 
      WHERE make = $1 AND model = $2 AND year = $3 AND status = 'active'
    `,[t.make,t.model,t.year]),c=n[0],d=c?.avg_price?Math.round((t.price_aed-c.avg_price)/c.avg_price*100):null;return a.status(200).json({vehicle:t,price_history:s,market_intelligence:{avg_price:parseInt(c?.avg_price||0),similar_count:parseInt(c?.similar_count||0),min_price:parseInt(c?.min_price||0),max_price:parseInt(c?.max_price||0),price_vs_market_pct:d}})}catch(e){return a.status(500).json({error:e.message})}}i=(s.then?(await s)():s)[0],t()}catch(e){t(e)}})}};var a=require("../../../webpack-api-runtime.js");a.C(e);var __webpack_exec__=e=>a(a.s=e),r=a.X(0,[4222],()=>__webpack_exec__(1935));module.exports=r})();