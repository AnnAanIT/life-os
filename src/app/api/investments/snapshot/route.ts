import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({}, { status: 401 })

  const { total_value, by_type } = await req.json()
  if (!total_value || total_value <= 0) return NextResponse.json({}, { status: 400 })

  const today = new Date().toISOString().slice(0, 10)

  await supabase.from('net_worth_snapshots').upsert(
    { user_id: user.id, snapshot_date: today, total_value, by_type: by_type ?? {} },
    { onConflict: 'user_id,snapshot_date' }
  )

  return NextResponse.json({ ok: true })
}
