'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Play, Square, Check } from 'lucide-react'

interface Props {
  userId: string
  today: string
  totalMinutesToday: number
}

export function MeditationTimer({ userId, today, totalMinutesToday }: Props) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [saved, setSaved] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  async function stop() {
    setRunning(false)
  }

  async function saveSession() {
    const mins = Math.round(elapsed / 60)
    if (mins < 1) { setElapsed(0); return }
    const supabase = createClient()
    await supabase.from('meditation_logs').insert({
      user_id: userId,
      duration_minutes: mins,
      date: today,
    })
    setSaved(true)
    setElapsed(0)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-stone-500">🧘 Thiền định</p>
        {totalMinutesToday > 0 && (
          <span className="text-xs text-stone-400">{totalMinutesToday} phút hôm nay</span>
        )}
      </div>

      {saved ? (
        <div className="flex items-center justify-center gap-2 py-4 text-green-600">
          <Check size={18} />
          <span className="text-sm font-medium">Đã lưu phiên thiền!</span>
        </div>
      ) : elapsed > 0 && !running ? (
        <div className="space-y-3">
          <p className="text-center text-3xl font-mono font-bold text-stone-800">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
          <div className="flex gap-2">
            <button onClick={() => { setElapsed(0) }} className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500">Bỏ</button>
            <button onClick={saveSession} className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium active:scale-95 transition-transform">
              Lưu ({Math.round(elapsed / 60)} phút)
            </button>
          </div>
        </div>
      ) : running ? (
        <div className="space-y-3">
          <p className="text-center text-4xl font-mono font-bold text-stone-800">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
          <button
            onClick={stop}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium active:scale-95 transition-transform"
          >
            <Square size={15} /> Dừng
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setRunning(true); setSaved(false) }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-50 text-purple-700 text-sm font-medium active:scale-95 transition-transform"
        >
          <Play size={15} /> Bắt đầu thiền
        </button>
      )}
    </div>
  )
}
