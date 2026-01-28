/**
 * Test script to verify Supabase connection
 * Run with: npx tsx scripts/test-supabase-connection.ts
 * Or: ts-node scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY are set in .env.local')
  process.exit(1)
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  console.log(`📍 URL: ${supabaseUrl}`)

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Test connection by querying a system table or making a simple request
    const { data, error } = await supabase.from('races').select('count').limit(0)

    if (error) {
      // If races table doesn't exist, that's okay - connection is working
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('✅ Supabase connection successful!')
        console.log('ℹ️  Note: races table does not exist yet. Run the migration SQL to create it.')
        return true
      }
      throw error
    }

    console.log('✅ Supabase connection successful!')
    console.log('✅ races table exists and is accessible')
    return true
  } catch (error: any) {
    console.error('❌ Supabase connection failed:')
    console.error(error.message)
    return false
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
