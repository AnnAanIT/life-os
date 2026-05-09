import { requireUser } from '@/lib/auth'
import { localDateStr } from '@/lib/format'
import { EveningFlow } from '@/components/evening/evening-flow'

export default async function EveningPage() {
  const { user, supabase } = await requireUser()

  const today = localDateStr()

  const [
    { data: profile },
    { data: habits },
    { data: habitLogs },
    { data: todayScore },
    { data: activeGoals },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, purpose_statement, annual_theme').eq('id', user.id).single(),
    supabase.from('habits').select('id, name, icon')
      .eq('user_id', user.id).eq('is_active', true)
      .lte('start_date', today)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase.from('habit_logs').select('habit_id')
      .eq('user_id', user.id).eq('date', today),
    supabase.from('happiness_scores').select('score, note')
      .eq('user_id', user.id).eq('date', today).single(),
    supabase.from('goals').select('id, title')
      .eq('user_id', user.id).eq('is_done', false)
      .order('created_at', { ascending: true }),
  ])

  const userName = profile?.display_name ?? user.email?.split('@')[0] ?? 'bạn'
  const doneIds = new Set((habitLogs ?? []).map(l => l.habit_id))
  const habitsWithStatus = (habits ?? []).map(h => ({
    ...h,
    doneToday: doneIds.has(h.id),
  }))

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-8 max-w-lg mx-auto">
      <EveningFlow
        userId={user.id}
        userName={userName}
        habits={habitsWithStatus}
        todayScore={todayScore?.score ?? null}
        todayNote={todayScore?.note ?? null}
        today={today}
        goals={activeGoals ?? []}
        purposeStatement={profile?.purpose_statement ?? null}
        annualTheme={profile?.annual_theme ?? null}
      />
    </div>
  )
}
