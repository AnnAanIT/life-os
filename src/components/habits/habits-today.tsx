'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Flame, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Pencil, Trash2, Check, X, ArrowUp, ArrowDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRESET_ICONS = ['⚡', '💪', '📚', '🧘', '🏃', '💧', '😴', '🥗', '✍️', '🎯', '🧠', '❤️']

interface Habit {
  id: string
  name: string
  icon: string
  streak: number
  doneToday: boolean
  logs: string[]
  startDate: string
  challengeDays: number | null
}

interface Props {
  habits: Habit[]
  userId: string
  today: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── 7-day dot preview ──────────────────────────────────────────────────────
function SevenDots({ logs, today, startDate }: { logs: string[]; today: string; startDate: string }) {
  const logSet = new Set(logs)
  const startD = new Date(startDate + 'T00:00:00')
  const dots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() - (6 - i))
    return { done: logSet.has(isoDate(d)), active: d >= startD }
  })
  return (
    <div className="flex gap-[3px] shrink-0">
      {dots.map((dot, i) => (
        <div key={i} className={cn(
          'w-1.5 h-1.5 rounded-full transition-colors',
          !dot.active ? 'opacity-0' : dot.done ? 'bg-green-400' : 'bg-stone-200',
        )} />
      ))}
    </div>
  )
}

// ── Streak badge ───────────────────────────────────────────────────────────
function StreakBadge({ streak }: { streak: number }) {
  if (streak <= 1) return null
  if (streak >= 7) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 shrink-0">
        <Flame size={11} className="fill-amber-500 text-amber-500" />{streak}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-orange-400 font-medium shrink-0">
      <Flame size={11} className="fill-orange-400" />{streak}
    </span>
  )
}

// ── Monthly calendar ───────────────────────────────────────────────────────
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                   'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

