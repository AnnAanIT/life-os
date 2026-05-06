'use client'

import { useState } from 'react'
import { formatVND } from '@/lib/format'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Asset, AssetTransaction } from './investment-list'

export interface NetWorthSnapshot {
  snapshot_date: string
  total_value: number
  by_type: Record<string, number>
}

interface ChartPoint {
  month: string
  costBasis: number
  marketValue: number | null
  byTypeCost: Record<string, number>
  newCapital: number
  isVirtual?: boolean
}

interface Props {
  assets: Asset[]
  transactions: AssetTransaction[]
  snapshots: NetWorthSnapshot[]
}

type Period = '3m' | '6m' | '1y' | 'all'
type View   = 'total' | 'byType'

const TYPE_ORDER = ['crypto', 'gold', 'stock', 'savings', 'real_estate', 'cash', 'other']
const TYPE_META: Record<string, { label: string; icon: string; hex: string }> = {
  crypto:      { label: 'Crypto',        icon: '₿',  hex: '#f97316' },
  gold:        { label: 'Vàng',          icon: '🪙', hex: '#eab308' },
  stock:       { label: 'Cổ phiếu',     icon: '📈', hex: '#3b82f6' },
  savings:     { label: 'Tiết kiệm',    icon: '🏦', hex: '#10b981' },
  real_estate: { label: 'Bất động sản', icon: '🏠', hex: '#8b5cf6' },
  cash:        { label: 'Tiền mặt',     icon: '💵', hex: '#6b7280' },
  other:       { label: 'Khác',         icon: '💼', hex: '#d1d5db' },
}

const VN_MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']

const W = 300, H = 155
const PL = 44, PR = 8, PT = 10, PB = 20
const PLOT_W = W - PL - PR
const PLOT_H = H - PT - PB

function shortVal(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'tỷ'
  if (n >= 1_000_000)     return Math.round(n / 1_000_000) + 'tr'
  return formatVND(n)
}

function toMonthStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function prevMonth(m: string): string {
  const d = new Date(m + '-01')
  d.setMonth(d.getMonth() - 1)
  return toMonthStr(d)
}

function buildFromTransactions(
  transactions: AssetTransaction[],
  assets: Asset[],
  snapshots: NetWorthSnapshot[],
): ChartPoint[] {
  if (!transactions.length) return []

  const sorted = [...transactions].sort((a, b) =>
    a.transaction_date.localeCompare(b.transaction_date)
  )

  const firstMonth = sorted[0].transaction_date.slice(0, 7)
  const curMonth   = toMonthStr(new Date())

  const months: string[] = []
  const cursor = new Date(firstMonth + '-01')
  const end    = new Date(curMonth + '-01')
  while (cursor <= end) {
    months.push(toMonthStr(cursor))
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const typeOf = new Map(assets.map(a => [a.id, a.asset_type]))

  const snapMap = new Map<string, number>()
  for (const s of [...snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))) {
    snapMap.set(s.snapshot_date.slice(0, 7), s.total_value)
  }

  const cumByType: Record<string, number> = {}
  let txI = 0

  const points: ChartPoint[] = months.map(month => {
    let newCapital = 0
    while (txI < sorted.length && sorted[txI].transaction_date.slice(0, 7) <= month) {
      const tx = sorted[txI]
      const t  = typeOf.get(tx.asset_id) ?? 'other'
      if (tx.type === 'buy') {
        cumByType[t] = (cumByType[t] ?? 0) + tx.total_value
        newCapital  += tx.total_value
      } else {
        cumByType[t] = Math.max(0, (cumByType[t] ?? 0) - tx.total_value)
      }
      txI++
    }
    const costBasis = Object.values(cumByType).reduce((s, v) => s + Math.max(0, v), 0)
    return { month, costBasis, marketValue: snapMap.get(month) ?? null, byTypeCost: { ...cumByType }, newCapital }
  })

  // Latest month: fill market value from current asset values if no snapshot
  const last = points[points.length - 1]
  if (last && !last.marketValue) {
    const cv = assets.reduce((s, a) => s + a.current_value, 0)
    if (cv > 0) last.marketValue = cv
  }

  // Ensure at least 2 points so line chart can render
  if (points.length === 1) {
    points.unshift({
      month: prevMonth(points[0].month),
      costBasis: 0, marketValue: 0, byTypeCost: {}, newCapital: 0, isVirtual: true,
    })
  }

  return points
}

