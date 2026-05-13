'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Habit {
  id: string
  name: string
  icon: string
  doneToday: boolean
}

interface Props {
  habits: Habit[]
  userId: string
  today: string
}

export function HabitsPreview({ habits, userId, today }: Props) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [localDone, setLocalDone] = useState<Record<string, boolean>>(
    Object.fromEntries(habits.map(h => [h.id, h.doneToday]))
  )

  async function toggle(habit: Habit) {
    setToggling(habit.id)
    const isDone = localDone[habit.id]
    setLocalDone(prev => ({ ...prev, [habit.id]: !isDone }))
    const supabase = createClient()
    let error
    if (isDone) {
      ;({ error } = await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('user_id', userId).eq('date', today))
    } else {
      ;({ error } = await supabase.from('habit_logs').insert({ habit_id: habit.id, user_id: userId, date: today }))
    }
    if (error) setLocalDone(prev => ({ ...prev, [habit.id]: isDone }))
    setToggling(null)
    router.refresh()
  }

  const doneCount = Object.values(localDone).filter(Boolean).length
  const allDone = doneCount === habits.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Thói quen</p>
          <span className={cn(
            'text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors',
            allDone ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-500'
          )}>
            {doneCount}/{habits.length}
          </span>
        </div>
        <Link href="/habits" className="flex items-center gap-0.5 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          Xem thêm <ArrowRight size={11} />
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-3 border border-stone-100">
        <div className="flex flex-wrap gap-2">
          {habits.map(habit => {
            const isDone = localDone[habit.id]
            return (
              <button
                key={habit.id}
                onClick={() => toggle(habit)}
                disabled={toggling === habit.id}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95',
                  isDone
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                )}
              >
                <span className="text-base leading-none">{habit.icon}</span>
                <span>{habit.name}</span>
              </button>
            )
          })}
        </div>
        {allDone && habits.length > 0 && (
          <p className="text-xs text-green-600 font-medium mt-2.5 text-center">✓ Hoàn thành tất cả thói quen hôm nay!</p>
        )}
      </div>
    </div>
  )
}