function HabitCalendar({ logs, today, startDate }: { logs: string[]; today: string; startDate: string }) {
  const todayD   = new Date(today     + 'T00:00:00')
  const createdD = new Date(startDate + 'T00:00:00')
  const logSet   = new Set(logs)

  const [viewYear,  setViewYear]  = useState(todayD.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayD.getMonth())

  function goMonth(dir: -1 | 1) {
    setViewMonth(m => {
      const next = m + dir
      if (next < 0)  { setViewYear(y => y - 1); return 11 }
      if (next > 11) { setViewYear(y => y + 1); return 0  }
      return next
    })
  }

  const canGoNext = viewYear < todayD.getFullYear() ||
    (viewYear === todayD.getFullYear() && viewMonth < todayD.getMonth())
  const canGoPrev = viewYear > createdD.getFullYear() ||
    (viewYear === createdD.getFullYear() && viewMonth > createdD.getMonth())

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay()
  const startPad    = firstDow === 0 ? 6 : firstDow - 1

  type CellState = 'done' | 'active' | 'inactive' | 'future'
  type Cell = { day: number; ds: string; state: CellState; isToday: boolean } | null

  const cells: Cell[] = Array(startPad).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const ds    = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dateD = new Date(ds + 'T00:00:00')
    let state: CellState
    if      (dateD > todayD)   state = 'future'
    else if (dateD < createdD) state = 'inactive'
    else if (logSet.has(ds))   state = 'done'
    else                       state = 'active'
    cells.push({ day: d, ds, state, isToday: ds === today })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const rows: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

  const realCells  = cells.filter((c): c is NonNullable<Cell> => c !== null)
  const doneDays   = realCells.filter(c => c.state === 'done').length
  const activeDays = realCells.filter(c => c.state === 'done' || c.state === 'active').length

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => goMonth(-1)} disabled={!canGoPrev}
          className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 disabled:opacity-20 transition-colors">
          <ChevronLeft size={14} />
        </button>
        <p className="text-xs font-semibold text-stone-600">{MONTHS_VI[viewMonth]} {viewYear}</p>
        <button onClick={() => goMonth(1)} disabled={!canGoNext}
          className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 disabled:opacity-20 transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
          <p key={d} className="text-[10px] text-stone-300 text-center">{d}</p>
        ))}
      </div>
      <div className="space-y-0.5">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7">
            {row.map((cell, ci) => (
              <div key={ci} className="flex items-center justify-center py-0.5">
                {cell && (
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors',
                    cell.state === 'done'     && 'bg-green-500 text-white',
                    cell.state === 'active'   && 'text-stone-600',
                    cell.state === 'inactive' && 'text-stone-200',
                    cell.state === 'future'   && 'text-stone-200',
                    cell.isToday && cell.state !== 'done' && 'ring-1 ring-stone-400 font-semibold',
                    cell.isToday && cell.state === 'done' && 'ring-2 ring-offset-1 ring-green-400',
                  )}>
                    {cell.day}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-stone-400">
          {activeDays > 0 ? `${doneDays}/${activeDays} ngày hoàn thành tháng này` : 'Chưa có ngày nào trong tháng này'}
        </p>
        <p className="text-[10px] text-stone-300">từ {fmtDate(startDate)}</p>
      </div>
    </div>
  )
}

// ── Shared icon/name edit form ─────────────────────────────────────────────
function EditForm({
  name, icon,
  onSave, onCancel,
}: {
  name: string
  icon: string
  onSave: (name: string, icon: string) => Promise<void>
  onCancel: () => void
}) {
  const [editName,       setEditName]       = useState(name)
  const [editIcon,       setEditIcon]       = useState(icon)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [saving,         setSaving]         = useState(false)

  async function save() {
    if (!editName.trim()) return
    setSaving(true)
    await onSave(editName.trim(), editIcon)
    setSaving(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setShowIconPicker(p => !p)}
          className="shrink-0 w-10 h-10 rounded-xl border border-stone-200 text-xl flex items-center justify-center bg-white">
          {editIcon}
        </button>
        <input
          autoFocus value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 focus:outline-none focus:border-violet-400"
        />
        <button onClick={save} disabled={saving || !editName.trim()}
          className="shrink-0 p-2.5 rounded-xl bg-green-500 text-white disabled:opacity-50">
          <Check size={16} />
        </button>
        <button onClick={onCancel}
          className="shrink-0 p-2.5 rounded-xl border border-stone-200 text-stone-400">
          <X size={16} />
        </button>
      </div>
      {showIconPicker && (
        <div className="flex gap-1.5 flex-wrap bg-stone-50 rounded-xl p-2">
          {PRESET_ICONS.map(ic => (
            <button key={ic} onClick={() => { setEditIcon(ic); setShowIconPicker(false) }}
              className={cn('w-9 h-9 rounded-lg text-lg flex items-center justify-center',
                editIcon === ic ? 'bg-white shadow-sm' : 'hover:bg-white')}>
              {ic}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Active habit row ───────────────────────────────────────────────────────
function HabitRow({
  habit, today,
  canMoveUp, canMoveDown,
  onDelete, onUpdate, onMoveUp, onMoveDown,
}: {
  habit: Habit
  today: string
  canMoveUp: boolean
  canMoveDown: boolean
  onDelete: () => void
  onUpdate: (name: string, icon: string) => Promise<void>
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing,  setEditing]  = useState(false)

  return (
    <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
      {/* Main row — all controls here */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Icon + name */}
        <span className="text-xl shrink-0">{habit.icon}</span>
        <span className="flex-1 text-sm font-medium text-stone-700 truncate min-w-0">
          {habit.name}
        </span>

        {/* 7-day dots */}
        <SevenDots logs={habit.logs} today={today} startDate={habit.startDate} />

        {/* Streak */}
        <StreakBadge streak={habit.streak} />

        {/* Move up / down */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={!canMoveUp}
            className="text-stone-300 hover:text-stone-500 disabled:opacity-20 transition-colors">
            <ArrowUp size={12} />
          </button>
          <button onClick={onMoveDown} disabled={!canMoveDown}
            className="text-stone-300 hover:text-stone-500 disabled:opacity-20 transition-colors">
            <ArrowDown size={12} />
          </button>
        </div>

        {/* Edit */}
        <button onClick={() => { setEditing(true); setExpanded(true) }}
          className="shrink-0 p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-50 transition-colors">
          <Pencil size={14} />
        </button>

        {/* Delete */}
        <button onClick={onDelete}
          className="shrink-0 p-1.5 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
        </button>

        {/* Expand calendar */}
        <button onClick={() => !editing && setExpanded(e => !e)}
          className="shrink-0 text-stone-300 hover:text-stone-500 transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Challenge progress bar */}
      {habit.challengeDays && (() => {
        const startD    = new Date(habit.startDate + 'T00:00:00')
        const endD      = new Date(habit.startDate + 'T00:00:00')
        endD.setDate(startD.getDate() + habit.challengeDays - 1)
        const endStr    = endD.toISOString().split('T')[0]
        const todayD    = new Date(today + 'T00:00:00')
        const elapsed   = Math.min(Math.floor((todayD.getTime() - startD.getTime()) / 86400000) + 1, habit.challengeDays)
        const remaining = Math.max(0, Math.ceil((endD.getTime() - todayD.getTime()) / 86400000))
        const done      = habit.logs.filter(d => d >= habit.startDate && d <= endStr).length
        const ended     = todayD > endD
        const pct       = Math.round((elapsed / habit.challengeDays) * 100)
        return (
          <div className="px-4 pb-2.5 border-t border-stone-50 pt-2">
            {ended ? (
              <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                <Zap size={11} className="fill-amber-400 text-amber-400" />
                Thử thách kết thúc · {done}/{habit.challengeDays} ngày hoàn thành
              </p>
            ) : (
              <>
                <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Zap size={10} className="text-amber-400" />
                    {done}/{habit.challengeDays} ngày hoàn thành
                  </span>
                  <span>{remaining} ngày còn lại</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* Expanded — calendar only, or edit form */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-stone-50">
          {editing ? (
            <div className="pt-2.5">
              <EditForm
                name={habit.name}
                icon={habit.icon}
                onSave={async (n, ic) => { await onUpdate(n, ic); setEditing(false); setExpanded(false) }}
                onCancel={() => { setEditing(false); setExpanded(false) }}
              />
            </div>
          ) : (
            <HabitCalendar logs={habit.logs} today={today} startDate={habit.startDate} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Upcoming habit row ────────────────────────────────────────────────────
function UpcomingHabitRow({
  habit, onDelete, onUpdate,
}: {
  habit: Habit
  onDelete: () => void
  onUpdate: (name: string, icon: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-stone-100 px-4 py-3">
        <EditForm
          name={habit.name}
          icon={habit.icon}
          onSave={async (n, ic) => { await onUpdate(n, ic); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-stone-100 flex items-center gap-2 px-3 py-3">
      <span className="text-xl shrink-0 opacity-60">{habit.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-500 truncate">{habit.name}</p>
        <p className="text-[11px] text-stone-400 mt-0.5">
          Bắt đầu {fmtDate(habit.startDate)}
          {habit.challengeDays && (
            <span className="ml-1.5 text-amber-500">· {habit.challengeDays} ngày thử thách</span>
          )}
        </p>
      </div>
      <button onClick={() => setEditing(true)}
        className="shrink-0 p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-50 transition-colors">
        <Pencil size={14} />
      </button>
      <button onClick={onDelete}
        className="shrink-0 p-1.5 rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function HabitsToday({ habits: initialHabits, userId, today }: Props) {
  const router = useRouter()
  const [habits, setHabits] = useState(initialHabits)

  const habitIds = initialHabits.map(h => h.id).join(',')
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHabits(initialHabits)
  }, [habitIds]) // eslint-disable-line react-hooks/exhaustive-deps

  async function deleteHabit(id: string) {
    setHabits(prev => prev.filter(h => h.id !== id))
    const supabase = createClient()
    const { error } = await supabase.from('habits').update({ is_active: false }).eq('id', id).eq('user_id', userId)
    if (error) { router.refresh(); return }
    router.refresh()
  }

  async function updateHabit(id: string, name: string, icon: string) {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, name, icon } : h))
    const supabase = createClient()
    const { error } = await supabase.from('habits').update({ name, icon }).eq('id', id).eq('user_id', userId)
    if (error) { router.refresh(); return }
    router.refresh()
  }

  async function reorder(id: string, dir: 'up' | 'down') {
    const active  = habits.filter(h => h.startDate <= today)
    const idx     = active.findIndex(h => h.id === id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= active.length) return

    const reordered = [...active]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]

    // Replace active habits in-place; upcoming habits keep their original positions
    let ai = 0
    setHabits(habits.map(h => h.startDate <= today ? reordered[ai++] : h))

    const supabase = createClient()
    await Promise.all(
      reordered.map((h, i) =>
        supabase.from('habits').update({ sort_order: i }).eq('id', h.id).eq('user_id', userId)
      )
    )
    router.refresh()
  }

  const activeHabits   = habits.filter(h => h.startDate <= today)
  const upcomingHabits = habits.filter(h => h.startDate > today)
  const doneCount      = activeHabits.filter(h => h.doneToday).length

  if (habits.length === 0) {
    return (
      <div className="text-center py-10 text-stone-400">
        <p className="text-sm">Chưa có thói quen nào.</p>
        <p className="text-xs mt-1">Thêm thói quen đầu tiên bên trên.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {activeHabits.length > 0 && (
        <>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
            Hôm nay — {doneCount}/{activeHabits.length} hoàn thành
          </p>
          {activeHabits.map((habit, idx) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              today={today}
              canMoveUp={idx > 0}
              canMoveDown={idx < activeHabits.length - 1}
              onDelete={() => deleteHabit(habit.id)}
              onUpdate={(name, icon) => updateHabit(habit.id, name, icon)}
              onMoveUp={() => reorder(habit.id, 'up')}
              onMoveDown={() => reorder(habit.id, 'down')}
            />
          ))}
        </>
      )}

      {upcomingHabits.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Sắp tới</p>
          <div className="space-y-2">
            {upcomingHabits.map(habit => (
              <UpcomingHabitRow
                key={habit.id}
                habit={habit}
                onDelete={() => deleteHabit(habit.id)}
                onUpdate={(name, icon) => updateHabit(habit.id, name, icon)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
