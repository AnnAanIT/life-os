'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full text-sm text-red-500 py-3 rounded-xl border border-red-100 bg-red-50 active:scale-95 transition-transform"
    >
      Đăng xuất
    </button>
  )
}
