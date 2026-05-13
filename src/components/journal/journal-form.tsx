'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JournalEntry {
  gratitude: string | null
  morning_focus: string | null
  morning_need: string | null
  evening_win: string | null
  evening_lesson: string | null
  mood: number | null
}

interface Props {
  userId: string
  today: string
  existing: JournalEntry | null
  activePeriod?: 'morning' | 'evening'
}

const MOODS = [
  { value: 1, emoji: '😢', label: 'Tệ' },
  { value: 2, emoji: '😕', label: 'Không ổn' },
  { value: 3, emoji: '😐', label: 'Bình thường' },
  { value: 4, emoji: '😊', label: 'Tốt' },
  { value: 5, emoji: '😄', label: 'Tuyệt vời' },
]

export function JournalForm({ userId, today, existing, activePeriod }: Props) {
  const router = useRouter()
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? '')
  const [morningFocus, setMorningFocus] = useState(existing?.morning_focus ?? '')
  const [morningNeed, setMorningNeed] = useState(existing?.morning_need ?? '')
  const [eveningWin, setEveningWin] = useState(existing?.evening_win ?? '')
  const [eveningLesson, setEveningLesson] = useState(existing?.evening_lesson ?? '')
  const [mood, setMood] = useState(existing?.mood ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('journal_entries').upsert(
      {
        user_id: userId,
        date: today,
        gratitude: gratitude.trim() || null,
        morning_focus: morningFocus.trim() || null,
        morning_need: morningNeed.trim() || null,
        evening_win: eveningWin.trim() || null,
        evening_lesson: eveningLesson.trim() || null,
        mood: mood || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Morning */}
      <div className={cn(
        'bg-white rounded-2xl p-4 border space-y-4 transition-colors',
        activePeriod === 'morning' ? 'border-amber-200' : 'border-stone-100',
      )}>
        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">☀️ Buổi sáng</p>
        <Field
          label="Hôm nay tôi biết ơn điều gì?"
          value={gratitude}
          onChange={setGratitude}
          placeholder="Điều nhỏ nhất cũng được..."
          multiline
        />
        <Field
          label="Việc quan trọng nhất hôm nay?"
          value={morningFocus}
          onChange={setMorningFocus}
          placeholder="1 việc duy nhất nếu chỉ làm được 1..."
        />
        <Field
          label="Tôi cần gì để ngày hôm nay tốt?"
          value={morningNeed}
          onChange={setMorningNeed}
          placeholder="Năng lượng, tập trung, nghỉ ngơi..."
        />
      </div>

      {/* Evening */}
      <div className={cn(
        'bg-white rounded-2xl p-4 border space-y-4 transition-colors',
        activePeriod === 'evening' ? 'border-indigo-200' : 'border-stone-100',
      )}>
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">🌙 Buổi tối</p>
        <Field
          label="Điều tốt nhất hôm nay là gì?"
          value={eveningWin}
          onChange={setEveningWin}
          placeholder="Dù nhỏ đến đâu cũng được..."
          multiline
        />
        <Field
          label="Hôm nay tôi học được gì?"
          value={eveningLesson}
          onChange={setEveningLesson}
          placeholder="Bài học, insight, nhận ra điều gì..."
        />

        {/* Mood */}
        <div>
          <p className="text-xs text-stone-400 mb-2">Tâm trạng hôm nay</p>
          <div className="flex justify-between">
            {MOODS.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                title={m.label}
                className={cn(
                  'flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all',
                  mood === m.value ? 'bg-stone-100 scale-110' : 'hover:bg-stone-50'
                )}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] text-stone-400">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
      >
        {saved ? <><Check size={16} /> Đã lưu!</> : saving ? 'Đang lưu...' : 'Lưu nhật ký'}
      </button>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, multiline }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-stone-500 mb-1.5">{label}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-violet-400 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-violet-400"
        />
      )}
    </div>
  )
}
