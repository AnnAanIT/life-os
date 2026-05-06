'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, BarChart2, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', icon: Home,      label: 'Hôm nay' },
  { href: '/modules',   icon: Grid3X3,   label: 'Modules' },
  { href: '/review',    icon: BarChart2, label: 'Review' },
  { href: '/me',        icon: User,      label: 'Tôi' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white/95 backdrop-blur-sm"
      style={{
        boxShadow: '0 -1px 0 0 rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.slice(0, 2).map(tab => (
          <NavItem key={tab.href} tab={tab} active={pathname.startsWith(tab.href)} />
        ))}

        <Link
          href="/capture"
          className="flex flex-col items-center justify-center w-14 h-14 -mt-6 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-400/40 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>

        {tabs.slice(2).map(tab => (
          <NavItem key={tab.href} tab={tab} active={pathname.startsWith(tab.href)} />
        ))}
      </div>
    </nav>
  )
}

function NavItem({ tab, active }: { tab: typeof tabs[0]; active: boolean }) {
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
