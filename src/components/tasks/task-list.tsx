'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Star, Trash2, RefreshCw, Pencil, Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { localDateStr } from '@/lib/format'

type EnergyLevel = 'high' | 'medium' | 'low' | null
type Recurrence  = 'daily' | 'weekly' | 'monthly' | null

interface Task {
  id: string
  title: string
  is_mit: boolean
  is_done: boolean
  due_date: string | null
  energy_level?: EnergyLevel
  recurrence?: Recurrence
  goal_id?: string | null
}

interface TaskUpdates {
  title: string
  due_date: string | null
  energy_level: EnergyLevel
  recurrence: Recurrence
  goal_id: string | null
}

interface GoalOption { id: string; title: string; timeframe: string }
interface Props { tasks: Task[]; userId: string; goals?: GoalOption[] }

const ENERGY_DOT: Record<string, string> = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-emerald-400',
}

const ENERGY_LABELS: Record<string, string> = {
  high: 'Cao', medium: 'Trung bình', low: 'Thấp',
}

const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Ngày', weekly: 'Tuần', monthly: 'Tháng',
}

function formatDue(dateStr: string): { label: string; cls: string } {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(dateStr + 'T00:00:00')
  const diff  = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0)   return { label: `${Math.abs(diff)}d trước`, cls: 'bg-red-50 text-red-500' }
  if (diff === 0)  return { label: 'Hôm nay',                  cls: 'bg-amber-50 text-amber-600' }
  if (diff === 1)  return { label: 'Ngày mai',                  cls: 'bg-amber-50 text-amber-500' }
  if (diff <= 7)   return { label: `${diff}d nữa`,             cls: 'bg-stone-100 text-stone-500' }
  const [y, mo, d] = dateStr.split('-')
  return { label: `${y}/${mo}/${d}`, cls: 'bg-stone-100 text-stone-400' }
}

function nextDueDate(current: string | null, recurrence: Recurrence): string {
  const base = current ? new Date(current + 'T00:00:00') : new Date()
  base.setHours(0, 0, 0, 0)
  if (recurrence === 'daily')   base.setDate(base.getDate() + 1)
  if (recurrence === 'weekly')  base.setDate(base.getDate() + 7)
  if (recurrence === 'monthly') base.setMonth(base.getMonth() + 1)
  return localDateStr(base)
}

