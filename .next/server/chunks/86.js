"use strict";exports.id=86,exports.ids=[86],exports.modules={1086:(e,r,i)=>{let{Pool:t}=i(5900),a=new t({connectionString:process.env.DATABASE_URL||"postgresql://neondb_owner:npg_Gti86hMbalmS@ep-little-dawn-aidgj4w1-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require",ssl:{rejectUnauthorized:!1}});async function getAllVehicles(){try{let e=`
      SELECT 
        v.*,
        ARRAY_AGG(vf.feature) AS features
      FROM vehicles v
      LEFT JOIN vehicle_features vf ON v.id = vf.vehicle_id
      GROUP BY v.id
      ORDER BY v.make, v.model, v.price
    `,r=await a.query(e);return r.rows.map(e=>({id:e.id,make:e.make,model:e.model,year:e.year,price:parseFloat(e.price),bodyType:e.body_type,color:e.color,fuelType:e.fuel_type,transmission:e.transmission,mileage:e.mileage,location:e.location,description:e.description,imageUrl:e.image_url,features:e.features||[]}))}catch(e){return console.error("Error fetching vehicles from database:",e.message),console.log("Falling back to mock data mode"),getMockVehicles()}}function getMockVehicles(){return[{id:"1",make:"Toyota",model:"Camry",year:2022,price:85e3,bodyType:"Sedan",color:"White",fuelType:"Petrol",transmission:"Automatic",mileage:15e3,location:"Dubai",description:"Well-maintained family sedan with low mileage",imageUrl:"/placeholder.jpg",features:["Apple CarPlay","Leather seats","Advanced safety","Sunroof"]},{id:"2",make:"Range Rover",model:"Sport",year:2023,price:35e4,bodyType:"SUV",color:"Black",fuelType:"Diesel",transmission:"Automatic",mileage:5e3,location:"Abu Dhabi",description:"Luxury SUV with all premium features",imageUrl:"/placeholder.jpg",features:["Panoramic roof","Massage seats","Advanced safety","Apple CarPlay","Heated seats","Cooled seats"]},{id:"3",make:"BMW",model:"X5",year:2021,price:28e4,bodyType:"SUV",color:"Blue",fuelType:"Petrol",transmission:"Automatic",mileage:3e4,location:"Sharjah",description:"Sporty luxury SUV with latest BMW tech",imageUrl:"/placeholder.jpg",features:["iDrive 7","Panoramic roof","Laser headlights","Bowers & Wilkins sound"]}]}async function getVehiclesByFilters(e){try{let{make:r=[],model:i=[],minYear:t,maxYear:o,minPrice:l,maxPrice:s,bodyType:c=[],fuelType:n=[],transmission:u=[],color:p=[],location:h=[],features:d=[],accidentFree:v=!1,serviceHistory:y=!1,limit:m=10,offset:f=0}=e,$=`
      SELECT 
        v.*,
        ARRAY_AGG(vf.feature) AS features
      FROM vehicles v
      LEFT JOIN vehicle_features vf ON v.id = vf.vehicle_id
      WHERE 1=1
    `,g=[],E=0;r.length>0&&($+=` AND v.make = ANY($${++E})`,g.push(r)),i.length>0&&($+=` AND v.model = ANY($${++E})`,g.push(i)),void 0!==t&&($+=` AND v.year >= $${++E}`,g.push(t)),void 0!==o&&($+=` AND v.year <= $${++E}`,g.push(o)),void 0!==l&&($+=` AND v.price >= $${++E}`,g.push(l)),void 0!==s&&($+=` AND v.price <= $${++E}`,g.push(s)),c.length>0&&($+=` AND v.body_type = ANY($${++E})`,g.push(c)),n.length>0&&($+=` AND v.fuel_type = ANY($${++E})`,g.push(n)),u.length>0&&($+=` AND v.transmission = ANY($${++E})`,g.push(u)),p.length>0&&($+=` AND v.color = ANY($${++E})`,g.push(p)),h.length>0&&($+=` AND v.location = ANY($${++E})`,g.push(h)),d.length>0&&($+=` AND v.id IN (
        SELECT vehicle_id 
        FROM vehicle_features 
        WHERE feature = ANY($${++E})
        GROUP BY vehicle_id 
        HAVING COUNT(*) >= $${++E}
      )`,g.push(d),g.push(d.length)),v&&($+=` AND v.description NOT ILIKE $${++E}`,g.push("%accident%")),y&&($+=` AND EXISTS (
        SELECT 1 FROM vehicle_features vf2 
        WHERE vf2.vehicle_id = v.id 
        AND vf2.feature = $${++E}
      )`,g.push("Service History")),$+=`
      GROUP BY v.id
      ORDER BY v.make, v.model, v.price
      LIMIT $${++E} OFFSET $${++E}
    `,g.push(m),g.push(f);let A=await a.query($,g),N=`
      SELECT COUNT(DISTINCT v.id) as total_count
      FROM vehicles v
      LEFT JOIN vehicle_features vf ON v.id = vf.vehicle_id
      WHERE 1=1
    `,_=[],T=0,S=[];r.length>0&&(S.push(`v.make = ANY($${++T})`),_.push(r)),i.length>0&&(S.push(`v.model = ANY($${++T})`),_.push(i)),void 0!==t&&(S.push(`v.year >= $${++T}`),_.push(t)),void 0!==o&&(S.push(`v.year <= $${++T}`),_.push(o)),void 0!==l&&(S.push(`v.price >= $${++T}`),_.push(l)),void 0!==s&&(S.push(`v.price <= $${++T}`),_.push(s)),c.length>0&&(S.push(`v.body_type = ANY($${++T})`),_.push(c)),n.length>0&&(S.push(`v.fuel_type = ANY($${++T})`),_.push(n)),u.length>0&&(S.push(`v.transmission = ANY($${++T})`),_.push(u)),p.length>0&&(S.push(`v.color = ANY($${++T})`),_.push(p)),h.length>0&&(S.push(`v.location = ANY($${++T})`),_.push(h)),d.length>0&&(S.push(`v.id IN (
        SELECT vehicle_id 
        FROM vehicle_features 
        WHERE feature = ANY($${++T})
        GROUP BY vehicle_id 
        HAVING COUNT(*) >= $${++T}
      )`),_.push(d),_.push(d.length)),v&&(S.push(`v.description NOT ILIKE $${++T}`),_.push("%accident%")),y&&(S.push(`EXISTS (
        SELECT 1 FROM vehicle_features vf2 
        WHERE vf2.vehicle_id = v.id 
        AND vf2.feature = $${++T}
      )`),_.push("Service History")),S.length>0&&(N+=" AND "+S.join(" AND "));let R=await a.query(N,_),w=parseInt(R.rows[0].total_count);return{vehicles:A.rows.map(e=>({id:e.id,make:e.make,model:e.model,year:e.year,price:parseFloat(e.price),bodyType:e.body_type,color:e.color,fuelType:e.fuel_type,transmission:e.transmission,mileage:e.mileage,location:e.location,description:e.description,imageUrl:e.image_url,features:e.features||[]})),totalCount:w,hasMore:f+m<w}}catch(e){throw console.error("Error filtering vehicles:",e),e}}async function getCulturalPreferences(e){try{let r=`
      SELECT * FROM cultural_preferences 
      WHERE nationality = $1
    `,i=await a.query(r,[e]);if(0===i.rows.length)return null;let t=i.rows[0];return{nationality:t.nationality,preferredMakes:t.preferred_makes,preferredBodyTypes:t.preferred_body_types,preferredColors:t.preferred_colors,typicalBudgetRange:{min:parseFloat(t.typical_budget_min),max:parseFloat(t.typical_budget_max)},weight:parseFloat(t.weight),sampleSize:t.sample_size,updatedAt:t.updated_at}}catch(e){throw console.error("Error fetching cultural preferences:",e),e}}async function getVehicleById(e){try{let r=`
      SELECT 
        v.*,
        ARRAY_AGG(vf.feature) AS features
      FROM vehicles v
      LEFT JOIN vehicle_features vf ON v.id = vf.vehicle_id
      WHERE v.id = $1
      GROUP BY v.id
    `,i=await a.query(r,[e]);if(0===i.rows.length)return null;let t=i.rows[0];return{id:t.id,make:t.make,model:t.model,year:t.year,price:parseFloat(t.price),bodyType:t.body_type,color:t.color,fuelType:t.fuel_type,transmission:t.transmission,mileage:t.mileage,location:t.location,description:t.description,imageUrl:t.image_url,features:t.features||[]}}catch(e){throw console.error("Error fetching vehicle by ID:",e),e}}async function getSimilarVehicles(e,r=5){try{let i=await getVehicleById(e);if(!i)throw Error(`Vehicle not found with ID: ${e}`);let t=`
      SELECT 
        v.*,
        ARRAY_AGG(vf.feature) AS features
      FROM vehicles v
      LEFT JOIN vehicle_features vf ON v.id = vf.vehicle_id
      WHERE v.id != $1
      GROUP BY v.id
      ORDER BY 
        CASE 
          WHEN v.make = $2 THEN 0
          WHEN v.body_type = $3 THEN 1
          ELSE 2
        END,
        ABS(v.price - $4) ASC,
        ABS(v.year - $5) ASC
      LIMIT $6
    `,o=await a.query(t,[e,i.make,i.bodyType,i.price,i.year,r]);return o.rows.map(e=>({id:e.id,make:e.make,model:e.model,year:e.year,price:parseFloat(e.price),bodyType:e.body_type,color:e.color,fuelType:e.fuel_type,transmission:e.transmission,mileage:e.mileage,location:e.location,description:e.description,imageUrl:e.image_url,features:e.features||[]}))}catch(e){throw console.error("Error finding similar vehicles:",e),e}}async function insertVehicle(e){try{let{make:r,model:i,year:t,price:o,bodyType:l,color:s,fuelType:c,transmission:n,mileage:u,location:p,description:h,imageUrl:d,features:v=[]}=e,y=await a.query("SELECT COUNT(*) FROM vehicles"),m=`V${String(parseInt(y.rows[0].count)+1).padStart(3,"0")}`,f=`
      INSERT INTO vehicles (id, make, model, year, price, body_type, color, fuel_type, transmission, mileage, location, description, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;if(await a.query(f,[m,r,i,t,o,l,s,c,n,u,p,h,d]),v.length>0){let e=v.map(e=>`('${m}', '${e.replace(/'/g,"''")}')`).join(","),r=`INSERT INTO vehicle_features (vehicle_id, feature) VALUES ${e}`;await a.query(r)}return{id:m,...e,features:v}}catch(e){throw console.error("Error inserting vehicle:",e),e}}async function testConnection(){try{let e=await a.query("SELECT NOW() as current_time");return{connected:!0,time:e.rows[0].current_time,connection:"NeonDB PostgreSQL"}}catch(e){return console.error("Database connection test failed:",e),{connected:!1,error:e.message}}}e.exports={pool:a,getAllVehicles,getVehiclesByFilters,getCulturalPreferences,getVehicleById,getSimilarVehicles,insertVehicle,testConnection}}};