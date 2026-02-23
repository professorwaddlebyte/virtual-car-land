"use strict";(()=>{var e={};e.id=6887,e.ids=[6887],e.modules={7096:e=>{e.exports=require("bcrypt")},9344:e=>{e.exports=require("jsonwebtoken")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},5146:(e,a,s)=>{s.a(e,async(e,t)=>{try{s.r(a),s.d(a,{config:()=>o,default:()=>c,routeModule:()=>_});var r=s(1802),i=s(7153),E=s(6249),l=s(5883),d=e([l]);l=(d.then?(await d)():d)[0];let c=(0,E.l)(l,"default"),o=(0,E.l)(l,"config"),_=new r.PagesAPIRouteModule({definition:{kind:i.x.PAGES_API,page:"/api/dealership/analytics",pathname:"/api/dealership/analytics",bundlePath:"",filename:""},userland:l});t()}catch(e){t(e)}})},5883:(e,a,s)=>{s.a(e,async(e,t)=>{try{s.r(a),s.d(a,{default:()=>handler});var r=s(4637),i=s(3186),E=e([r]);r=(E.then?(await E)():E)[0];let getAnalytics=async(e,a)=>{try{let s=e.user.profile_id,t=await (0,r.query)(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vehicles,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_vehicles,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_vehicles,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_vehicles,
        COALESCE(SUM(CASE WHEN status = 'sold' THEN price_aed END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'sold' THEN price_aed END), 0) as avg_selling_price
      FROM vehicles 
      WHERE dealer_id = $1
    `,[s]),i=await (0,r.query)(`
      SELECT 
        DATE_TRUNC('day', sold_at) as date,
        COUNT(*) as vehicles_sold,
        COALESCE(SUM(price_aed), 0) as revenue
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND sold_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', sold_at)
      ORDER BY date
    `,[s]),E=await (0,r.query)(`
      SELECT 
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp_clicks,
        COALESCE(SUM(saves_count), 0) as total_saves,
        COALESCE(AVG(views_count), 0) as avg_views_per_vehicle,
        COALESCE(AVG(whatsapp_clicks), 0) as avg_whatsapp_per_vehicle,
        COALESCE(AVG(saves_count), 0) as avg_saves_per_vehicle
      FROM vehicles 
      WHERE dealer_id = $1
    `,[s]),l=await (0,r.query)(`
      SELECT 
        id,
        make,
        model,
        year,
        price_aed,
        views_count,
        whatsapp_clicks,
        saves_count,
        status
      FROM vehicles 
      WHERE dealer_id = $1
      ORDER BY views_count DESC
      LIMIT 5
    `,[s]),d=await (0,r.query)(`
      SELECT 
        CASE 
          WHEN EXTRACT(DAY FROM (NOW() - created_at)) <= 7 THEN '0-7 days'
          WHEN EXTRACT(DAY FROM (NOW() - created_at)) <= 30 THEN '8-30 days'
          WHEN EXTRACT(DAY FROM (NOW() - created_at)) <= 90 THEN '31-90 days'
          ELSE '90+ days'
        END as age_group,
        COUNT(*) as count
      FROM vehicles 
      WHERE dealer_id = $1 AND status = 'active'
      GROUP BY age_group
      ORDER BY 
        CASE age_group
          WHEN '0-7 days' THEN 1
          WHEN '8-30 days' THEN 2
          WHEN '31-90 days' THEN 3
          ELSE 4
        END
    `,[s]),c=await (0,r.query)(`
      SELECT 
        business_name,
        listing_integrity_score,
        score_tier,
        total_listings,
        total_sold,
        response_rate
      FROM dealers 
      WHERE id = $1
    `,[s]);return a.status(200).json({success:!0,data:{inventory:t[0],salesTrend:i,engagement:E[0],topVehicles:l,inventoryAge:d,dealership:c[0]}})}catch(e){return console.error("Dealership analytics error:",e),a.status(500).json({success:!1,error:"Failed to fetch analytics data",details:e.message})}};async function handler(e,a){return"GET"===e.method?(0,i.withAuth)(getAnalytics,"dealership")(e,a):a.status(405).json({error:"Method not allowed"})}t()}catch(e){t(e)}})}};var a=require("../../../webpack-api-runtime.js");a.C(e);var __webpack_exec__=e=>a(a.s=e),s=a.X(0,[4222,9823,3186],()=>__webpack_exec__(5146));module.exports=s})();