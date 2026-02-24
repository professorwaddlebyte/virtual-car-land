"use strict";(()=>{var e={};e.id=1518,e.ids=[1518],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},8212:(e,a,t)=>{t.a(e,async(e,r)=>{try{t.r(a),t.d(a,{config:()=>c,default:()=>u,routeModule:()=>l});var s=t(1802),n=t(7153),i=t(6249),d=t(2764),o=e([d]);d=(o.then?(await o)():o)[0];let u=(0,i.l)(d,"default"),c=(0,i.l)(d,"config"),l=new s.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/markets",pathname:"/api/markets",bundlePath:"",filename:""},userland:d});r()}catch(e){r(e)}})},4637:(e,a,t)=>{t.a(e,async(e,r)=>{try{t.r(a),t.d(a,{default:()=>d,query:()=>query});var s=t(8048),n=e([s]);s=(n.then?(await n)():n)[0];let i=process.env.DATABASE_URL?(0,s.neon)(process.env.DATABASE_URL):null;async function query(e,a=[]){if(!i)throw Error("Database not configured");return a.length>0?i.query(e,a):i.query(e)}let d=i;r()}catch(e){r(e)}})},2764:(e,a,t)=>{t.a(e,async(e,r)=>{try{t.r(a),t.d(a,{default:()=>handler});var s=t(4637),n=e([s]);async function handler(e,a){if("GET"!==e.method)return a.status(405).json({error:"Method not allowed"});try{let e=await (0,s.query)(`
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
    `);return a.status(200).json({markets:e})}catch(e){return a.status(500).json({error:e.message})}}s=(n.then?(await n)():n)[0],r()}catch(e){r(e)}})}};var a=require("../../webpack-api-runtime.js");a.C(e);var __webpack_exec__=e=>a(a.s=e),t=a.X(0,[4222],()=>__webpack_exec__(8212));module.exports=t})();