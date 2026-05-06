function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function getTodayLabel() {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

interface Props {
  name:            string
  annualTheme?:    string | null
  energyScore?:    number | null
  habitsDone?:     number
  habitsTotal?:    number
  mitRemaining?:   number
  happinessScore?: number | null
}

export function DashboardGreeting({
  name,
  annualTheme,
  energyScore,
  habitsDone = 0,
  habitsTotal = 0,
  mitRemaining = 0,
  happinessScore,
}: Props) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm shadow-violet-200/40">
      {/* ── Gradient hero ── */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-500 to-purple-500 px-5 pt-5 pb-4 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/10" />

        <p className="text-[11px] text-white/70 capitalize mb-0.5 relative">{getTodayLabel()}</p>
        <p className="text-sm text-white/80 relative">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-white mt-0.5 relative">{name} ✨</h1>

        {annualTheme ? (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 relative">
            <span className="text-[11px] text-white font-medium">✦ {annualTheme}</span>
          </div>
        ) : (
          <p className="text-xs text-white/60 mt-2 relative">Hôm nay muốn làm gì?</p>
        )}
      </div>

      {/* ── Stat chips ── */}
      <div className="bg-white border-t border-violet-100 px-4 py-3 flex items-center divide-x divide-stone-100">
        <StatChip
          emoji="⚡"
          value={energyScore ? `${energyScore}/5` : '—'}
          label="Năng lượng"
        />
        {habitsTotal > 0 && (
          <StatChip
            emoji="✓"
            value={`${habitsDone}/${habitsTotal}`}
            label="Thói quen"
            highlight={habitsDone === habitsTotal}
          />
        )}
        <StatChip
          emoji="⭐"
          value={mitRemaining === 0 ? 'Xong!' : `${mitRemaining} còn`}
          label="MIT"
          highlight={mitRemaining === 0}
        />
        {happinessScore != null && (
          <StatChip
            emoji="😊"
            value={`${happinessScore}/10`}
            label="Hạnh phúc"
          />
        )}
      </div>
    </div>
  )
}

function StatChip({
  emoji, value, label, highlight = false,
}: {
  emoji: string; value: string; label: string; highlight?: boolean
}) {
  return (
    <div className="flex-1 flex flex-col items-center px-2 first:pl-0 last:pr-0">
      <span className="text-base leading-none mb-0.5">{emoji}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-violet-600' : 'text-stone-700'}`}>
        {value}
      </span>
      <span className="text-[9px] text-stone-400 mt-0.5">{label}</span>
    </div>
  )
}
