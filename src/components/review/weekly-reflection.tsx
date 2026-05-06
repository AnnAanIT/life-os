'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  userId:      string
  weekStart:   string
  annualTheme: string | null
  existing:    {
    best_thing:    string | null
    carry_forward: string | null
    next_priority: string | null
    theme_moment:  string | null
  } | null
  stats: {
    avgHappiness: string | null
    habitRate:    number
    mitDone:      number
    mitTotal:     number
    avgEnergy:    string | null
    avgSleep:     string | null
  }
}

export function WeeklyReflection({ userId, weekStart, annualTheme, existing, stats }: Props) {
  const [answers, setAnswers] = useState({
    best_thing:    existing?.best_thing    ?? '',
    carry_forward: existing?.carry_forward ?? '',
    next_priority: existing?.next_priority ?? '',
    theme_moment:  existing?.theme_moment  ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const isDone = !!(
    existing?.best_thing ||
    existing?.carry_forward ||
    existing?.next_priority ||
    existing?.theme_moment
  )

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('weekly_reviews').upsert(
      {
        user_id:       userId,
        week_start:    weekStart,
        best_thing:    answers.best_thing    || null,
        carry_forward: answers.carry_forward || null,
        next_priority: answers.next_priority || null,
        theme_moment:  answers.theme_moment  || null,
      },
      { onConflict: 'user_id,week_start' },
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const baseQuestions = [
    {
      key:         'best_thing' as const,
      label:       'Điều tốt nhất tuần này là gì?',
      placeholder: 'Dù nhỏ thôi cũng được...',
    },
    {
      key:         'carry_forward' as const,
      label:       'Điều nào chưa làm được — chuyển sang tuần sau hay bỏ?',
      placeholder: 'Ghi lại để không quên...',
    },
    {
      key:         'next_priority' as const,
      label:       'Tuần tới: 1 ưu tiên lớn nhất là gì?',
      placeholder: 'Chỉ 1 thôi...',
    },
  ]

  return (
    <div className="space-y-3">
      {/* Auto-filled stats */}
      <div className="bg-stone-800 rounded-2xl p-4 text-white">
        <p className="text-xs text-stone-400 mb-3 uppercase tracking-wide font-medium">Tóm tắt tuần</p>
        <div className="grid grid-cols-3 gap-3">
          {stats.avgHappiness && (
            <div>
              <p className="text-[10px] text-stone-400">Hạnh phúc</p>
              <p className="text-lg font-bold">{stats.avgHappiness}<span className="text-xs font-normal text-stone-400">/10</span></p>
            </div>
          )}
          {stats.avgEnergy && (
            <div>
              <p className="text-[10px] text-stone-400">Năng lượng</p>
              <p className="text-lg font-bold">{stats.avgEnergy}<span className="text-xs font-normal text-stone-400">/5</span></p>
            </div>
          )}
          {stats.avgSleep && (
            <div>
              <p className="text-[10px] text-stone-400">Ngủ TB</p>
              <p className="text-lg font-bold">{stats.avgSleep}<span className="text-xs font-normal text-stone-400">h</span></p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-stone-400">Thói quen</p>
            <p className="text-lg font-bold">{stats.habitRate}<span className="text-xs font-normal text-stone-400">%</span></p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400">MIT xong</p>
            <p className="text-lg font-bold">{stats.mitDone}<span className="text-xs font-normal text-stone-400">/{stats.mitTotal}</span></p>
          </div>
        </div>
      </div>

      {/* Reflection questions */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-stone-700">Reflection tuần</p>
          {isDone && <CheckCircle2 size={15} className="text-emerald-500" />}
        </div>

        {baseQuestions.map(q => (
          <div key={q.key}>
            <p className="text-xs text-stone-500 mb-1.5 font-medium">{q.label}</p>
            <textarea
              value={answers[q.key]}
              onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
              rows={2}
              placeholder={q.placeholder}
              className="w-full text-sm text-stone-700 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 resize-none placeholder:text-stone-300 transition-colors"
            />
          </div>
        ))}

        {/* Annual Theme alignment — only shown when theme exists */}
        {annualTheme && (
          <div className="pt-1 border-t border-stone-50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs font-medium text-stone-500">✦</span>
              <p className="text-xs text-stone-500 font-medium">
                Tuần này có khoảnh khắc nào bạn sống đúng với &ldquo;{annualTheme}&rdquo; không?
              </p>
            </div>
            <textarea
              value={answers.theme_moment}
              onChange={e => setAnswers(prev => ({ ...prev, theme_moment: e.target.value }))}
              rows={2}
              placeholder="Kể 1 khoảnh khắc cụ thể..."
              className="w-full text-sm text-stone-700 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 resize-none placeholder:text-stone-300 transition-colors"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'w-full py-2.5 rounded-xl text-sm font-medium transition-all',
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40',
          )}
        >
          {saved ? '✓ Đã lưu' : saving ? 'Đang lưu...' : 'Lưu reflection'}
        </button>
      </div>
    </div>
  )
}
