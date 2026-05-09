import { requireUser } from '@/lib/auth'
import { getUserCategories } from '@/lib/categories'
import { TransactionList } from '@/components/transactions/transaction-list'
import { BalanceCard } from '@/components/transactions/balance-card'
import { MonthNav } from '@/components/transactions/month-nav'
import { QuickEntry } from '@/components/transactions/quick-entry'
import { AnalysisPanel } from '@/components/transactions/analysis-panel'
import { CategoryManager } from '@/components/transactions/category-manager'
import { ExportButton } from '@/components/transactions/export-button'
import { YearChart } from '@/components/transactions/year-chart'
import type { MonthSummary } from '@/components/transactions/year-chart'
import { localMonthRange, localDateStr } from '@/lib/format'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { user, supabase } = await requireUser()

  const { month: monthParam } = await searchParams
  const now = new Date()
  let targetYear = now.getFullYear()
  let targetMonth = now.getMonth() + 1

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [py, pm] = monthParam.split('-').map(Number)
    const paramDate = new Date(py, pm - 1, 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    if (paramDate <= thisMonth) { targetYear = py; targetMonth = pm }
  }

  const currentMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`
  const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === now.getMonth() + 1

  const { start: monthStart, end: monthEnd } = localMonthRange(new Date(targetYear, targetMonth - 1, 1))
  const queryEnd = isCurrentMonth ? localDateStr() : monthEnd

  const [{ data: transactions }, { data: budgets }, categories, { data: yearTxRaw }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, type, category, note, date')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', queryEnd)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('budgets').select('category, monthly_limit').eq('user_id', user.id),
    getUserCategories(supabase, user.id),
    supabase
      .from('transactions')
      .select('amount, type, date')
      .eq('user_id', user.id)
      .gte('date', `${targetYear}-01-01`)
      .lte('date', localDateStr()),
  ])

  const income = transactions?.filter(t => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const expense = transactions?.filter(t => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0) ?? 0

  const spendingByCategory: Record<string, number> = {}
  for (const t of transactions ?? []) {
    if (t.type === 'expense')
      spendingByCategory[t.category] = (spendingByCategory[t.category] ?? 0) + Number(t.amount)
  }

  // Aggregate year data by month
  const yearMap: Record<string, { income: number; expense: number }> = {}
  for (const t of yearTxRaw ?? []) {
    const m = (t.date as string).slice(0, 7)
    if (!yearMap[m]) yearMap[m] = { income: 0, expense: 0 }
    if (t.type === 'income') yearMap[m].income += Number(t.amount)
    else if (t.type === 'expense') yearMap[m].expense += Number(t.amount)
  }
  const yearData: MonthSummary[] = Object.entries(yearMap).map(([month, v]) => ({ month, ...v }))

  const monthLabel = new Date(targetYear, targetMonth - 1, 1)
    .toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Tài chính</h1>
          <p className="text-stone-400 text-sm">Theo dõi thu chi hàng ngày</p>
        </div>
        <ExportButton transactions={transactions ?? []} monthLabel={currentMonth} />
      </div>

      <MonthNav currentMonth={currentMonth} />

      <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">

        {/* Left: primary actions */}
        <div className="space-y-4">
          {isCurrentMonth && <QuickEntry userId={user.id} categories={categories} />}
          <TransactionList transactions={transactions ?? []} userId={user.id} categories={categories} />
        </div>

        {/* Right: analysis */}
        <div className="space-y-4">
          <BalanceCard income={income} expense={expense} monthLabel={monthLabel} />
          <YearChart data={yearData} currentMonth={currentMonth} year={targetYear} />
          <AnalysisPanel
            spendingByCategory={spendingByCategory}
            totalExpense={expense}
            budgets={budgets ?? []}
            userId={user.id}
            categories={categories}
          />
          <CategoryManager categories={categories} userId={user.id} />
        </div>

      </div>
    </div>
  )
}
