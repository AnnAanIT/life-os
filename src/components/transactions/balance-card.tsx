import { formatVND } from '@/lib/format'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  income: number
  expense: number
  monthLabel: string
}

export function BalanceCard({ income, expense, monthLabel }: Props) {
  const balance = income - expense
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : null
  const expenseRatio = income > 0 ? Math.min((expense / income) * 100, 100) : 0
  const isOver = expense > income && income > 0

  return (
    <div className="bg-stone-800 rounded-2xl p-4 text-white">
      <p className="text-xs text-stone-400 mb-2 capitalize">{monthLabel}</p>

      {/* Balance + savings rate */}
      <div className="flex items-baseline gap-2 mb-2">
        <Wallet size={15} className="text-stone-400 shrink-0 self-center" />
        <span className={cn('text-2xl font-bold', balance >= 0 ? 'text-white' : 'text-red-400')}>
          {balance >= 0 ? '+' : ''}{formatVND(balance)}
        </span>
        {savingsRate !== null && (
          <span className={cn(
            'text-xs font-semibold',
            savingsRate >= 20 ? 'text-emerald-400'
              : savingsRate >= 0 ? 'text-amber-400'
              : 'text-red-400'
          )}>
            {savingsRate > 0 ? `+${savingsRate}%` : `${savingsRate}%`}
          </span>
        )}
      </div>

      {/* Expense ratio bar */}
      {income > 0 && (
        <div className="mb-3">
          <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isOver ? 'bg-red-400' : expenseRatio > 80 ? 'bg-amber-400' : 'bg-emerald-400'
              )}
              style={{ width: `${expenseRatio}%` }}
            />
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {isOver
              ? `Vượt thu nhập ${formatVND(expense - income)}`
              : expenseRatio > 0
                ? `Đã chi ${Math.round(expenseRatio)}% thu nhập`
                : 'Chưa có chi tiêu'
            }
          </p>
        </div>
      )}

      {/* Income / Expense */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={13} className="text-emerald-400 shrink-0" />
          <span className="text-xs text-stone-300">
            Thu: <span className="text-emerald-400 font-semibold">{formatVND(income)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown size={13} className="text-red-400 shrink-0" />
          <span className="text-xs text-stone-300">
            Chi: <span className={cn('font-semibold', isOver ? 'text-red-400' : 'text-red-300')}>
              {formatVND(expense)}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
