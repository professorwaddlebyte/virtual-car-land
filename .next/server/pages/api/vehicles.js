"use strict";(()=>{var e={};e.id=95,e.ids=[95],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},8048:e=>{e.exports=import("@neondatabase/serverless")},9679:(e,s,a)=>{a.a(e,async(e,t)=>{try{a.r(s),a.d(s,{config:()=>d,default:()=>u,routeModule:()=>c});var r=a(1802),n=a(7153),i=a(6249),o=a(6227),p=e([o]);o=(p.then?(await p)():p)[0];let u=(0,i.l)(o,"default"),d=(0,i.l)(o,"config"),c=new r.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/vehicles",pathname:"/api/vehicles",bundlePath:"",filename:""},userland:o});t()}catch(e){t(e)}})},4637:(e,s,a)=>{a.a(e,async(e,t)=>{try{a.r(s),a.d(s,{default:()=>o,query:()=>query});var r=a(8048),n=e([r]);if(r=(n.then?(await n)():n)[0],!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is not set");let i=(0,r.neon)(process.env.DATABASE_URL);async function query(e,s=[]){return s.length>0?i.query(e,s):i.query(e)}let o=i;t()}catch(e){t(e)}})},6227:(e,s,a)=>{a.a(e,async(e,t)=>{try{a.r(s),a.d(s,{default:()=>handler});var r=a(4637),n=e([r]);async function handler(e,s){if("GET"!==e.method)return s.status(405).json({error:"Method not allowed"});try{let{market_id:a,make:t,model:n,year_min:i,year_max:o,price_min:p,price_max:u,gcc:d,transmission:c,body:v,status:h="active",page:l=1,limit:_=20}=e.query,m=["v.status = $1"],E=[h],$=2;a&&(m.push(`v.market_id = $${$++}`),E.push(a)),t&&(m.push(`LOWER(v.make) = LOWER($${$++})`),E.push(t)),n&&(m.push(`LOWER(v.model) LIKE LOWER($${$++})`),E.push(`%${n}%`)),i&&(m.push(`v.year >= $${$++}`),E.push(parseInt(i))),o&&(m.push(`v.year <= $${$++}`),E.push(parseInt(o))),p&&(m.push(`v.price_aed >= $${$++}`),E.push(parseInt(p))),u&&(m.push(`v.price_aed <= $${$++}`),E.push(parseInt(u))),void 0!==d&&(m.push(`(v.specs->>'gcc')::boolean = $${$++}`),E.push("true"===d)),c&&(m.push(`LOWER(v.specs->>'transmission') = LOWER($${$++})`),E.push(c)),v&&(m.push(`LOWER(v.specs->>'body') = LOWER($${$++})`),E.push(v));let y=(parseInt(l)-1)*parseInt(_),I=m.join(" AND "),O=await (0,r.query)(`
      SELECT 
        v.id,
        v.make,
        v.model,
        v.year,
        v.price_aed,
        v.mileage_km,
        v.specs,
        v.photos,
        v.status,
        v.views_count,
        v.created_at,
        v.expires_at,
        d.business_name as dealer_name,
        d.listing_integrity_score,
        d.score_tier,
        d.phone as dealer_phone,
        s.showroom_number,
        s.section,
        s.location_hint,
        s.map_x,
        s.map_y,
        m.name as market_name
      FROM vehicles v
      LEFT JOIN dealers d ON v.dealer_id = d.id
      LEFT JOIN showrooms s ON v.showroom_id = s.id
      LEFT JOIN markets m ON v.market_id = m.id
      WHERE ${I}
      ORDER BY d.listing_integrity_score DESC, v.created_at DESC
      LIMIT $${$++} OFFSET $${$++}
    `,[...E,parseInt(_),y]),L=await (0,r.query)(`
      SELECT COUNT(*) as total
      FROM vehicles v
      WHERE ${I}
    `,E);return s.status(200).json({vehicles:O,pagination:{total:parseInt(L[0]?.total||0),page:parseInt(l),limit:parseInt(_),pages:Math.ceil(parseInt(L[0]?.total||0)/parseInt(_))}})}catch(e){return s.status(500).json({error:e.message})}}r=(n.then?(await n)():n)[0],t()}catch(e){t(e)}})}};var s=require("../../webpack-api-runtime.js");s.C(e);var __webpack_exec__=e=>s(s.s=e),a=s.X(0,[222],()=>__webpack_exec__(9679));module.exports=a})();