import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { localDateStr } from '@/lib/format'
import { SleepLogCard } from '@/components/health/sleep-log-card'
import { NutritionCard } from '@/components/health/nutrition-card'
import { MovementLogCard } from '@/components/health/movement-log-card'
import { RecoveryCard } from '@/components/health/recovery-card'

export default async function HealthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = localDateStr()

  const [
    { data: sleepLog },
    { data: movementLog },
  ] = await Promise.all([
    supabase.from('sleep_logs').select('bedtime, wake_time, duration_hours, quality')
      .eq('user_id', user.id).eq('date', today).single(),
    supabase.from('movement_logs').select('did_move, activity, felt_after, stress_level, recovery_activities, meal_quality')
      .eq('user_id', user.id).eq('date', today).single(),
  ])

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-stone-800">Sức khỏe</h1>
        <p className="text-stone-400 text-sm">Năng lượng để sống cuộc sống bạn muốn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
