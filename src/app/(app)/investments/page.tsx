import { requireUser } from '@/lib/auth'
import { InvestmentOverview } from '@/components/investments/investment-overview'
import { NetWorthChart } from '@/components/investments/net-worth-chart'
import { InvestmentForm } from '@/components/investments/investment-form'
import { InvestmentList } from '@/components/investments/investment-list'
import { SavingsGoalsList } from '@/components/investments/savings-goals-list'

export default async function InvestmentsPage() {
  const { user, supabase } = await requireUser()

  const [{ data: assets }, { data: savingsGoals }, { data: snapshots }, { data: transactions }] = await Promise.all([
    supabase
      .from('assets')
      .select('id, asset_type, name, symbol, current_value, buy_value, buy_price_per_unit, market_price_per_unit, quantity, unit')
      .eq('user_id', user.id)
      .order('asset_type')
      .order('created_at', { ascending: false }),
    supabase
      .from('savings_goals')
      .select('id, name, icon, target_amount, current_amount, target_date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('net_worth_snapshots')
      .select('snapshot_date, total_value, by_type')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: true })
      .limit(365),
    supabase
      .from('asset_transactions')
      .select('id, asset_id, type, quantity, price_per_unit, total_value, transaction_date, note')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at',       { ascending: false }),
  ])

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-stone-800">Đầu tư</h1>
        <p className="text-stone-400 text-sm">Theo dõi tài sản và net worth</p>
      </div>

      <InvestmentOverview assets={assets ?? []} />

      <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">

        {/* Left: portfolio management */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <InvestmentList assets={assets ?? []} transactions={transactions ?? []} userId={user.id} />
          <InvestmentForm userId={user.id} />
        </div>

        {/* Right: charts + savings goals */}
        <div className="space-y-4">
          <NetWorthChart assets={assets ?? []} transactions={transactions ?? []} snapshots={snapshots ?? []} />
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-1 mb-2">Mục tiêu tiết kiệm</p>
            <SavingsGoalsList goals={savingsGoals ?? []} userId={user.id} />
          </div>
        </div>

      </div>
    </div>
  )
}
