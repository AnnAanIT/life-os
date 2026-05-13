import { requireUser } from '@/lib/auth'
import { getProfile } from '@/lib/get-profile'
import { formatVND, localDateStr, localMonthRange } from '@/lib/format'
import { TrendingUp, TrendingDown, Star, RotateCcw, Smile, BookOpen, Target } from 'lucide-react'
import { WeeklyReflection } from '@/components/review/weekly-reflection'

export default async function ReviewPage() {
  const { user, supabase } = await requireUser()

  const today = new Date()
  const todayStr = localDateStr(today)

  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - dayOfWeek + 1)
  const weekStartStr = localDateStr(weekStart)

  const { start: monthStart } = localMonthRange(today)
  const monthName = today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  const [
    { data: weekHappiness },
    { data: weekTransactions },
    { data: weekHabitLogs },
    { data: habits },
    { data: mitTasks },
    { data: monthTransactions },
    { data: monthHappiness },
    { data: monthHabitLogs },
    { data: booksFinishedThisMonth },
    { data: goals },
    { data: weekEnergyLogs },
    { data: weekSleepLogs },
    { data: weeklyReview },
    reviewProfile,
  ] = await Promise.all([
    supabase.from('happiness_scores').select('score').eq('user_id', user.id).gte('date', weekStartStr).lte('date', todayStr),
    supabase.from('transactions').select('amount, type').eq('user_id', user.id).gte('date', weekStartStr).lte('date', todayStr),
    supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).gte('date', weekStartStr).lte('date', todayStr),
    supabase.from('habits').select('id, name, icon').eq('user_id', user.id).eq('is_active', true),
    supabase.from('tasks').select('is_done').eq('user_id', user.id).eq('is_mit', true),
    supabase.from('transactions').select('amount, type, category').eq('user_id', user.id).gte('date', monthStart).lte('date', todayStr),
    supabase.from('happiness_scores').select('score, date').eq('user_id', user.id).gte('date', monthStart).lte('date', todayStr),
    supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).gte('date', monthStart).lte('date', todayStr),
    supabase.from('books').select('id, title').eq('user_id', user.id).eq('status', 'done').gte('finished_at', monthStart).lte('finished_at', todayStr),
    supabase.from('goals').select('id, title, progress, is_done, value_tag').eq('user_id', user.id).eq('is_done', false),
    supabase.from('energy_logs').select('score').eq('user_id', user.id).gte('date', weekStartStr).lte('date', todayStr),
    supabase.from('sleep_logs').select('duration_hours').eq('user_id', user.id).gte('date', weekStartStr).lte('date', todayStr),
    supabase.from('weekly_reviews').select('best_thing, carry_forward, next_priority, theme_moment')
      .eq('user_id', user.id).eq('week_start', weekStartStr).single(),
    getProfile(user.id),
  ])

  const avgHappinessWeek = weekHappiness?.length
    ? (weekHappiness.reduce((s, r) => s + r.score, 0) / weekHappiness.length).toFixed(1) : null
  const avgEnergyWeek = weekEnergyLogs?.length
    ? (weekEnergyLogs.reduce((s, r) => s + r.score, 0) / weekEnergyLogs.length).toFixed(1) : null
  const avgSleepWeek = weekSleepLogs?.filter(s => s.duration_hours != null).length
    ? (weekSleepLogs!.filter(s => s.duration_hours != null)
        .reduce((s, r) => s + Number(r.duration_hours), 0) /
       weekSleepLogs!.filter(s => s.duration_hours != null).length).toFixed(1)
    : null
  const weekIncome = weekTransactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const weekExpense = weekTransactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const habitCount = habits?.length ?? 0
  const weekHabitRate = habitCount > 0 && dayOfWeek > 0
    ? Math.round(((weekHabitLogs?.length ?? 0) / (habitCount * dayOfWeek)) * 100) : 0
  const mitDone = mitTasks?.filter(t => t.is_done).length ?? 0
  const mitTotal = mitTasks?.length ?? 0

  const monthIncome = monthTransactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const monthExpense = monthTransactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const avgHappinessMonth = monthHappiness?.length
    ? (monthHappiness.reduce((s, r) => s + r.score, 0) / monthHappiness.length).toFixed(1) : null
  const daysInMonth = today.getDate()
  const monthHabitRate = habitCount > 0 && daysInMonth > 0
    ? Math.round(((monthHabitLogs?.length ?? 0) / (habitCount * daysInMonth)) * 100) : 0

  const categorySpend: Record<string, number> = {}
  for (const t of monthTransactions ?? []) {
    if (t.type === 'expense') categorySpend[t.category] = (categorySpend[t.category] ?? 0) + Number(t.amount)
  }
  const topCategory = Object.entries(categorySpend).sort(([, a], [, b]) => b - a)[0]

  const monthSaved = monthIncome - monthExpense
  const savingsRate = monthIncome > 0 ? Math.round((monthSaved / monthIncome) * 100) : null

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-stone-800">Review</h1>
        <p className="text-stone-400 text-sm">Nhìn lại & điều chỉnh</p>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start space-y-6 lg:space-y-0">

        {/* ===== LEFT: WEEKLY ===== */}
        <div className="space-y-4">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-violet-400 rounded-full" />
              <p className="text-sm font-semibold text-stone-700">Tuần này</p>
            </div>
            <WeeklyReflection
              userId={user.id}
              weekStart={weekStartStr}
              annualTheme={reviewProfile?.annual_theme ?? null}
              existing={weeklyReview}
              stats={{
                avgHappiness: avgHappinessWeek,
                habitRate:    weekHabitRate,
                mitDone:      mitDone,
                mitTotal:     mitTotal,
                avgEnergy:    avgEnergyWeek,
                avgSleep:     avgSleepWeek,
              }}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-stone-300 rounded-full" />
              <p className="text-sm font-semibold text-stone-700">Số liệu tuần</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<Smile size={15} className="text-amber-500" />}
                label="Hạnh phúc TB"
                value={avgHappinessWeek ?? '—'}
                unit={avgHappinessWeek ? '/10' : ''}
                sub={`${weekHappiness?.length ?? 0} ngày ghi`}
                highlight={!!avgHappinessWeek}
              />
              <StatCard
                icon={<RotateCcw size={15} className="text-blue-500" />}
                label="Thói quen"
                value={String(weekHabitRate)}
                unit="%"
                sub={`${habitCount} thói quen`}
              />
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-100 space-y-3">
              <p className="text-xs font-medium text-stone-400">Tài chính tuần</p>
              <div className="flex gap-0 divide-x divide-stone-100">
                <FinanceItem label="Thu" amount={weekIncome} color="text-emerald-600" icon={<TrendingUp size={13} />} />
                <FinanceItem label="Chi" amount={weekExpense} color="text-red-500" icon={<TrendingDown size={13} />} />
                <FinanceItem
                  label="Còn lại"
                  amount={weekIncome - weekExpense}
                  color={weekIncome - weekExpense >= 0 ? 'text-emerald-600' : 'text-red-500'}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl px-4 py-3.5 border border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={15} className="text-amber-500 fill-amber-500" />
                <p className="text-sm text-stone-700">MIT hoàn thành</p>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-bold text-stone-800">{mitDone}</span>
                <span className="text-sm text-stone-400">/{mitTotal}</span>
              </div>
            </div>
          </section>
        </div>

        {/* ===== RIGHT: MONTHLY ===== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-violet-400 rounded-full" />
            <p className="text-sm font-semibold text-stone-700 capitalize">{monthName}</p>
          </div>

          <div className="bg-stone-800 rounded-2xl p-4 text-white space-y-3">
            <p className="text-xs text-stone-400">Tài chính tháng</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[11px] text-stone-400 mb-0.5">Thu nhập</p>
                <p className="text-sm font-bold text-emerald-400">{formatVND(monthIncome)}</p>
              </div>
              <div>
                <p className="text-[11px] text-stone-400 mb-0.5">Chi tiêu</p>
                <p className="text-sm font-bold text-red-400">{formatVND(monthExpense)}</p>
              </div>
              <div>
                <p className="text-[11px] text-stone-400 mb-0.5">Tiết kiệm</p>
                <p className={`text-sm font-bold ${monthSaved >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatVND(monthSaved)}
                </p>
              </div>
            </div>
            {(topCategory || savingsRate != null) && (
              <div className="flex gap-3 pt-1 border-t border-white/10">
                {savingsRate != null && (
                  <p className="text-xs text-stone-400">Tỷ lệ tiết kiệm: <span className="text-stone-200 font-medium">{savingsRate}%</span></p>
                )}
                {topCategory && (
                  <p className="text-xs text-stone-400">Chi nhiều nhất: <span className="text-stone-200">{topCategory[0]}</span></p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<Smile size={15} className="text-amber-500" />}
              label="Hạnh phúc TB"
              value={avgHappinessMonth ?? '—'}
              unit={avgHappinessMonth ? '/10' : ''}
              sub={`${monthHappiness?.length ?? 0} ngày ghi`}
              highlight={!!avgHappinessMonth}
            />
            <StatCard
              icon={<RotateCcw size={15} className="text-blue-500" />}
              label="Thói quen"
              value={String(monthHabitRate)}
              unit="%"
              sub={`${daysInMonth} ngày đã qua`}
            />
          </div>

          {(booksFinishedThisMonth?.length ?? 0) > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-stone-100">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={15} className="text-sky-500" />
                <p className="text-sm font-medium text-stone-700">
                  {booksFinishedThisMonth!.length} cuốn đọc xong tháng này
                </p>
              </div>
              <div className="space-y-1 pl-5">
                {booksFinishedThisMonth!.map(b => (
                  <p key={b.id} className="text-xs text-stone-500">· {b.title}</p>
                ))}
              </div>
            </div>
          )}

          {(goals?.length ?? 0) > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-stone-100">
              <div className="flex items-center gap-2 mb-3">
                <Target size={15} className="text-purple-500" />
                <p className="text-sm font-medium text-stone-700">Tiến độ mục tiêu</p>
              </div>
              <div className="space-y-3">
                {goals!.slice(0, 4).map(g => (
                  <div key={g.id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-stone-600 truncate pr-2">{g.title}</span>
                      <span className="shrink-0 font-semibold text-stone-700">{g.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${g.progress}%`,
                          backgroundColor: g.progress >= 80 ? '#10b981' : g.progress >= 40 ? '#a855f7' : '#c4b5fd',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function StatCard({ icon, label, value, unit, sub, highlight }: {
  icon: React.ReactNode; label: string; value: string; unit: string; sub: string; highlight?: boolean
}) {
  return (
    <div className={highlight ? 'bg-amber-50 rounded-2xl p-4 border border-amber-100' : 'bg-white rounded-2xl p-4 border border-stone-100'}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-xs text-stone-400">{label}</p>
      </div>
      <p className={highlight ? 'text-2xl font-bold text-amber-700' : 'text-2xl font-bold text-stone-800'}>
        {value}
        {unit && <span className="text-sm font-normal text-stone-400 ml-0.5">{unit}</span>}
      </p>
      <p className="text-xs text-stone-300 mt-1">{sub}</p>
    </div>
  )
}

function FinanceItem({ label, amount, color, icon }: {
  label: string; amount: number; color: string; icon?: React.ReactNode
}) {
  return (
    <div className="flex-1 px-3 first:pl-0 last:pr-0">
      <div className="flex items-center gap-1 mb-0.5">
        {icon && <span className={color}>{icon}</span>}
        <p className="text-xs text-stone-400">{label}</p>
      </div>
      <p className={`text-sm font-semibold ${color}`}>{formatVND(amount)}</p>
    </div>
  )
}
