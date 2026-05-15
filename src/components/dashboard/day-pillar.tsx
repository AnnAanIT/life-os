import type { DaySummary } from '@/lib/wisdom'

interface Props {
  summary:      DaySummary
  lunarDateStr: string
  currentHour:  number  // 0–23, server-computed (UTC+7)
}

// Module-level: built once, shared across all renders
const CHI_RANGE: Record<string, { start: number; end: number }> = {
  'Tý':   { start: 23, end: 1  },
  'Sửu':  { start: 1,  end: 3  },
  'Dần':  { start: 3,  end: 5  },
  'Mão':  { start: 5,  end: 7  },
  'Thìn': { start: 7,  end: 9  },
  'Tỵ':   { start: 9,  end: 11 },
  'Ngọ':  { start: 11, end: 13 },
  'Mùi':  { start: 13, end: 15 },
  'Thân': { start: 15, end: 17 },
  'Dậu':  { start: 17, end: 19 },
  'Tuất': { start: 19, end: 21 },
  'Hợi':  { start: 21, end: 23 },
}

function isActive(start: number, end: number, hour: number): boolean {
  // Giờ Tý crosses midnight (start=23, end=1)
  if (start > end) return hour >= start || hour < end
  return hour >= start && hour < end
}

function isPast(start: number, end: number, hour: number): boolean {
  // Midnight-crossing hours: past when current hour is between end and the next start
  // e.g. Tý (23–01): past if 01 ≤ hour < 23
  if (start > end) return hour >= end && hour < start
  return hour >= end
}

// Hours until `start`, wrapping midnight correctly
function hoursUntil(start: number, currentHour: number): number {
  return start >= currentHour ? start - currentHour : 24 - currentHour + start
}

export function DayPillarCard({ summary, lunarDateStr, currentHour }: Props) {
  const { canChi, quality, luckyHours } = summary
  const isGood = quality.quality === 'hoang-dao'

  // Find active lucky hour (if any) — uses module-level CHI_RANGE
  const activeChi = luckyHours.find(h => {
    const range = CHI_RANGE[h.chi]
    return range ? isActive(range.start, range.end, currentHour) : false
  })

  // Sort: active first, then upcoming by actual time-until-start (midnight-safe), then past
  const sortedHours = luckyHours.map(h => {
    const range  = CHI_RANGE[h.chi]
    const active = range ? isActive(range.start, range.end, currentHour) : false
    const past   = range ? isPast(range.start, range.end, currentHour) : false
    const until  = range ? hoursUntil(range.start, currentHour) : 99
    return { ...h, active, past, until }
  }).sort((a, b) => {
    if (a.active && !b.active) return -1
    if (!a.active && b.active) return 1
    if (!a.past && b.past) return -1
    if (a.past && !b.past) return 1
    return a.until - b.until  // nearest upcoming first, correctly handles midnight wrap
  })

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-100">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-stone-800">{lunarDateStr}</p>
          <p className="text-xs text-stone-400 mt-0.5">Ngày {canChi.full}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
          isGood
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-stone-100 text-stone-500 border-stone-200'
        }`}>
          {isGood ? '✦ Hoàng Đạo' : '· Hắc Đạo'}
        </span>
      </div>

      {/* Lucky hours */}
      {luckyHours.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-stone-400 uppercase tracking-widest mb-2">
            Giờ hoàng đạo
            {activeChi && <span className="ml-1.5 text-amber-500 normal-case font-medium">· đang trong giờ {activeChi.chi}</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sortedHours.map(h => (
              <span
                key={h.chi}
                className={`text-[11px] px-2 py-0.5 rounded-lg font-medium border transition-colors ${
                  h.active
                    ? 'bg-amber-400 text-white border-amber-400'
                    : h.past
                      ? 'bg-stone-50 text-stone-300 border-stone-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}
              >
                {h.chi} {h.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
