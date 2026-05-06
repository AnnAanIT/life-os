import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PriceUpdate {
  id: string
  current_value: number
  market_price_per_unit: number | null
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { updates }: { updates: PriceUpdate[] } = await req.json()
  if (!updates?.length) return NextResponse.json({ ok: true })

  await Promise.all(
    updates.map(({ id, current_value, market_price_per_unit }) =>
      supabase
        .from('assets')
        .update({ current_value, market_price_per_unit })
        .eq('id', id)
        .eq('user_id', user.id)
    )
  )

  return NextResponse.json({ ok: true })
}
