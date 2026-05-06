'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { localDateStr } from '@/lib/format'
import { Heart } from 'lucide-react'

interface Props {
  userId: string
  todayLog: { stress_level: number | null; recovery_activities: string[] } | null
}

const STRESS_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: 'Rất nhẹ',  cls: 'bg-emerald-600 border-emerald-600' },
  2: { label: 'Nhẹ',      cls: 'bg-lime-500 border-lime-500' },
  3: { label: 'Vừa',      cls: 'bg-amber-500 border-amber-500' },
  4: { label: 'Cao',      cls: 'bg-orange-500 border-orange-500' },
  5: { label: 'Rất cao',  cls: 'bg-red-500 border-red-500' },
}

const RECOVERY_OPTIONS = [
  { key: 'nature',     emoji: '🌿', label: 'Thiên nhiên' },
  { key: 'meditation', emoji: '🧘', label: 'Thiền' },
  { key: 'social',     emoji: '👥', label: 'Gặp gỡ' },
  { key: 'creative',   emoji: '🎨', label: 'Sáng tạo' },
  { key: 'rest',       emoji: '😴', label: 'Nghỉ ngơi' },
  { key: 'no_screen',  emoji: '📵', label: 'Không màn hình' },
]

export function RecoveryCard({ userId, todayLog }: Props) {
  const [stress,     setStress]     = useState<number | null>(todayLog?.stress_level ?? null)
  const [activities, setActivities] = useState<string[]>(todayLog?.recovery_activities ?? [])
  const [saving,     setSaving]     = useState(false)

  async function upsert(newStress: number | null, newActivities: string[]) {
    if (saving) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('movement_logs').upsert(
      {
        user_id:             userId,
        date:                localDateStr(),
        stress_level:        newStress,
        recovery_activities: newActivities,
      },
      { onConflict: 'user_id,date' },
    )
    setSaving(false)
  }

  async function handleStress(val: number) {
    setStress(val)
    await upsert(val, activities)
  }

  async function toggleActivity(key: string) {
    const next = activities.includes(key)
      ? activities.filter(a => a !== key)
      : [...activities, key]
    setActivities(next)
    await upsert(stress, next)
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-4 border border-stone-100 space-y-4">
      <div className="flex items-center gap-2">
        <Heart size={15} className="text-rose-400" />
        <p className="text-sm font-medium text-stone-700">Phục hồi & Tinh thần</p>
      </div>

      {/* Stress level */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-stone-400">Stress hôm nay</p>
          {stress && (
            <span className="text-[11px] text-stone-500 font-medium">{STRESS_LABELS[stress].label}</span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => handleStress(n)}
              className={cn(
                'py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95',
                stress === n
                  ? `${STRESS_LABELS[n].cls} text-white`
                  : 'border-stone-100 text-stone-400 hover:border-stone-300',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Recovery activities */}
      <div>
        <p className="text-[11px] text-stone-400 mb-2">Điều gì giúp bạn phục hồi hôm nay?</p>
        <div className="grid grid-cols-3 gap-1.5">
          {RECOVERY_OPTIONS.map(r => (
            <button
              key={r.key}
              onClick={() => toggleActivity(r.key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs transition-all active:scale-95',
                activities.includes(r.key)
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-stone-100 text-stone-500 hover:border-stone-200',
              )}
            >
              <span>{r.emoji}</span>
              <span className="truncate">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {stress != null && stress >= 4 && activities.length === 0 && (
        <p className="text-[11px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
          Stress cao — thử dành 10 phút cho một trong các hoạt động phục hồi nhé.
        </p>
      )}
    </div>
  )
}
