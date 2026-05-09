import { requireUser } from '@/lib/auth'
import { HabitsToday } from '@/components/habits/habits-today'
import { AddHabitForm } from '@/components/habits/add-habit-form'
import { localDateStr, daysAgoStr } from '@/lib/format'

function computeStreak(logs: string[], today: string): number {
  const logSet = new Set(logs)
  let streak = 0
  const d = new Date(today + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  while (true) {
    const dateStr = localDateStr(d)
    if (logSet.has(dateStr)) { streak++; d.setDate(d.getDate() - 1) }
    else break
  }
  if (logSet.has(today)) streak++
  return streak
}

export default async function HabitsPage() {
  const { user, supabase } = await requireUser()

  const today     = localDateStr()
  const thirtyAgo = daysAgoStr(365)

  const [{ data: habits }, { data: recentLogs }, { data: activeGoals }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, icon, created_at, start_date, challenge_days')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('habit_id, date')
      .eq('user_id', user.id)
      .gte('date', thirtyAgo),
    supabase
      .from('goals')
      .select('id, title, timeframe')
      .eq('user_id', user.id)
      .eq('is_done', false)
      .order('created_at', { ascending: true }),
  ])

  const logsByHabit: Record<string, string[]> = {}
  for (const log of recentLogs ?? []) {
    if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = []
    logsByHabit[log.habit_id].push(log.date)
  }

  const habitsWithData = (habits ?? []).map(h => {
    const logs = logsByHabit[h.id] ?? []
    return {
      ...h,
      streak:        computeStreak(logs, today),
      doneToday:     logs.includes(today),
      logs,
      startDate:     (h.start_date ?? h.created_at.split('T')[0]) as string,
      challengeDays: h.challenge_days as number | null,
    }
  })

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Thói quen</h1>
        <p className="text-stone-400 text-sm">Xây dựng từng ngày một</p>
      </div>
      <AddHabitForm userId={user.id} goals={activeGoals ?? []} />
      <HabitsToday habits={habitsWithData} userId={user.id} today={today} />
    </div>
  )
}
