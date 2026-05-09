import { requireUser } from '@/lib/auth'
import { LogoutButton } from '@/components/me/logout-button'
import { ProfileForm } from '@/components/me/profile-form'
import { ChangePasswordForm } from '@/components/me/change-password-form'
import { LifeDesignCard } from '@/components/me/life-design-card'
import { LifeWheelCard } from '@/components/me/life-wheel-card'

export default async function MePage() {
  const { user, supabase } = await requireUser()

  const [{ data: profile }, { data: latestWheel }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, annual_theme, energy_peak_start, energy_peak_end, purpose_statement, life_chapter, core_values')
      .eq('id', user.id)
      .single(),
    supabase
      .from('life_wheel_entries')
      .select('assessed_at, finance, health, learning, work, relationships, spirit, time')
      .eq('user_id', user.id)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-stone-800">
          {profile?.display_name ?? 'Bạn'}
        </h1>
        <p className="text-stone-400 text-sm">{user.email}</p>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
        {/* Left: Life Design + Settings */}
        <div className="space-y-4">
          <LifeDesignCard
            userId={user.id}
            annualTheme={profile?.annual_theme        ?? null}
            purposeStatement={profile?.purpose_statement ?? null}
            lifeChapter={profile?.life_chapter        ?? null}
            coreValues={profile?.core_values          ?? []}
          />
          <ProfileForm
            userId={user.id}
            displayName={profile?.display_name       ?? null}
            energyStart={profile?.energy_peak_start  ?? null}
            energyEnd={profile?.energy_peak_end      ?? null}
          />
          <ChangePasswordForm email={user.email!} />
          <LogoutButton />
        </div>

        {/* Right: Life Wheel */}
        <div>
          <LifeWheelCard
            userId={user.id}
            latest={latestWheel ?? null}
          />
        </div>
      </div>
    </div>
  )
}
