'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatVND } from '@/lib/format'
import { RefreshCw, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Asset } from './investment-list'

const TYPE_META: Record<string, { label: string; icon: string; hex: string }> = {
  crypto:      { label: 'Crypto',        icon: '₿',  hex: '#f97316' },
  gold:        { label: 'Vàng',          icon: '🪙', hex: '#eab308' },
  stock:       { label: 'Cổ phiếu',     icon: '📈', hex: '#60a5fa' },
  savings:     { label: 'Tiết kiệm',    icon: '🏦', hex: '#34d399' },
  real_estate: { label: 'Bất động sản', icon: '🏠', hex: '#a78bfa' },
  cash:        { label: 'Tiền mặt',     icon: '💵', hex: '#a8a29e' },
  other:       { label: 'Khác',         icon: '💼', hex: '#d6d3d1' },
}

interface LiveResult {
  id: string
  updated: boolean
  currentPricePerUnit?: number
  currentValue: number
  pnl?: number | null
  pnlPct?: number | null
  priceSource?: string | null
}

interface LiveData {
  results: LiveResult[]
  totalCurrentValue: number
  totalPnl: number
  totalPnlPct: number | null
}

interface Props { assets: Asset[] }

function fmtPct(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%' }

function fmtShort(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + ' tỷ'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + ' tr'
  return formatVND(n)
}

// ── Donut chart ───────────────────────────────────────────────────────────────
const CX = 70, CY = 70, R = 54, SW = 18
const CIRC = 2 * Math.PI * R

interface Segment { type: string; pct: number; cumPct: number; hex: string }

function DonutChart({ segments, total, pnl, pnlPct }: {
  segments: Segment[]
  total: number
  pnl: number | null
  pnlPct: number | null
}) {
  const isGain = pnl !== null && pnl >= 0
  return (
    <svg viewBox="0 0 140 140" className="w-[120px] h-[120px] shrink-0 -rotate-90">
      {/* Track */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#292524" strokeWidth={SW} />
      {/* Segments */}
      {segments.map(({ type, pct, cumPct, hex }) => (
        <circle
          key={type}
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={hex}
          strokeWidth={SW}
          strokeLinecap="butt"
          strokeDasharray={`${(pct / 100) * CIRC} ${CIRC}`}
          strokeDashoffset={-(cumPct / 100) * CIRC}
        />
      ))}
      {/* Center text — rotate back to upright */}
      <text
        x={CX} y={CY - 7}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="16" fontWeight="700" fill="white"
        transform={`rotate(90 ${CX} ${CY})`}
      >
        {fmtShort(total)}
      </text>
      {pnl !== null && pnlPct !== null ? (
        <text
          x={CX} y={CY + 10}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fill={isGain ? '#34d399' : '#f87171'}
          transform={`rotate(90 ${CX} ${CY})`}
        >
          {isGain ? '+' : ''}{fmtPct(pnlPct)}
        </text>
      ) : (
        <text
          x={CX} y={CY + 10}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fill="#78716c"
          transform={`rotate(90 ${CX} ${CY})`}
        >
          Net Worth
        </text>
      )}
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function InvestmentOverview({ assets }: Props) {
  const router = useRouter()
  const [liveData, setLiveData]     = useState<LiveData | null>(null)
  const [liveStatus, setLiveStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  useEffect(() => {
    if (assets.length === 0) return
    const total = assets.reduce((s, a) => s + assetValue(a, null), 0)
    if (total <= 0) return
    const byType: Record<string, number> = {}
    for (const a of assets) byType[a.asset_type] = (byType[a.asset_type] ?? 0) + assetValue(a, null)
    fetch('/api/investments/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total_value: Math.round(total), by_type: byType }),
    })
      .then(() => router.refresh())
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchLivePrices() {
    setLiveStatus('loading')
    setLiveData(null)
    try {
      const res = await fetch('/api/investments/live-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: assets.map(a => ({
            id:                  a.id,
            name:                a.name,
            asset_type:          a.asset_type,
            symbol:              a.symbol,
            quantity:            a.quantity,
            unit:                a.unit,
            buy_price_per_unit:  a.buy_price_per_unit,
            buy_value:           a.buy_value,
            current_value:       a.current_value,
          })),
        }),
      })
      if (!res.ok) throw new Error()
      const data: LiveData = await res.json()
      setLiveData(data)
      setLiveStatus('ok')

      const priceUpdates = data.results
        .filter(r => r.updated && r.currentPricePerUnit)
        .map(r => ({
          id:                    r.id,
          current_value:         r.currentValue,
          market_price_per_unit: r.currentPricePerUnit ?? null,
        }))
      if (priceUpdates.length > 0) {
        await fetch('/api/investments/update-prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: priceUpdates }),
        }).catch(() => {})
      }

      const byType: Record<string, number> = {}
      for (const r of data.results) {
        const asset = assets.find(a => a.id === r.id)
        if (asset) byType[asset.asset_type] = (byType[asset.asset_type] ?? 0) + r.currentValue
      }
      await fetch('/api/investments/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_value: Math.round(data.totalCurrentValue), by_type: byType }),
      }).catch(() => {})

      router.refresh()
    } catch {
      setLiveStatus('error')
    }
  }

  const liveMap = new Map<string, LiveResult>(liveData?.results.map(r => [r.id, r]) ?? [])

  function assetValue(a: Asset, map: Map<string, LiveResult> | null): number {
    const live = map?.get(a.id)
    if (live) return live.currentValue
    const qty = a.quantity ?? 1
    if (a.quantity && a.market_price_per_unit) return a.market_price_per_unit * qty
    return a.current_value
  }

  function assetCost(a: Asset): number | null {
    if (a.buy_price_per_unit && a.quantity) return a.buy_price_per_unit * a.quantity
    if (a.buy_value) return a.buy_value
    return null
  }

  if (assets.length === 0) {
    return (
      <div className="bg-stone-800 rounded-2xl p-5 text-center py-10">
        <p className="text-stone-400 text-sm">Chưa có tài sản nào.</p>
        <p className="text-stone-500 text-xs mt-1">Thêm tài sản đầu tiên bên dưới.</p>
      </div>
    )
  }

  // ── Aggregations ──────────────────────────────────────────────────────────
  const totalNetWorth = liveData
    ? liveData.totalCurrentValue
    : assets.reduce((s, a) => s + assetValue(a, null), 0)

  const totalCost = assets.reduce((s, a) => { const c = assetCost(a); return c ? s + c : s }, 0)
  const hasCost   = assets.some(a => assetCost(a) !== null)

  const totalPnl    = liveData ? liveData.totalPnl
    : (hasCost ? totalNetWorth - totalCost : null)
  const totalPnlPct = liveData ? liveData.totalPnlPct
    : (totalPnl !== null && totalCost > 0 ? (totalPnl / totalCost) * 100 : null)

  const byType: Record<string, { value: number; cost: number | null; hasCost: boolean }> = {}
  for (const a of assets) {
    const t = a.asset_type
    if (!byType[t]) byType[t] = { value: 0, cost: null, hasCost: false }
    byType[t].value += assetValue(a, liveMap)
    const c = assetCost(a)
    if (c !== null) { byType[t].cost = (byType[t].cost ?? 0) + c; byType[t].hasCost = true }
  }

  const typeRows = Object.entries(TYPE_META)
    .map(([type, meta]) => ({ type, meta, summary: byType[type] }))
    .filter(r => r.summary)
    .sort((a, b) => b.summary.value - a.summary.value)

  let cumPct = 0
  const donutSegments: Segment[] = typeRows.map(({ type, meta, summary }) => {
    const pct = totalNetWorth > 0 ? (summary.value / totalNetWorth) * 100 : 0
    const seg = { type, pct, cumPct, hex: meta.hex }
    cumPct += pct
    return seg
  })

  const priceSources = liveData
    ? [...new Set(liveData.results.filter(r => r.priceSource).map(r => r.priceSource!))]
    : []
  const updatedCount = liveData?.results.filter(r => r.updated).length ?? 0

  return (
    <div className="bg-stone-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-4 pb-0 flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Phân bổ tài sản</p>
        <div className="flex items-center gap-2">
          {liveStatus === 'loading' && (
            <span className="flex items-center gap-1 text-[10px] text-stone-500">
              <RefreshCw size={10} className="animate-spin" /> Đang lấy giá...
            </span>
          )}
          {liveStatus === 'ok' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {updatedCount} tài sản đã cập nhật
            </span>
          )}
          {liveStatus === 'error' && (
            <span className="text-[10px] text-red-400">Lỗi kết nối</span>
          )}
          <button
            onClick={fetchLivePrices}
            disabled={liveStatus === 'loading'}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
              liveStatus === 'loading'
                ? 'text-stone-500 cursor-not-allowed'
                : liveStatus === 'ok'
                  ? 'bg-emerald-500/20 text-emerald-400 active:scale-95'
                  : 'bg-stone-700 text-stone-200 hover:bg-stone-600 active:scale-95'
            )}
          >
            {liveStatus === 'ok'
              ? <><RefreshCw size={10} /> Cập nhật</>
              : <><Zap size={10} /> Lấy giá</>
            }
          </button>
        </div>
      </div>

      {/* Donut + legend */}
      {totalNetWorth > 0 && (
        <div className="flex items-center gap-4 px-5 py-4">
          <DonutChart
            segments={donutSegments}
            total={totalNetWorth}
            pnl={totalPnl}
            pnlPct={totalPnlPct}
          />

          <div className="flex-1 space-y-2 min-w-0">
            {typeRows.map(({ type, meta, summary }) => {
              const pct  = totalNetWorth > 0 ? (summary.value / totalNetWorth) * 100 : 0
              const pnl  = summary.hasCost && summary.cost !== null ? summary.value - summary.cost : null
              const pnlP = pnl !== null && summary.cost ? (pnl / summary.cost) * 100 : null

              return (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.hex }} />
                  <span className="text-xs text-stone-300 flex-1 truncate min-w-0">
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-[10px] text-stone-500 shrink-0">{pct.toFixed(0)}%</span>
                  <div className="text-right shrink-0 min-w-[56px]">
                    <p className="text-xs font-semibold text-white leading-tight">{fmtShort(summary.value)}</p>
                    {pnlP !== null && (
                      <p className={cn('text-[10px] leading-tight', pnlP >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {fmtPct(pnlP)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {priceSources.length > 0 && (
        <p className="text-[10px] text-stone-500 text-center pb-3 -mt-1">
          Nguồn: {priceSources.join(' · ')}
        </p>
      )}
    </div>
  )
}
