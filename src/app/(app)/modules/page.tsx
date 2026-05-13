import { requireUser } from '@/lib/auth'
import { ModulesClient } from '@/components/modules/modules-client'

const DEFAULT_MODULES = [
  'finance','investments','habits','tasks','goals',
  'health','learning','spirit','insights',
]

export default async function ModulesPage() {
  const { user, supabase } = await requireUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('enabled_modules')
    .eq('id', user.id)
    .single()

  const enabledModules: string[] = profile?.enabled_modules ?? DEFAULT_MODULES

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4">
      <ModulesClient userId={user.id} initialEnabled={enabledModules} />
    </div>
  )
}
