'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Star, Calendar, RefreshCw, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

type EnergyLevel = 'high' | 'medium' | 'low' | null
type Recurrence  = 'daily' | 'weekly' | 'monthly' | null

const ENERGY_META = {
  high:   { label: 'Cao',  active: 'bg-red-50 border-red-200 text-red-500',     idle: 'text-stone-400' },
  medium: { label: 'TB',   active: 'bg-amber-50 border-amber-200 text-amber-600', idle: 'text-stone-400' },
  low:    { label: 'Thấp', active: 'bg-emerald-50 border-emerald-200 text-emerald-600', idle: 'text-stone-400' },
}

const RECURRENCE_CYCLE: Recurrence[] = [null, 'daily', 'weekly', 'monthly']
const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Hàng ngày', weekly: 'Hàng tuần', monthly: 'Hàng tháng',
}

const TIMEFRAME_PREFIX: Record<string, string> = {
  year: 'Năm', quarter: 'Quý', month: 'Tháng',
}

interface GoalOption { id: string; title: string; timeframe: string }
interface Props { userId: string; mitCount: number; goals?: GoalOption[] }

export function AddTaskForm({ userId, mitCount, goals = [] }: Props) {
  const router = useRouter()
  const [title,      setTitle]      = useState('')
  const [isMit,      setIsMit]      = useState(false)
  const [dueDate,    setDueDate]    = useState('')
  const [energy,     setEnergy]     = useState<EnergyLevel>(null)
  const [recurrence, setRecurrence] = useState<Recurrence>(null)
  const [goalId,     setGoalId]     = useState<string>('')
  const [saving,     setSaving]     = useState(false)
  const dateRef = useRef<HTMLInputElement>(null)

  const canSetMit = mitCount < 3

  function cycleRecurrence() {
    const idx = RECURRENCE_CYCLE.indexOf(recurrence)
    setRecurrence(RECURRENCE_CYCLE[(idx + 1) % RECURRENCE_CYCLE.length])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const supabase = createClient()
    const row: Record<string, unknown> = {
      user_id:  userId,
      title:    title.trim(),
      is_mit:   isMit && canSetMit,
      due_date: dueDate || null,
    }
    if (energy)     row.energy_level = energy
    if (recurrence) row.recurrence   = recurrence
    if (goalId)     row.goal_id      = goalId
    const { error } = await supabase.from('tasks').insert(row)
    setSaving(false)
    if (error) return
    setTitle('')
    setIsMit(false)
    setDueDate('')
    setEnergy(null)
    setRecurrence(null)
    setGoalId('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Main input row */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Thêm việc cần làm..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400 bg-white"
        />
        <button
          type="button"
          onClick={() => canSetMit && setIsMit(!isMit)}
          title={canSetMit ? 'Đặt làm MIT' : 'Đã đủ 3 MIT'}
          className={cn(
            'shrink-0 p-2.5 rounded-xl border transition-colors',
            isMit ? 'bg-amber-50 border-amber-200 text-amber-500' : 'border-stone-200 text-stone-300 hover:text-amber-400',
            !canSetMit && 'opacity-40 cursor-not-allowed',
          )}
        >
          <Star size={18} className={isMit ? 'fill-amber-500' : ''} />
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="shrink-0 p-2.5 rounded-xl bg-violet-600 text-white disabled:opacity-50 active:scale-95 transition-transform"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Options row */}
      <div className="flex items-center gap-3 px-0.5 flex-wrap">
        {/* Due date */}
        <button
          type="button"
          onClick={() => dateRef.current?.showPicker()}
          className="flex items-center gap-1.5 cursor-pointer"
        >
          <Calendar size={13} className={dueDate ? 'text-blue-400' : 'text-stone-300'} />
          {dueDate && <span className="text-[11px] text-stone-500">{dueDate.replace(/-/g, '/')}</span>}
        </button>
        <input
          ref={dateRef}
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="sr-only"
        />

        <div className="h-3 w-px bg-stone-200" />

        {/* Energy level */}
        <div className="flex items-center gap-1">
          {(['high', 'medium', 'low'] as const).map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => setEnergy(energy === lvl ? null : lvl)}
              className={cn(
                'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                energy === lvl ? ENERGY_META[lvl].active : 'border-transparent ' + ENERGY_META[lvl].idle + ' hover:text-stone-600',
              )}
            >
              {ENERGY_META[lvl].label}
            </button>
          ))}
        </div>

        <div className="h-3 w-px bg-stone-200" />

        {/* Recurrence */}
        <button
          type="button"
          onClick={cycleRecurrence}
          className={cn(
            'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors',
            recurrence
              ? 'bg-violet-50 border-violet-200 text-violet-500'
              : 'border-transparent text-stone-300 hover:text-stone-500',
          )}
        >
          <RefreshCw size={10} />
          {recurrence ? RECURRENCE_LABELS[recurrence] : 'Lặp lại'}
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
