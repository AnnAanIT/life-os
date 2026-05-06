'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  userId: string
  todayScore: { score: number; note: string | null } | null
}

function getScoreConfig(n: number) {
  if (n <= 3) return { active: 'bg-red-500 text-white', inactive: 'bg-red-50 text-red-300 hover:bg-red-100' }
  if (n <= 5) return { active: 'bg-amber-500 text-white', inactive: 'bg-amber-50 text-amber-300 hover:bg-amber-100' }
  if (n <= 7) return { active: 'bg-lime-500 text-white', inactive: 'bg-lime-50 text-lime-400 hover:bg-lime-100' }
  return { active: 'bg-emerald-500 text-white', inactive: 'bg-emerald-50 text-emerald-300 hover:bg-emerald-100' }
}

function getScoreMessage(score: number) {
  if (score <= 3) return 'Ngày khó khăn. Mọi chuyện rồi sẽ tốt hơn ❤️'
  if (score <= 5) return 'Ngày bình thường. Vẫn tiến về phía trước.'
  if (score <= 7) return 'Ngày tốt. Tiếp tục nhé!'
  if (score <= 9) return 'Ngày tuyệt vời! Ghi lại khoảnh khắc này.'
  return 'Ngày hoàn hảo! ✨'
}

export function HappinessScoreCard({ userId, todayScore }: Props) {
  const [selected, setSelected] = useState<number | null>(todayScore?.score ?? null)
  const [saving, setSaving] = useState(false)

  async function handleSelect(score: number) {
    if (saving) return
    setSelected(score)
    setSaving(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('happiness_scores')
      .upsert({ user_id: userId, score, date: today }, { onConflict: 'user_id,date' })
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-4 border border-stone-100 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-700">Hôm nay thế nào?</p>
        {selected && (
          <span className="text-xs font-semibold text-stone-400">{selected}/10</span>
        )}
      </div>

      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const config = getScoreConfig(n)
          const isSelected = selected === n
          return (
            <button
              key={n}
              onClick={() => handleSelect(n)}
              className={cn(
                'h-9 rounded-lg text-xs font-bold transition-all active:scale-90',
                isSelected ? `${config.active} scale-110 shadow-sm` : config.inactive
              )}
            >
              {n}
            </button>
          )
        })}
      </div>

      {selected && (
        <p className="text-xs text-stone-400">{getScoreMessage(selected)}</p>
      )}
    </div>
  )
}
