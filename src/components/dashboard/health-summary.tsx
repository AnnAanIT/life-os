import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  sleepLog:    { duration_hours: number | null; quality: number | null } | null
  movementLog: { did_move: boolean | null; stress_level: number | null } | null
  energyLog:   { score: number | null } | null
}

function Pill({ emoji, value, sub, color }: {
  emoji: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-base', color)}>
        {emoji}
      </div>
      <span className="text-[11px] font-semibold text-stone-700 tabular-nums">{value}</span>
      {sub && <span className="text-[9px] text-stone-400">{sub}</span>}
    </div>
  )
}

export function HealthSummary({ sleepLog, movementLog, energyLog }: Props) {
  const hasAnyData = sleepLog || movementLog?.did_move != null || energyLog?.score

  if (!hasAnyData) return null

  const sleepHours = sleepLog?.duration_hours
  const sleepColor = !sleepHours          ? 'bg-stone-100'
    : sleepHours < 6                      ? 'bg-red-100'
    : sleepHours < 7                      ? 'bg-amber-100'
    : 'bg-emerald-100'

  const moveColor = movementLog?.did_move == null ? 'bg-stone-100'
    : movementLog.did_move                         ? 'bg-emerald-100'
    : 'bg-stone-100'

  const stressLevel = movementLog?.stress_level
  const stressColor = !stressLevel     ? 'bg-stone-100'
    : stressLevel <= 2                 ? 'bg-emerald-100'
    : stressLevel <= 3                 ? 'bg-amber-100'
    : 'bg-red-100'

  const energyScore = energyLog?.score
  const energyColor = !energyScore    ? 'bg-stone-100'
    : energyScore <= 2                ? 'bg-red-100'
    : energyScore <= 3                ? 'bg-amber-100'
    : 'bg-emerald-100'

  return (
    <Link
      href="/health"
      className="bg-white rounded-2xl px-4 py-3 border border-stone-100 hover:border-stone-200 transition-colors block"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Sức khỏe hôm nay</p>
        <ChevronRight size={14} className="text-stone-300" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Pill
          emoji="💤"
          value={sleepHours != null ? `${sleepHours}h` : '—'}
          sub="Ngủ"
          color={sleepColor}
        />
        <Pill
          emoji={movementLog?.did_move ? '🏃' : '🚶'}
          value={movementLog?.did_move == null ? '—' : movementLog.did_move ? 'Có' : 'Chưa'}
          sub="Vận động"
          color={moveColor}
        />
        <Pill
          emoji="😤"
          value={stressLevel != null ? `${stressLevel}/5` : '—'}
          sub="Stress"
          color={stressColor}
        />
        <Pill
          emoji="⚡"
          value={energyScore != null ? `${energyScore}/5` : '—'}
          sub="Năng lượng"
          color={energyColor}
        />
      </div>
    </Link>
  )
}
