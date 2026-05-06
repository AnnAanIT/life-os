'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { localDateStr } from '@/lib/format'
import { Zap } from 'lucide-react'

interface Props {
  userId: string
  todayLog: {
    did_move: boolean
    activity: string | null
    felt_after: string | null
  } | null
}

const ACTIVITIES = [
  { key: 'run',  emoji: '🏃', label: 'Chạy' },
  { key: 'gym',  emoji: '🏋️', label: 'Gym' },
  { key: 'yoga', emoji: '🧘', label: 'Yoga' },
  { key: 'walk', emoji: '🚶', label: 'Đi bộ' },
  { key: 'swim', emoji: '🏊', label: 'Bơi' },
  { key: 'other',emoji: '✨', label: 'Khác' },
]

const FELT_AFTER = [
  { key: 'energized', emoji: '⚡', label: 'Nạp năng lượng', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { key: 'neutral',   emoji: '→',  label: 'Trung tính',     cls: 'border-stone-200 bg-stone-50 text-stone-600' },
  { key: 'drained',   emoji: '🔋', label: 'Mệt hơn',        cls: 'border-red-200 bg-red-50 text-red-600' },
]

export function MovementLogCard({ userId, todayLog }: Props) {
  const [didMove,   setDidMove]   = useState<boolean | null>(todayLog?.did_move ?? null)
  const [activity,  setActivity]  = useState<string | null>(todayLog?.activity  ?? null)
  const [feltAfter, setFeltAfter] = useState<string | null>(todayLog?.felt_after ?? null)
  const [saving,    setSaving]    = useState(false)

  async function save(patch: Partial<{ did_move: boolean; activity: string | null; felt_after: string | null }>) {
    if (saving) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('movement_logs').upsert(
      {
        user_id:    userId,
        date:       localDateStr(),
        did_move:   patch.did_move   ?? didMove   ?? false,
        activity:   patch.activity   !== undefined ? patch.activity   : activity,
        felt_after: patch.felt_after !== undefined ? patch.felt_after : feltAfter,
      },
      { onConflict: 'user_id,date' },
    )
    setSaving(false)
  }

  async function handleDidMove(val: boolean) {
    setDidMove(val)
    if (!val) { setActivity(null); setFeltAfter(null) }
    await save({ did_move: val, activity: val ? activity : null, felt_after: val ? feltAfter : null })
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-4 border border-stone-100 space-y-4">
      <div className="flex items-center gap-2">
        <Zap size={15} className="text-amber-400" />
        <p className="text-sm font-medium text-stone-700">Vận động hôm nay</p>
      </div>

      {/* Did move? */}
      <div className="grid grid-cols-2 gap-2">
        {[true, false].map(val => (
          <button
            key={String(val)}
            onClick={() => handleDidMove(val)}
            className={cn(
              'py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95',
              didMove === val
                ? val
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-stone-200 border-stone-200 text-stone-600'
                : 'border-stone-100 text-stone-400 hover:border-stone-300',
            )}
          >
            {val ? '✓ Có vận động' : '✗ Chưa vận động'}
          </button>
        ))}
      </div>

      {/* Activity type */}
      {didMove && (
        <div>
          <p className="text-[11px] text-stone-400 mb-2">Hình thức</p>
          <div className="grid grid-cols-3 gap-1.5">
            {ACTIVITIES.map(a => (
              <button
                key={a.key}
                onClick={() => { setActivity(a.key); save({ activity: a.key }) }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all active:scale-95',
                  activity === a.key
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'border-stone-100 text-stone-500 hover:border-stone-300',
                )}
              >
                <span>{a.emoji}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Felt after */}
      {didMove && (
        <div>
          <p className="text-[11px] text-stone-400 mb-2">Cảm giác sau khi vận động?</p>
          <div className="space-y-1.5">
            {FELT_AFTER.map(f => (
              <button
                key={f.key}
                onClick={() => { setFeltAfter(f.key); save({ felt_after: f.key }) }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95',
                  feltAfter === f.key ? f.cls : 'border-stone-100 text-stone-400 hover:border-stone-200',
                )}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {didMove === false && (
        <p className="text-[11px] text-stone-400 italic">
          Không sao — ngày mai bắt đầu lại thôi.
        </p>
      )}
    </div>
  )
}
