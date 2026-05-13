import { requireUser } from '@/lib/auth'
import { InsightsClient, type InsightsData } from '@/components/insights/insights-client'

const CACHE_TTL_HOURS = 24

export default async function InsightsPage() {
  const { user, supabase } = await requireUser()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { data: happinessData },
    { data: habitLogs },
    { data: allHabits },
    { data: transactions },
    { data: sleepLogs },
    { data: movementLogs },
    { data: energyLogs },
    { data: cachedAI },
  ] = await Promise.all([
    supabase.from('happiness_scores').select('date, score').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('habit_logs').select('habit_id, date').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('habits').select('id').eq('user_id', user.id).eq('is_active', true),
    supabase.from('transactions').select('type, amount').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('sleep_logs').select('date, duration_hours, quality').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('movement_logs').select('date, did_move').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('energy_logs').select('date, score').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('ai_insights_cache').select('monthly_story, insights, generated_at').eq('user_id', user.id).single(),
  ])

  const scores    = happinessData ?? []
  const logs      = habitLogs ?? []
  const habits    = allHabits ?? []
  const txs       = transactions ?? []
  const sleeps    = sleepLogs ?? []
  const movements = movementLogs ?? []
  const energies  = energyLogs ?? []

  const movedDates      = new Set(movements.filter(m => m.did_move).map(m => m.date))
  const goodSleepDates  = new Set(sleeps.filter(s => (s.quality ?? 0) >= 4).map(s => s.date))
  const highEnergyDates = new Set(energies.filter(e => e.score >= 4).map(e => e.date))
  const lowEnergyDates  = new Set(energies.filter(e => e.score <= 2).map(e => e.date))

  const avg    = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const round1 = (n: number | null) => n != null ? Math.round(n * 10) / 10 : null

  const habitMap: Record<string, number> = {}
  logs.forEach(l => { habitMap[l.habit_id] = (habitMap[l.habit_id] ?? 0) + 1 })

  const expenses   = txs.filter(t => t.type === 'expense')
  const totalSpend = expenses.reduce((s, t) => s + Number(t.amount), 0)
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)

  const stats: InsightsData['stats'] = {
    happiness: {
      average: round1(avg(scores.map(s => s.score))),
      entries: scores.length,
    },
    habits: {
      totalHabits: habits.length,
      completionRate: habits.length > 0 ? Math.round((logs.length / (habits.length * 30)) * 100) : null,
    },
    finance: { totalSpend, totalIncome },
    sleep: {
      avgHours:   round1(avg(sleeps.map(s => Number(s.duration_hours)).filter(Boolean))),
      avgQuality: round1(avg(sleeps.map(s => s.quality ?? 0).filter(Boolean))),
    },
    energy: {
      average: round1(avg(energies.map(e => e.score))),
      entries: energies.length,
    },
    movement: {
      movedDays: movements.filter(m => m.did_move).length,
      totalDays: movements.length,
    },
    correlations: {
      happinessWithMovement:    round1(avg(scores.filter(s => movedDates.has(s.date)).map(s => s.score))),
      happinessWithoutMovement: round1(avg(scores.filter(s => !movedDates.has(s.date)).map(s => s.score))),
      happinessHighEnergy:      round1(avg(scores.filter(s => highEnergyDates.has(s.date)).map(s => s.score))),
      happinessLowEnergy:       round1(avg(scores.filter(s => lowEnergyDates.has(s.date)).map(s => s.score))),
      happinessGoodSleep:       round1(avg(scores.filter(s => goodSleepDates.has(s.date)).map(s => s.score))),
      happinessOtherSleep:      round1(avg(scores.filter(s => !goodSleepDates.has(s.date)).map(s => s.score))),
    },
  }

  let initialData: InsightsData | null = null
  if (cachedAI) {
    const ageHours = (Date.now() - new Date(cachedAI.generated_at).getTime()) / 3_600_000
    if (ageHours < CACHE_TTL_HOURS) {
      initialData = {
        monthly_story: cachedAI.monthly_story as string | null,
        insights:      cachedAI.insights as InsightsData['insights'],
        stats,
        cached:        true,
        generated_at:  cachedAI.generated_at,
      }
    }
  }

  // Pass stats even when AI cache is stale so stats show immediately while AI loads
  if (!initialData) {
    initialData = {
      monthly_story: null,
      insights:      [],
      stats,
      cached:        false,
      generated_at:  null,
    }
  }

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Insights</h1>
        <p className="text-stone-400 text-sm">Pattern từ dữ liệu 30 ngày qua</p>
      </div>
      <InsightsClient initialData={initialData} />
    </div>
  )
}
