'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentMonth: string // "2026-04"
}

export function MonthNav({ currentMonth }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [y, m] = currentMonth.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  const today = new Date()
  const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const isCurrentMonth = currentMonth === todayMonth

  function navigate(delta: number) {
    const next = new Date(y, m - 1 + delta, 1)
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    if (nextStr > todayMonth) return
    if (nextStr === todayMonth) {
      router.push(pathname)
    } else {
      router.push(`${pathname}?month=${nextStr}`)
    }
  }

  return (
    <div className="flex items-center justify-between px-1">
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-xl hover:bg-stone-100 active:bg-stone-200 transition-colors"
      >
        <ChevronLeft size={18} className="text-stone-500" />
      </button>
      <p className="text-sm font-semibold text-stone-700 capitalize">{label}</p>
      <button
        onClick={() => navigate(1)}
        disabled={isCurrentMonth}
        className="p-2 rounded-xl hover:bg-stone-100 active:bg-stone-200 transition-colors disabled:opacity-25"
      >
        <ChevronRight size={18} className="text-stone-500" />
      </button>
    </div>
  )
}
