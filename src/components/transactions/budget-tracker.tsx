'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/categories'
import { expenseCategories } from '@/lib/categories'
import { formatVND } from '@/lib/format'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Budget {
  category: string
  monthly_limit: number
}

interface Props {
  userId: string
  spendingByCategory: Record<string, number>
  budgets: Budget[]
  categories: Category[]
}

function formatInput(val: string) {
  const digits = val.replace(/\D/g, '')
  return digits ? Number(digits).toLocaleString('vi-VN') : ''
}

function getDailyRemaining(limit: number, spent: number): string | null {
  if (limit <= 0 || spent >= limit) return null
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - today.getDate() + 1
  if (daysLeft <= 0) return null
  const daily = Math.round((limit - spent) / daysLeft)
  return daily >= 1000
    ? `~${daily >= 1000000 ? `${(daily / 1000000).toFixed(1)}tr` : `${Math.round(daily / 1000)}k`}/ngày`
    : null
}

function EditForm({
  cat, spent, currentLimit, saving,
  editValue, onChange, onSave, onRemove, onCancel,
}: {
  cat: Category
  spent: number
  currentLimit: number
  saving: boolean
  editValue: string
  onChange: (v: string) => void
  onSave: () => void
  onRemove: () => void
  onCancel: () => void
}) {
  return (
    <div className="bg-stone-50 rounded-2xl px-4 py-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-base">{cat.emoji}</span>
        <span className="text-sm font-medium text-stone-700">{cat.name}</span>
        {spent > 0 && (
          <span className="text-xs text-stone-400 ml-auto">đã chi {formatVND(spent)}</span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Nhập ngân sách tháng..."
            value={formatInput(editValue)}
            onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && onSave()}
            className="w-full px-3 py-2.5 pr-8 rounded-xl border border-stone-200 text-sm text-stone-800 focus:outline-none focus:border-violet-400"
            autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">₫</span>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-3 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
        >
          <Check size={14} />{saving ? '' : 'Lưu'}
        </button>
        <button onClick={onCancel} className="p-2.5 rounded-xl border border-stone-200 text-stone-400 hover:bg-stone-100">
          <X size={14} />
        </button>
      </div>
      {/* Quick presets */}
      <div className="flex gap-2 flex-wrap">
        {[500000, 1000000, 2000000, 3000000, 5000000].map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(String(p))}
            className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-600 text-xs font-medium hover:bg-stone-100 transition-colors"
          >
            {p >= 1000000 ? `${p / 1000000}tr` : `${p / 1000}k`}
          </button>
        ))}
      </div>
      {currentLimit > 0 && (
        <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-500 transition-colors">
          Xoá ngân sách này
        </button>
      )}
    </div>
  )
}

export function BudgetTracker({ userId, spendingByCategory, budgets, categories }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const expCats = expenseCategories(categories)

  const budgetMap: Record<string, number> = {}
  for (const b of budgets) budgetMap[b.category] = b.monthly_limit

  async function saveBudget(key: string) {
    const limit = parseFloat(editValue.replace(/\D/g, ''))
    if (!limit || limit <= 0) { setEditing(null); return }
    setSaving(true)
    const supabase = createClient()
    await supabase.from('budgets').upsert(
      { user_id: userId, category: key, monthly_limit: limit },
      { onConflict: 'user_id,category' }
    )
    setSaving(false)
    setEditing(null)
    setEditValue('')
    router.refresh()
  }

  async function removeBudget(key: string) {
    const supabase = createClient()
    await supabase.from('budgets').delete().eq('user_id', userId).eq('category', key)
    setEditing(null)
    router.refresh()
  }

  function openEdit(key: string, currentLimit: number) {
    setEditing(key)
    setEditValue(currentLimit > 0 ? String(currentLimit) : '')
  }

  const withData = expCats.filter(c => (spendingByCategory[c.key] ?? 0) > 0 || (budgetMap[c.key] ?? 0) > 0)
  const withoutData = expCats.filter(c => (spendingByCategory[c.key] ?? 0) === 0 && (budgetMap[c.key] ?? 0) === 0)

  return (
    <div className="space-y-1.5">
      {/* Categories with spending or budget */}
      {withData.map(cat => {
        const spent = spendingByCategory[cat.key] ?? 0
        const limit = budgetMap[cat.key] ?? 0
        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
        const over = limit > 0 && spent > limit
        const near = !over && limit > 0 && pct > 80
        const daily = getDailyRemaining(limit, spent)

        if (editing === cat.key) {
          return (
            <EditForm
              key={cat.key}
              cat={cat}
              spent={spent}
              currentLimit={limit}
              saving={saving}
              editValue={editValue}
              onChange={setEditValue}
              onSave={() => saveBudget(cat.key)}
              onRemove={() => removeBudget(cat.key)}
              onCancel={() => setEditing(null)}
            />
          )
        }

        return (
          <button
            key={cat.key}
            onClick={() => openEdit(cat.key, limit)}
            className="w-full bg-white rounded-2xl border border-stone-100 px-4 py-3 text-left hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{cat.emoji}</span>
                <span className="text-sm text-stone-700">{cat.name}</span>
              </div>
              <div className="text-right">
                {over && <span className="text-xs font-semibold text-red-500">Vượt {formatVND(spent - limit)}</span>}
                {!over && (
                  <span className={cn('text-xs font-medium', near ? 'text-amber-500' : 'text-stone-500')}>
                    {formatVND(spent)}
                    {limit > 0 && <span className="text-stone-300 font-normal"> / {formatVND(limit)}</span>}
                  </span>
                )}
              </div>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              {limit > 0 && (
                <div
                  className={cn('h-full rounded-full transition-all',
                    over ? 'bg-red-400' : near ? 'bg-amber-400' : 'bg-emerald-400'
                  )}
                  style={{ width: `${pct}%` }}
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              {limit === 0 ? (
                <p className="text-[11px] text-stone-400">Chưa đặt ngân sách · Bấm để đặt</p>
              ) : (
                <p className={cn('text-[11px]', over ? 'text-red-400' : near ? 'text-amber-400' : 'text-stone-400')}>
                  {over
                    ? `Đã vượt ${Math.round(pct - 100)}% ngân sách`
                    : `${Math.round(pct)}% đã dùng`
                  }
                </p>
              )}
              {daily && !over && (
                <p className="text-[11px] text-emerald-600 font-medium">{daily} còn lại</p>
              )}
            </div>
          </button>
        )
      })}

      {/* Categories with no spending and no budget */}
      {withoutData.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
            Chưa đặt ngân sách
          </p>
          {withoutData.map((cat, i) => {
            if (editing === cat.key) {
              return (
                <div key={cat.key} className="border-t border-stone-50 p-3">
                  <EditForm
                    cat={cat}
                    spent={0}
                    currentLimit={0}
                    saving={saving}
                    editValue={editValue}
                    onChange={setEditValue}
                    onSave={() => saveBudget(cat.key)}
                    onRemove={() => removeBudget(cat.key)}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )
            }
            return (
              <button
                key={cat.key}
                onClick={() => openEdit(cat.key, 0)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-stone-50 transition-colors',
                  i > 0 && 'border-t border-stone-50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{cat.emoji}</span>
                  <span className="text-sm text-stone-500">{cat.name}</span>
                </div>
                <span className="text-xs text-stone-300">+ Đặt ngân sách</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
