'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Trash2, Plus, Check, X, ChevronDown, ChevronRight, Pencil, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const VALUE_TAG_MAP: Record<string, { icon: string; label: string; color: string }> = {
  finance:       { icon: '💰', label: 'Tài chính', color: 'bg-green-50 text-green-700' },
  health:        { icon: '💪', label: 'Sức khỏe',  color: 'bg-red-50 text-red-600' },
  learning:      { icon: '📚', label: 'Học tập',   color: 'bg-sky-50 text-sky-600' },
  work:          { icon: '💼', label: 'Công việc', color: 'bg-blue-50 text-blue-600' },
  relationships: { icon: '❤️', label: 'Quan hệ',  color: 'bg-pink-50 text-pink-600' },
  spirit:        { icon: '🧘', label: 'Tinh thần', color: 'bg-purple-50 text-purple-600' },
  other:         { icon: '🎯', label: 'Khác',      color: 'bg-stone-50 text-stone-600' },
}

const VALUE_TAGS = [
  { value: 'finance',       label: '💰 Tài chính' },
  { value: 'health',        label: '💪 Sức khỏe' },
  { value: 'learning',      label: '📚 Học tập' },
  { value: 'work',          label: '💼 Công việc' },
  { value: 'relationships', label: '❤️ Quan hệ' },
  { value: 'spirit',        label: '🧘 Tinh thần' },
  { value: 'other',         label: '🎯 Khác' },
]

const TIMEFRAME_LABELS: Record<string, string> = {
  year:    'Mục tiêu năm',
  quarter: 'Mục tiêu quý',
  month:   'Mục tiêu tháng',
}

interface KeyResult { id: string; title: string; is_done: boolean }

interface Goal {
  id: string
  title: string
  description: string | null
  timeframe: string
  value_tag: string
  target_date: string | null
  progress: number
  is_done: boolean
  key_results: KeyResult[]
  task_count: number
  habit_count: number
}

interface GoalUpdates {
  title: string
  description: string | null
  timeframe: string
  value_tag: string
  target_date: string | null
}

interface Props { goals: Goal[]; userId: string }

