import { requireUser } from '@/lib/auth'
import { getProfile } from '@/lib/get-profile'
import { AICaptureBar } from '@/components/dashboard/ai-capture-bar'
import { DashboardGreeting } from '@/components/dashboard/greeting'
import { MITPreview } from '@/components/dashboard/mit-preview'
import { HabitsPreview } from '@/components/dashboard/habits-preview'
import { EnergyCheckIn } from '@/components/dashboard/energy-check-in'
import { EveningCTA } from '@/components/dashboard/evening-cta'
import { ContextZone } from '@/components/dashboard/context-zone'
import { FinanceSummary } from '@/components/dashboard/finance-summary'
import { localDateStr, localMonthRange } from '@/lib/format'

const DEFAULT_MODULES = [
  'finance','investments','habits','tasks','goals',
  'health','learning','spirit','insights',
]

export default async function DashboardPage() {
  const { user, supabase } = await requireUser()
  const today = localDateStr()
  const { start: monthStart, end: monthEnd } = localMonthRange()

  const profile = await getProfile(user.id)

  const enabledModules: string[] = profile?.enabled_modules ?? DEFAULT_MODULES
  const m = new Set(enabledModules)

  const none = Promise.resolve({ data: null, error: null })

  const [
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
    { data: monthTransactions },
  ] = await Promise.all([
    supabase.from('happiness_scores').select('score, note').eq('user_id', user.id).eq('date', today).single(),
    m.has('health') ? supabase.from('energy_logs').select('score, factors').eq('user_id', user.id).eq('date', today).single() : none,
    m.has('health') ? supabase.from('sleep_logs').select('duration_hours, quality').eq('user_id', user.id).eq('date', today).single() : none,
    m.has('health') ? supabase.from('movement_logs').select('did_move, stress_level').eq('user_id', user.id).eq('date', today).single() : none,
    supabase.from('inbox_items').select('id').eq('user_id', user.id).eq('is_processed', false),
    m.has('tasks') ? supabase.from('tasks').select('id, title, is_done').eq('user_id', user.id).eq('is_mit', true).eq('is_done', false).limit(3) : none,
    m.has('habits') ? supabase.from('habits').select('id, name, icon').eq('user_id', user.id).eq('is_active', true).lte('start_date', today).order('sort_order', { ascending: true }).order('created_at', { ascending: true }).limit(6) : none,
    m.has('habits') ? supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('date', today) : none,
    m.has('goals') ? supabase.from('goals').select('id, title, value_tag, progress').eq('user_id', user.id).eq('is_done', false).order('progress', { ascending: true }).limit(3) : none,
    m.has('goals') ? supabase.from('key_results').select('goal_id, is_done').eq('user_id', user.id) : none,
    m.has('finance') ? supabase.from('transactions').select('amount, type, date').eq('user_id', user.id).gte('date', monthStart).lte('date', monthEnd) : none,
  ])

  const displayName       = profile?.display_name ?? user.email?.split('@')[0] ?? 'bạn'
  const annualTheme       = profile?.annual_theme
  const todayDoneHabitIds = new Set((todayHabitLogs ?? []).map((l: { habit_id: string }) => l.habit_id))
  const habitsWithStatus  = (habits ?? []).map((h: { id: string; name: string; icon: string }) => ({ ...h, doneToday: todayDoneHabitIds.has(h.id) }))
  const inboxCount        = inboxItems?.length ?? 0
  const habitsDone        = habitsWithStatus.filter((h: { doneToday: boolean }) => h.doneToday).length
  const habitsTotal       = habitsWithStatus.length
  const mitRemaining      = (mitTasks ?? []).length

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

  const txs          = monthTransactions ?? []
  const todayExpense = txs.filter(t => t.date === today && t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const todayIncome  = txs.filter(t => t.date === today && t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const monthExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const monthIncome  = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="px-4 pt-10 pb-6 lg:px-8 lg:pt-8 lg:pb-10">
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

        {/* ── LEFT COL ── */}
        <div className="space-y-3">
          <DashboardGreeting
            name={displayName}
            annualTheme={annualTheme}
            energyScore={m.has('health') ? (todayEnergyLog?.score ?? null) : undefined}
            habitsDone={m.has('habits') ? habitsDone : undefined}
            habitsTotal={m.has('habits') ? habitsTotal : undefined}
            mitRemaining={m.has('tasks') ? mitRemaining : undefined}
            happinessScore={todayScore?.score ?? null}
          />
          {m.has('health') && (
            <EnergyCheckIn userId={user.id} todayLog={todayEnergyLog} />
          )}
          {m.has('finance') && (
            <FinanceSummary
              todayExpense={todayExpense}
              todayIncome={todayIncome}
              monthExpense={monthExpense}
              monthIncome={monthIncome}
              monthSavings={monthIncome - monthExpense}
            />
          )}
          {m.has('tasks') && (
            <MITPreview tasks={mitTasks ?? []} userId={user.id} />
          )}
          {m.has('habits') && habitsWithStatus.length > 0 && (
            <HabitsPreview habits={habitsWithStatus} userId={user.id} today={today} />
          )}
          <AICaptureBar userId={user.id} />
          <EveningCTA isDone={!!(todayScore?.note)} />
        </div>

        {/* ── RIGHT COL ── */}
        <div className="space-y-3 mt-3 lg:mt-0">
          <ContextZone
            userId={user.id}
            todayScore={todayScore}
            energyLog={m.has('health') ? todayEnergyLog : null}
            sleepLog={m.has('health') ? todaySleepLog : null}
            movementLog={m.has('health') ? todayMovementLog : null}
            goals={m.has('goals') ? goalsForDashboard : []}
            inboxCount={inboxCount}
            enabledModules={enabledModules}
          />
        </div>

      </div>
    </div>
  )
}
