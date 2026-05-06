import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Fetch the transaction being deleted (need asset_id)
  const { data: tx } = await supabase
    .from('asset_transactions')
    .select('asset_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete it
  const { error: delErr } = await supabase
    .from('asset_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  // Recalculate asset aggregates from remaining transactions (chronological order)
  const { data: remaining } = await supabase
    .from('asset_transactions')
    .select('type, quantity, price_per_unit, total_value')
    .eq('asset_id', tx.asset_id)
    .order('transaction_date', { ascending: true })
    .order('created_at',       { ascending: true })

  let totalQty  = 0
  let totalCost = 0
  for (const t of remaining ?? []) {
    if (t.type === 'buy') {
      totalQty  += t.quantity
      totalCost += t.total_value
    } else {
      const avg  = totalQty > 0 ? totalCost / totalQty : 0
      totalQty  -= t.quantity
      totalCost -= avg * t.quantity
    }
  }
  totalQty  = Math.max(0, totalQty)
  totalCost = Math.max(0, totalCost)
  const avgPpu = totalQty > 0 ? Math.round(totalCost / totalQty) : 0

  // Use stored market price for current_value if available
  const { data: asset } = await supabase
    .from('assets')
    .select('market_price_per_unit')
    .eq('id', tx.asset_id)
    .single()
  const marketPpu = asset?.market_price_per_unit ?? avgPpu

  await supabase.from('assets').update({
    quantity:           totalQty,
    buy_price_per_unit: avgPpu,
    buy_value:          Math.round(totalCost),
    current_value:      Math.round(marketPpu * totalQty),
  }).eq('id', tx.asset_id).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
