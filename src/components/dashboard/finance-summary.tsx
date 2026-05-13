import Link from 'next/link'
import { TrendingDown, TrendingUp, ArrowRight } from 'lucide-react'
import { formatVND } from '@/lib/format'

interface Props {
  todayExpense:  number
  todayIncome:   number
  monthExpense:  number
  monthIncome:   number
  monthSavings:  number
}

export function FinanceSummary({ todayExpense, todayIncome, monthExpense, monthIncome, monthSavings }: Props) {
  const savingsRate = monthIncome > 0 ? Math.round((monthSavings / monthIncome) * 100) : null
  const hasToday    = todayExpense > 0 || todayIncome > 0

  return (
    <Link
      href="/transactions"
      className="block bg-white rounded-2xl border border-stone-100 hover:border-stone-200 transition-colors px-4 py-3.5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-stone-500">Tài chính hôm nay</p>
        <ArrowRight size={13} className="text-stone-300" />
      </div>

      {hasToday ? (
        <div className="flex items-center gap-4">
          {todayExpense > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingDown size={13} className="text-red-400 shrink-0" />
              <div>
                <p className="text-xs text-stone-400">Chi</p>
                <p className="text-sm font-semibold text-stone-800">{formatVND(todayExpense)}</p>
              </div>
            </div>
          )}
          {todayIncome > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-stone-400">Thu</p>
                <p className="text-sm font-semibold text-stone-800">{formatVND(todayIncome)}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-stone-300">Chưa ghi giao dịch nào hôm nay</p>
      )}

      {(monthExpense > 0 || monthIncome > 0) && (
        <div className="mt-3 pt-3 border-t border-stone-50 flex items-center justify-between">
          <p className="text-xs text-stone-400">
            Tháng này chi <span className="text-stone-600 font-medium">{formatVND(monthExpense)}</span>
          </p>
          {savingsRate != null && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              savingsRate >= 20 ? 'bg-emerald-50 text-emerald-600' :
              savingsRate >= 0  ? 'bg-stone-100 text-stone-500' :
                                  'bg-red-50 text-red-500'
            }`}>
              Tiết kiệm {savingsRate}%
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
