'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TuViTab } from './tu-vi-tab'
import { KinhDichTab } from './kinh-dich-tab'

export interface Reading {
  id: string
  created_at: string
  hexagram_num: number
  question: string | null
  reflection: string | null
}

interface Props {
  userId: string
  birthDate: string | null
  birthHour: number | null
  initialReadings: Reading[]
}

type Tab = 'tu-vi' | 'kinh-dich'

const TABS: { id: Tab; label: string }[] = [
  { id: 'tu-vi',     label: 'Tử Vi' },
  { id: 'kinh-dich', label: 'Kinh Dịch' },
]

export function WisdomTabs({ userId, birthDate, birthHour, initialReadings }: Props) {
  const [tab, setTab] = useState<Tab>('tu-vi')

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-stone-100 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
              tab === t.id
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tu-vi'
        ? <TuViTab birthDate={birthDate} birthHour={birthHour} />
        : <KinhDichTab userId={userId} initialReadings={initialReadings} />
      }
    </div>
  )
}