function buildFromSnapshots(snapshots: NetWorthSnapshot[]): ChartPoint[] {
  if (!snapshots.length) return []
  const byMonth: Record<string, NetWorthSnapshot> = {}
  for (const s of snapshots) {
    const m = s.snapshot_date.slice(0, 7)
    if (!byMonth[m] || s.snapshot_date > byMonth[m].snapshot_date) byMonth[m] = s
  }
  const points: ChartPoint[] = Object.values(byMonth)
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map(s => ({
      month: s.snapshot_date.slice(0, 7),
      costBasis: s.total_value, marketValue: s.total_value,
      byTypeCost: s.by_type ?? {}, newCapital: 0,
    }))

  if (points.length === 1) {
    points.unshift({
      month: prevMonth(points[0].month),
      costBasis: 0, marketValue: 0, byTypeCost: {}, newCapital: 0, isVirtual: true,
    })
  }
  return points
}

function filterByPeriod(points: ChartPoint[], period: Period): ChartPoint[] {
  if (period === 'all' || !points.length) return points
  const months = period === '3m' ? 3 : period === '6m' ? 6 : 12
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  const cutoff = toMonthStr(d)
  const idx = points.findIndex(p => p.month >= cutoff)
  if (idx === -1) return points
  const sliced = points.slice(idx)
  return sliced.length < 2 ? points.slice(-2) : sliced
}

function xOf(i: number, n: number): number {
  return PL + (n <= 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W)
}
function yOf(v: number, maxY: number): number {
  if (maxY === 0) return PT + PLOT_H
  return PT + PLOT_H - (v / maxY) * PLOT_H
}

