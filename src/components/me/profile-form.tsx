'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Pencil } from 'lucide-react'

interface Props {
  userId:      string
  displayName: string | null
  energyStart: string | null
  energyEnd:   string | null
}

export function ProfileForm({ userId, displayName, energyStart, energyEnd }: Props) {
  const router  = useRouter()
  const [name,    setName]    = useState(displayName ?? '')
  const [eStart,  setEStart]  = useState(energyStart ?? '08:00')
  const [eEnd,    setEEnd]    = useState(energyEnd   ?? '11:00')
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      display_name:      name.trim() || null,
      energy_peak_start: eStart,
      energy_peak_end:   eEnd,
      updated_at:        new Date().toISOString(),
    }).eq('id', userId)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-stone-100 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700">Cài đặt</p>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            <Pencil size={11} /> Chỉnh sửa
          </button>
        </div>
        <Row label="Tên hiển thị" value={name || '—'} />
        <Row label="Giờ vàng" value={`${eStart} – ${eEnd}`} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-4">
      <p className="text-sm font-semibold text-stone-700">Chỉnh sửa cài đặt</p>

      <div>
        <label className="text-xs text-stone-400 block mb-1">Tên hiển thị</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tên của bạn"
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-violet-400"
        />
      </div>

      <div>
        <label className="text-xs text-stone-400 block mb-1">Giờ vàng (năng lượng cao nhất)</label>
        <div className="flex items-center gap-2">
          <input type="time" value={eStart} onChange={e => setEStart(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-violet-400" />
          <span className="text-stone-400 text-sm">–</span>
          <input type="time" value={eEnd} onChange={e => setEEnd(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-violet-400" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setEditing(false)}
          className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 hover:text-stone-700 transition-colors">
          Huỷ
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 transition-colors">
          <Check size={14} /> {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-stone-400 shrink-0">{label}</span>
      <span className="text-sm text-stone-700 text-right">{value}</span>
    </div>
  )
}
