'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Moon, ChevronRight, CheckCircle2 } from 'lucide-react'

interface Props {
  isDone: boolean
}

export function EveningCTA({ isDone }: Props) {
  const [isEvening] = useState(() => new Date().getHours() >= 18)

  // Before 6pm: only show if already done (so user can see progress)
  if (!isDone && !isEvening) return null

  if (isDone) {
    return (
      <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3 border border-stone-100">
        <CheckCircle2 size={16} className="text-stone-400 shrink-0" />
        <p className="text-xs text-stone-400 flex-1">Đã kết thúc ngày. Nghỉ ngơi nhé.</p>
      </div>
    )
  }

  return (
    <Link
      href="/evening"
      className="flex items-center gap-3 bg-violet-600 rounded-xl px-4 py-3.5 hover:bg-violet-700 transition-colors"
    >
      <Moon size={16} className="text-stone-300 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">Kết thúc ngày</p>
        <p className="text-xs text-stone-400 mt-0.5">Tick habit · Điểm hạnh phúc · MIT ngày mai</p>
      </div>
      <ChevronRight size={14} className="text-stone-400" />
    </Link>
  )
}
