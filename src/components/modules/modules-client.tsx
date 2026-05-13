'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  DollarSign, CheckSquare, RotateCcw, TrendingUp,
  BookOpen, Heart, Sparkles, Landmark, Brain,
  BarChart2, Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ALL_MODULES = [
  { id: 'finance',      name: 'Tài chính',  desc: 'Thu chi & ngân sách',    icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', href: '/transactions' },
  { id: 'investments',  name: 'Đầu tư',     desc: 'Tài sản & Net Worth',    icon: Landmark,   color: 'bg-amber-50 text-amber-700',    href: '/investments' },
  { id: 'habits',       name: 'Thói quen',  desc: 'Xây dựng từng ngày',     icon: RotateCcw,  color: 'bg-amber-50 text-amber-600',    href: '/habits' },
  { id: 'tasks',        name: 'Tasks',      desc: '3 MIT mỗi ngày',         icon: CheckSquare,color: 'bg-blue-50 text-blue-600',      href: '/tasks' },
  { id: 'goals',        name: 'Mục tiêu',   desc: 'OKRs & milestones',      icon: TrendingUp, color: 'bg-purple-50 text-purple-600',  href: '/goals' },
  { id: 'health',       name: 'Sức khỏe',   desc: 'Vận động & giấc ngủ',    icon: Heart,      color: 'bg-red-50 text-red-500',        href: '/health' },
  { id: 'learning',     name: 'Học tập',    desc: 'Sách, khóa học',         icon: BookOpen,   color: 'bg-sky-50 text-sky-600',        href: '/learning' },
  { id: 'spirit',       name: 'Tinh thần',  desc: 'Nhật ký & cảm xúc',     icon: Sparkles,   color: 'bg-rose-50 text-rose-500',      href: '/journal' },
  { id: 'insights',     name: 'Insights',   desc: 'Pattern từ dữ liệu',     icon: Brain,      color: 'bg-violet-50 text-violet-500',  href: '/insights' },
]

interface Props {
  userId: string
  initialEnabled: string[]
}

export function ModulesClient({ userId, initialEnabled }: Props) {
  const router = useRouter()
  const [enabled, setEnabled] = useState<string[]>(initialEnabled)
  const [saving, setSaving] = useState(false)

  async function toggle(moduleId: string) {
    const next = enabled.includes(moduleId)
      ? enabled.filter(m => m !== moduleId)
      : [...enabled, moduleId]

    setEnabled(next)
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ enabled_modules: next })
      .eq('id', userId)

    setSaving(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Modules</h1>
          <p className="text-stone-400 text-sm">
            {enabled.length}/{ALL_MODULES.length} đang bật
            {saving && <span className="ml-2 text-xs text-violet-500">Đang lưu...</span>}
          </p>
        </div>
      </div>

      {/* System links */}
      <div className="flex gap-2 mb-4">
        <Link
          href="/review"
          className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-stone-100 hover:border-stone-200 transition-colors"
        >
          <BarChart2 size={16} className="text-violet-500" />
          <div>
            <p className="text-xs font-semibold text-stone-700">Review</p>
            <p className="text-[10px] text-stone-400">Nhìn lại & điều chỉnh</p>
          </div>
        </Link>
        <Link
          href="/evening"
          className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-stone-100 hover:border-stone-200 transition-colors"
        >
          <Moon size={16} className="text-indigo-400" />
          <div>
            <p className="text-xs font-semibold text-stone-700">Buổi tối</p>
            <p className="text-[10px] text-stone-400">Kết thúc ngày</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_MODULES.map(mod => {
          const Icon = mod.icon
          const isEnabled = enabled.includes(mod.id)

          return (
            <div
              key={mod.id}
              className={cn(
                'bg-white rounded-2xl p-4 border transition-all',
                isEnabled ? 'border-stone-100' : 'border-stone-100 opacity-50'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', mod.color)}>
                  <Icon size={20} />
                </div>
                <button
                  onClick={() => toggle(mod.id)}
                  className={cn(
                    'relative w-10 h-6 rounded-full transition-colors shrink-0',
                    isEnabled ? 'bg-violet-600' : 'bg-stone-200'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    isEnabled ? 'translate-x-5' : 'translate-x-1'
                  )} />
                </button>
              </div>

              <Link href={mod.href} className={cn(!isEnabled && 'pointer-events-none')}>
                <p className="text-sm font-semibold text-stone-800">{mod.name}</p>
                <p className="text-xs text-stone-400 mt-0.5 leading-snug">{mod.desc}</p>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
