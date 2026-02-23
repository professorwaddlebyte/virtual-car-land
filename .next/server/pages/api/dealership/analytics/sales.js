"use strict";(()=>{var e={};e.id=6196,e.ids=[6196],e.modules={7096:e=>{e.exports=require("bcrypt")},9344:e=>{e.exports=require("jsonwebtoken")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},6893:(e,a,s)=>{s.a(e,async(e,t)=>{try{s.r(a),s.d(a,{config:()=>c,default:()=>o,routeModule:()=>n});var l=s(1802),r=s(7153),d=s(6249),i=s(6983),_=e([i]);i=(_.then?(await _)():_)[0];let o=(0,d.l)(i,"default"),c=(0,d.l)(i,"config"),n=new l.PagesAPIRouteModule({definition:{kind:r.x.PAGES_API,page:"/api/dealership/analytics/sales",pathname:"/api/dealership/analytics/sales",bundlePath:"",filename:""},userland:i});t()}catch(e){t(e)}})},6983:(e,a,s)=>{s.a(e,async(e,t)=>{try{s.r(a),s.d(a,{default:()=>handler});var l=s(4637),r=s(3186),d=e([l]);l=(d.then?(await d)():d)[0];let getSalesAnalytics=async(e,a)=>{try{let s;let t=e.user.profile_id,{period:r="30d"}=e.query;switch(r){case"7d":s="7 days";break;case"30d":default:s="30 days";break;case"90d":s="90 days"}let d=await (0,l.query)(`
      SELECT 
        DATE_TRUNC('week', sold_at) as period,
        COUNT(*) as vehicles_sold,
        COALESCE(SUM(price_aed), 0) as revenue,
        COALESCE(AVG(price_aed), 0) as avg_selling_price
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND sold_at >= NOW() - INTERVAL '${s}'
      GROUP BY DATE_TRUNC('week', sold_at)
      ORDER BY period
    `,[t]),i=await (0,l.query)(`
      SELECT 
        make,
        model,
        COUNT(*) as units_sold,
        COALESCE(SUM(price_aed), 0) as total_revenue,
        COALESCE(AVG(price_aed), 0) as avg_selling_price,
        COALESCE(MIN(sold_at), NOW()) as first_sale_date,
        COALESCE(MAX(sold_at), NOW()) as last_sale_date
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND sold_at >= NOW() - INTERVAL '${s}'
      GROUP BY make, model
      ORDER BY units_sold DESC
      LIMIT 10
    `,[t]),_=await (0,l.query)(`
      SELECT 
        AVG(days_to_sell) as avg_days_to_sell,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_sell) as median_days_to_sell,
        MIN(days_to_sell) as min_days_to_sell,
        MAX(days_to_sell) as max_days_to_sell
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND days_to_sell IS NOT NULL
        AND sold_at >= NOW() - INTERVAL '${s}'
    `,[t]),o=await (0,l.query)(`
      SELECT 
        make,
        model,
        COUNT(*) as units_sold,
        COALESCE(AVG(price_aed), 0) as avg_selling_price,
        COALESCE(AVG(mileage_km), 0) as avg_mileage,
        COALESCE(MIN(price_aed), 0) as min_price,
        COALESCE(MAX(price_aed), 0) as max_price
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'sold' 
        AND sold_at >= NOW() - INTERVAL '${s}'
      GROUP BY make, model
      ORDER BY avg_selling_price DESC
      LIMIT 10
    `,[t]);return a.status(200).json({success:!0,data:{trends:d,byModel:i,daysToSell:_[0],pricePerformance:o},period:r})}catch(e){return console.error("Sales analytics error:",e),a.status(500).json({success:!1,error:"Failed to fetch sales analytics data",details:e.message})}};async function handler(e,a){return"GET"===e.method?(0,r.withAuth)(getSalesAnalytics,"dealership")(e,a):a.status(405).json({error:"Method not allowed"})}t()}catch(e){t(e)}})}};var a=require("../../../../webpack-api-runtime.js");a.C(e);var __webpack_exec__=e=>a(a.s=e),s=a.X(0,[4222,9823,3186],()=>__webpack_exec__(6893));module.exports=s})();