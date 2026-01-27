// scripts/seed.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!; // Use service_role key if you have RLS enabled, but anon works for local/public

// #region agent log
fetch('http://127.0.0.1:7242/ingest/87a46258-107f-4438-881f-45d5a23c4b28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'seed.ts:20',message:'Before createClient - checking assigned values',data:{supabaseUrl:supabaseUrl||'UNDEFINED',supabaseKey:supabaseKey?'EXISTS':'UNDEFINED',urlLength:supabaseUrl?.length||0,keyLength:supabaseKey?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleRaces = [
  {
    name: 'Boston Marathon',
    date: '2026-04-20',
    location: 'Boston, MA, USA',
    country: 'USA',
    distance: 'Marathon',
    type: 'road',
    description: 'Point-to-point race from Hopkinton to Boston.',
    latitude: 42.3601,
    longitude: -71.0589,
    website_url: 'https://www.baa.org/',
  },
  {
    name: 'London Marathon',
    date: '2026-04-26',
    location: 'London, UK',
    country: 'UK',
    distance: 'Marathon',
    type: 'road',
    description: 'Flat city course winding past London landmarks.',
    latitude: 51.5074,
    longitude: -0.1278,
    website_url: 'https://www.tcslondonmarathon.com/',
  },
  {
    name: 'Berlin Marathon',
    date: '2026-09-27',
    location: 'Berlin, Germany',
    country: 'Germany',
    distance: 'Marathon',
    type: 'road',
    description: 'Fast, flat course through central Berlin.',
    latitude: 52.5200,
    longitude: 13.4050,
    website_url: 'https://www.bmw-berlin-marathon.com/',
  },
];

async function seed() {
  console.log('🌱 Seeding races...');
  
  const { data, error } = await supabase
    .from('races')
    .insert(sampleRaces)
    .select();

  if (error) {
    console.error('Error seeding data:', error);
  } else {
    console.log(`Successfully added ${data.length} races!`);
  }
}

seed();