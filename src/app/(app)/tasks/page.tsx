import { requireUser } from '@/lib/auth'
import { TaskList } from '@/components/tasks/task-list'
import { AddTaskForm } from '@/components/tasks/add-task-form'

export default async function TasksPage() {
  const { user, supabase } = await requireUser()

  const [{ data: activeTasks }, { data: doneTasks }, { data: activeGoals }, { data: taskGoalLinks }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, is_mit, is_done, due_date, energy_level, recurrence')
      .eq('user_id', user.id)
      .eq('is_done', false)
      .order('is_mit',     { ascending: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('tasks')
      .select('id, title, is_mit, is_done, due_date, energy_level, recurrence')
      .eq('user_id', user.id)
      .eq('is_done', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('goals')
      .select('id, title, timeframe')
      .eq('user_id', user.id)
      .eq('is_done', false)
      .order('created_at', { ascending: true }),
    // Separate query — gracefully returns null if column doesn't exist yet (pre-migration)
    supabase
      .from('tasks')
      .select('id, goal_id')
      .eq('user_id', user.id),
  ])

  const goalIdMap: Record<string, string> = {}
  for (const t of taskGoalLinks ?? []) {
    if (t.goal_id) goalIdMap[t.id] = t.goal_id
  }

  const allTasks = [...(activeTasks ?? []), ...(doneTasks ?? [])].map(t => ({
    ...t,
    goal_id: goalIdMap[t.id] ?? null,
  }))
  const mitCount = activeTasks?.filter(t => t.is_mit).length ?? 0
  const goals = activeGoals ?? []

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Tasks</h1>
        <p className="text-stone-400 text-sm">Tập trung vào điều quan trọng nhất</p>
      </div>
      <AddTaskForm userId={user.id} mitCount={mitCount} goals={goals} />
      <TaskList tasks={allTasks} userId={user.id} goals={goals} />
    </div>
  )
}
