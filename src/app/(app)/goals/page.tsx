import { requireUser } from '@/lib/auth'
import { GoalList } from '@/components/goals/goal-list'
import { AddGoalForm } from '@/components/goals/add-goal-form'

export default async function GoalsPage() {
  const { user, supabase } = await requireUser()

  const [
    { data: goals },
    { data: keyResults },
    { data: linkedTasks },
    { data: linkedHabits },
  ] = await Promise.all([
    supabase
      .from('goals')
      .select('id, title, description, timeframe, value_tag, target_date, progress, is_done')
      .eq('user_id', user.id)
      .order('is_done', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('key_results')
      .select('id, goal_id, title, is_done')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    // Gracefully returns null if goal_id column doesn't exist yet (pre-migration)
    supabase.from('tasks').select('goal_id').eq('user_id', user.id).not('goal_id', 'is', null).eq('is_done', false),
    supabase.from('habits').select('goal_id').eq('user_id', user.id).not('goal_id', 'is', null).eq('is_active', true),
  ])

  const krsByGoal: Record<string, { id: string; title: string; is_done: boolean }[]> = {}
  for (const kr of keyResults ?? []) {
    if (!krsByGoal[kr.goal_id]) krsByGoal[kr.goal_id] = []
    krsByGoal[kr.goal_id].push({ id: kr.id, title: kr.title, is_done: kr.is_done })
  }

  const taskCountByGoal: Record<string, number> = {}
  for (const t of linkedTasks ?? []) {
    if (t.goal_id) taskCountByGoal[t.goal_id] = (taskCountByGoal[t.goal_id] ?? 0) + 1
  }

  const habitCountByGoal: Record<string, number> = {}
  for (const h of linkedHabits ?? []) {
    if (h.goal_id) habitCountByGoal[h.goal_id] = (habitCountByGoal[h.goal_id] ?? 0) + 1
  }

  const allGoals = (goals ?? []).map(g => ({
    ...g,
    key_results:  krsByGoal[g.id]        ?? [],
    task_count:   taskCountByGoal[g.id]  ?? 0,
    habit_count:  habitCountByGoal[g.id] ?? 0,
  }))

  const activeGoalCount = allGoals.filter(g => !g.is_done).length
  const avgProgress = activeGoalCount > 0
    ? Math.round(allGoals.filter(g => !g.is_done).reduce((s, g) => s + g.progress, 0) / activeGoalCount)
    : null
  // eslint-disable-next-line react-hooks/purity -- server component, Date.now() is safe
  const now = Date.now()
  const nearDeadline = allGoals.filter(g => !g.is_done && g.target_date).filter(g => {
    const days = Math.ceil((new Date(g.target_date!).getTime() - now) / 86400000)
    return days >= 0 && days <= 14
  }).length

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Mục tiêu</h1>
        <p className="text-stone-400 text-sm">Thiết kế cuộc sống có chủ đích</p>
      </div>

      {activeGoalCount > 0 && (
        <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-3 border border-stone-100 text-sm">
          <span className="text-stone-700 font-medium">{activeGoalCount} đang theo đuổi</span>
          {avgProgress != null && (
            <>
              <span className="text-stone-200">·</span>
              <span className="text-stone-500">TB <span className="font-semibold text-stone-700">{avgProgress}%</span></span>
            </>
          )}
          {nearDeadline > 0 && (
            <>
              <span className="text-stone-200">·</span>
              <span className="text-amber-600 font-medium">{nearDeadline} sắp đến hạn</span>
            </>
          )}
        </div>
      )}

      <AddGoalForm userId={user.id} />
      <GoalList goals={allGoals} userId={user.id} />
    </div>
  )
}
