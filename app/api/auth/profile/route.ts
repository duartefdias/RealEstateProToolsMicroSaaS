import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

export async function POST(request: Request) {
  try {
    const { userId, email, fullName } = await request.json()
    
    const supabase = await createClient()

    // Verify the user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Profile fetch error:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!existingProfile) {
      // Create new profile
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          subscription_tier: 'registered',
          daily_calculations_used: 0,
          last_calculation_reset: new Date().toISOString().split('T')[0]
        })

      if (createError) {
        console.error('Profile creation error:', createError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Profile created successfully' })
    }

    return NextResponse.json({ message: 'Profile already exists' })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}