"use strict";(()=>{var e={};e.id=1701,e.ids=[1701],e.modules={7096:e=>{e.exports=require("bcrypt")},9344:e=>{e.exports=require("jsonwebtoken")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},611:(e,a,s)=>{s.a(e,async(e,t)=>{try{s.r(a),s.d(a,{config:()=>_,default:()=>l,routeModule:()=>o});var i=s(1802),r=s(7153),c=s(6249),E=s(4888),n=e([E]);E=(n.then?(await n)():n)[0];let l=(0,c.l)(E,"default"),_=(0,c.l)(E,"config"),o=new i.PagesAPIRouteModule({definition:{kind:r.x.PAGES_API,page:"/api/dealership/analytics/engagement",pathname:"/api/dealership/analytics/engagement",bundlePath:"",filename:""},userland:E});t()}catch(e){t(e)}})},4888:(e,a,s)=>{s.a(e,async(e,t)=>{try{s.r(a),s.d(a,{default:()=>handler});var i=s(4637),r=s(3186),c=e([i]);i=(c.then?(await c)():c)[0];let getEngagementAnalytics=async(e,a)=>{try{let s;let t=e.user.profile_id,{period:r="30d"}=e.query;switch(r){case"7d":s="7 days";break;case"30d":default:s="30 days";break;case"90d":s="90 days"}let c=await (0,i.query)(`
      SELECT 
        DATE_TRUNC('week', created_at) as period,
        SUM(views_count) as total_views,
        SUM(whatsapp_clicks) as total_whatsapp_clicks,
        SUM(saves_count) as total_saves,
        COUNT(*) as active_vehicles
      FROM vehicles 
      WHERE dealer_id = $1 
        AND status = 'active'
        AND created_at >= NOW() - INTERVAL '${s}'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY period
    `,[t]),E=await (0,i.query)(`
      SELECT 
        id,
        make,
        model,
        year,
        views_count,
        whatsapp_clicks,
        saves_count,
        (views_count + whatsapp_clicks + saves_count) as total_engagement
      FROM vehicles 
      WHERE dealer_id = $1
      ORDER BY total_engagement DESC
      LIMIT 10
    `,[t]),n=await (0,i.query)(`
      SELECT 
        COUNT(*) as total_vehicles,
        COALESCE(SUM(CASE WHEN views_count > 0 THEN 1 ELSE 0 END), 0) as vehicles_with_views,
        COALESCE(SUM(CASE WHEN whatsapp_clicks > 0 THEN 1 ELSE 0 END), 0) as vehicles_with_whatsapp,
        COALESCE(SUM(CASE WHEN saves_count > 0 THEN 1 ELSE 0 END), 0) as vehicles_with_saves,
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(whatsapp_clicks), 0) as total_whatsapp,
        COALESCE(SUM(saves_count), 0) as total_saves,
        COALESCE(AVG(views_count), 0) as avg_views,
        COALESCE(AVG(whatsapp_clicks), 0) as avg_whatsapp,
        COALESCE(AVG(saves_count), 0) as avg_saves
      FROM vehicles 
      WHERE dealer_id = $1
    `,[t]),l=await (0,i.query)(`
      SELECT 
        DATE_TRUNC('week', created_at) as period,
        COUNT(*) as total_inquiries,
        COUNT(CASE WHEN inquiry_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN inquiry_type = 'whatsapp_click' THEN 1 END) as whatsapp_clicks,
        COUNT(CASE WHEN inquiry_type = 'save' THEN 1 END) as saves
      FROM inquiries 
      WHERE dealer_id = $1
        AND created_at >= NOW() - INTERVAL '${s}'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY period
    `,[t]);return a.status(200).json({success:!0,data:{trends:c,topVehicles:E,ratios:n[0],inquiries:l},period:r})}catch(e){return console.error("Engagement analytics error:",e),a.status(500).json({success:!1,error:"Failed to fetch engagement analytics data",details:e.message})}};async function handler(e,a){return"GET"===e.method?(0,r.withAuth)(getEngagementAnalytics,"dealership")(e,a):a.status(405).json({error:"Method not allowed"})}t()}catch(e){t(e)}})}};var a=require("../../../../webpack-api-runtime.js");a.C(e);var __webpack_exec__=e=>a(a.s=e),s=a.X(0,[4222,9823,3186],()=>__webpack_exec__(611));module.exports=s})();