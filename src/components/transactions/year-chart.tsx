'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { formatVND } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface MonthSummary {
  month: string // "2026-04"
  income: number
  expense: number
}

interface Props {
  data: MonthSummary[]
  currentMonth: string
  year: number
}

const MONTH_SHORT = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
const COL_W = 44
const BAR_H = 80

export function YearChart({ data, currentMonth, year }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [view, setView] = useState<'bar' | 'trend'>('bar')

  const today = new Date()
  const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    const key = `${year}-${m}`
    const found = data.find(d => d.month === key)
    return {
      key,
      label: MONTH_SHORT[i],
      income: found?.income ?? 0,
      expense: found?.expense ?? 0,
      isFuture: key > todayMonth,
      isCurrent: key === currentMonth,
    }
  })

  const pastMonths = months.filter(m => !m.isFuture)
  const maxVal = Math.max(...pastMonths.map(m => Math.max(m.income, m.expense)), 1)
  const totalIncome = pastMonths.reduce((s, m) => s + m.income, 0)
  const totalExpense = pastMonths.reduce((s, m) => s + m.expense, 0)
  const totalNet = totalIncome - totalExpense
  const totalW = 12 * COL_W

  function navigate(key: string, isFuture: boolean) {
    if (isFuture) return
    router.push(key === todayMonth ? pathname : `${pathname}?month=${key}`)
  }

  function fmtShort(n: number) {
    if (n === 0) return ''
    const abs = Math.abs(n)
    const prefix = n >= 0 ? '+' : ''
    if (abs >= 1000000) return `${prefix}${(n / 1000000).toFixed(abs % 1000000 === 0 ? 0 : 1)}tr`
    return `${prefix}${Math.round(n / 1000)}k`
  }

  // Map value to SVG y coordinate (higher value = lower y = higher on screen)
  function toY(value: number): number {
    return BAR_H - 6 - Math.round((Math.min(value, maxVal) / maxVal) * (BAR_H - 12))
  }

  // Build SVG polyline points for a series, only connecting past months with data
  function buildPoints(getValue: (m: typeof months[0]) => number): string {
    return pastMonths
      .filter(m => getValue(m) > 0)
      .map(m => {
        const i = months.indexOf(m)
        return `${(i + 0.5) * COL_W},${toY(getValue(m))}`
      })
      .join(' ')
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-stone-700">Tổng quan {year}</p>
          <p className={cn('text-xs mt-0.5 font-medium', totalNet >= 0 ? 'text-emerald-500' : 'text-red-400')}>
            {totalNet >= 0 ? 'Tiết kiệm ' : 'Bội chi '}{fmtShort(totalNet)}
          </p>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-stone-200 text-[11px]">
          <button
            onClick={() => setView('bar')}
            className={cn('px-3 py-1.5 font-medium transition-colors',
              view === 'bar' ? 'bg-violet-600 text-white' : 'text-stone-400 hover:text-stone-600'
            )}
          >
            Cột
          </button>
          <button
            onClick={() => setView('trend')}
            className={cn('px-3 py-1.5 font-medium transition-colors',
              view === 'trend' ? 'bg-violet-600 text-white' : 'text-stone-400 hover:text-stone-600'
            )}
          >
            Xu hướng
          </button>
        </div>
      </div>

      {/* Chart — horizontally scrollable */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div style={{ width: totalW }}>

          {/* ── BAR VIEW ── */}
          {view === 'bar' && (
            <div className="flex">
              {months.map(({ key, label, income, expense, isFuture, isCurrent }) => {
                const net = income - expense
                const incH = income > 0 ? Math.max(Math.round((income / maxVal) * BAR_H), 4) : 3
                const expH = expense > 0 ? Math.max(Math.round((expense / maxVal) * BAR_H), 4) : 3
                const isOver = expense > income && expense > 0

                return (
                  <button
                    key={key}
                    onClick={() => navigate(key, isFuture)}
                    disabled={isFuture}
                    style={{ width: COL_W }}
                    className={cn(
                      'flex flex-col items-center rounded-xl pt-1 pb-1.5 transition-colors select-none',
                      isCurrent ? 'bg-stone-100' : 'hover:bg-stone-50',
                      isFuture && 'opacity-20 pointer-events-none'
                    )}
                  >
                    {/* Net label above bars */}
                    <span className={cn(
                      'text-[9px] font-bold h-3 leading-3',
                      net > 0 ? 'text-emerald-500' : net < 0 ? 'text-red-400' : 'text-transparent'
                    )}>
                      {(income > 0 || expense > 0) ? fmtShort(net) : ''}
                    </span>

                    {/* Bars */}
                    <div className="flex gap-0.5 items-end mt-1" style={{ height: BAR_H }}>
                      <div
                        className="rounded-t-[3px] bg-emerald-400 transition-all"
                        style={{ width: 15, height: incH, opacity: income > 0 ? 1 : 0.15 }}
                      />
                      <div
                        className={cn('rounded-t-[3px] transition-all', isOver ? 'bg-red-400' : 'bg-orange-300')}
                        style={{ width: 15, height: expH, opacity: expense > 0 ? 1 : 0.15 }}
                      />
                    </div>

                    {/* Month label */}
                    <span className={cn(
                      'text-[10px] mt-1.5 font-medium',
                      isCurrent ? 'text-stone-800' : 'text-stone-400'
                    )}>
                      {label}
                    </span>
                    {isCurrent && <div className="w-1 h-1 rounded-full bg-stone-700 mt-0.5" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── TREND VIEW ── */}
          {view === 'trend' && (
            <svg width={totalW} height={BAR_H + 28} className="overflow-visible">
              {/* Subtle grid lines */}
              {[0, 0.33, 0.66, 1].map(f => {
                const y = 6 + (1 - f) * (BAR_H - 12)
                return <line key={f} x1={0} y1={y} x2={totalW} y2={y} stroke="#f5f5f4" strokeWidth={1} />
              })}

              {/* Income area fill */}
              {pastMonths.filter(m => m.income > 0).length > 1 && (
                <polyline
                  points={buildPoints(m => m.income)}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Expense area fill */}
              {pastMonths.filter(m => m.expense > 0).length > 1 && (
                <polyline
                  points={buildPoints(m => m.expense)}
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Per-month dots, labels, interaction */}
              {months.map(({ key, label, income, expense, isFuture, isCurrent }, i) => {
                const x = (i + 0.5) * COL_W
                const net = income - expense
                const incY = income > 0 ? toY(income) : null
                const expY = expense > 0 ? toY(expense) : null
                const labelY = BAR_H + 14
                const dotY = BAR_H + 22

                return (
                  <g
                    key={key}
                    opacity={isFuture ? 0.2 : 1}
                    onClick={() => navigate(key, isFuture)}
                    style={{ cursor: isFuture ? 'default' : 'pointer' }}
                  >
                    {/* Dots */}
                    {incY !== null && <circle cx={x} cy={incY} r={3} fill="#34d399" />}
                    {expY !== null && <circle cx={x} cy={expY} r={3} fill="#fb923c" />}

                    {/* Net label between dots */}
                    {(income > 0 || expense > 0) && (
                      <text
                        x={x} y={Math.min(incY ?? BAR_H, expY ?? BAR_H) - 6}
                        textAnchor="middle" fontSize={9} fontWeight={600}
                        fill={net > 0 ? '#10b981' : net < 0 ? '#f87171' : '#a8a29e'}
                      >
                        {fmtShort(net)}
                      </text>
                    )}

                    {/* Month label */}
                    <text
                      x={x} y={labelY}
                      textAnchor="middle" fontSize={10}
                      fill={isCurrent ? '#1c1917' : '#a8a29e'}
                      fontWeight={isCurrent ? 700 : 400}
                    >
                      {label}
                    </text>

                    {/* Current month dot */}
                    {isCurrent && <circle cx={x} cy={dotY} r={2} fill="#1c1917" />}
                  </g>
                )
              })}
            </svg>
          )}

        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 mt-2 border-t border-stone-50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-stone-400">Thu {formatVND(totalIncome)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-orange-300" />
          <span className="text-[10px] text-stone-400">Chi {formatVND(totalExpense)}</span>
        </div>
      </div>
    </div>
  )
}
