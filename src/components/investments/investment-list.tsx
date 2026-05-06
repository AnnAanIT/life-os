'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatVND } from '@/lib/format'
import { SmartAmountInput } from '@/components/ui/smart-amount-input'
import { Trash2, Pencil, TrendingUp, TrendingDown, Minus, ChevronRight, Plus, History } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_META: Record<string, { label: string; icon: string }> = {
  crypto:      { label: 'Crypto',        icon: '₿'  },
  gold:        { label: 'Vàng',          icon: '🪙' },
  stock:       { label: 'Chứng khoán',   icon: '📈' },
  savings:     { label: 'Tiết kiệm',     icon: '🏦' },
  real_estate: { label: 'Bất động sản',  icon: '🏠' },
  cash:        { label: 'Tiền mặt',      icon: '💵' },
  other:       { label: 'Khác',          icon: '💼' },
}

export interface Asset {
  id: string
  asset_type: string
  name: string
  symbol: string | null
  current_value: number
  buy_value: number | null
  buy_price_per_unit: number | null
  market_price_per_unit: number | null
  quantity: number | null
  unit: string | null
}

export interface AssetTransaction {
  id: string
  asset_id: string
  type: 'buy' | 'sell'
  quantity: number
  price_per_unit: number
  total_value: number
  transaction_date: string
  note: string | null
}

interface Props {
  assets: Asset[]
  transactions: AssetTransaction[]
  userId: string
}

function fmtQty(qty: number): string {
  return qty < 1 ? qty.toPrecision(4).replace(/\.?0+$/, '') : qty.toLocaleString('vi-VN')
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}