export function NetWorthChart({ assets, transactions, snapshots }: Props) {
  const [period, setPeriod]           = useState<Period>('all')
  const [view, setView]               = useState<View>('total')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const hasTransactions = transactions.length > 0
  const timeline        = hasTransactions
    ? buildFromTransactions(transactions, assets, snapshots)
    : buildFromSnapshots(snapshots)

  const filtered = filterByPeriod(timeline, period)
  const n        = filtered.length

  if (n === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 px-5 py-6 text-center">
        <p className="text-sm font-medium text-stone-400">Lịch sử đầu tư</p>
        <p className="text-xs text-stone-300 mt-1">Thêm tài sản để bắt đầu thấy lịch sử.</p>
      </div>
    )
  }

  // Last non-virtual point = "current" state
  const lastRealIdx = filtered.reduce((acc, p, i) => p.isVirtual ? acc : i, -1)
  const last        = lastRealIdx >= 0 ? filtered[lastRealIdx] : filtered[n - 1]
  const totalCost   = last.costBasis
  const curVal      = last.marketValue ?? totalCost
  const pnl         = curVal - totalCost
  const pnlPct      = totalCost > 0 ? (pnl / totalCost) * 100 : 0
  const isGain      = pnl >= 0
  // P&L indicator: only when market value meaningfully differs from cost basis
  const hasPnl      = hasTransactions && Math.abs(pnl) > 1000

  const activeTypes = TYPE_ORDER.filter(t => filtered.some(p => (p.byTypeCost[t] ?? 0) > 0))
  const hasTypeData = activeTypes.length > 1

  // Y scale — ensure market value dot fits when P&L exists
  const allVals: number[] = []
  for (const p of filtered) {
    if (view === 'byType' && hasTypeData) {
      activeTypes.forEach(t => allVals.push(p.byTypeCost[t] ?? 0))
    } else {
      allVals.push(p.costBasis)
    }
  }
  if (hasPnl) allVals.push(curVal)
  const maxY    = Math.max(...allVals, 1) * 1.1
  const yGuides = [maxY, maxY / 2, 0]

  const costLine  = filtered.map((p, i) => `${xOf(i, n)},${yOf(p.costBasis, maxY)}`).join(' ')
  // P&L dot coordinates (current state endpoint)
  const pnlCx     = lastRealIdx >= 0 ? xOf(lastRealIdx, n) : 0
  const pnlCyCost = yOf(totalCost, maxY)
  const pnlCyMv   = yOf(curVal, maxY)

  const selectedPoint = selectedIdx !== null ? filtered[selectedIdx] : null

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-2">

          {/* Numbers */}
          <div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
              Net Worth
            </p>
            <div className="flex items-end gap-2 flex-wrap">
              <span className="text-2xl font-bold text-stone-800">{shortVal(curVal)}</span>
              {hasPnl && (
                <div className={cn('flex items-center gap-1 text-xs font-semibold mb-1',
                  isGain ? 'text-emerald-500' : 'text-red-400'
                )}>
                  {isGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {isGain ? '+' : ''}{shortVal(Math.abs(Math.round(pnl)))}
                  <span className="font-normal opacity-75">({isGain ? '+' : ''}{pnlPct.toFixed(1)}%)</span>
                </div>
              )}
            </div>
            {hasPnl && (
              <p className="text-[11px] text-stone-400 mt-0.5">Vốn: {shortVal(totalCost)}</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex gap-0.5">
              {(['3m','6m','1y','all'] as Period[]).map(p => (
                <button key={p}
                  onClick={() => { setPeriod(p); setSelectedIdx(null) }}
                  className={cn('px-2 py-1 rounded-lg text-[10px] font-medium transition-colors',
                    period === p ? 'bg-violet-600 text-white' : 'text-stone-400 hover:bg-stone-100'
                  )}>
                  {p === '3m' ? '3T' : p === '6m' ? '6T' : p === '1y' ? '1N' : 'Tất cả'}
                </button>
              ))}
            </div>
            {hasTypeData && n >= 2 && (
              <div className="flex gap-0.5 bg-stone-100 p-0.5 rounded-lg">
                {(['total','byType'] as View[]).map(v => (
                  <button key={v}
                    onClick={() => { setView(v); setSelectedIdx(null) }}
                    className={cn('px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all',
                      view === v ? 'bg-white text-stone-700 shadow-sm' : 'text-stone-400'
                    )}>
                    {v === 'total' ? 'Tổng' : 'Theo loại'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SVG Chart ── */}
      <div className="px-3 pb-1">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>

          {/* Y-axis guides */}
          {yGuides.map((val, gi) => {
            const y = yOf(val, maxY)
            return (
              <g key={gi}>
                <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f5f5f4" strokeWidth="1" />
                <text x={PL - 4} y={y + 3.5} textAnchor="end" fontSize="8" fill="#d4d0cd">
                  {val > 0 ? shortVal(Math.round(val)) : '0'}
                </text>
              </g>
            )
          })}

          {/* X-axis */}
          <line x1={PL} y1={PT + PLOT_H} x2={W - PR} y2={PT + PLOT_H} stroke="#e7e5e4" strokeWidth="1" />

          {/* ── Total view: cost basis line + current value dot ── */}
          {(view === 'total' || !hasTypeData) && n >= 2 && (
            <>
              <polyline points={costLine} fill="none" stroke="#a8a29e"
                strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
              />
              {/* When P&L exists: vertical gap indicator + two endpoint dots */}
              {hasPnl && lastRealIdx >= 0 && (
                <>
                  <line
                    x1={pnlCx} y1={Math.min(pnlCyCost, pnlCyMv)}
                    x2={pnlCx} y2={Math.max(pnlCyCost, pnlCyMv)}
                    stroke={isGain ? '#10b981' : '#ef4444'} strokeWidth="1.5" strokeDasharray="2 1.5"
                  />
                  {/* Cost endpoint */}
                  <circle cx={pnlCx} cy={pnlCyCost} r={3} fill="white" stroke="#a8a29e" strokeWidth="1.5" />
                  {/* Current market value endpoint */}
                  <circle cx={pnlCx} cy={pnlCyMv} r={5}
                    fill={isGain ? '#10b981' : '#ef4444'} stroke="white" strokeWidth="1.5"
                  />
                </>
              )}
            </>
          )}

          {/* ── By-type view ── */}
          {view === 'byType' && hasTypeData && n >= 2 && activeTypes.map(t => (
            <polyline key={t}
              points={filtered.map((p, i) => `${xOf(i, n)},${yOf(p.byTypeCost[t] ?? 0, maxY)}`).join(' ')}
              fill="none" stroke={TYPE_META[t].hex}
              strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
            />
          ))}

          {/* Cursor line */}
          {selectedIdx !== null && (
            <line
              x1={xOf(selectedIdx, n)} y1={PT}
              x2={xOf(selectedIdx, n)} y2={PT + PLOT_H}
              stroke="#a8a29e" strokeWidth="1" strokeDasharray="3 2"
            />
          )}

          {/* Dots + tap targets */}
          {filtered.map((point, i) => {
            if (point.isVirtual) return null
            // Last point with P&L indicator: just a tap target (dots already drawn)
            if (i === lastRealIdx && hasPnl) {
              return (
                <g key={i} onClick={() => setSelectedIdx(prev => prev === i ? null : i)} style={{ cursor: 'pointer' }}>
                  <circle cx={pnlCx} cy={pnlCyMv} r={12} fill="transparent" />
                </g>
              )
            }
            const isSel = selectedIdx === i
            type Dot = { v: number; color: string; key: string }
            const dots: Dot[] = []
            if (view === 'byType' && hasTypeData) {
              activeTypes.forEach(t => {
                const v = point.byTypeCost[t] ?? 0
                if (v > 0) dots.push({ v, color: TYPE_META[t].hex, key: t })
              })
            } else {
              dots.push({ v: point.costBasis, color: '#a8a29e', key: 'cost' })
            }
            return dots.map(({ v, color, key }) => {
              const cx = xOf(i, n)
              const cy = yOf(v, maxY)
              return (
                <g key={`${i}-${key}`} onClick={() => setSelectedIdx(prev => prev === i ? null : i)} style={{ cursor: 'pointer' }}>
                  <circle cx={cx} cy={cy} r={10} fill="transparent" />
                  <circle cx={cx} cy={cy} r={isSel ? 4.5 : 3}
                    fill={color} stroke="white" strokeWidth={isSel ? 1.5 : 1}
                  />
                </g>
              )
            })
          })}

          {/* X-axis labels */}
          {filtered.map((point, i) => {
            if (point.isVirtual) return null
            const mNum = parseInt(point.month.slice(5, 7))
            const year = point.month.slice(2, 4)
            const cx   = xOf(i, n)
            const show = n <= 8 || i === 0 || i === n - 1 || mNum === 1
            return show ? (
              <text key={i} x={cx} y={H - 4}
                textAnchor="middle" fontSize="8"
                fill={selectedIdx === i ? '#44403c' : '#a8a29e'}
                fontWeight={selectedIdx === i ? '600' : 'normal'}
              >
                {VN_MONTHS[mNum - 1]}{mNum === 1 ? `'${year}` : ''}
              </text>
            ) : null
          })}
        </svg>
      </div>

      {/* ── Selected point detail ── */}
      {selectedPoint && !selectedPoint.isVirtual && (
        <div className="mx-3 mb-3 bg-stone-50 rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-700">
              {VN_MONTHS[parseInt(selectedPoint.month.slice(5, 7)) - 1]}/{selectedPoint.month.slice(0, 4)}
            </p>
            {selectedPoint.newCapital > 0 && (
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +{shortVal(selectedPoint.newCapital)} mới
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-stone-700">{shortVal(selectedPoint.costBasis)}</p>
          {TYPE_ORDER.filter(t => (selectedPoint.byTypeCost[t] ?? 0) > 0).length > 0 && (
            <div className="space-y-1 border-t border-stone-100 pt-2">
              {TYPE_ORDER
                .filter(t => (selectedPoint.byTypeCost[t] ?? 0) > 0)
                .map(t => {
                  const val  = selectedPoint.byTypeCost[t]
                  const pct  = selectedPoint.costBasis > 0 ? (val / selectedPoint.costBasis) * 100 : 0
                  const meta = TYPE_META[t]
                  return (
                    <div key={t} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.hex }} />
                      <span className="text-xs text-stone-500 flex-1">{meta.icon} {meta.label}</span>
                      <div className="w-12 h-1 rounded-full bg-stone-200 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.hex }} />
                      </div>
                      <span className="text-[10px] text-stone-400 w-5 text-right">{Math.round(pct)}%</span>
                      <span className="text-xs font-medium text-stone-700 min-w-[44px] text-right">{shortVal(val)}</span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* Legend (byType view only) */}
      {view === 'byType' && hasTypeData && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 pb-3">
          {activeTypes.map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ background: TYPE_META[t].hex }} />
              <span className="text-[10px] text-stone-400">{TYPE_META[t].label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
