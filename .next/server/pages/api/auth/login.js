"use strict";(()=>{var e={};e.id=908,e.ids=[908],e.modules={9344:e=>{e.exports=require("jsonwebtoken")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},7618:e=>{e.exports=import("bcryptjs")},1686:(e,r,t)=>{t.a(e,async(e,a)=>{try{t.r(r),t.d(r,{config:()=>u,default:()=>o,routeModule:()=>c});var s=t(1802),i=t(7153),n=t(6249),d=t(8165),l=e([d]);d=(l.then?(await l)():l)[0];let o=(0,n.l)(d,"default"),u=(0,n.l)(d,"config"),c=new s.PagesAPIRouteModule({definition:{kind:i.x.PAGES_API,page:"/api/auth/login",pathname:"/api/auth/login",bundlePath:"",filename:""},userland:d});a()}catch(e){a(e)}})},4637:(e,r,t)=>{t.a(e,async(e,a)=>{try{t.r(r),t.d(r,{default:()=>d,query:()=>query});var s=t(8048),i=e([s]);if(s=(i.then?(await i)():i)[0],!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is not set");let n=(0,s.neon)(process.env.DATABASE_URL);async function query(e,r=[]){return r.length>0?n.query(e,r):n.query(e)}let d=n;a()}catch(e){a(e)}})},8165:(e,r,t)=>{t.a(e,async(e,a)=>{try{t.r(r),t.d(r,{default:()=>handler});var s=t(4637),i=t(7618),n=t(9344),d=t.n(n),l=e([s,i]);async function handler(e,r){if("POST"!==e.method)return r.status(405).json({error:"Method not allowed"});let{email:t,password:a}=e.body;if(!t||!a)return r.status(400).json({error:"Email and password required"});try{let e=await (0,s.query)(`
      SELECT 
        u.*,
        d.id as dealer_id,
        d.business_name,
        d.listing_integrity_score,
        d.score_tier,
        d.subscription_tier,
        d.telegram_chat_id
      FROM users u
      LEFT JOIN dealers d ON u.id = d.user_id
      WHERE u.email = $1
    `,[t]);if(!e.length)return r.status(401).json({error:"Invalid credentials"});let n=e[0],l=await i.default.compare(a,n.password_hash);if(!l)return r.status(401).json({error:"Invalid credentials"});await (0,s.query)(`
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = $1
    `,[n.id]);let o=d().sign({userId:n.id,email:n.email,role:n.role,dealerId:n.dealer_id||null},process.env.JWT_SECRET,{expiresIn:"24h"});return r.status(200).json({token:o,user:{id:n.id,email:n.email,full_name:n.full_name,role:n.role,dealer_id:n.dealer_id,business_name:n.business_name,score_tier:n.score_tier,subscription_tier:n.subscription_tier,telegram_chat_id:n.telegram_chat_id}})}catch(e){return r.status(500).json({error:e.message})}}[s,i]=l.then?(await l)():l,a()}catch(e){a(e)}})}};var r=require("../../../webpack-api-runtime.js");r.C(e);var __webpack_exec__=e=>r(r.s=e),t=r.X(0,[222],()=>__webpack_exec__(1686));module.exports=t})();