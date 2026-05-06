'use client'

import { useState } from 'react'
import { Pencil, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  goal: number
  done: number
  year: number
}

export function ReadingGoalBar({ userId, goal, done, year }: Props) {
  const [editing,     setEditing]     = useState(false)
  const [inputValue,  setInputValue]  = useState(String(goal))
  const [currentGoal, setCurrentGoal] = useState(goal)
  const [saving,      setSaving]      = useState(false)

  const pct = currentGoal > 0 ? Math.min(Math.round((done / currentGoal) * 100), 100) : 0

  async function save() {
    const n = parseInt(inputValue)
    if (isNaN(n) || n < 1) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ reading_goal: n }).eq('id', userId)
    setCurrentGoal(n)
    setSaving(false)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 border border-stone-100">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-stone-700">Mục tiêu {year}</p>
          {!editing && (
            <button onClick={() => { setEditing(true); setInputValue(String(currentGoal)) }}
              className="text-stone-300 hover:text-stone-500 transition-colors">
              <Pencil size={11} />
            </button>
          )}
        </div>

        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              min={1} max={365}
              autoFocus
              className="w-14 text-center px-2 py-1 rounded-lg border border-stone-200 text-sm font-bold text-stone-800 focus:outline-none focus:border-violet-400"
            />
            <span className="text-xs text-stone-400">cuốn</span>
            <button onClick={save} disabled={saving}
              className="p-1 text-violet-600 hover:text-violet-800 transition-colors disabled:opacity-40">
              <Check size={14} />
            </button>
          </div>
        ) : (
          <span className="text-sm font-bold text-stone-800">
            {done}
            <span className="font-normal text-stone-400">/{currentGoal} cuốn</span>
          </span>
        )}
      </div>

      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 100 ? '#10b981' : pct >= 60 ? '#8b5cf6' : '#a78bfa',
          }}
        />
      </div>
      <p className="text-xs text-stone-400 mt-1.5">{pct}% hoàn thành năm nay</p>
    </div>
  )
}
