'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, BarChart2 } from 'lucide-react'
import type { Category } from '@/lib/categories'
import { expenseCategories } from '@/lib/categories'
import { formatVND } from '@/lib/format'
import { SpendingChart } from './spending-chart'
import { BudgetTracker } from './budget-tracker'

interface Budget {
  category: string
  monthly_limit: number
}

interface Props {
  spendingByCategory: Record<string, number>
  totalExpense: number
  budgets: Budget[]
  userId: string
  categories: Category[]
}

export function AnalysisPanel({ spendingByCategory, totalExpense, budgets, userId, categories }: Props) {
  const [open, setOpen] = useState(false)

  const expCats = expenseCategories(categories)
  const totalBudget = budgets
    .filter(b => expCats.some(c => c.key === b.category))
    .reduce((s, b) => s + b.monthly_limit, 0)
  const budgetCount = budgets.filter(b => expCats.some(c => c.key === b.category)).length
  const overCount = budgets.filter(b => {
    const spent = spendingByCategory[b.category] ?? 0
    return spent > b.monthly_limit
  }).length

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-stone-100 text-left"
      >
        <div className="flex items-center gap-2.5">
          <BarChart2 size={15} className="text-stone-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-stone-700">Ngân sách & Chi tiêu</p>
            {!open && (
              <p className="text-xs text-stone-400 mt-0.5">
                {budgetCount === 0
                  ? 'Chưa đặt ngân sách · Bấm để thiết lập'
                  : overCount > 0
                    ? `${overCount} danh mục vượt ngân sách`
                    : totalExpense > 0
                      ? `${formatVND(totalExpense)} / ${formatVND(totalBudget)} ngân sách`
                      : `${budgetCount} danh mục đã đặt ngân sách`
                }
              </p>
            )}
          </div>
        </div>
        {open
          ? <ChevronUp size={15} className="text-stone-400 shrink-0" />
          : <ChevronDown size={15} className="text-stone-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {totalExpense > 0 && (
            <SpendingChart
              spendingByCategory={spendingByCategory}
              totalExpense={totalExpense}
              categories={categories}
            />
          )}
          <BudgetTracker
            userId={userId}
            spendingByCategory={spendingByCategory}
            budgets={budgets}
            categories={categories}
          />
        </div>
      )}
    </div>
  )
}