// ── Inline full-edit form ──────────────────────────────────────────────────────
function AssetEditForm({
  asset,
  txCount,
  onSave,
  onCancel,
}: {
  asset: Asset
  txCount: number
  onSave: (id: string, updates: Partial<Asset>) => Promise<void>
  onCancel: () => void
}) {
  const hasQty = Boolean(asset.quantity)
  const hasDCA = hasQty && txCount > 0   // has transaction history → qty/price are managed by transactions
  const BASE   = 'w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400'

  const [name,       setName]       = useState(asset.name)
  const [quantity,   setQuantity]   = useState(asset.quantity ? String(asset.quantity) : '')
  const [buyPpu,     setBuyPpu]     = useState<number | null>(asset.buy_price_per_unit)
  const [mktPpu,     setMktPpu]     = useState<number | null>(asset.market_price_per_unit)
  const [totalVND,   setTotalVND]   = useState<number | null>(asset.current_value)
  const [initialVND, setInitialVND] = useState<number | null>(asset.buy_value)
  const [saving,     setSaving]     = useState(false)

  async function handleSave() {
    setSaving(true)

    if (hasDCA) {
      // DCA asset: only update name + market price override
      const qty = asset.quantity!
      const effectivePpu = mktPpu ?? asset.buy_price_per_unit ?? 0
      await onSave(asset.id, {
        name:                  name.trim() || asset.name,
        market_price_per_unit: mktPpu,
        current_value:         Math.round(effectivePpu * qty),
      })
    } else if (hasQty) {
      const qty = parseFloat(quantity.replace(',', '.'))
      if (!qty || !buyPpu) { setSaving(false); return }
      const effectivePpu = mktPpu ?? buyPpu
      await onSave(asset.id, {
        name:                  name.trim() || asset.name,
        quantity:              qty,
        unit:                  asset.unit,
        buy_price_per_unit:    buyPpu,
        market_price_per_unit: mktPpu,
        current_value:         Math.round(effectivePpu * qty),
        buy_value:             Math.round(buyPpu * qty),
      })
    } else {
      if (!name.trim() || !totalVND) { setSaving(false); return }
      await onSave(asset.id, {
        name:                  name.trim(),
        current_value:         totalVND,
        buy_value:             initialVND,
        buy_price_per_unit:    null,
        market_price_per_unit: null,
      })
    }
    setSaving(false)
  }

  return (
    <div className="bg-stone-50 rounded-2xl px-4 py-3 border border-stone-200 space-y-2.5">
      <p className="text-xs font-medium text-stone-500">Chỉnh sửa tài sản</p>

      <input type="text" value={name} onChange={e => setName(e.target.value)}
        placeholder="Tên tài sản" className={BASE} autoFocus
      />

      {/* DCA asset: qty + buy price are read-only, managed by transaction history */}
      {hasDCA && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-stone-100 rounded-xl px-3 py-2">
              <p className="text-[10px] text-stone-400 mb-0.5">Số lượng</p>
              <p className="text-sm font-semibold text-stone-600">
                {fmtQty(asset.quantity!)} <span className="text-stone-400 text-xs">{asset.unit}</span>
              </p>
            </div>
            <div className="bg-stone-100 rounded-xl px-3 py-2">
              <p className="text-[10px] text-stone-400 mb-0.5">Giá mua TB</p>
              <p className="text-sm font-semibold text-stone-600">
                {asset.buy_price_per_unit ? formatVND(asset.buy_price_per_unit) : '—'}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-stone-400 px-1">
            Số lượng và giá mua được tính từ lịch sử giao dịch
          </p>
          <SmartAmountInput placeholder="Giá thị trường (tuỳ chọn — để trống = tự lấy)"
            onValue={setMktPpu} defaultValue={asset.market_price_per_unit} className={BASE}
          />
        </>
      )}

      {/* Non-DCA qty asset: full edit */}
      {hasQty && !hasDCA && (
        <>
          <div className="flex gap-2">
            <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)}
              placeholder="Số lượng"
              className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400"
            />
            <div className="flex items-center px-3 py-2 rounded-xl border border-stone-100 bg-stone-50 text-sm text-stone-500 w-24 justify-center">
              {asset.unit ?? '—'}
            </div>
          </div>
          <SmartAmountInput placeholder="Giá mua TB (VND/đơn vị)"
            onValue={setBuyPpu} defaultValue={asset.buy_price_per_unit} className={BASE}
          />
          <SmartAmountInput placeholder="Giá thị trường (tuỳ chọn)"
            onValue={setMktPpu} defaultValue={asset.market_price_per_unit} className={BASE}
          />
        </>
      )}

      {/* Non-qty asset: value edit */}
      {!hasQty && (
        <>
          <SmartAmountInput placeholder="Giá trị hiện tại (VND)"
            onValue={setTotalVND} defaultValue={asset.current_value} className={BASE}
          />
          <SmartAmountInput placeholder="Giá trị ban đầu (tuỳ chọn)"
            onValue={setInitialVND} defaultValue={asset.buy_value} className={BASE}
          />
        </>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-100"
        >Huỷ</button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50"
        >{saving ? 'Đang lưu...' : 'Lưu'}</button>
      </div>
    </div>
  )
}

