import { cn } from '@/lib/utils'

interface DayData {
  date: string
  dayLabel: string
  isToday: boolean
  sleepQuality: number | null
  didMove: boolean | null
  energyScore: number | null
}

interface Props {
  days: DayData[]
}

function QualityDot({ value, max, activeColor }: { value: number | null; max: number; activeColor: string }) {
  if (value == null) return <div className="w-1.5 h-1.5 rounded-full bg-stone-100" />
  const filled = Math.round((value / max) * 3)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map(i => (
        <div key={i} className={cn('w-1 h-1 rounded-full', i <= filled ? activeColor : 'bg-stone-100')} />
      ))}
    </div>
  )
}

export function HealthWeekStrip({ days }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 px-4 py-3">
      <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-3">7 ngày qua</p>
      <div className="flex justify-between">
        {days.map(day => (
          <div key={day.date} className="flex flex-col items-center gap-1.5">
            <span className={cn('text-[9px] font-medium', day.isToday ? 'text-stone-700' : 'text-stone-300')}>
              {day.dayLabel}
            </span>

            {/* Energy score circle */}
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors',
              day.energyScore == null
                ? day.isToday ? 'bg-violet-100 text-violet-300' : 'bg-stone-50 text-stone-200'
                : day.energyScore >= 4 ? 'bg-emerald-100 text-emerald-700'
                : day.energyScore >= 3 ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-600',
            )}>
              {day.energyScore ?? (day.isToday ? '·' : '')}
            </div>

            {/* Sleep quality dots */}
            <QualityDot value={day.sleepQuality} max={5} activeColor="bg-sky-400" />

            {/* Movement indicator */}
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              day.didMove === true  ? 'bg-emerald-400'
              : day.didMove === false ? 'bg-stone-200'
              : 'bg-stone-100',
            )} />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-stone-50">
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded bg-emerald-100" />
          <span className="text-[9px] text-stone-400">Năng lượng</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">{[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-sky-400" />)}</div>
          <span className="text-[9px] text-stone-400">Giấc ngủ</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-stone-400">Vận động</span>
        </div>
      </div>
    </div>
  )
}
