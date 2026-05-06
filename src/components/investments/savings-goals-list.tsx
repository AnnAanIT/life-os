'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatVND } from '@/lib/format'
import { Plus, Trash2, Pencil, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SavingsGoal {
  id: string
  name: string
  icon: string
  target_amount: number
  current_amount: number
  target_date: string | null
}

interface Props {
  goals: SavingsGoal[]
  userId: string
}

const ICONS = ['🎯', '🚗', '✈️', '🏠', '📱', '💊', '🎓', '💍', '🌟', '🛡️']

export function SavingsGoalsList({ goals, userId }: Props) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateAmount, setUpdateAmount] = useState('')

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(targetAmount.replace(/[^\d]/g, ''))
    if (!name.trim() || !amt) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('savings_goals').insert({
      user_id: userId,
      name: name.trim(),
      icon,
      target_amount: amt,
      target_date: targetDate || null,
    })
    setSaving(false)
    if (error) return
    setName('')
    setTargetAmount('')
    setTargetDate('')
    setIcon('🎯')
    setShowAdd(false)
    router.refresh()
  }

  async function updateCurrent(id: string) {
    const amt = parseFloat(updateAmount.replace(/[^\d]/g, ''))
    if (isNaN(amt)) return
    const supabase = createClient()
    const { error } = await supabase.from('savings_goals').update({ current_amount: amt }).eq('id', id).eq('user_id', userId)
    if (error) return
    setUpdatingId(null)
    setUpdateAmount('')
    router.refresh()
  }

  async function deleteGoal(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', userId)
    if (error) return
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Hũ tiết kiệm</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          <Plus size={13} /> Thêm hũ
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addGoal} className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
          <div className="flex gap-2">
            <select
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="w-14 rounded-xl border border-stone-200 text-lg text-center bg-white focus:outline-none"
            >
              {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <input
              type="text"
              placeholder="Tên mục tiêu (VD: Mua xe, Du lịch...)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400"
              required autoFocus
            />
          </div>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Số tiền mục tiêu (VND)"
            value={targetAmount}
            onChange={e => setTargetAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-violet-400"
            required
          />
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 focus:outline-none focus:border-violet-400"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Thêm'}
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 && !showAdd && (
        <p className="text-sm text-stone-400 text-center py-4">Chưa có hũ nào. Nhấn &ldquo;+ Thêm hũ&rdquo; để bắt đầu.</p>
      )}

      {goals.map(goal => {
        const pct = Math.min(Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100), 100)
        const done = pct >= 100
        return (
          <div key={goal.id} className={cn('bg-white rounded-2xl p-4 border border-stone-100 group', done && 'border-green-100')}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{goal.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-800">{goal.name}</p>
                  <div className="flex items-center gap-1.5">
                    {done && <span className="text-xs text-green-600 font-medium">✓ Đạt rồi!</span>}
                    <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-stone-300 hover:text-red-400 rounded-lg transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {goal.target_date && (
                  <p className="text-xs text-stone-400 mt-0.5">Mục tiêu: {goal.target_date.replace(/-/g, '/')}</p>
                )}
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs text-stone-500">
                    {updatingId === goal.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="Số tiền hiện tại"
                          value={updateAmount}
                          onChange={e => setUpdateAmount(e.target.value)}
                          className="flex-1 text-xs border-b border-stone-300 focus:outline-none bg-transparent"
                          autoFocus
                        />
                        <button onClick={() => updateCurrent(goal.id)} className="text-green-600"><Check size={13} /></button>
                        <button onClick={() => setUpdatingId(null)} className="text-stone-400 text-xs">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setUpdatingId(goal.id); setUpdateAmount(String(goal.current_amount)) }}
                        className="flex items-center gap-1 hover:text-stone-700 transition-colors"
                      >
                        <Pencil size={10} />
                        {formatVND(Number(goal.current_amount))}
                      </button>
                    )}
                    <span className="font-medium">{formatVND(Number(goal.target_amount))}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', done ? 'bg-green-400' : 'bg-stone-700')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-400 text-right">{pct}%</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
