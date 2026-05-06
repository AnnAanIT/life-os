'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, ChevronDown, Calendar } from 'lucide-react'

const VALUE_TAGS = [
  { value: 'finance',       label: 'Tài chính', icon: '💰' },
  { value: 'health',        label: 'Sức khỏe',  icon: '💪' },
  { value: 'learning',      label: 'Học tập',   icon: '📚' },
  { value: 'work',          label: 'Công việc', icon: '💼' },
  { value: 'relationships', label: 'Quan hệ',   icon: '❤️' },
  { value: 'spirit',        label: 'Tinh thần', icon: '🧘' },
  { value: 'other',         label: 'Khác',      icon: '🎯' },
]

const TIMEFRAMES = [
  { value: 'year',    label: 'Năm' },
  { value: 'quarter', label: 'Quý' },
  { value: 'month',   label: 'Tháng' },
]

interface Props { userId: string }

export function AddGoalForm({ userId }: Props) {
  const router = useRouter()
  const [open,        setOpen]        = useState(false)
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [timeframe,   setTimeframe]   = useState('year')
  const [valueTag,    setValueTag]    = useState('other')
  const [targetDate,  setTargetDate]  = useState('')
  const [saving,      setSaving]      = useState(false)
  const dateRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('goals').insert({
      user_id:     userId,
      title:       title.trim(),
      description: description.trim() || null,
      timeframe,
      value_tag:   valueTag,
      target_date: targetDate || null,
    })
    setSaving(false)
    if (error) return
    setTitle('')
    setDescription('')
    setTimeframe('year')
    setValueTag('other')
    setTargetDate('')
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-stone-100 text-stone-400 hover:text-stone-600 hover:border-stone-200 transition-colors text-sm"
      >
        <Plus size={16} /> Thêm mục tiêu mới
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
      <input
        type="text"
        placeholder="Mục tiêu của bạn là gì?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400"
        autoFocus
        required
      />
      <input
        type="text"
        placeholder="Mô tả thêm (tuỳ chọn)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400"
      />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
            className="w-full appearance-none px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-violet-400 bg-white pr-8"
          >
            {TIMEFRAMES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <select
            value={valueTag}
            onChange={e => setValueTag(e.target.value)}
            className="w-full appearance-none px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-violet-400 bg-white pr-8"
          >
            {VALUE_TAGS.map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        </div>
      </div>

      {/* Target date */}
      <button
        type="button"
        onClick={() => dateRef.current?.showPicker()}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
      >
        <Calendar size={14} className={targetDate ? 'text-blue-400' : 'text-stone-300'} />
        {targetDate
          ? <span className="text-stone-600">{targetDate.replace(/-/g, '/')}</span>
          : <span className="text-stone-400">Ngày mục tiêu (tuỳ chọn)</span>
        }
      </button>
      <input
        ref={dateRef}
        type="date"
        value={targetDate}
        onChange={e => setTargetDate(e.target.value)}
        className="sr-only"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
        >
          {saving ? 'Đang lưu...' : 'Thêm'}
        </button>
      </div>
    </form>
  )
}
