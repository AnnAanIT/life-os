'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { localDateStr } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, ChevronRight, Star } from 'lucide-react'

interface Habit { id: string; name: string; icon: string; doneToday: boolean }
interface Goal  { id: string; title: string }

interface Props {
  userId:           string
  userName:         string
  habits:           Habit[]
  todayScore:       number | null
  todayNote:        string | null
  today:            string
  goals:            Goal[]
  purposeStatement: string | null
  annualTheme:      string | null
}

const SCORE_EMOJI: Record<number, string> = {
  1:'😞',2:'😕',3:'😐',4:'🙂',5:'😊',6:'😄',7:'😁',8:'🤩',9:'✨',10:'🌟',
}

function getScoreColor(n: number) {
  if (n <= 3) return { active: 'bg-red-500 text-white',    idle: 'bg-red-50 text-red-300 hover:bg-red-100' }
  if (n <= 5) return { active: 'bg-amber-500 text-white',  idle: 'bg-amber-50 text-amber-300 hover:bg-amber-100' }
  if (n <= 7) return { active: 'bg-lime-500 text-white',   idle: 'bg-lime-50 text-lime-400 hover:bg-lime-100' }
  return             { active: 'bg-emerald-500 text-white',idle: 'bg-emerald-50 text-emerald-300 hover:bg-emerald-100' }
}

const ALIGNMENT_OPTIONS = [
  { value: 'no',      label: 'Chưa hẳn',  emoji: '😔', border: 'border-stone-200 hover:bg-stone-50',      text: 'text-stone-600' },
  { value: 'partial', label: 'Một phần',  emoji: '🙂', border: 'border-amber-100 hover:bg-amber-50',      text: 'text-amber-700' },
  { value: 'yes',     label: 'Có, rõ ràng', emoji: '✨', border: 'border-emerald-100 hover:bg-emerald-50', text: 'text-emerald-700' },
]

const DONE_MESSAGE: Record<string, string> = {
  yes:     'Hôm nay bạn đã sống đúng với bản thân.',
  partial: 'Ngày mai sẽ còn nhiều cơ hội hơn.',
  no:      'Nhận ra là bước đầu tiên. Ngày mai thử lại.',
}

