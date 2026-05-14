'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Pencil } from 'lucide-react'

// Địa Chi tương ứng theo giờ (mỗi 2 tiếng)
const BIRTH_HOUR_OPTIONS = [
  { value: 23, label: '23:00–01:00 (giờ Tý)' },
  { value: 1,  label: '01:00–03:00 (giờ Sửu)' },
  { value: 3,  label: '03:00–05:00 (giờ Dần)' },
  { value: 5,  label: '05:00–07:00 (giờ Mão)' },
  { value: 7,  label: '07:00–09:00 (giờ Thìn)' },
  { value: 9,  label: '09:00–11:00 (giờ Tỵ)' },
  { value: 11, label: '11:00–13:00 (giờ Ngọ)' },
  { value: 13, label: '13:00–15:00 (giờ Mùi)' },
  { value: 15, label: '15:00–17:00 (giờ Thân)' },
  { value: 17, label: '17:00–19:00 (giờ Dậu)' },
  { value: 19, label: '19:00–21:00 (giờ Tuất)' },
  { value: 21, label: '21:00–23:00 (giờ Hợi)' },
]

function getBirthHourLabel(hour: number | null): string {
  if (hour === null) return '—'
  return BIRTH_HOUR_OPTIONS.find(o => o.value === hour)?.label ?? '—'
}

interface Props {
  userId:      string
  displayName: string | null
  energyStart: string | null
  energyEnd:   string | null
  birthDate:   string | null
  birthHour:   number | null
}

export function ProfileForm({ userId, displayName, energyStart, energyEnd, birthDate, birthHour }: Props) {
  const router  = useRouter()
  const [name,       setName]      = useState(displayName ?? '')
  const [eStart,     setEStart]    = useState(energyStart ?? '08:00')
  const [eEnd,       setEEnd]      = useState(energyEnd   ?? '11:00')
  const [bDate,      setBDate]     = useState(birthDate   ?? '')
  const [bHour,      setBHour]     = useState<string>(birthHour !== null ? String(birthHour) : '')
  const [editing,    setEditing]   = useState(false)
  const [saving,     setSaving]    = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      display_name:      name.trim() || null,
      energy_peak_start: eStart,
      energy_peak_end:   eEnd,
      birth_date:        bDate || null,
      birth_hour:        bHour !== '' ? Number(bHour) : null,
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
        <Row label="Ngày sinh" value={bDate ? new Date(bDate + 'T00:00:00').toLocaleDateString('vi-VN') : '—'} />
        <Row label="Giờ sinh" value={getBirthHourLabel(birthHour)} />
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

      <div>
        <label className="text-xs text-stone-400 block mb-1">Ngày sinh <span className="text-stone-300">(dùng cho Tử Vi)</span></label>
        <input
          type="date"
          value={bDate}
          onChange={e => setBDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-violet-400"
        />
      </div>

      <div>
        <label className="text-xs text-stone-400 block mb-1">Giờ sinh <span className="text-stone-300">(tùy chọn, để tính chính xác hơn)</span></label>
        <select
          value={bHour}
          onChange={e => setBHour(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-violet-400 bg-white"
        >
          <option value="">Không nhớ / Bỏ qua</option>
          {BIRTH_HOUR_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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
