'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { localDateStr } from '@/lib/format'
import { Salad } from 'lucide-react'

interface Props {
  userId: string
  todayLog: { meal_quality: string | null } | null
}

const OPTIONS = [
  {
    key:       'energized',
    emoji:     '⚡',
    label:     'Nạp năng lượng',
    sublabel:  'Ăn xong thấy nhẹ, tỉnh táo',
    idle:      'border-emerald-100 bg-emerald-50',
    active:    'bg-emerald-600 border-emerald-600',
    textIdle:  'text-emerald-700',
  },
  {
    key:       'neutral',
    emoji:     '→',
    label:     'Trung tính',
    sublabel:  'Không ảnh hưởng nhiều',
    idle:      'border-stone-200 bg-stone-50',
    active:    'bg-stone-600 border-stone-600',
    textIdle:  'text-stone-600',
  },
  {
    key:       'drained',
    emoji:     '🔋',
    label:     'Hút năng lượng',
    sublabel:  'Ăn xong buồn ngủ, nặng nề',
    idle:      'border-red-100 bg-red-50',
    active:    'bg-red-500 border-red-500',
    textIdle:  'text-red-600',
  },
]

export function NutritionCard({ userId, todayLog }: Props) {
  const [selected, setSelected] = useState<string | null>(todayLog?.meal_quality ?? null)
  const [saving,   setSaving]   = useState(false)

  async function handleSelect(key: string) {
    if (saving) return
    const next = selected === key ? null : key
    setSelected(next)
    setSaving(true)
    const supabase = createClient()
    await supabase.from('movement_logs').upsert(
      { user_id: userId, date: localDateStr(), meal_quality: next },
      { onConflict: 'user_id,date' },
    )
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-4 border border-stone-100 space-y-3">
      <div className="flex items-center gap-2">
        <Salad size={15} className="text-emerald-500" />
        <p className="text-sm font-medium text-stone-700">Ăn uống hôm nay</p>
      </div>

      <p className="text-[11px] text-stone-400">Nhìn lại cả ngày — ăn uống ảnh hưởng đến năng lượng thế nào?</p>

      <div className="space-y-2">
        {OPTIONS.map(o => {
          const isSelected = selected === o.key
          return (
            <button
              key={o.key}
              onClick={() => handleSelect(o.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.98]',
                isSelected ? o.active : o.idle,
              )}
            >
              <span className="text-lg leading-none">{o.emoji}</span>
              <div>
                <p className={cn('text-xs font-medium', isSelected ? 'text-white' : o.textIdle)}>
                  {o.label}
                </p>
                <p className={cn('text-[10px]', isSelected ? 'text-white/70' : 'text-stone-400')}>
                  {o.sublabel}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
