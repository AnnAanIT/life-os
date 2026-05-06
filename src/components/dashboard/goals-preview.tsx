import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const VALUE_TAG_ICON: Record<string, string> = {
  finance: '💰', health: '💪', learning: '📚', work: '💼',
  relationships: '❤️', spirit: '🧘', other: '🎯',
}

interface GoalSummary {
  id: string
  title: string
  value_tag: string
  progress: number
  kr_total: number
  kr_done: number
}

interface Props { goals: GoalSummary[] }

export function GoalsPreview({ goals }: Props) {
  if (goals.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Mục tiêu</p>
        <Link
          href="/goals"
          className="flex items-center gap-0.5 text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          Tất cả <ChevronRight size={12} />
        </Link>
      </div>
      <div className="px-4 pb-3.5 space-y-3">
        {goals.map(g => {
          const pct = g.kr_total > 0
            ? Math.round((g.kr_done / g.kr_total) * 100)
            : g.progress
          return (
            <div key={g.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm leading-none">{VALUE_TAG_ICON[g.value_tag] ?? '🎯'}</span>
                  <span className="text-xs font-medium text-stone-700 truncate">{g.title}</span>
                </div>
                <span className="shrink-0 text-[11px] text-stone-400 ml-2 tabular-nums">{pct}%</span>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    pct >= 100 ? 'bg-green-400' : 'bg-stone-700',
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
