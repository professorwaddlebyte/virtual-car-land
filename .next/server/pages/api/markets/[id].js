"use strict";(()=>{var e={};e.id=613,e.ids=[613],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},8331:(e,r,t)=>{t.a(e,async(e,a)=>{try{t.r(r),t.d(r,{config:()=>l,default:()=>u,routeModule:()=>c});var s=t(1802),n=t(7153),i=t(6249),o=t(1419),d=e([o]);o=(d.then?(await d)():d)[0];let u=(0,i.l)(o,"default"),l=(0,i.l)(o,"config"),c=new s.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/markets/[id]",pathname:"/api/markets/[id]",bundlePath:"",filename:""},userland:o});a()}catch(e){a(e)}})},4637:(e,r,t)=>{t.a(e,async(e,a)=>{try{t.r(r),t.d(r,{default:()=>o,query:()=>query});var s=t(8048),n=e([s]);if(s=(n.then?(await n)():n)[0],!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is not set");let i=(0,s.neon)(process.env.DATABASE_URL);async function query(e,r=[]){return r.length>0?i.query(e,r):i.query(e)}let o=i;a()}catch(e){a(e)}})},1419:(e,r,t)=>{t.a(e,async(e,a)=>{try{t.r(r),t.d(r,{default:()=>handler});var s=t(4637),n=e([s]);async function handler(e,r){let{id:t}=e.query;if("GET"!==e.method)return r.status(405).json({error:"Method not allowed"});try{let e=await (0,s.query)(`
      SELECT * 
      FROM markets 
      WHERE id = $1
    `,[t]);if(!e.length)return r.status(404).json({error:"Market not found"});let a=await (0,s.query)(`
      SELECT 
        s.*,
        d.business_name as dealer_name,
        d.listing_integrity_score,
        d.score_tier,
        d.phone as dealer_phone,
        COUNT(v.id) as active_vehicles
      FROM showrooms s
      LEFT JOIN dealers d ON s.dealer_id = d.id
      LEFT JOIN vehicles v ON s.id = v.showroom_id AND v.status = 'active'
      WHERE s.market_id = $1
      GROUP BY s.id, d.business_name, d.listing_integrity_score, d.score_tier, d.phone
      ORDER BY s.showroom_number ASC
    `,[t]);return r.status(200).json({market:e[0],showrooms:a})}catch(e){return r.status(500).json({error:e.message})}}s=(n.then?(await n)():n)[0],a()}catch(e){a(e)}})}};var r=require("../../../webpack-api-runtime.js");r.C(e);var __webpack_exec__=e=>r(r.s=e),t=r.X(0,[4222],()=>__webpack_exec__(8331));module.exports=t})();