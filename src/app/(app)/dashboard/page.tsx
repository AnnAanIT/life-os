import { requireUser } from '@/lib/auth'
import { AICaptureBar } from '@/components/dashboard/ai-capture-bar'
import { DashboardGreeting } from '@/components/dashboard/greeting'
import { MITPreview } from '@/components/dashboard/mit-preview'
import { HabitsPreview } from '@/components/dashboard/habits-preview'
import { EnergyCheckIn } from '@/components/dashboard/energy-check-in'
import { EveningCTA } from '@/components/dashboard/evening-cta'
import { ContextZone } from '@/components/dashboard/context-zone'
import { localDateStr } from '@/lib/format'

export default async function DashboardPage() {
  const { user, supabase } = await requireUser()

  const today = localDateStr()

  const [
    { data: profile },
    { data: todayScore },
    { data: todayEnergyLog },
    { data: todaySleepLog },
    { data: todayMovementLog },
    { data: inboxItems },
    { data: mitTasks },
    { data: habits },
    { data: todayHabitLogs },
    { data: activeGoals },
    { data: goalKRs },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, annual_theme, purpose_statement').eq('id', user.id).single(),
    supabase.from('happiness_scores').select('score, note').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('energy_logs').select('score, factors').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('sleep_logs').select('duration_hours, quality').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('movement_logs').select('did_move, stress_level').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('inbox_items').select('id').eq('user_id', user.id).eq('is_processed', false),
    supabase.from('tasks').select('id, title, is_done').eq('user_id', user.id).eq('is_mit', true).eq('is_done', false).limit(3),
    supabase.from('habits').select('id, name, icon').eq('user_id', user.id).eq('is_active', true)
      .lte('start_date', today)
      .order('sort_order', { ascending: true }).order('created_at', { ascending: true }).limit(6),
    supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('date', today),
    supabase.from('goals').select('id, title, value_tag, progress')
      .eq('user_id', user.id).eq('is_done', false)
      .order('progress', { ascending: true }).limit(3),
    supabase.from('key_results').select('goal_id, is_done').eq('user_id', user.id),
  ])

  const displayName      = profile?.display_name      ?? user.email?.split('@')[0] ?? 'bạn'
  const annualTheme      = profile?.annual_theme
  const todayDoneHabitIds = new Set((todayHabitLogs ?? []).map(l => l.habit_id))
  const habitsWithStatus  = (habits ?? []).map(h => ({ ...h, doneToday: todayDoneHabitIds.has(h.id) }))
  const inboxCount        = inboxItems?.length ?? 0

  const habitsDone    = habitsWithStatus.filter(h => h.doneToday).length
  const habitsTotal   = habitsWithStatus.length
  const mitRemaining  = mitTasks?.length ?? 0

  const krByGoal: Record<string, { total: number; done: number }> = {}
  for (const kr of goalKRs ?? []) {
    if (!krByGoal[kr.goal_id]) krByGoal[kr.goal_id] = { total: 0, done: 0 }
    krByGoal[kr.goal_id].total++
    if (kr.is_done) krByGoal[kr.goal_id].done++
  }
  const goalsForDashboard = (activeGoals ?? []).map(g => ({
    ...g,
    kr_total: krByGoal[g.id]?.total ?? 0,
    kr_done:  krByGoal[g.id]?.done  ?? 0,
  }))

  return (
    <div className="px-4 pt-10 pb-6 lg:px-8 lg:pt-8 lg:pb-10">
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

        {/* ── LEFT COL: ZONE 1 + ZONE 2 ── */}
        <div className="space-y-3">
          <DashboardGreeting
            name={displayName}
            annualTheme={annualTheme}
            energyScore={todayEnergyLog?.score ?? null}
            habitsDone={habitsDone}
            habitsTotal={habitsTotal}
            mitRemaining={mitRemaining}
            happinessScore={todayScore?.score ?? null}
          />
          <EnergyCheckIn userId={user.id} todayLog={todayEnergyLog} />
          <MITPreview tasks={mitTasks ?? []} userId={user.id} />
          {habitsWithStatus.length > 0 && (
            <HabitsPreview habits={habitsWithStatus} userId={user.id} today={today} />
          )}
          <AICaptureBar userId={user.id} />
          <EveningCTA isDone={!!(todayScore?.note)} />
        </div>

        {/* ── RIGHT COL: ZONE 3 ── */}
        <div className="space-y-3 mt-3 lg:mt-0">
          <ContextZone
            userId={user.id}
            todayScore={todayScore}
            energyLog={todayEnergyLog}
            sleepLog={todaySleepLog}
            movementLog={todayMovementLog}
            goals={goalsForDashboard}
            inboxCount={inboxCount}
          />
        </div>

      </div>
    </div>
  )
}
