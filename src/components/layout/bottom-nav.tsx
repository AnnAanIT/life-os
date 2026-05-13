'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, User, Plus, Wallet, TrendingUp, RefreshCw, CheckSquare, Target, Heart, BookOpen, Smile, Lightbulb, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface Tab { href: string; icon: LucideIcon; label: string }

const MODULE_TABS: (Tab & { moduleId: string })[] = [
  { moduleId: 'finance',     href: '/transactions', icon: Wallet,      label: 'Tài chính' },
  { moduleId: 'investments', href: '/investments',  icon: TrendingUp,  label: 'Đầu tư' },
  { moduleId: 'habits',      href: '/habits',       icon: RefreshCw,   label: 'Thói quen' },
  { moduleId: 'tasks',       href: '/tasks',        icon: CheckSquare, label: 'Tasks' },
  { moduleId: 'goals',       href: '/goals',        icon: Target,      label: 'Mục tiêu' },
  { moduleId: 'health',      href: '/health',       icon: Heart,       label: 'Sức khỏe' },
  { moduleId: 'learning',    href: '/learning',     icon: BookOpen,    label: 'Học tập' },
  { moduleId: 'spirit',      href: '/journal',      icon: Smile,       label: 'Tinh thần' },
  { moduleId: 'insights',    href: '/insights',     icon: Lightbulb,   label: 'Insights' },
]

const HUB_TAB:    Tab = { href: '/modules', icon: LayoutGrid, label: 'All' }
const REVIEW_TAB: Tab = { href: '/review',  icon: BarChart2,  label: 'Review' }

interface Props { enabledModules?: string[] }

export function BottomNav({ enabledModules }: Props) {
  const pathname = usePathname()

  const topModules = MODULE_TABS.filter(t => enabledModules?.includes(t.moduleId))
  // 0 modules  → [Modules hub] [Review]
  // 1 module   → [module1]     [Review]
  // 2 modules  → [module1]     [module2]   (both fit directly)
  // 3+ modules → [module1]     [All hub]   (hub links to others + Review)
  const slot1: Tab = topModules[0] ?? HUB_TAB
  const slot2: Tab = topModules.length === 2
    ? topModules[1]
    : topModules.length >= 3
      ? HUB_TAB
      : REVIEW_TAB

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white/95 backdrop-blur-sm"
      style={{
        boxShadow: '0 -1px 0 0 rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        <NavItem tab={{ href: '/dashboard', icon: Home, label: 'Hôm nay' }} active={pathname.startsWith('/dashboard')} />
        <NavItem tab={slot1} active={pathname.startsWith(slot1.href)} />

        <Link
          href="/capture"
          className="flex flex-col items-center justify-center w-14 h-14 -mt-6 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-400/40 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>

        <NavItem tab={slot2} active={pathname.startsWith(slot2.href)} />
        <NavItem tab={{ href: '/me', icon: User, label: 'Tôi' }} active={pathname.startsWith('/me')} />
      </div>
    </nav>
  )
}

function NavItem({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <Link
      href={tab.href}
      className={cn(
        'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
        active ? 'text-violet-600' : 'text-stone-400 hover:text-stone-600'
      )}
    >
      <div className={cn(
        'w-8 h-6 flex items-center justify-center rounded-lg transition-all',
        active ? 'bg-violet-50' : ''
      )}>
        <tab.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
      </div>
      <span className={cn('text-[10px] font-medium', active ? 'text-violet-700' : 'text-stone-400')}>
        {tab.label}
      </span>
    </Link>
  )
}
