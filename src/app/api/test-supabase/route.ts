import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test connection by attempting to query the races table
    const { data, error } = await supabase.from('races').select('count').limit(0)

    if (error) {
      // If table doesn't exist, connection is still working
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          message: 'Supabase connection successful! races table does not exist yet.',
          connected: true,
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful! races table exists.',
      connected: true,
      tableExists: true,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase connection failed',
        error: error.message,
        connected: false,
      },
      { status: 500 }
    )
  }
}
