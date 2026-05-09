import { requireUser } from '@/lib/auth'
import { JournalForm } from '@/components/journal/journal-form'
import { localDateStr, daysAgoStr } from '@/lib/format'

const MOOD_EMOJI: Record<number, string> = { 1: '😢', 2: '😕', 3: '😐', 4: '😊', 5: '😄' }
const MOOD_BG:    Record<number, string> = {
  1: 'bg-red-100 text-red-500',
  2: 'bg-orange-100 text-orange-500',
  3: 'bg-stone-100 text-stone-500',
  4: 'bg-amber-100 text-amber-600',
  5: 'bg-emerald-100 text-emerald-600',
}
const DAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default async function JournalPage() {
  const { user, supabase } = await requireUser()

  const today = localDateStr()
  const sevenDaysAgo = daysAgoStr(6)

  const [{ data: todayEntry }, { data: recentEntries }] = await Promise.all([
    supabase.from('journal_entries')
      .select('gratitude, morning_focus, morning_need, evening_win, evening_lesson, mood')
      .eq('user_id', user.id).eq('date', today).single(),
    supabase.from('journal_entries')
      .select('date, mood, evening_win')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: true }),
  ])

  const todayDateLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  // Build 7-day strip (today + 6 days back)
  const moodByDate: Record<string, number | null> = {}
  for (const e of recentEntries ?? []) moodByDate[e.date] = e.mood
  moodByDate[today] = todayEntry?.mood ?? null

  const strip: { date: string; dayLabel: string; mood: number | null; isToday: boolean }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = localDateStr(d)
    strip.push({ date: dateStr, dayLabel: DAY_LABEL[d.getDay()], mood: moodByDate[dateStr] ?? null, isToday: i === 0 })
  }

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Nhật ký</h1>
        <p className="text-stone-400 text-sm capitalize">{todayDateLabel}</p>
      </div>

      {/* 7-day mood strip */}
      <div className="bg-white rounded-2xl border border-stone-100 px-4 py-3">
        <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-2.5">Tâm trạng 7 ngày</p>
        <div className="flex justify-between">
          {strip.map(day => (
            <div key={day.date} className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                day.mood ? MOOD_BG[day.mood] : day.isToday ? 'bg-violet-600' : 'bg-stone-50'
              } ${day.isToday && !day.mood ? 'ring-2 ring-stone-300' : ''}`}>
                {day.mood ? MOOD_EMOJI[day.mood] : day.isToday ? '·' : ''}
              </div>
              <span className={`text-[9px] font-medium ${day.isToday ? 'text-stone-700' : 'text-stone-300'}`}>
                {day.dayLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      <JournalForm userId={user.id} today={today} existing={todayEntry ?? null} />
    </div>
  )
}
