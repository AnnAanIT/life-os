import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { asset_id, type, quantity, price_per_unit, transaction_date, note } = await req.json()
  if (!asset_id || !type || !quantity || !price_per_unit) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Fetch current asset state
  const { data: asset } = await supabase
    .from('assets')
    .select('quantity, buy_price_per_unit, buy_value, market_price_per_unit')
    .eq('id', asset_id)
    .eq('user_id', user.id)
    .single()
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  const curQty       = asset.quantity ?? 0
  const curBuyValue  = asset.buy_value ?? 0

  // Weighted average calculation
  let newQty: number
  let newBuyValue: number
  if (type === 'buy') {
    newQty      = curQty + quantity
    newBuyValue = curBuyValue + quantity * price_per_unit
  } else {
    const avgPpu = curQty > 0 ? curBuyValue / curQty : 0
    newQty      = curQty - quantity
    newBuyValue = curBuyValue - avgPpu * quantity
  }

  const newBuyPpu  = newQty > 0 ? Math.round(newBuyValue / newQty) : 0
  const marketPpu  = asset.market_price_per_unit ?? price_per_unit
  const newCurrent = Math.round(marketPpu * Math.max(0, newQty))

  // Insert transaction record
  const { error: txErr } = await supabase.from('asset_transactions').insert({
    user_id:          user.id,
    asset_id,
    type,
    quantity,
    price_per_unit,
    total_value:      Math.round(quantity * price_per_unit),
    transaction_date: transaction_date ?? new Date().toISOString().slice(0, 10),
    note:             note ?? null,
  })
  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 })

  // Update asset aggregates
  const { error: assetErr } = await supabase.from('assets').update({
    quantity:           Math.max(0, newQty),
    buy_price_per_unit: newBuyPpu,
    buy_value:          Math.round(Math.max(0, newBuyValue)),
    current_value:      newCurrent,
  }).eq('id', asset_id).eq('user_id', user.id)
  if (assetErr) return NextResponse.json({ error: assetErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
