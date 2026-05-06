import type { Category } from '@/lib/categories'
import { catByKey } from '@/lib/categories'
import { formatVND } from '@/lib/format'

const BAR_COLORS = [
  'bg-orange-400', 'bg-blue-400', 'bg-pink-400', 'bg-purple-400',
  'bg-red-400', 'bg-sky-400', 'bg-stone-400', 'bg-emerald-400',
  'bg-amber-400', 'bg-teal-400', 'bg-indigo-400', 'bg-rose-400',
]

interface Props {
  spendingByCategory: Record<string, number>
  totalExpense: number
  categories: Category[]
}

export function SpendingChart({ spendingByCategory, totalExpense, categories }: Props) {
  if (totalExpense === 0) return null

  const items = Object.entries(spendingByCategory)
    .map(([key, amount]) => ({ key, amount, cat: catByKey(categories, key) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 7)

  return (
    <div className="bg-white rounded-2xl border border-stone-100 px-4 py-3 space-y-2.5">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Chi tiêu theo danh mục</p>
      {items.map(({ key, amount, cat }, i) => {
        const pct = Math.round((amount / totalExpense) * 100)
        const color = BAR_COLORS[i % BAR_COLORS.length]
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-stone-700 flex items-center gap-1.5">
                <span className="text-sm">{cat?.emoji ?? '📦'}</span>
                {cat?.name ?? key}
              </span>
              <span className="text-xs font-semibold text-stone-600">
                {formatVND(amount)}
                <span className="text-stone-400 font-normal ml-1.5">{pct}%</span>
              </span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
