'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { localDateStr } from '@/lib/format'
import { Moon, Clock } from 'lucide-react'

interface Props {
  userId: string
  todayLog: { bedtime: string | null; wake_time: string | null; duration_hours: number | null; quality: number | null } | null
}

const QUALITY = [
  { value: 1, label: 'Rất kém' },
  { value: 2, label: 'Kém' },
  { value: 3, label: 'Ổn' },
  { value: 4, label: 'Tốt' },
  { value: 5, label: 'Rất tốt' },
]

const HOURS   = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

function pad(n: number) { return String(n).padStart(2, '0') }

function parseTimeStr(s: string | null | undefined): [number, number] | null {
  if (!s) return null
  const [h, m] = s.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  const roundedM = Math.round(m / 15) * 15
  return [h, roundedM >= 60 ? 45 : roundedM]
}

function calcDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  const bedMins = bh * 60 + bm
  let wakeMins  = wh * 60 + wm
  if (wakeMins <= bedMins) wakeMins += 24 * 60
  return Math.round((wakeMins - bedMins) / 60 * 10) / 10
}

export function SleepLogCard({ userId, todayLog }: Props) {
  const parsedBed  = parseTimeStr(todayLog?.bedtime)
  const parsedWake = parseTimeStr(todayLog?.wake_time)

  const [bedH,    setBedH]    = useState<number | ''>(parsedBed  ? parsedBed[0]  : '')
  const [bedM,    setBedM]    = useState<number>(parsedBed  ? parsedBed[1]  : 0)
  const [wakeH,   setWakeH]   = useState<number | ''>(parsedWake ? parsedWake[0] : '')
  const [wakeM,   setWakeM]   = useState<number>(parsedWake ? parsedWake[1] : 0)
  const [quality, setQuality] = useState<number | null>(todayLog?.quality ?? null)
  const [saving,  setSaving]  = useState(false)

  const bedtime  = bedH  !== '' ? `${pad(bedH)}:${pad(bedM)}`   : null
  const wakeTime = wakeH !== '' ? `${pad(wakeH)}:${pad(wakeM)}` : null
  const duration = bedtime && wakeTime ? calcDuration(bedtime, wakeTime) : null

  async function save(patch: Partial<{ bedtime: string; wake_time: string; quality: number }>) {
    if (saving) return
    setSaving(true)
    const supabase = createClient()
    const next = {
      bedtime:   patch.bedtime   ?? bedtime  ?? null,
      wake_time: patch.wake_time ?? wakeTime ?? null,
      quality:   patch.quality   ?? quality  ?? null,
    }
    const dur = next.bedtime && next.wake_time
      ? calcDuration(next.bedtime, next.wake_time)
      : null
    await supabase.from('sleep_logs').upsert(
      { user_id: userId, date: localDateStr(), ...next, duration_hours: dur },
      { onConflict: 'user_id,date' },
    )
    setSaving(false)
  }

  const durationColor = duration == null ? ''
    : duration < 5   ? 'text-red-500'
    : duration < 6.5 ? 'text-amber-500'
    : duration <= 9  ? 'text-emerald-600'
    : 'text-amber-500'

  return (
    <div className="bg-white rounded-2xl px-4 py-4 border border-stone-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon size={15} className="text-indigo-400" />
          <p className="text-sm font-medium text-stone-700">Giấc ngủ tối qua</p>
        </div>
        {duration != null && (
          <span className={cn('text-sm font-semibold tabular-nums', durationColor)}>
            {duration}h
          </span>
        )}
      </div>

      {/* Time dropdowns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bedtime */}
        <div className={cn(
          'flex flex-col gap-2 px-3 py-3 rounded-xl border transition-colors',
          bedH !== '' ? 'border-indigo-200 bg-indigo-50' : 'border-stone-100',
        )}>
          <span className="text-[10px] text-stone-400 uppercase tracking-wide">Giờ ngủ</span>
          <div className="flex items-center gap-1">
            <select
              value={bedH}
              onChange={e => {
                const h = Number(e.target.value)
                setBedH(h)
                save({ bedtime: `${pad(h)}:${pad(bedM)}` })
              }}
              className={cn(
                'flex-1 min-w-0 text-base font-semibold tabular-nums bg-transparent outline-none cursor-pointer',
                bedH !== '' ? 'text-indigo-600' : 'text-stone-300',
              )}
            >
              <option value="">--</option>
              {HOURS.map(h => <option key={h} value={h}>{pad(h)}</option>)}
            </select>
            <span className="text-stone-400 font-bold">:</span>
            <select
              value={bedM}
              onChange={e => {
                const m = Number(e.target.value)
                setBedM(m)
                if (bedH !== '') save({ bedtime: `${pad(bedH as number)}:${pad(m)}` })
              }}
              className={cn(
                'flex-1 min-w-0 text-base font-semibold tabular-nums bg-transparent outline-none cursor-pointer',
                bedH !== '' ? 'text-indigo-600' : 'text-stone-300',
              )}
            >
              {MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
            </select>
          </div>
        </div>

        {/* Wake time */}
        <div className={cn(
          'flex flex-col gap-2 px-3 py-3 rounded-xl border transition-colors',
          wakeH !== '' ? 'border-amber-200 bg-amber-50' : 'border-stone-100',
        )}>
          <span className="text-[10px] text-stone-400 uppercase tracking-wide">Giờ thức</span>
          <div className="flex items-center gap-1">
            <select
              value={wakeH}
              onChange={e => {
                const h = Number(e.target.value)
                setWakeH(h)
                save({ wake_time: `${pad(h)}:${pad(wakeM)}` })
              }}
              className={cn(
                'flex-1 min-w-0 text-base font-semibold tabular-nums bg-transparent outline-none cursor-pointer',
                wakeH !== '' ? 'text-amber-600' : 'text-stone-300',
              )}
            >
              <option value="">--</option>
              {HOURS.map(h => <option key={h} value={h}>{pad(h)}</option>)}
            </select>
            <span className="text-stone-400 font-bold">:</span>
            <select
              value={wakeM}
              onChange={e => {
                const m = Number(e.target.value)
                setWakeM(m)
                if (wakeH !== '') save({ wake_time: `${pad(wakeH as number)}:${pad(m)}` })
              }}
              className={cn(
                'flex-1 min-w-0 text-base font-semibold tabular-nums bg-transparent outline-none cursor-pointer',
                wakeH !== '' ? 'text-amber-600' : 'text-stone-300',
              )}
            >
              {MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Quality */}
      <div>
        <p className="text-[11px] text-stone-400 mb-2">Chất lượng giấc ngủ</p>
        <div className="grid grid-cols-5 gap-1.5">
          {QUALITY.map(q => (
            <button
              key={q.value}
              onClick={() => { setQuality(q.value); save({ quality: q.value }) }}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[10px] transition-all active:scale-95',
                quality === q.value
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-stone-100 text-stone-400 hover:border-stone-300',
              )}
            >
              <span className="font-bold text-xs">{q.value}</span>
              <span className="leading-tight text-center">{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {duration != null && (
        <p className="text-[11px] text-stone-400 flex items-center gap-1">
          <Clock size={10} />
          {duration < 6
            ? 'Ngủ ít hơn khuyến nghị — năng lượng có thể bị ảnh hưởng hôm nay.'
            : duration >= 7
            ? 'Ngủ đủ giấc. Tốt lắm!'
            : 'Gần đủ. Cố thêm 30 phút tối nay nhé.'}
        </p>
      )}
    </div>
  )
}
