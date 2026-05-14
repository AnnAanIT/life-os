import { requireUser } from '@/lib/auth'
import { WisdomTabs } from '@/components/wisdom/wisdom-tabs'

export default async function WisdomPage() {
  const { user, supabase } = await requireUser()

  const [{ data: profile }, { data: readings }] = await Promise.all([
    supabase
      .from('profiles')
      .select('birth_date, birth_hour')
      .eq('id', user.id)
      .single(),
    supabase
      .from('wisdom_readings')
      .select('id, created_at, hexagram_num, question, reflection')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Tuệ Giác</h1>
        <p className="text-stone-400 text-sm mt-1">Tử vi · Kinh Dịch · Lịch âm</p>
      </div>

      <WisdomTabs
        userId={user.id}
        birthDate={profile?.birth_date ?? null}
        birthHour={profile?.birth_hour ?? null}
        initialReadings={readings ?? []}
      />
    </div>
  )
}
