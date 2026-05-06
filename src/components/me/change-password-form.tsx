'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, Check, Pencil } from 'lucide-react'

interface Props {
  email: string
}

export function ChangePasswordForm({ email }: Props) {
  const [editing,     setEditing]     = useState(false)
  const [currentPw,   setCurrentPw]   = useState('')
  const [newPw,       setNewPw]       = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)

  function reset() {
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setError(null); setSuccess(false); setEditing(false)
  }

  async function handleSave() {
    setError(null)
    if (newPw.length < 6) { setError('Mật khẩu mới tối thiểu 6 ký tự.'); return }
    if (newPw !== confirmPw) { setError('Mật khẩu xác nhận không khớp.'); return }

    setSaving(true)
    const supabase = createClient()

    // Re-authenticate to verify current password
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: currentPw })
    if (authError) { setError('Mật khẩu hiện tại không đúng.'); setSaving(false); return }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPw })
    setSaving(false)
    if (updateError) { setError('Đổi mật khẩu thất bại. Thử lại sau.'); return }

    setSuccess(true)
    setTimeout(reset, 1500)
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-stone-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound size={14} className="text-stone-400" />
            <p className="text-sm font-semibold text-stone-700">Mật khẩu</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            <Pencil size={11} /> Đổi mật khẩu
          </button>
        </div>
        <p className="text-sm text-stone-400">••••••••</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-4">
      <p className="text-sm font-semibold text-stone-700">Đổi mật khẩu</p>

      <div>
        <label className="text-xs text-stone-400 block mb-1">Mật khẩu hiện tại</label>
        <input
          type="password"
          value={currentPw}
          onChange={e => setCurrentPw(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-violet-400"
          autoFocus
        />
      </div>

      <div>
        <label className="text-xs text-stone-400 block mb-1">Mật khẩu mới</label>
        <input
          type="password"
          value={newPw}
          onChange={e => setNewPw(e.target.value)}
          placeholder="Tối thiểu 6 ký tự"
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-violet-400"
        />
      </div>

      <div>
        <label className="text-xs text-stone-400 block mb-1">Xác nhận mật khẩu mới</label>
        <input
          type="password"
          value={confirmPw}
          onChange={e => setConfirmPw(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-violet-400"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={reset}
          className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          Huỷ
        </button>
        <button
          onClick={handleSave}
          disabled={saving || success || !currentPw || !newPw || !confirmPw}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 transition-all active:scale-95"
        >
          {success ? <><Check size={14} /> Đã đổi!</> : saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </button>
      </div>
    </div>
  )
}
