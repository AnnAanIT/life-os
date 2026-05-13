import { requireUser } from '@/lib/auth'
import { localDateStr, daysAgoStr } from '@/lib/format'
import { SleepLogCard } from '@/components/health/sleep-log-card'
import { NutritionCard } from '@/components/health/nutrition-card'
import { MovementLogCard } from '@/components/health/movement-log-card'
import { RecoveryCard } from '@/components/health/recovery-card'
import { HealthWeekStrip } from '@/components/health/health-week-strip'

const DAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default async function HealthPage() {
  const { user, supabase } = await requireUser()

  const today = localDateStr()
  const sevenDaysAgo = daysAgoStr(6)

  const [
    { data: sleepLog },
    { data: movementLog },
    { data: weekSleep },
    { data: weekMovement },
    { data: weekEnergy },
  ] = await Promise.all([
    supabase.from('sleep_logs').select('bedtime, wake_time, duration_hours, quality')
      .eq('user_id', user.id).eq('date', today).single(),
    supabase.from('movement_logs').select('did_move, activity, felt_after, stress_level, recovery_activities, meal_quality')
      .eq('user_id', user.id).eq('date', today).single(),
    supabase.from('sleep_logs').select('date, quality')
      .eq('user_id', user.id).gte('date', sevenDaysAgo).lte('date', today),
    supabase.from('movement_logs').select('date, did_move')
      .eq('user_id', user.id).gte('date', sevenDaysAgo).lte('date', today),
    supabase.from('energy_logs').select('date, score')
      .eq('user_id', user.id).gte('date', sevenDaysAgo).lte('date', today),
  ])

  const sleepByDate   = Object.fromEntries((weekSleep   ?? []).map(r => [r.date, r.quality]))
  const moveByDate    = Object.fromEntries((weekMovement ?? []).map(r => [r.date, r.did_move]))
  const energyByDate  = Object.fromEntries((weekEnergy  ?? []).map(r => [r.date, r.score]))

  const stripDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const dateStr = localDateStr(d)
    return {
      date:         dateStr,
      dayLabel:     DAY_LABEL[d.getDay()],
      isToday:      i === 6,
      sleepQuality: sleepByDate[dateStr]  ?? null,
      didMove:      moveByDate[dateStr]   ?? null,
      energyScore:  energyByDate[dateStr] ?? null,
    }
  })

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-stone-800">Sức khỏe</h1>
        <p className="text-stone-400 text-sm">Năng lượng để sống cuộc sống bạn muốn</p>
      </div>

      <HealthWeekStrip days={stripDays} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <SleepLogCard userId={user.id} todayLog={sleepLog} />

        <MovementLogCard
          userId={user.id}
          todayLog={movementLog ? {
            did_move:   movementLog.did_move,
            activity:   movementLog.activity,
            felt_after: movementLog.felt_after,
          } : null}
        />

        <NutritionCard
          userId={user.id}
          todayLog={movementLog ? { meal_quality: movementLog.meal_quality } : null}
        />

        <RecoveryCard
          userId={user.id}
          todayLog={movementLog ? {
            stress_level:        movementLog.stress_level,
            recovery_activities: movementLog.recovery_activities ?? [],
          } : null}
        />
      </div>
    </div>
  )
}
