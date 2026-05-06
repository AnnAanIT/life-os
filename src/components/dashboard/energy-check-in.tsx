'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { localDateStr } from '@/lib/format'
import Link from 'next/link'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface Props {
  userId: string
  todayLog: { score: number; factors: string[] } | null
}

const SCORES = [
  { value: 1, emoji: '😴', label: 'Kiệt sức' },
  { value: 2, emoji: '😕', label: 'Mệt mỏi' },
  { value: 3, emoji: '😐', label: 'Ổn' },
  { value: 4, emoji: '😊', label: 'Tốt' },
  { value: 5, emoji: '⚡', label: 'Bùng nổ' },
]

const FACTORS = [
  { key: 'sleep',    emoji: '💤', label: 'Giấc ngủ' },
  { key: 'food',     emoji: '🥗', label: 'Ăn uống'  },
  { key: 'movement', emoji: '🏃', label: 'Vận động' },
  { key: 'stress',   emoji: '🧘', label: 'Tinh thần' },
]

export function EnergyCheckIn({ userId, todayLog }: Props) {
  const [score,     setScore]     = useState<number | null>(todayLog?.score ?? null)
  const [factors,   setFactors]   = useState<string[]>(todayLog?.factors ?? [])
  const [saving,    setSaving]    = useState(false)
  const [expanded,  setExpanded]  = useState(!todayLog?.score) // collapse when already logged

  async function upsert(newScore: number, newFactors: string[]) {
    if (saving) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('energy_logs').upsert(
      { user_id: userId, date: localDateStr(), score: newScore, factors: newFactors },
      { onConflict: 'user_id,date' },
    )
    setSaving(false)
  }

  async function handleScore(val: number) {
    setScore(val)
    await upsert(val, factors)
    setExpanded(false) // auto-collapse after scoring
  }

  async function toggleFactor(key: string) {
    if (!score) return
    const next = factors.includes(key)
      ? factors.filter(f => f !== key)
      : [...factors, key]
    setFactors(next)
    await upsert(score, next)
  }

  const current = score ? SCORES.find(s => s.value === score) : null

  // ── Compact mode (already logged) ──────────────────────────────────────
  if (!expanded) {
    return (
      <div className="bg-white rounded-2xl px-4 py-3 border border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{current?.emoji}</span>
            <div>
              <p className="text-xs font-medium text-stone-600">
                Năng lượng: {current?.label}
              </p>
              {factors.length > 0 && (
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {factors.map(f => FACTORS.find(x => x.key === f)?.emoji).join(' ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(true)}
              className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
            >
              <ChevronDown size={14} />
            </button>
            <Link
              href="/health"
              className="flex items-center gap-0.5 text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
            >
              Chi tiết <ChevronRight size={10} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Full mode ───────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl px-4 py-4 border border-stone-100 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-700">Năng lượng hôm nay?</p>
        <Link
          href="/health"
          className="flex items-center gap-0.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          Chi tiết <ChevronRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {SCORES.map(s => (
          <button
            key={s.value}
            onClick={() => handleScore(s.value)}
            className={cn(
              'flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95',
              score === s.value
                ? 'border-violet-700 bg-violet-600 text-white shadow-sm scale-105'
                : 'border-stone-100 text-stone-400 hover:border-stone-300 hover:text-stone-600',
            )}
          >
            <span className="text-base leading-none">{s.emoji}</span>
            <span className="text-[10px]">{s.label}</span>
          </button>
        ))}
      </div>

      {score && (
        <div>
          <p className="text-[11px] text-stone-400 mb-1.5">Điều gì ảnh hưởng nhiều nhất?</p>
          <div className="flex gap-2 flex-wrap">
            {FACTORS.map(f => (
              <button
                key={f.key}
                onClick={() => toggleFactor(f.key)}
                className={cn(
                  'flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-all',
                  factors.includes(f.key)
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'border-stone-200 text-stone-400 hover:border-stone-400',
                )}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