export function EveningFlow({
  userId, userName, habits, todayScore, todayNote, today,
  goals, purposeStatement, annualTheme,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Step 1 — habits
  const [habitDone, setHabitDone] = useState<Record<string, boolean>>(
    Object.fromEntries(habits.map(h => [h.id, h.doneToday]))
  )

  // Step 2 — happiness
  const [score,       setScore]       = useState<number | null>(todayScore)
  const [note,        setNote]        = useState(todayNote ?? '')
  const [savingScore, setSavingScore] = useState(false)

  // Step 3 — purpose alignment (no DB save — reflection moment only)
  const [alignment, setAlignment] = useState<string | null>(null)
  const hasPurpose = !!(purposeStatement || annualTheme)

  const hasHabitsStep = habits.length > 0
  const totalSteps    = (hasHabitsStep ? 1 : 0) + 1 + (hasPurpose ? 1 : 0) + 1
  const happinessNum  = hasHabitsStep ? 2 : 1
  const purposeNum    = happinessNum + 1

  // Step 4 — tomorrow MIT
  const [tomorrowMIT,  setTomorrowMIT]  = useState('')
  const [tomorrowGoal, setTomorrowGoal] = useState('')
  const [savingMIT,    setSavingMIT]    = useState(false)

  async function toggleHabit(habitId: string) {
    const supabase = createClient()
    const nowDone = !habitDone[habitId]
    setHabitDone(prev => ({ ...prev, [habitId]: nowDone }))
    if (nowDone) {
      const { error } = await supabase.from('habit_logs').upsert(
        { user_id: userId, habit_id: habitId, date: today },
        { onConflict: 'user_id,habit_id,date' },
      )
      if (error) setHabitDone(prev => ({ ...prev, [habitId]: !nowDone }))
    } else {
      const { error } = await supabase.from('habit_logs').delete()
        .eq('user_id', userId).eq('habit_id', habitId).eq('date', today)
      if (error) setHabitDone(prev => ({ ...prev, [habitId]: !nowDone }))
    }
  }

  async function saveHappiness(newScore: number) {
    setScore(newScore)
    setSavingScore(true)
    const supabase = createClient()
    await supabase.from('happiness_scores').upsert(
      { user_id: userId, score: newScore, note: note || null, date: today },
      { onConflict: 'user_id,date' },
    )
    setSavingScore(false)
  }

  async function saveNote() {
    if (!score) return
    const supabase = createClient()
    await supabase.from('happiness_scores').upsert(
      { user_id: userId, score, note: note || null, date: today },
      { onConflict: 'user_id,date' },
    )
  }

  async function saveTomorrow() {
    if (!tomorrowMIT.trim()) { setStep(5); return }
    setSavingMIT(true)
    const supabase = createClient()
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    await supabase.from('tasks').insert({
      user_id:  userId,
      title:    tomorrowMIT.trim(),
      is_mit:   true,
      due_date: localDateStr(tomorrow),
      goal_id:  tomorrowGoal || null,
    })
    setSavingMIT(false)
    setStep(5)
  }

  // ─── Step 0: Welcome ───────────────────────────────────────────────────
  if (step === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-6">
      <div className="space-y-2">
        <p className="text-3xl">🌙</p>
        <h1 className="text-2xl font-semibold text-stone-800">Chào buổi tối, {userName}.</h1>
        <p className="text-stone-400 text-sm leading-relaxed">
          Dành 2 phút để khép lại ngày hôm nay.<br />Không cần hoàn hảo — chỉ cần thật thôi.
        </p>
      </div>
      <button
        onClick={() => setStep(habits.length > 0 ? 1 : 2)}
        className="flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-2xl text-sm font-medium hover:bg-stone-700 transition-colors"
      >
        Bắt đầu <ChevronRight size={16} />
      </button>
    </div>
  )

  // ─── Step 1: Habits ────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-0.5">Bước 1 / {totalSteps}</p>
        <h2 className="text-xl font-semibold text-stone-800">Thói quen hôm nay</h2>
        <p className="text-stone-400 text-sm mt-0.5">Tick những thứ bạn đã làm.</p>
      </div>

      <div className="space-y-2">
        {habits.map(h => (
          <button
            key={h.id}
            onClick={() => toggleHabit(h.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
              habitDone[h.id]
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'bg-white border-stone-100 text-stone-600 hover:border-stone-300',
            )}
          >
            {habitDone[h.id]
              ? <CheckCircle2 size={18} className="text-white shrink-0" />
              : <Circle size={18} className="text-stone-300 shrink-0" />
            }
            <span className="text-sm">{h.icon} {h.name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setStep(2)}
        className="w-full flex items-center justify-center gap-2 bg-stone-800 text-white py-3 rounded-2xl text-sm font-medium hover:bg-stone-700 transition-colors"
      >
        Tiếp theo <ChevronRight size={16} />
      </button>
    </div>
  )

  // ─── Step 2: Happiness + Note ──────────────────────────────────────────
  if (step === 2) return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-0.5">Bước {happinessNum} / {totalSteps}</p>
        <h2 className="text-xl font-semibold text-stone-800">Hôm nay thế nào?</h2>
        <p className="text-stone-400 text-sm mt-0.5">Không có câu trả lời đúng hay sai.</p>
      </div>

      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const c = getScoreColor(n)
          return (
            <button
              key={n}
              disabled={savingScore}
              onClick={() => saveHappiness(n)}
              className={cn(
                'h-10 rounded-xl text-sm font-bold transition-all active:scale-90',
                score === n ? `${c.active} scale-110 shadow-sm` : c.idle,
              )}
            >
              {n}
            </button>
          )
        })}
      </div>

      {score && <p className="text-center text-2xl">{SCORE_EMOJI[score]}</p>}

      <div>
        <p className="text-xs text-stone-400 mb-1.5">Điều tốt nhất hôm nay là gì? <span className="text-stone-300">(tùy chọn)</span></p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          onBlur={saveNote}
          rows={2}
          placeholder="Dù nhỏ thôi cũng được..."
          className="w-full text-sm text-stone-700 border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-400 resize-none placeholder:text-stone-300 transition-colors"
        />
      </div>

      <button
        onClick={() => setStep(hasPurpose ? 3 : 4)}
        disabled={!score}
        className="w-full flex items-center justify-center gap-2 bg-stone-800 text-white py-3 rounded-2xl text-sm font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors"
      >
        Tiếp theo <ChevronRight size={16} />
      </button>
    </div>
  )

  // ─── Step 3: Purpose Alignment ────────────────────────────────────────
  if (step === 3) return (
    <div className="space-y-8 py-4">
      <p className="text-xs text-stone-400 uppercase tracking-wide font-medium">Bước {purposeNum} / {totalSteps}</p>
      {annualTheme && (
        <div className="inline-flex items-center gap-1.5 bg-stone-100 rounded-full px-3 py-1">
          <span className="text-xs text-stone-400">Năm nay ·</span>
          <span className="text-xs font-medium text-stone-700">{annualTheme}</span>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-800 leading-snug">
          Hôm nay bạn sống đúng<br />với bản thân chưa?
        </h2>
        {purposeStatement && (
          <p className="text-sm text-stone-400 italic leading-relaxed">&ldquo;{purposeStatement}&rdquo;</p>
        )}
      </div>

      <div className="space-y-2">
        {ALIGNMENT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setAlignment(opt.value); setStep(4) }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white text-left transition-all active:scale-[0.98]',
              opt.border,
            )}
          >
            <span className="text-xl leading-none">{opt.emoji}</span>
            <span className={cn('font-medium text-sm', opt.text)}>{opt.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => setStep(4)}
        className="text-xs text-stone-300 hover:text-stone-500 w-full text-center transition-colors"
      >
        Bỏ qua
      </button>
    </div>
  )

  // ─── Step 4: Tomorrow MIT ──────────────────────────────────────────────
  if (step === 4) return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-0.5">Bước {totalSteps} / {totalSteps}</p>
        <h2 className="text-xl font-semibold text-stone-800">Ngày mai</h2>
        <p className="text-stone-400 text-sm mt-0.5 italic">
          &ldquo;Nếu ngày mai chỉ làm được 1 việc, đó là gì?&rdquo;
        </p>
      </div>

      <input
        autoFocus
        value={tomorrowMIT}
        onChange={e => setTomorrowMIT(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && saveTomorrow()}
        placeholder="Việc quan trọng nhất ngày mai..."
        className="w-full text-sm text-stone-800 border border-stone-200 rounded-xl px-3 py-3 outline-none focus:border-violet-400 transition-colors"
      />

      {goals.length > 0 && tomorrowMIT && (
        <div>
          <p className="text-[11px] text-stone-400 mb-1.5">Gắn với mục tiêu?</p>
          <select
            value={tomorrowGoal}
            onChange={e => setTomorrowGoal(e.target.value)}
            className="w-full text-xs text-stone-600 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 bg-white"
          >
            <option value="">Không gắn</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setStep(5)}
          className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm text-stone-400 hover:border-stone-300 transition-colors"
        >
          Bỏ qua
        </button>
        <button
          onClick={saveTomorrow}
          disabled={savingMIT}
          className="flex-1 flex items-center justify-center gap-1.5 bg-stone-800 text-white py-3 rounded-2xl text-sm font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors"
        >
          <Star size={14} className="fill-white" />
          {savingMIT ? 'Đang lưu...' : 'Lưu MIT'}
        </button>
      </div>
    </div>
  )

  // ─── Step 5: Done ──────────────────────────────────────────────────────
  const doneCount = Object.values(habitDone).filter(Boolean).length
  const alignmentMessage = alignment ? DONE_MESSAGE[alignment] : null

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 space-y-6">
      <div className="space-y-3">
        <p className="text-4xl">✨</p>
        <h1 className="text-2xl font-semibold text-stone-800">Ngày hôm nay đã khép lại.</h1>
        <p className="text-stone-400 text-sm leading-relaxed">
          {doneCount > 0 && `${doneCount} thói quen hoàn thành. `}
          {score && `Hạnh phúc: ${score}/10. `}
        </p>
        {alignmentMessage && (
          <p className="text-sm text-stone-500 italic">{alignmentMessage}</p>
        )}
      </div>
      <button
        onClick={() => router.push('/dashboard')}
        className="text-sm text-stone-500 hover:text-stone-800 underline underline-offset-4 transition-colors"
      >
        Về Dashboard
      </button>
    </div>
  )
}
