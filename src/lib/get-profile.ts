import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('display_name, annual_theme, purpose_statement, enabled_modules')
    .eq('id', userId)
    .single()
  return data
})
