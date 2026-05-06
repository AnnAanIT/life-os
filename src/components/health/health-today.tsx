'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Droplets, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SleepLog {
  quality: number | null
  duration_hours: number | null
}

interface Props {
  userId: string
  today: string
  waterGlasses: number
  sleepLog: SleepLog | null
}

const SLEEP_QUALITY = [
  { value: 1, label: 'Rất tệ', emoji: '😫' },
  { value: 2, label: 'Tệ', emoji: '😴' },
  { value: 3, label: 'Bình thường', emoji: '😐' },
  { value: 4, label: 'Tốt', emoji: '😊' },
  { value: 5, label: 'Rất tốt', emoji: '😄' },
]

export function HealthToday({ userId, today, waterGlasses, sleepLog }: Props) {
  const router = useRouter()
  const [glasses, setGlasses] = useState(waterGlasses)
  const [updating, setUpdating] = useState(false)
  const [showSleep, setShowSleep] = useState(false)
  const [bedTime, setBedTime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [sleepQuality, setSleepQuality] = useState(sleepLog?.quality ?? 0)
  const GOAL = 8

  async function addGlass() {
    const newCount = glasses + 1
    setGlasses(newCount)
    setUpdating(true)
    const supabase = createClient()
    await supabase.from('water_logs').upsert(
      { user_id: userId, date: today, glasses: newCount },
      { onConflict: 'user_id,date' }
    )
    setUpdating(false)
    router.refresh()
  }

  async function removeGlass() {
    if (glasses <= 0) return
    const newCount = glasses - 1
    setGlasses(newCount)
    const supabase = createClient()
    await supabase.from('water_logs').upsert(
      { user_id: userId, date: today, glasses: newCount },
      { onConflict: 'user_id,date' }
    )
    router.refresh()
  }

  async function saveSleep() {
    if (!sleepQuality) return
    const supabase = createClient()
    let duration: number | null = null
    if (bedTime && wakeTime) {
      const [bh, bm] = bedTime.split(':').map(Number)
      const [wh, wm] = wakeTime.split(':').map(Number)
      let mins = (wh * 60 + wm) - (bh * 60 + bm)
      if (mins < 0) mins += 24 * 60
      duration = Math.round((mins / 60) * 100) / 100
    }
    await supabase.from('sleep_logs').upsert(
      { user_id: userId, date: today, bed_time: bedTime || null, wake_time: wakeTime || null, duration_hours: duration, quality: sleepQuality },
      { onConflict: 'user_id,date' }
    )
    setShowSleep(false)
    router.refresh()
  }

  const pct = Math.min((glasses / GOAL) * 100, 100)

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Water */}
      <div className="bg-white rounded-2xl p-4 border border-stone-100">
        <div className="flex items-center gap-1.5 mb-3">
          <Droplets size={15} className="text-blue-400" />
          <p className="text-xs font-medium text-stone-500">Uống nước</p>
        </div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-2xl font-bold text-stone-800">{glasses}</span>
          <span className="text-xs text-stone-400 mb-1">/{GOAL} ly</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={removeGlass}
            disabled={glasses <= 0}
            className="flex-1 py-1.5 rounded-lg border border-stone-200 text-stone-400 text-sm font-bold disabled:opacity-30 active:scale-95 transition-transform"
          >−</button>
          <button
            onClick={addGlass}
            disabled={updating}
            className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-bold active:scale-95 transition-transform"
          >+</button>
        </div>
      </div>

      {/* Sleep */}
      <div className="bg-white rounded-2xl p-4 border border-stone-100">
        <div className="flex items-center gap-1.5 mb-3">
          <Moon size={15} className="text-indigo-400" />
          <p className="text-xs font-medium text-stone-500">Giấc ngủ</p>
        </div>
        {sleepLog?.quality && !showSleep ? (
          <div className="space-y-1">
            <p className="text-2xl">{SLEEP_QUALITY.find(s => s.value === sleepLog.quality)?.emoji}</p>
            {sleepLog.duration_hours && (
              <p className="text-sm font-semibold text-stone-700">{sleepLog.duration_hours}h</p>
            )}
            <button onClick={() => setShowSleep(true)} className="text-xs text-stone-400 hover:text-stone-600 underline">Sửa</button>
          </div>
        ) : showSleep ? (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <input type="time" value={bedTime} onChange={e => setBedTime(e.target.value)} className="flex-1 text-xs border border-stone-200 rounded-lg px-2 py-1 focus:outline-none" placeholder="Ngủ" />
              <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} className="flex-1 text-xs border border-stone-200 rounded-lg px-2 py-1 focus:outline-none" placeholder="Dậy" />
            </div>
            <div className="flex gap-1">
              {SLEEP_QUALITY.map(s => (
                <button key={s.value} onClick={() => setSleepQuality(s.value)}
                  className={cn('flex-1 text-sm rounded-lg p-1 transition-colors', sleepQuality === s.value ? 'bg-indigo-50' : 'hover:bg-stone-50')}
                >{s.emoji}</button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowSleep(false)} className="flex-1 text-xs text-stone-400 border border-stone-200 rounded-lg py-1">Huỷ</button>
              <button onClick={saveSleep} disabled={!sleepQuality} className="flex-1 text-xs bg-indigo-500 text-white rounded-lg py-1 disabled:opacity-40">Lưu</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-stone-400 mb-3">Đêm qua ngủ thế nào?</p>
            <button onClick={() => setShowSleep(true)} className="w-full py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium active:scale-95 transition-transform">
              Ghi nhận
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
