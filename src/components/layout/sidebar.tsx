'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BarChart2, User, Plus, Sparkles,
  DollarSign, Landmark, RotateCcw, CheckSquare,
  TrendingUp, Heart, BookOpen, PenLine, Brain,
  Zap, Grid3X3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CORE_ITEMS = [
  { href: '/dashboard', icon: Home,     label: 'Hôm nay',       moduleId: null },
  { href: '/review',    icon: BarChart2, label: 'Review',        moduleId: null },
  { href: '/capture',   icon: Zap,       label: 'Quick Capture', moduleId: null },
]

const MODULE_ITEMS = [
  { href: '/transactions', icon: DollarSign,  label: 'Tài chính',  moduleId: 'finance' },
  { href: '/investments',  icon: Landmark,    label: 'Đầu tư',     moduleId: 'investments' },
  { href: '/habits',       icon: RotateCcw,   label: 'Thói quen',  moduleId: 'habits' },
  { href: '/tasks',        icon: CheckSquare, label: 'Tasks',      moduleId: 'tasks' },
  { href: '/goals',        icon: TrendingUp,  label: 'Mục tiêu',   moduleId: 'goals' },
  { href: '/health',       icon: Heart,       label: 'Sức khỏe',   moduleId: 'health' },
  { href: '/learning',     icon: BookOpen,    label: 'Học tập',    moduleId: 'learning' },
  { href: '/journal',      icon: PenLine,     label: 'Nhật ký',    moduleId: 'spirit' },
  { href: '/insights',     icon: Brain,       label: 'Insights',   moduleId: 'insights' },
]

interface Props {
  displayName:    string
  annualTheme?:   string | null
  enabledModules: string[]
}

export function Sidebar({ displayName, annualTheme, enabledModules }: Props) {
  const pathname = usePathname()
  const visibleModuleItems = MODULE_ITEMS.filter(
    item => item.moduleId && enabledModules.includes(item.moduleId)
  )

  const navGroups = [
    { label: 'Chính',    items: CORE_ITEMS },
    { label: 'Cuộc sống', items: visibleModuleItems },
  ]

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-slate-900 h-screen sticky top-0 shrink-0">

      {/* ── Brand ── */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-none">Life OS</p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{displayName}</p>
          </div>
        </div>

        {annualTheme && (
          <div className="mt-3 bg-white/10 border border-white/10 rounded-xl px-3 py-2">
            <p className="text-[9px] text-violet-300 uppercase tracking-wider font-medium mb-0.5">Chủ đề năm</p>
            <p className="text-xs font-medium text-white truncate">✦ {annualTheme}</p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 pb-3 overflow-y-auto space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all',
                      active
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5',
                    )}
                  >
                    <item.icon
                      size={15}
                      strokeWidth={active ? 2.5 : 1.8}
                      className={active ? 'text-violet-400' : ''}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Quick Capture CTA ── */}
      <div className="px-3 pb-5 pt-2 border-t border-white/5">
        <Link
          href="/capture"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-sm shadow-black/20"
        >
          <Plus size={16} strokeWidth={2.5} />
          Ghi nhanh
        </Link>
        <Link
          href="/modules"
          className={cn(
            'mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all',
            pathname.startsWith('/modules')
              ? 'bg-white/10 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/5',
          )}
        >
          <Grid3X3 size={15} strokeWidth={pathname.startsWith('/modules') ? 2.5 : 1.8}
            className={pathname.startsWith('/modules') ? 'text-violet-400' : ''} />
          Modules
        </Link>
        <Link
          href="/me"
          className={cn(
            'mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all',
            pathname.startsWith('/me')
              ? 'bg-white/10 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/5',
          )}
        >
          <User size={15} strokeWidth={pathname.startsWith('/me') ? 2.5 : 1.8}
            className={pathname.startsWith('/me') ? 'text-violet-400' : ''} />
          Hồ sơ
        </Link>
      </div>
    </aside>
  )
}