// ── "Mua thêm" inline form ─────────────────────────────────────────────────────
function AddTransactionForm({
  asset,
  onSave,
  onCancel,
}: {
  asset: Asset
  onSave: () => void
  onCancel: () => void
}) {
  const [qty,     setQty]     = useState('')
  const [ppu,     setPpu]     = useState<number | null>(null)
  const [date,    setDate]    = useState(new Date().toISOString().slice(0, 10))
  const [saving,  setSaving]  = useState(false)
  const [key] = useState(0)

  const parsedQty  = parseFloat(qty.replace(',', '.'))
  const curQty     = asset.quantity ?? 0
  const curBuyVal  = asset.buy_value ?? 0

  const newAvgPpu = ppu && parsedQty > 0 && curQty >= 0
    ? Math.round((curBuyVal + parsedQty * ppu) / (curQty + parsedQty))
    : null
  const curAvgPpu = asset.buy_price_per_unit

  async function handleSave() {
    if (!parsedQty || !ppu || parsedQty <= 0) return
    setSaving(true)
    const res = await fetch('/api/investments/transactions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset_id:         asset.id,
        type:             'buy',
        quantity:         parsedQty,
        price_per_unit:   ppu,
        transaction_date: date,
      }),
    })
    setSaving(false)
    if (!res.ok) return
    onSave()
  }

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 space-y-2.5 mt-1">
      <p className="text-xs font-semibold text-emerald-700">Mua thêm</p>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Số lượng"
          value={qty}
          onChange={e => setQty(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400 bg-white"
          autoFocus
        />
        {asset.unit && (
          <span className="text-xs text-stone-400 shrink-0">{asset.unit}</span>
        )}
      </div>

      <SmartAmountInput
        key={key}
        placeholder="Giá mua (VND)"
        onValue={setPpu}
        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400 bg-white"
      />

      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400 bg-white text-stone-700"
      />

      {newAvgPpu && curAvgPpu && (
        <p className="text-xs text-stone-500 px-1">
          Giá TB: {formatVND(curAvgPpu)} → <span className="font-semibold text-stone-700">{formatVND(newAvgPpu)}</span>
          {asset.unit && <span className="text-stone-400">/{asset.unit}</span>}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-100 bg-white"
        >Huỷ</button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !parsedQty || !ppu || parsedQty <= 0}
          className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-40"
        >{saving ? 'Đang lưu...' : 'Lưu'}</button>
      </div>
    </div>
  )
}

// ── Transaction history list ───────────────────────────────────────────────────
function TransactionHistory({
  transactions,
  unit,
  onDeleted,
}: {
  transactions: AssetTransaction[]
  unit: string | null
  onDeleted: () => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/investments/transactions/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (!res.ok) return
    onDeleted()
  }

  if (transactions.length === 0) {
    return (
      <p className="text-xs text-stone-400 text-center py-2 italic">Chưa có lịch sử giao dịch</p>
    )
  }

  return (
    <div className="space-y-0.5">
      {transactions.map(tx => (
        <div key={tx.id} className="flex items-center gap-2 py-1.5 px-1">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-stone-400">{fmtDate(tx.transaction_date)}</span>
            <span className={cn(
              'text-xs font-medium ml-2',
              tx.type === 'buy' ? 'text-emerald-600' : 'text-red-500'
            )}>
              {tx.type === 'buy' ? '↑ Mua' : '↓ Bán'}
            </span>
            <span className="text-xs text-stone-600 ml-1">
              {fmtQty(tx.quantity)}{unit ? ` ${unit}` : ''}
            </span>
            <span className="text-xs text-stone-400 ml-1">
              × {formatVND(tx.price_per_unit)}
            </span>
          </div>
          <span className="text-xs font-semibold text-stone-700 shrink-0">
            {formatVND(tx.total_value)}
          </span>
          <button
            onClick={() => handleDelete(tx.id)}
            disabled={deletingId === tx.id}
            className="p-1 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40 shrink-0"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Main list ──────────────────────────────────────────────────────────────────
export function InvestmentList({ assets, transactions, userId }: Props) {
  const router = useRouter()
  const [deleting,    setDeleting]    = useState<string | null>(null)
  const [editingFull, setEditingFull] = useState<string | null>(null)
  const [collapsed,   setCollapsed]   = useState<Set<string>>(new Set())
  const [liveCrypto,  setLiveCrypto]  = useState<Record<string, number>>({})
  const [showHistory, setShowHistory] = useState<Set<string>>(new Set())
  const [addingTo,    setAddingTo]    = useState<string | null>(null)

  // Re-fetch live crypto prices whenever the set of crypto symbols changes
  const cryptoSymbols = [...new Set(
    assets.filter(a => a.asset_type === 'crypto' && a.symbol).map(a => a.symbol!.toUpperCase())
  )].sort().join(',')

  useEffect(() => {
    if (!cryptoSymbols) return
    fetch(`/api/prices/crypto?symbols=${cryptoSymbols}`)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json() })
      .then(data => setLiveCrypto(data))
      .catch(() => {})
  }, [cryptoSymbols])

  function toggleGroup(type: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(type)) { next.delete(type) } else { next.add(type) }
      return next
    })
  }

  function toggleHistory(id: string) {
    setShowHistory(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
    // Close "Mua thêm" if open for this asset
    if (addingTo === id) setAddingTo(null)
  }

  async function deleteAsset(id: string) {
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('assets').delete().eq('id', id).eq('user_id', userId)
    setDeleting(null)
    if (error) return
    router.refresh()
  }

  async function updateAsset(id: string, updates: Partial<Asset>) {
    const supabase = createClient()
    const { error } = await supabase.from('assets').update(updates).eq('id', id).eq('user_id', userId)
    if (error) return
    setEditingFull(null)
    router.refresh()
  }

  function calcAsset(asset: Asset) {
    const qty = asset.quantity ?? 1
    let currentPpu: number
    let totalValue: number
    let priceSource: 'live' | 'stored' | 'cost' = 'cost'

    if (asset.asset_type === 'crypto' && asset.symbol && liveCrypto[asset.symbol.toUpperCase()]) {
      currentPpu  = liveCrypto[asset.symbol.toUpperCase()]
      totalValue  = currentPpu * qty
      priceSource = 'live'
    } else if (asset.quantity && asset.market_price_per_unit) {
      currentPpu  = asset.market_price_per_unit
      totalValue  = currentPpu * qty
      priceSource = 'stored'
    } else if (asset.quantity && asset.buy_price_per_unit) {
      currentPpu  = asset.buy_price_per_unit
      totalValue  = asset.current_value
      priceSource = 'cost'
    } else {
      currentPpu  = asset.current_value
      totalValue  = asset.current_value
    }

    const costBasis = asset.buy_price_per_unit
      ? asset.buy_price_per_unit * qty
      : (asset.buy_value ?? null)
    const pnl    = costBasis !== null ? totalValue - costBasis : null
    const pnlPct = pnl !== null && costBasis ? Math.round((pnl / costBasis) * 1000) / 10 : null

    return { currentPpu, totalValue, costBasis, pnl, pnlPct, priceSource }
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-10 text-stone-400">
        <p className="text-sm">Chưa có tài sản nào.</p>
        <p className="text-xs mt-1">Thêm tài sản đầu tiên bên dưới nhé.</p>
      </div>
    )
  }

  const grouped = Object.entries(TYPE_META)
    .map(([type, meta]) => ({ type, meta, items: assets.filter(a => a.asset_type === type) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="divide-y divide-stone-100">
      {grouped.map(({ type, meta, items }) => {
        const subtotal    = items.reduce((s, a) => s + calcAsset(a).totalValue, 0)
        const groupCostTotal = items.reduce((s, a) => { const { costBasis } = calcAsset(a); return costBasis !== null ? s + costBasis : s }, 0)
        const groupHasCost   = items.some(a => calcAsset(a).costBasis !== null)
        const groupPnlPct    = groupHasCost && groupCostTotal > 0
          ? ((subtotal - groupCostTotal) / groupCostTotal) * 100 : null
        const isCollapsed = collapsed.has(type)

        return (
          <div key={type}>

            {/* Group header */}
            <button
              type="button"
              onClick={() => toggleGroup(type)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ChevronRight
                  size={14}
                  className={cn('text-stone-400 transition-transform duration-200', !isCollapsed && 'rotate-90')}
                />
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  {meta.icon} {meta.label}
                </p>
                <span className="text-xs text-stone-400">· {items.length}</span>
              </div>
              <div className="flex items-center gap-2">
                {groupPnlPct !== null && (
                  <span className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                    groupPnlPct >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  )}>
                    {groupPnlPct >= 0 ? '+' : ''}{groupPnlPct.toFixed(1)}%
                  </span>
                )}
                <p className="text-xs font-bold text-stone-700">{formatVND(subtotal)}</p>
              </div>
            </button>

            {/* Items */}
            {!isCollapsed && (
              <div className="divide-y divide-stone-50 border-t border-stone-100">
                {items.map(asset => {
                  const assetTxs    = transactions.filter(t => t.asset_id === asset.id)
                  const txCount     = assetTxs.length

                  if (editingFull === asset.id) {
                    return (
                      <div key={asset.id} className="p-3">
                        <AssetEditForm
                          asset={asset}
                          txCount={txCount}
                          onSave={updateAsset}
                          onCancel={() => setEditingFull(null)}
                        />
                      </div>
                    )
                  }

                  const { currentPpu, totalValue, costBasis, pnl, pnlPct, priceSource } = calcAsset(asset)
                  const isHistOpen  = showHistory.has(asset.id)
                  const isAddingHere = addingTo === asset.id
                  const hasQty      = Boolean(asset.quantity)

                  return (
                    <div key={asset.id} className="px-4 py-3 space-y-1.5">

                      {/* Row 1: Name + badge | Value + actions */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-stone-800 truncate">{asset.name}</p>
                            {priceSource === 'live' && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                              </span>
                            )}
                          </div>
                          {/* Compact qty row */}
                          {hasQty && (
                            <div className="flex flex-wrap items-center gap-x-1.5 mt-0.5">
                              <span className="text-xs font-medium text-stone-600">
                                {fmtQty(asset.quantity!)}
                                {asset.unit && <span className="font-normal text-stone-400 ml-0.5">{asset.unit}</span>}
                              </span>
                              {asset.buy_price_per_unit && (
                                <>
                                  <span className="text-stone-300 text-xs">·</span>
                                  <span className="text-xs text-stone-400">
                                    {formatVND(asset.buy_price_per_unit)}
                                    {asset.unit && <span className="text-stone-300">/{asset.unit}</span>}
                                  </span>
                                </>
                              )}
                              {(priceSource === 'live' || priceSource === 'stored') && asset.buy_price_per_unit && Math.round(currentPpu) !== asset.buy_price_per_unit && (
                                <>
                                  <span className="text-stone-300 text-xs">→</span>
                                  <span className={cn(
                                    'text-xs font-medium',
                                    priceSource === 'live' ? 'text-emerald-600' : 'text-stone-600'
                                  )}>
                                    {formatVND(Math.round(currentPpu))}
                                    {asset.unit && <span className="font-normal text-stone-300">/{asset.unit}</span>}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <p className="text-sm font-bold text-stone-800">
                            {formatVND(Math.round(totalValue))}
                          </p>
                          <button
                            onClick={() => { setEditingFull(asset.id); setAddingTo(null) }}
                            className="p-1 text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => deleteAsset(asset.id)}
                            disabled={deleting === asset.id}
                            className="p-1 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Vốn | P&L */}
                      {(costBasis !== null || pnl !== null) && (
                        <div className="flex items-center justify-between -mt-0.5">
                          <p className="text-xs text-stone-400">
                            {costBasis !== null && !hasQty ? <>Vốn {formatVND(costBasis)}</> : null}
                          </p>
                          {pnl !== null && (
                            <div className={cn(
                              'flex items-center gap-1 text-xs font-semibold',
                              pnl >= 0 ? 'text-emerald-600' : 'text-red-500'
                            )}>
                              {pnl > 0 ? <TrendingUp size={11} /> : pnl < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                              {pnl >= 0 ? '+' : ''}{formatVND(Math.round(pnl))}
                              {pnlPct !== null && (
                                <span className="text-[10px] font-normal opacity-75">
                                  ({pnl >= 0 ? '+' : ''}{pnlPct}%)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Row 4: History + Mua thêm actions — only for qty-based assets */}
                      {hasQty && !isAddingHere && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            onClick={() => toggleHistory(asset.id)}
                            className={cn(
                              'flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors',
                              isHistOpen
                                ? 'bg-stone-100 text-stone-600'
                                : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'
                            )}
                          >
                            <History size={11} />
                            {txCount > 0 ? `${txCount} giao dịch` : 'Lịch sử'}
                          </button>
                          <button
                            onClick={() => { setAddingTo(asset.id); setShowHistory(prev => { const n = new Set(prev); n.delete(asset.id); return n }) }}
                            className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                          >
                            <Plus size={11} />
                            Mua thêm
                          </button>
                        </div>
                      )}

                      {/* History panel */}
                      {isHistOpen && !isAddingHere && (
                        <div className="border-t border-stone-100 pt-2">
                          <TransactionHistory
                            transactions={assetTxs}
                            unit={asset.unit}
                            onDeleted={() => router.refresh()}
                          />
                        </div>
                      )}

                      {/* Add transaction form */}
                      {isAddingHere && (
                        <AddTransactionForm
                          asset={asset}
                          onSave={() => { setAddingTo(null); router.refresh() }}
                          onCancel={() => setAddingTo(null)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
