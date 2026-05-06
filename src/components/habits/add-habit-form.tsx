'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar, Zap, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRESET_ICONS = ['⚡', '💪', '📚', '🧘', '🏃', '💧', '😴', '🥗', '✍️', '🎯', '🧠', '❤️']

const TIMEFRAME_PREFIX: Record<string, string> = {
  year: 'Năm', quarter: 'Quý', month: 'Tháng',
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface GoalOption { id: string; title: string; timeframe: string }
interface Props { userId: string; goals?: GoalOption[] }

export function AddHabitForm({ userId, goals = [] }: Props) {
  const router = useRouter()
  const [name,       setName]       = useState('')
  const [icon,       setIcon]       = useState('⚡')
  const [startDate,  setStartDate]  = useState(todayStr())
  const [challenge,  setChallenge]  = useState(false)
  const [goalId,     setGoalId]     = useState<string>('')
  const [showIcons,  setShowIcons]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const dateRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const row: Record<string, unknown> = {
      user_id:        userId,
      name:           name.trim(),
      icon,
      start_date:     startDate,
      challenge_days: challenge ? 30 : null,
    }
    if (goalId) row.goal_id = goalId
    const { error } = await supabase.from('habits').insert(row)
    setSaving(false)
    if (error) return
    setName('')
    setIcon('⚡')
    setStartDate(todayStr())
    setChallenge(false)
    setGoalId('')
    setShowIcons(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Main row */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowIcons(!showIcons)}
          className="shrink-0 w-11 h-11 rounded-xl border border-stone-200 text-xl flex items-center justify-center bg-white hover:border-stone-300 transition-colors"
        >
          {icon}
        </button>
        <input
          type="text"
          placeholder="Tên thói quen..."
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400 bg-white"
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="shrink-0 p-2.5 rounded-xl bg-violet-600 text-white disabled:opacity-50 active:scale-95 transition-transform"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Icon picker */}
      {showIcons && (
        <div className="flex gap-2 flex-wrap bg-white rounded-xl p-2 border border-stone-100">
          {PRESET_ICONS.map(i => (
            <button
              key={i}
              type="button"
              onClick={() => { setIcon(i); setShowIcons(false) }}
              className={cn(
                'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors',
                icon === i ? 'bg-stone-100' : 'hover:bg-stone-50',
              )}
            >
              {i}
            </button>
          ))}
        </div>
      )}

      {/* Options row */}
      <div className="flex items-center gap-3 px-0.5 flex-wrap">
        {/* Start date */}
        <button
          type="button"
          onClick={() => dateRef.current?.showPicker()}
          className="flex items-center gap-1.5 cursor-pointer"
        >
          <Calendar size={13} className={startDate !== todayStr() ? 'text-blue-400' : 'text-stone-300'} />
          <span className="text-[11px] text-stone-400">Bắt đầu</span>
          <span className="text-[11px] text-stone-500">{startDate.replace(/-/g, '/')}</span>
        </button>
        <input
          ref={dateRef}
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="sr-only"
        />

        <div className="h-3 w-px bg-stone-200" />

        {/* Challenge toggle */}
        <button
          type="button"
          onClick={() => setChallenge(c => !c)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors',
            challenge
              ? 'bg-amber-50 border-amber-200 text-amber-600'
              : 'border-transparent text-stone-400 hover:text-stone-600',
          )}
        >
          <Zap size={11} className={challenge ? 'fill-amber-500 text-amber-500' : ''} />
          {challenge ? 'Thử thách 30 ngày ✓' : 'Thử thách 30 ngày'}
        </button>

        {/* Goal link */}
        {goals.length > 0 && (
          <>
            <div className="h-3 w-px bg-stone-200" />
            <div className="flex items-center gap-1">
              <Target size={11} className={goalId ? 'text-indigo-400' : 'text-stone-300'} />
              <select
                value={goalId}
                onChange={e => setGoalId(e.target.value)}
                className={cn(
                  'text-[11px] bg-transparent border-none focus:outline-none cursor-pointer',
                  goalId ? 'text-indigo-500' : 'text-stone-300',
                )}
              >
                <option value="">Gắn mục tiêu</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>
                    [{TIMEFRAME_PREFIX[g.timeframe] ?? g.timeframe}] {g.title}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </form>
  )
}