export function TaskList({ tasks, userId, goals = [] }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const goalMap = Object.fromEntries(goals.map(g => [g.id, g.title]))

  const mitTasks   = tasks.filter(t => t.is_mit)
  const otherTasks = tasks.filter(t => !t.is_mit)
  const activeMitCount = mitTasks.filter(t => !t.is_done).length

  const highTasks    = otherTasks.filter(t => t.energy_level === 'high')
  const mediumTasks  = otherTasks.filter(t => t.energy_level === 'medium')
  const lowTasks     = otherTasks.filter(t => t.energy_level === 'low')
  const noEnergyTasks = otherTasks.filter(t => !t.energy_level)
  const hasEnergyGrouping = highTasks.length + mediumTasks.length + lowTasks.length > 0

  async function toggleDone(task: Task) {
    setLoading(task.id)
    const supabase = createClient()
    const nowDone = !task.is_done
    const { error } = await supabase.from('tasks').update({ is_done: nowDone }).eq('id', task.id).eq('user_id', userId)
    if (error) { setLoading(null); return }

    if (nowDone && task.recurrence) {
      const { error: recurError } = await supabase.from('tasks').insert({
        user_id:      userId,
        title:        task.title,
        is_mit:       false,
        energy_level: task.energy_level,
        recurrence:   task.recurrence,
        due_date:     nextDueDate(task.due_date, task.recurrence),
        goal_id:      task.goal_id ?? null,
      })
      if (recurError) console.error('Failed to create recurring task:', recurError.message)
    }

    setLoading(null)
    router.refresh()
  }

  async function toggleMit(task: Task) {
    if (!task.is_mit && activeMitCount >= 3) return
    setLoading(task.id)
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ is_mit: !task.is_mit }).eq('id', task.id).eq('user_id', userId)
    setLoading(null)
    if (error) return
    router.refresh()
  }

  async function deleteTask(id: string) {
    setLoading(id)
    const supabase = createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId)
    setLoading(null)
    if (error) return
    router.refresh()
  }

  async function updateTask(id: string, updates: TaskUpdates): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({
        title:        updates.title.trim(),
        due_date:     updates.due_date || null,
        energy_level: updates.energy_level || null,
        recurrence:   updates.recurrence || null,
        goal_id:      updates.goal_id || null,
      })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return false
    router.refresh()
    return true
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 text-stone-400">
        <p className="text-sm">Chưa có việc nào.</p>
        <p className="text-xs mt-1">Thêm task bên trên nhé.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* MIT section */}
      <div>
        <div className="mb-2">
          <div className="flex items-center gap-1.5">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              3 việc quan trọng nhất — {activeMitCount}/3
            </p>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5 ml-0.5 italic">
            Nếu hôm nay chỉ làm được 1 việc, đó là gì?
          </p>
        </div>
        <div className="space-y-2">
          {mitTasks.length === 0 ? (
            <div className="text-center py-4 text-stone-300 border-2 border-dashed border-stone-100 rounded-xl">
              <p className="text-sm">Chưa có MIT nào.</p>
              <p className="text-xs mt-0.5">Nhấn ⭐ để đặt việc quan trọng nhất.</p>
            </div>
          ) : (
            mitTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                goalTitle={task.goal_id ? goalMap[task.goal_id] : undefined}
                goals={goals}
                onToggleDone={toggleDone}
                onToggleMit={toggleMit}
                onDelete={deleteTask}
                onUpdate={updateTask}
                loading={loading}
                canAddMit={activeMitCount < 3}
              />
            ))
          )}
        </div>
      </div>

      {/* Other tasks — grouped by energy level */}
      {otherTasks.length > 0 && (
        <div className="space-y-4">
          {hasEnergyGrouping ? (
            <>
              {highTasks.length > 0 && (
                <EnergyGroup
                  label="Cần tập trung cao"
                  dotClass="bg-red-400"
                  tasks={highTasks}
                  goalMap={goalMap}
                  goals={goals}
                  onToggleDone={toggleDone}
                  onToggleMit={toggleMit}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  loading={loading}
                  canAddMit={activeMitCount < 3}
                />
              )}
              {mediumTasks.length > 0 && (
                <EnergyGroup
                  label="Vừa sức"
                  dotClass="bg-amber-400"
                  tasks={mediumTasks}
                  goalMap={goalMap}
                  goals={goals}
                  onToggleDone={toggleDone}
                  onToggleMit={toggleMit}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  loading={loading}
                  canAddMit={activeMitCount < 3}
                />
              )}
              {lowTasks.length > 0 && (
                <EnergyGroup
                  label="Nhẹ nhàng"
                  dotClass="bg-emerald-400"
                  tasks={lowTasks}
                  goalMap={goalMap}
                  goals={goals}
                  onToggleDone={toggleDone}
                  onToggleMit={toggleMit}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  loading={loading}
                  canAddMit={activeMitCount < 3}
                />
              )}
              {noEnergyTasks.length > 0 && (
                <EnergyGroup
                  label="Chưa phân loại"
                  tasks={noEnergyTasks}
                  goalMap={goalMap}
                  goals={goals}
                  onToggleDone={toggleDone}
                  onToggleMit={toggleMit}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  loading={loading}
                  canAddMit={activeMitCount < 3}
                />
              )}
            </>
          ) : (
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Các việc khác</p>
              <div className="space-y-2">
                {noEnergyTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    goalTitle={task.goal_id ? goalMap[task.goal_id] : undefined}
                    goals={goals}
                    onToggleDone={toggleDone}
                    onToggleMit={toggleMit}
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                    loading={loading}
                    canAddMit={activeMitCount < 3}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EnergyGroup({
  label, dotClass, tasks, goalMap, goals,
  onToggleDone, onToggleMit, onDelete, onUpdate, loading, canAddMit,
}: {
  label: string
  dotClass?: string
  tasks: Task[]
  goalMap: Record<string, string>
  goals: GoalOption[]
  onToggleDone: (t: Task) => void
  onToggleMit:  (t: Task) => void
  onDelete:     (id: string) => void
  onUpdate:     (id: string, updates: TaskUpdates) => Promise<boolean>
  loading:      string | null
  canAddMit:    boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {dotClass && <span className={cn('w-2 h-2 rounded-full shrink-0', dotClass)} />}
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">{label}</p>
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            goalTitle={task.goal_id ? goalMap[task.goal_id] : undefined}
            goals={goals}
            onToggleDone={onToggleDone}
            onToggleMit={onToggleMit}
            onDelete={onDelete}
            onUpdate={onUpdate}
            loading={loading}
            canAddMit={canAddMit}
          />
        ))}
      </div>
    </div>
  )
}

function TaskRow({
  task, goalTitle, goals, onToggleDone, onToggleMit, onDelete, onUpdate, loading, canAddMit,
}: {
  task: Task
  goalTitle?: string
  goals: GoalOption[]
  onToggleDone: (t: Task) => void
  onToggleMit:  (t: Task) => void
  onDelete:     (id: string) => void
  onUpdate:     (id: string, updates: TaskUpdates) => Promise<boolean>
  loading:      string | null
  canAddMit:    boolean
}) {
  const [isEditing,    setIsEditing]    = useState(false)
  const [editTitle,    setEditTitle]    = useState(task.title)
  const [editDate,     setEditDate]     = useState(task.due_date ?? '')
  const [editEnergy,   setEditEnergy]   = useState<EnergyLevel>(task.energy_level ?? null)
  const [editRecur,    setEditRecur]    = useState<Recurrence>(task.recurrence ?? null)
  const [editGoalId,   setEditGoalId]   = useState<string>(task.goal_id ?? '')
  const [saving,       setSaving]       = useState(false)
  const dateRef = useRef<HTMLInputElement>(null)

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (isEditing) {
      setEditTitle(task.title)
      setEditDate(task.due_date ?? '')
      setEditEnergy(task.energy_level ?? null)
      setEditRecur(task.recurrence ?? null)
      setEditGoalId(task.goal_id ?? '')
    }
  }, [isEditing])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  async function handleSave() {
    if (!editTitle.trim()) return
    setSaving(true)
    const ok = await onUpdate(task.id, {
      title:        editTitle,
      due_date:     editDate || null,
      energy_level: editEnergy,
      recurrence:   editRecur,
      goal_id:      editGoalId || null,
    })
    setSaving(false)
    if (ok) setIsEditing(false)
  }

  const due = task.due_date ? formatDue(task.due_date) : null
  const isOverdue = due && due.cls.includes('red') && !task.is_done

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-3">
        {/* Title */}
        <input
          autoFocus
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false) }}
          className="w-full text-sm text-stone-800 border-b border-stone-200 pb-1.5 outline-none focus:border-violet-400 transition-colors bg-transparent"
          placeholder="Tên công việc"
        />

        {/* Energy level */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 w-20 shrink-0">Năng lượng</span>
          <div className="flex gap-1.5">
            {(['high', 'medium', 'low'] as EnergyLevel[]).map(lvl => (
              <button
                key={lvl!}
                type="button"
                onClick={() => setEditEnergy(editEnergy === lvl ? null : lvl)}
                className={cn(
                  'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                  editEnergy === lvl
                    ? lvl === 'high'   ? 'bg-red-50 border-red-200 text-red-600'
                    : lvl === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-600'
                    :                   'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'border-stone-200 text-stone-400 hover:border-stone-300',
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', ENERGY_DOT[lvl!])} />
                {ENERGY_LABELS[lvl!]}
              </button>
            ))}
          </div>
        </div>

        {/* Recurrence */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 w-20 shrink-0">Lặp lại</span>
          <div className="flex gap-1.5">
            {(['daily', 'weekly', 'monthly'] as Recurrence[]).map(r => (
              <button
                key={r!}
                type="button"
                onClick={() => setEditRecur(editRecur === r ? null : r)}
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                  editRecur === r
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'border-stone-200 text-stone-400 hover:border-stone-300',
                )}
              >
                {RECURRENCE_LABELS[r!]}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 w-20 shrink-0">Deadline</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => dateRef.current?.showPicker()}
              className={cn(
                'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                editDate
                  ? 'bg-stone-100 border-stone-300 text-stone-600'
                  : 'border-stone-200 text-stone-400 hover:border-stone-300',
              )}
            >
              <Calendar size={10} />
              {editDate ? editDate : 'Chọn ngày'}
            </button>
            {editDate && (
              <button
                type="button"
                onClick={() => setEditDate('')}
                className="text-stone-300 hover:text-stone-500 transition-colors"
              >
                <X size={12} />
              </button>
            )}
            <input
              ref={dateRef}
              type="date"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              className="sr-only"
            />
          </div>
        </div>

        {/* Goal link */}
        {goals.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 w-20 shrink-0">Mục tiêu</span>
            <select
              value={editGoalId}
              onChange={e => setEditGoalId(e.target.value)}
              className="flex-1 text-xs text-stone-600 border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-violet-400 bg-white"
            >
              <option value="">Không gắn</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !editTitle.trim()}
            className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-white rounded-xl px-3 py-2.5 border flex items-center gap-2.5 group transition-opacity',
      isOverdue ? 'border-red-100' : 'border-stone-100',
      task.is_done && 'opacity-50',
    )}>
      {/* Done toggle */}
      <button
        onClick={() => onToggleDone(task)}
        disabled={loading === task.id}
        className="shrink-0 text-stone-300 hover:text-green-500 transition-colors"
      >
        {task.is_done
          ? <CheckCircle2 size={20} className="text-green-500" />
          : <Circle size={20} />
        }
      </button>

      {/* Energy dot */}
      {task.energy_level && (
        <div className={cn('w-2 h-2 rounded-full shrink-0', ENERGY_DOT[task.energy_level])} />
      )}

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-sm text-stone-700 block truncate',
          task.is_done && 'line-through text-stone-400',
        )}>
          {task.title}
        </span>
        {(due || task.recurrence || goalTitle) && (
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {due && (
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', due.cls)}>
                {due.label}
              </span>
            )}
            {task.recurrence && (
              <span className="flex items-center gap-0.5 text-[10px] text-stone-400">
                <RefreshCw size={9} />
                {RECURRENCE_LABELS[task.recurrence]}
              </span>
            )}
            {goalTitle && (
              <span className="text-[10px] text-indigo-400 truncate max-w-[120px]">
                🎯 {goalTitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* MIT toggle */}
      <button
        onClick={() => onToggleMit(task)}
        disabled={loading === task.id || (!task.is_mit && !canAddMit)}
        title={task.is_mit ? 'Bỏ MIT' : canAddMit ? 'Đặt làm MIT' : 'Đã đủ 3 MIT'}
        className={cn(
          'shrink-0 transition-colors',
          task.is_mit
            ? 'text-amber-500'
            : 'text-stone-200 hover:text-amber-400 lg:opacity-0 lg:group-hover:opacity-100',
          !task.is_mit && !canAddMit && 'cursor-not-allowed',
        )}
      >
        <Star size={15} className={task.is_mit ? 'fill-amber-500' : ''} />
      </button>

      {/* Edit */}
      <button
        onClick={() => setIsEditing(true)}
        disabled={loading === task.id}
        className="shrink-0 p-1 rounded-lg lg:opacity-0 lg:group-hover:opacity-100 hover:bg-stone-100 text-stone-300 hover:text-stone-500 transition-all"
      >
        <Pencil size={14} />
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        disabled={loading === task.id}
        className="shrink-0 p-1 rounded-lg lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-50 text-stone-300 hover:text-red-400 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
