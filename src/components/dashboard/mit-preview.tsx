'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  is_done: boolean
}

interface Props {
  tasks: Task[]
  userId: string
}

export function MITPreview({ tasks, userId }: Props) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [localDone, setLocalDone] = useState<Record<string, boolean>>(
    Object.fromEntries(tasks.map(t => [t.id, t.is_done]))
  )

  async function toggleDone(task: Task) {
    setToggling(task.id)
    setLocalDone(prev => ({ ...prev, [task.id]: !prev[task.id] }))
    const supabase = createClient()
    await supabase.from('tasks').update({ is_done: !task.is_done }).eq('id', task.id).eq('user_id', userId)
    setToggling(null)
    router.refresh()
  }

  const doneCount = Object.values(localDone).filter(Boolean).length
  const total = tasks.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">⭐ Quan trọng nhất</p>
          {total > 0 && (
            <span className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-full',
              doneCount === total ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-500'
            )}>
              {doneCount}/{total}
            </span>
          )}
        </div>
        <Link href="/tasks" className="flex items-center gap-0.5 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          Tất cả <ArrowRight size={11} />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <Link
          href="/tasks"
          className="flex items-center justify-center py-4 text-stone-400 border-2 border-dashed border-stone-100 rounded-xl hover:border-stone-200 transition-colors gap-2"
        >
          <span className="text-sm">Chưa đặt MIT hôm nay</span>
          <ArrowRight size={14} />
        </Link>
      ) : (
        <div className="space-y-1.5">
          {tasks.map(task => {
            const isDone = localDone[task.id]
            return (
              <button
                key={task.id}
                onClick={() => toggleDone(task)}
                disabled={toggling === task.id}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all active:scale-[0.98]',
                  isDone ? 'bg-stone-50 border-stone-100' : 'bg-white border-stone-100 hover:border-stone-200'
                )}
              >
                {isDone
                  ? <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                  : <Circle size={20} className="text-stone-200 shrink-0" />
                }
                <span className={cn(
                  'text-sm flex-1 text-left',
                  isDone ? 'line-through text-stone-300' : 'text-stone-700 font-medium'
                )}>
                  {task.title}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
