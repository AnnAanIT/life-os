'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

const WORKOUT_TYPES = [
  { value: 'gym', label: '🏋️ Gym' },
  { value: 'run', label: '🏃 Chạy bộ' },
  { value: 'yoga', label: '🧘 Yoga' },
  { value: 'walk', label: '🚶 Đi bộ' },
  { value: 'swim', label: '🏊 Bơi lội' },
  { value: 'cycle', label: '🚴 Đạp xe' },
  { value: 'other', label: '⚡ Khác' },
]

interface Props {
  userId: string
}

export function WorkoutForm({ userId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('gym')
  const [duration, setDuration] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const mins = parseInt(duration)
    if (!mins || mins <= 0) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('workouts').insert({
      user_id: userId,
      type,
      duration_minutes: mins,
      note: note.trim() || null,
      date: new Date().toISOString().split('T')[0],
    })
    setSaving(false)
    setDuration('')
    setNote('')
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-stone-100 text-stone-400 hover:text-stone-600 hover:border-stone-200 transition-colors text-sm"
      >
        <Plus size={16} /> Ghi bài tập hôm nay
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {WORKOUT_TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`py-2 px-2 rounded-xl text-xs font-medium transition-colors ${
              type === t.value ? 'bg-violet-600 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Thời gian"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400 pr-10"
            required autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">phút</span>
        </div>
        <input
          type="text"
          placeholder="Ghi chú (tuỳ chọn)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400"
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500">Huỷ</button>
        <button type="submit" disabled={saving || !duration} className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform">
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  )
}
