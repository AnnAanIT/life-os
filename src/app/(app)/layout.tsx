import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  let displayName = 'bạn'
  let annualTheme: string | null = null
  let enabledModules: string[] = [
    'finance','investments','habits','tasks','goals',
    'health','learning','spirit','insights',
  ]

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, annual_theme, enabled_modules')
      .eq('id', user.id)
      .single()
    displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'bạn'
    annualTheme = profile?.annual_theme ?? null
    if (profile?.enabled_modules) enabledModules = profile.enabled_modules
  }

  return (
    <div className="min-h-screen bg-stone-50 lg:flex lg:h-screen lg:overflow-hidden lg:bg-slate-900">
      <Sidebar displayName={displayName} annualTheme={annualTheme} enabledModules={enabledModules} />

      <div className="w-full max-w-md mx-auto min-h-screen bg-stone-50 sm:shadow-xl sm:shadow-stone-300/40 lg:flex-1 lg:max-w-none lg:shadow-none lg:overflow-y-auto lg:h-screen lg:bg-white relative">
        <main className="pb-24 lg:pb-10">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
