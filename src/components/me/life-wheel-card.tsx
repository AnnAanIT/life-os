'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { localDateStr } from '@/lib/format'
import { RotateCcw } from 'lucide-react'

type WheelScores = {
  finance: number | null
  health: number | null
  learning: number | null
  work: number | null
  relationships: number | null
  spirit: number | null
  time: number | null
}

interface Entry extends WheelScores { assessed_at: string }

interface Props {
  userId:  string
  latest:  Entry | null
}

const AXES = [
  { key: 'finance'       as const, label: 'Tài chính',     emoji: '💰' },
  { key: 'health'        as const, label: 'Sức khỏe',      emoji: '💪' },
  { key: 'learning'      as const, label: 'Phát triển',    emoji: '📚' },
  { key: 'work'          as const, label: 'Công việc',     emoji: '💼' },
  { key: 'relationships' as const, label: 'Quan hệ',       emoji: '❤️' },
  { key: 'spirit'        as const, label: 'Tinh thần',     emoji: '🧘' },
  { key: 'time'          as const, label: 'Thời gian',     emoji: '⏰' },
]

function scoreColor(n: number | null) {
  if (n == null) return 'bg-stone-100'
  if (n <= 3)    return 'bg-red-400'
  if (n <= 5)    return 'bg-amber-400'
  if (n <= 7)    return 'bg-lime-400'
  return              'bg-emerald-500'
}

function ScoreBar({ score, label, emoji }: { score: number | null; label: string; emoji: string }) {
  const pct = score != null ? (score / 10) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm leading-none w-5 shrink-0">{emoji}</span>
      <span className="text-xs text-stone-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', scoreColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-stone-600 w-6 text-right tabular-nums">
        {score ?? '—'}
      </span>
    </div>
  )
}

export function LifeWheelCard({ userId, latest }: Props) {
  const router  = useRouter()
  const [assessing, setAssessing] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [scores,    setScores]    = useState<WheelScores>({
    finance:       latest?.finance       ?? null,
    health:        latest?.health        ?? null,
    learning:      latest?.learning      ?? null,
    work:          latest?.work          ?? null,
    relationships: latest?.relationships ?? null,
    spirit:        latest?.spirit        ?? null,
    time:          latest?.time          ?? null,
  })

  const avgScore = latest
    ? (() => {
        const vals = AXES.map(a => latest[a.key]).filter((v): v is number => v != null)
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
      })()
    : null

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('life_wheel_entries').insert({
      user_id:       userId,
      assessed_at:   localDateStr(),
      ...scores,
    })
    setSaving(false)
    setAssessing(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-100 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-700">Life Wheel</p>
          {latest && (
            <p className="text-[10px] text-stone-400 mt-0.5">
              Đánh giá lần cuối: {new Date(latest.assessed_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {avgScore && <span className="ml-1">· TB {avgScore}/10</span>}
            </p>
          )}
        </div>
        <button
          onClick={() => setAssessing(v => !v)}
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          <RotateCcw size={11} />
          {assessing ? 'Huỷ' : latest ? 'Đánh giá lại' : 'Đánh giá ngay'}
        </button>
      </div>

      {/* View: latest scores */}
      {!assessing && latest && (
        <div className="space-y-2.5">
          {AXES.map(a => (
            <ScoreBar key={a.key} score={latest[a.key]} label={a.label} emoji={a.emoji} />
          ))}
        </div>
      )}

      {!assessing && !latest && (
        <div className="py-4 text-center">
          <p className="text-sm text-stone-400">Chưa có đánh giá nào.</p>
          <p className="text-xs text-stone-300 mt-1">Đánh giá 7 lĩnh vực cuộc sống để thấy bức tranh tổng thể.</p>
        </div>
      )}

      {/* Edit: score input */}
      {assessing && (
        <div className="space-y-3">
          <p className="text-[11px] text-stone-400">Cho điểm từng lĩnh vực (1 = rất kém · 10 = hoàn hảo)</p>
          {AXES.map(a => (
            <div key={a.key}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm leading-none">{a.emoji}</span>
                <p className="text-xs font-medium text-stone-600">{a.label}</p>
                {scores[a.key] != null && (
                  <span className="text-xs text-stone-400 ml-auto">{scores[a.key]}/10</span>
                )}
              </div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setScores(prev => ({ ...prev, [a.key]: prev[a.key] === n ? null : n }))}
                    className={cn(
                      'h-7 rounded-lg text-[10px] font-bold transition-all active:scale-90',
                      scores[a.key] === n
                        ? `${scoreColor(n)} text-white scale-110`
                        : 'bg-stone-50 text-stone-400 hover:bg-stone-100',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
          </button>
        </div>
      )}
    </div>
  )
}
