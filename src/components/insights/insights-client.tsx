'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatVND } from '@/lib/format'

interface Insight {
  title: string
  body: string
  type: 'positive' | 'tip' | 'neutral'
}

interface Stats {
  happiness: { average: number | null; entries: number }
  habits: { totalHabits: number; completionRate: number | null }
  finance: { totalSpend: number; totalIncome: number }
  sleep: { avgHours: number | null; avgQuality: number | null }
  energy: { average: number | null; entries: number }
  movement: { movedDays: number; totalDays: number }
  correlations: {
    happinessWithMovement: number | null
    happinessWithoutMovement: number | null
    happinessHighEnergy: number | null
    happinessLowEnergy: number | null
    happinessGoodSleep: number | null
    happinessOtherSleep: number | null
  }
}

interface InsightsData {
  monthly_story: string | null
  insights: Insight[]
  stats: Stats
  cached: boolean
  generated_at: string | null
}

export function InsightsClient() {
  const [data, setData]       = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]     = useState(false)

  function load(refresh = false) {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(false)
    fetch(refresh ? '/api/ai/insights?refresh=1' : '/api/ai/insights')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); setRefreshing(false) })
      .catch(() => { setError(true); setLoading(false); setRefreshing(false) })
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={24} className="animate-spin text-stone-400" />
        <p className="text-sm text-stone-400">Claude đang phân tích dữ liệu của bạn...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-10 text-stone-400">
        <p className="text-sm">Không thể tải insights. Thêm API key hoặc thử lại.</p>
      </div>
    )
  }

  const { monthly_story, insights, stats, cached, generated_at } = data

  const generatedLabel = generated_at
    ? new Date(generated_at).toLocaleString('vi-VN', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="space-y-4">
      {/* Cache status bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-400">
          {cached && generatedLabel ? `Phân tích lúc ${generatedLabel}` : 'Vừa phân tích xong'}
        </p>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all disabled:opacity-40"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Đang phân tích...' : 'Phân tích lại'}
        </button>
      </div>

    <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">

      {/* ── Left col: story + stats ── */}
      <div className="space-y-4">
        {monthly_story && (
          <div className="bg-gradient-to-br from-violet-600 via-violet-500 to-purple-500 rounded-2xl p-5 text-white">
            <p className="text-[10px] font-semibold text-violet-200 uppercase tracking-widest mb-2">✨ Tháng này của bạn</p>
            <p className="text-sm leading-relaxed text-white/90">{monthly_story}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Hạnh phúc TB"
            value={stats.happiness.average != null ? `${stats.happiness.average}/10` : '—'}
            sub={`${stats.happiness.entries} ngày ghi`}
            color="text-amber-500"
          />
          <StatCard
            label="Thói quen"
            value={stats.habits.completionRate != null ? `${stats.habits.completionRate}%` : '—'}
            sub={`${stats.habits.totalHabits} thói quen`}
            color="text-blue-500"
          />
          <StatCard
            label="Chi tiêu"
            value={stats.finance.totalSpend > 0 ? formatVND(stats.finance.totalSpend) : '—'}
            sub="30 ngày qua"
            color="text-red-500"
          />
          <StatCard
            label="Năng lượng TB"
            value={stats.energy?.average != null ? `${stats.energy.average}/5` : '—'}
            sub={stats.sleep.avgHours != null ? `Ngủ TB ${stats.sleep.avgHours}h` : '30 ngày qua'}
            color="text-emerald-500"
          />
        </div>
      </div>

      {/* ── Right col: correlations + patterns ── */}
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Tương quan hạnh phúc</p>

          {stats.correlations.happinessWithMovement != null && stats.correlations.happinessWithoutMovement != null && (
            <CorrelationCard
              label="Vận động"
              leftLabel="Có vận động"
              leftValue={stats.correlations.happinessWithMovement}
              leftColor="text-emerald-500"
              rightLabel="Không vận động"
              rightValue={stats.correlations.happinessWithoutMovement}
            />
          )}

          {stats.correlations.happinessHighEnergy != null && stats.correlations.happinessLowEnergy != null && (
            <CorrelationCard
              label="Năng lượng"
              leftLabel="Năng lượng cao"
              leftValue={stats.correlations.happinessHighEnergy}
              leftColor="text-violet-500"
              rightLabel="Năng lượng thấp"
              rightValue={stats.correlations.happinessLowEnergy}
            />
          )}

          {stats.correlations.happinessGoodSleep != null && stats.correlations.happinessOtherSleep != null && (
            <CorrelationCard
              label="Giấc ngủ"
              leftLabel="Ngủ đủ giấc"
              leftValue={stats.correlations.happinessGoodSleep}
              leftColor="text-sky-500"
              rightLabel="Ngủ thiếu"
              rightValue={stats.correlations.happinessOtherSleep}
            />
          )}

          {stats.correlations.happinessWithMovement == null &&
           stats.correlations.happinessHighEnergy == null &&
           stats.correlations.happinessGoodSleep == null && (
            <div className="bg-white rounded-2xl p-4 border border-stone-100 text-center">
              <p className="text-sm text-stone-400">Cần thêm dữ liệu sức khỏe để thấy tương quan.</p>
            </div>
          )}
        </div>

        {insights.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Pattern phát hiện</p>
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-stone-100 text-center">
            <p className="text-sm text-stone-500">Cần thêm dữ liệu để phát hiện pattern.</p>
            <p className="text-xs text-stone-400 mt-1">Tiếp tục dùng app 2–4 tuần nhé!</p>
          </div>
        )}
      </div>

    </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-3.5 border border-stone-100">
      <p className="text-xs text-stone-400 mb-1">{label}</p>
      <p className={cn('text-lg font-bold', color)}>{value}</p>
      <p className="text-xs text-stone-300 mt-0.5">{sub}</p>
    </div>
  )
}

function CorrelationCard({ label, leftLabel, leftValue, leftColor, rightLabel, rightValue }: {
  label: string
  leftLabel: string
  leftValue: number
  leftColor: string
  rightLabel: string
  rightValue: number
}) {
  const diff = leftValue - rightValue
  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-100">
      <p className="text-xs font-medium text-stone-400 mb-3">{label}</p>
      <div className="flex items-center gap-4">
        <div className="flex-1 text-center">
          <p className={cn('text-2xl font-bold', leftColor)}>{leftValue}</p>
          <p className="text-xs text-stone-400 mt-0.5">{leftLabel}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-px h-8 bg-stone-100" />
          {diff !== 0 && (
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', diff > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500')}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-stone-300">{rightValue}</p>
          <p className="text-xs text-stone-400 mt-0.5">{rightLabel}</p>
        </div>
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const config = {
    positive: { bg: 'bg-green-50 border-green-100', icon: '🌟', title: 'text-green-800' },
    tip:      { bg: 'bg-amber-50 border-amber-100', icon: '💡', title: 'text-amber-800' },
    neutral:  { bg: 'bg-stone-50 border-stone-200', icon: '📊', title: 'text-stone-700' },
  }
  const c = config[insight.type] ?? config.neutral

  return (
    <div className={cn('rounded-2xl px-4 py-3.5 border', c.bg)}>
      <p className={cn('text-sm font-semibold mb-1', c.title)}>
        {c.icon} {insight.title}
      </p>
      <p className="text-sm text-stone-600 leading-relaxed">{insight.body}</p>
    </div>
  )
}
