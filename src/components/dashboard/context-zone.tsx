'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Inbox } from 'lucide-react'
import Link from 'next/link'
import { HealthSummary } from './health-summary'
import { GoalsPreview } from './goals-preview'
import { HappinessScoreCard } from './happiness-score-card'

interface GoalSummary {
  id: string
  title: string
  value_tag: string
  progress: number
  kr_total: number
  kr_done: number
}

interface Props {
  userId:      string
  todayScore:  { score: number; note: string | null } | null
  energyLog:   { score: number | null; factors: string[] } | null
  sleepLog:    { duration_hours: number | null; quality: number | null } | null
  movementLog: { did_move: boolean | null; stress_level: number | null } | null
  goals:       GoalSummary[]
  inboxCount:  number
}

export function ContextZone({
  userId, todayScore, energyLog, sleepLog, movementLog, goals, inboxCount,
}: Props) {
  const [open, setOpen] = useState(false)

  const summaryParts = [
    sleepLog?.duration_hours  && `💤 ${sleepLog.duration_hours}h`,
    movementLog?.did_move === true  && '🏃 Đã vận động',
    movementLog?.did_move === false && '🚶 Chưa vận động',
    energyLog?.score          && `⚡ ${energyLog.score}/5`,
    todayScore?.score         && `😊 ${todayScore.score}/10`,
    inboxCount > 0            && `📥 ${inboxCount}`,
  ].filter(Boolean) as string[]

  const summaryText = summaryParts.length > 0
    ? summaryParts.join(' · ')
    : 'Sức khỏe · Mục tiêu · Hạnh phúc'

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="lg:hidden w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-stone-100 hover:bg-stone-50 transition-colors"
      >
        <span className="text-xs text-stone-400 text-left truncate pr-2">{summaryText}</span>
        {open
          ? <ChevronUp size={14} className="text-stone-300 shrink-0" />
          : <ChevronDown size={14} className="text-stone-300 shrink-0" />
        }
      </button>

      <div className={`space-y-2 ${open ? 'block' : 'hidden'} lg:block`}>
        <HealthSummary
          energyLog={energyLog}
          sleepLog={sleepLog}
          movementLog={movementLog}
        />
        <GoalsPreview goals={goals} />
        <HappinessScoreCard userId={userId} todayScore={todayScore} />
        {inboxCount > 0 && (
          <Link
            href="/capture"
            className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-stone-100 hover:border-stone-200 transition-colors"
          >
            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
              <Inbox size={15} className="text-stone-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-700">Inbox</p>
              <p className="text-xs text-stone-400">{inboxCount} mục chưa xử lý</p>
            </div>
            <div className="w-5 h-5 bg-stone-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
              {inboxCount}
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
