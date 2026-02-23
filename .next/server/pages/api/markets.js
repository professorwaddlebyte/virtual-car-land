"use strict";(()=>{var e={};e.id=1518,e.ids=[1518],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},8212:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{config:()=>c,default:()=>u,routeModule:()=>l});var s=a(1802),n=a(7153),i=a(6249),o=a(2764),d=e([o]);o=(d.then?(await d)():d)[0];let u=(0,i.l)(o,"default"),c=(0,i.l)(o,"config"),l=new s.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/markets",pathname:"/api/markets",bundlePath:"",filename:""},userland:o});r()}catch(e){r(e)}})},4637:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{default:()=>o,query:()=>query});var s=a(8048),n=e([s]);if(s=(n.then?(await n)():n)[0],!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is not set");let i=(0,s.neon)(process.env.DATABASE_URL);async function query(e,t=[]){return t.length>0?i.query(e,t):i.query(e)}let o=i;r()}catch(e){r(e)}})},2764:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{default:()=>handler});var s=a(4637),n=e([s]);async function handler(e,t){if("GET"!==e.method)return t.status(405).json({error:"Method not allowed"});try{let e=await (0,s.query)(`
      SELECT 
        m.*,
        COUNT(DISTINCT s.id) as showroom_count,
        COUNT(DISTINCT v.id) as active_vehicle_count,
        COUNT(DISTINCT d.id) as dealer_count
      FROM markets m
      LEFT JOIN showrooms s ON m.id = s.market_id
      LEFT JOIN vehicles v ON m.id = v.market_id AND v.status = 'active'
      LEFT JOIN dealers d ON s.dealer_id = d.id
      WHERE m.status = 'active'
      GROUP BY m.id
      ORDER BY m.name ASC
    `);return t.status(200).json({markets:e})}catch(e){return t.status(500).json({error:e.message})}}s=(n.then?(await n)():n)[0],r()}catch(e){r(e)}})}};var t=require("../../webpack-api-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),a=t.X(0,[4222],()=>__webpack_exec__(8212));module.exports=a})();