export function GoalList({ goals, userId }: Props) {
  const router = useRouter()
  const [loading,  setLoading]  = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const activeGoals = goals.filter(g => !g.is_done)
  const doneGoals   = goals.filter(g => g.is_done)
  const grouped = {
    year:    activeGoals.filter(g => g.timeframe === 'year'),
    quarter: activeGoals.filter(g => g.timeframe === 'quarter'),
    month:   activeGoals.filter(g => g.timeframe === 'month'),
  }

  async function toggleDone(goal: Goal) {
    setLoading(goal.id)
    const supabase = createClient()
    const nowDone = !goal.is_done
    let progress: number
    if (nowDone) {
      progress = 100
    } else if (goal.key_results.length > 0) {
      progress = Math.round((goal.key_results.filter(k => k.is_done).length / goal.key_results.length) * 100)
    } else {
      progress = goal.progress
    }
    const { error } = await supabase.from('goals')
      .update({ is_done: nowDone, progress }).eq('id', goal.id).eq('user_id', userId)
    setLoading(null)
    if (error) return
    router.refresh()
  }

  async function updateGoal(id: string, updates: GoalUpdates): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from('goals').update(updates).eq('id', id).eq('user_id', userId)
    if (error) return false
    router.refresh()
    return true
  }

  async function updateProgress(id: string, progress: number) {
    const supabase = createClient()
    const { error } = await supabase.from('goals').update({ progress }).eq('id', id).eq('user_id', userId)
    if (error) return
    router.refresh()
  }

  async function deleteGoal(id: string) {
    setLoading(id)
    const supabase = createClient()
    const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', userId)
    setLoading(null)
    if (error) return
    router.refresh()
  }

  async function addKeyResult(goalId: string, title: string) {
    const supabase = createClient()
    const { error } = await supabase.from('key_results').insert({ goal_id: goalId, user_id: userId, title })
    if (error) return
    router.refresh()
  }

  async function updateKeyResult(id: string, title: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from('key_results').update({ title }).eq('id', id).eq('user_id', userId)
    if (error) return false
    router.refresh()
    return true
  }

  async function toggleKeyResult(kr: KeyResult, goalId: string, allKRs: KeyResult[]) {
    const supabase = createClient()
    const nowDone = !kr.is_done
    const { error } = await supabase.from('key_results')
      .update({ is_done: nowDone }).eq('id', kr.id).eq('user_id', userId)
    if (error) return
    const updated = allKRs.map(k => k.id === kr.id ? { ...k, is_done: nowDone } : k)
    const progress = Math.round((updated.filter(k => k.is_done).length / updated.length) * 100)
    await supabase.from('goals').update({ progress }).eq('id', goalId).eq('user_id', userId)
    router.refresh()
  }

  async function deleteKeyResult(id: string, goalId: string, remaining: KeyResult[]) {
    const supabase = createClient()
    const { error } = await supabase.from('key_results').delete().eq('id', id).eq('user_id', userId)
    if (error) return
    const progress = remaining.length > 0
      ? Math.round((remaining.filter(k => k.is_done).length / remaining.length) * 100)
      : 0
    await supabase.from('goals').update({ progress }).eq('id', goalId).eq('user_id', userId)
    router.refresh()
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-10 text-stone-400">
        <p className="text-sm">Chưa có mục tiêu nào.</p>
        <p className="text-xs mt-1">Thêm mục tiêu đầu tiên bên trên nhé.</p>
      </div>
    )
  }

  const cardProps = {
    onToggleDone: toggleDone, onUpdate: updateGoal, onUpdateProgress: updateProgress,
    onDelete: deleteGoal, onAddKR: addKeyResult, onUpdateKR: updateKeyResult,
    onToggleKR: toggleKeyResult, onDeleteKR: deleteKeyResult, loading,
  }

  return (
    <div className="space-y-6">
      {(['year', 'quarter', 'month'] as const).map(tf => {
        const items = grouped[tf]
        if (items.length === 0) return null
        return (
          <div key={tf}>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
              {TIMEFRAME_LABELS[tf]}
            </p>
            <div className="space-y-2">
              {items.map(goal => <GoalCard key={goal.id} goal={goal} {...cardProps} />)}
            </div>
          </div>
        )
      })}

      {doneGoals.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(s => !s)}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors mb-2"
          >
            {showDone ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            Đã hoàn thành ({doneGoals.length})
          </button>
          {showDone && (
            <div className="space-y-2">
              {doneGoals.map(goal => <GoalCard key={goal.id} goal={goal} {...cardProps} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GoalCard({
  goal, onToggleDone, onUpdate, onUpdateProgress, onDelete,
  onAddKR, onUpdateKR, onToggleKR, onDeleteKR, loading,
}: {
  goal: Goal
  onToggleDone: (g: Goal) => void
  onUpdate: (id: string, u: GoalUpdates) => Promise<boolean>
  onUpdateProgress: (id: string, p: number) => void
  onDelete: (id: string) => void
  onAddKR: (goalId: string, title: string) => void
  onUpdateKR: (id: string, title: string) => Promise<boolean>
  onToggleKR: (kr: KeyResult, goalId: string, allKRs: KeyResult[]) => void
  onDeleteKR: (id: string, goalId: string, remaining: KeyResult[]) => void
  loading: string | null
}) {
  const [isEditing,     setIsEditing]     = useState(false)
  const [editTitle,     setEditTitle]     = useState(goal.title)
  const [editDesc,      setEditDesc]      = useState(goal.description ?? '')
  const [editTimeframe, setEditTimeframe] = useState(goal.timeframe)
  const [editValueTag,  setEditValueTag]  = useState(goal.value_tag)
  const [editDate,      setEditDate]      = useState(goal.target_date ?? '')
  const [saving,        setSaving]        = useState(false)

  const [newKR,         setNewKR]         = useState('')
  const [addingKR,      setAddingKR]      = useState(false)
  const [editingKRId,   setEditingKRId]   = useState<string | null>(null)
  const [editKRTitle,   setEditKRTitle]   = useState('')

  const [localProgress, setLocalProgress] = useState(goal.progress)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLocalProgress(goal.progress) }, [goal.progress])

  const editDateRef = useRef<HTMLInputElement>(null)

  const tag    = VALUE_TAG_MAP[goal.value_tag] ?? VALUE_TAG_MAP.other
  const krs    = goal.key_results
  const hasKRs = krs.length > 0
  const krDone = krs.filter(k => k.is_done).length
  const displayProgress = hasKRs ? Math.round((krDone / krs.length) * 100) : localProgress

  function startEdit() {
    setEditTitle(goal.title)
    setEditDesc(goal.description ?? '')
    setEditTimeframe(goal.timeframe)
    setEditValueTag(goal.value_tag)
    setEditDate(goal.target_date ?? '')
    setAddingKR(false)
    setEditingKRId(null)
    setIsEditing(true)
  }

  async function handleSave() {
    if (!editTitle.trim()) return
    setSaving(true)
    const ok = await onUpdate(goal.id, {
      title:       editTitle.trim(),
      description: editDesc.trim() || null,
      timeframe:   editTimeframe,
      value_tag:   editValueTag,
      target_date: editDate || null,
    })
    setSaving(false)
    if (ok) setIsEditing(false)
  }

  function submitKR(e: React.FormEvent) {
    e.preventDefault()
    if (!newKR.trim()) return
    onAddKR(goal.id, newKR.trim())
    setNewKR('')
    setAddingKR(false)
  }

  function startEditKR(kr: KeyResult) {
    setEditingKRId(kr.id)
    setEditKRTitle(kr.title)
  }

  async function saveKR() {
    if (!editingKRId || !editKRTitle.trim()) { setEditingKRId(null); return }
    const ok = await onUpdateKR(editingKRId, editKRTitle.trim())
    if (ok) setEditingKRId(null)
  }

  return (
    <div className={cn(
      'bg-white rounded-2xl p-4 border border-stone-100 group',
      goal.is_done && 'opacity-60',
    )}>
      <div className="flex items-start gap-3">
        {/* Done toggle — hidden while editing */}
        {!isEditing && (
          <button
            onClick={() => onToggleDone(goal)}
            disabled={loading === goal.id}
            className="shrink-0 mt-0.5 text-stone-300 hover:text-green-500 transition-colors"
          >
            {goal.is_done
              ? <CheckCircle2 size={20} className="text-green-500" />
              : <Circle size={20} />
            }
          </button>
        )}

        <div className="flex-1 min-w-0">
          {isEditing ? (
            /* ── EDIT FORM ── */
            <div className="space-y-2.5">
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-800 focus:outline-none focus:border-stone-500"
              />
              <input
                type="text"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Mô tả thêm (tuỳ chọn)"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-violet-400"
              />
              <div className="flex gap-2">
                <select
                  value={editTimeframe}
                  onChange={e => setEditTimeframe(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-violet-400 bg-white"
                >
                  <option value="year">Năm</option>
                  <option value="quarter">Quý</option>
                  <option value="month">Tháng</option>
                </select>
                <select
                  value={editValueTag}
                  onChange={e => setEditValueTag(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-violet-400 bg-white"
                >
                  {VALUE_TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={() => editDateRef.current?.showPicker()}
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                <Calendar size={13} className={editDate ? 'text-blue-400' : 'text-stone-300'} />
                {editDate
                  ? <span className="text-stone-600">{editDate.replace(/-/g, '/')}</span>
                  : <span className="text-stone-400">Ngày mục tiêu</span>
                }
                {editDate && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setEditDate('') }}
                    className="text-stone-300 hover:text-stone-500"
                  >
                    <X size={12} />
                  </button>
                )}
              </button>
              <input ref={editDateRef} type="date" value={editDate}
                onChange={e => setEditDate(e.target.value)} className="sr-only" />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim()}
                  className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          ) : (
            /* ── VIEW MODE ── */
            <>
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <p className={cn(
                  'text-sm font-medium text-stone-800 leading-snug',
                  goal.is_done && 'line-through text-stone-400',
                )}>
                  {goal.title}
                </p>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={startEdit}
                    disabled={loading === goal.id}
                    className="p-1 hover:bg-stone-100 rounded-lg text-stone-300 hover:text-stone-600 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(goal.id)}
                    disabled={loading === goal.id}
                    className="p-1 hover:bg-red-50 rounded-lg text-stone-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {goal.description && (
                <p className="text-xs text-stone-400 mt-0.5">{goal.description}</p>
              )}

              {/* Tags row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', tag.color)}>
                  {tag.icon} {tag.label}
                </span>
                {goal.target_date && (
                  <span className="text-xs text-stone-400">📅 {goal.target_date.replace(/-/g, '/')}</span>
                )}
                {hasKRs && (
                  <span className="text-xs text-stone-400">{krDone}/{krs.length} KR</span>
                )}
                {goal.task_count > 0 && (
                  <span className="text-xs text-stone-400">📋 {goal.task_count}</span>
                )}
                {goal.habit_count > 0 && (
                  <span className="text-xs text-stone-400">⚡ {goal.habit_count}</span>
                )}
              </div>

              {/* Key Results */}
              {(hasKRs || !goal.is_done) && (
                <div className="mt-3 space-y-1.5">
                  {krs.map(kr => (
                    <div key={kr.id} className="flex items-center gap-2 group/kr">
                      <button
                        onClick={() => onToggleKR(kr, goal.id, krs)}
                        className="shrink-0 text-stone-300 hover:text-green-500 transition-colors"
                      >
                        {kr.is_done
                          ? <CheckCircle2 size={15} className="text-green-500" />
                          : <Circle size={15} />
                        }
                      </button>

                      {editingKRId === kr.id ? (
                        <input
                          type="text"
                          value={editKRTitle}
                          onChange={e => setEditKRTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); saveKR() }
                            if (e.key === 'Escape') setEditingKRId(null)
                          }}
                          onBlur={saveKR}
                          autoFocus
                          className="flex-1 text-xs border-b border-stone-400 focus:outline-none bg-transparent py-0.5 text-stone-700"
                        />
                      ) : (
                        <span className={cn(
                          'flex-1 text-xs text-stone-600',
                          kr.is_done && 'line-through text-stone-400',
                        )}>
                          {kr.title}
                        </span>
                      )}

                      <div className="flex items-center gap-0.5 opacity-0 group-hover/kr:opacity-100 transition-all">
                        {editingKRId !== kr.id && (
                          <button
                            onClick={() => startEditKR(kr)}
                            className="p-0.5 hover:bg-stone-100 rounded text-stone-300 hover:text-stone-600 transition-colors"
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteKR(kr.id, goal.id, krs.filter(k => k.id !== kr.id))}
                          className="p-0.5 hover:bg-red-50 rounded text-stone-300 hover:text-red-400 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {!hasKRs && !goal.is_done && (
                    <p className="text-[11px] text-stone-300 mb-0.5">
                      Thêm kết quả đo lường để tự động tính tiến độ
                    </p>
                  )}

                  {!goal.is_done && (
                    addingKR ? (
                      <form onSubmit={submitKR} className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={newKR}
                          onChange={e => setNewKR(e.target.value)}
                          placeholder="Kết quả then chốt..."
                          autoFocus
                          className="flex-1 text-xs border-b border-stone-300 focus:outline-none bg-transparent py-0.5 text-stone-700 placeholder:text-stone-300"
                        />
                        <button type="submit" className="text-green-600 hover:text-green-700"><Check size={13} /></button>
                        <button type="button" onClick={() => setAddingKR(false)} className="text-stone-300 hover:text-stone-500"><X size={13} /></button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setAddingKR(true)}
                        className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 border border-dashed border-stone-200 hover:border-stone-400 rounded-lg px-2 py-1 transition-colors mt-1 w-full justify-center"
                      >
                        <Plus size={12} /> Thêm kết quả then chốt
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Progress */}
              {!goal.is_done && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Tiến độ</span>
                    <span>{displayProgress}%</span>
                  </div>
                  {hasKRs ? (
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-700 rounded-full transition-all" style={{ width: `${displayProgress}%` }} />
                    </div>
                  ) : (
                    <input
                      type="range" min={0} max={100} step={5}
                      value={localProgress}
                      onChange={e => setLocalProgress(Number(e.target.value))}
                      onPointerUp={e => onUpdateProgress(goal.id, Number((e.target as HTMLInputElement).value))}
                      className="w-full h-1.5 accent-stone-700 cursor-pointer"
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
