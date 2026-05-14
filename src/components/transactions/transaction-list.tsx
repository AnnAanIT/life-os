'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/categories'
import { expenseCategories, incomeCategories, catByKey } from '@/lib/categories'
import { Trash2, Pencil, Check, X, ChevronDown } from 'lucide-react'
import { formatVND, localDateStr } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  amount: number
  type: string
  category: string
  note: string | null
  date: string
}

interface EditState {
  type: 'expense' | 'income'
  amount: string
  category: string
  note: string
  date: string
}

interface Props {
  transactions: Transaction[]
  userId: string
  categories: Category[]
}

function formatDateLabel(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

function formatAmount(val: string) {
  const digits = val.replace(/\D/g, '')
  return digits ? Number(digits).toLocaleString('vi-VN') : ''
}

export function TransactionList({ transactions, userId, categories }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  function toggleDate(date: string) {
    setExpandedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  const today = localDateStr()
  const expCats = expenseCategories(categories)
  const incCats = incomeCategories(categories)

  const typeFiltered = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType)
  const presentCategories = Array.from(new Set(typeFiltered.map(t => t.category)))

  const filtered = filterCategory
    ? typeFiltered.filter(t => t.category === filterCategory)
    : typeFiltered

  async function deleteItem(id: string) {
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId)
    setDeleting(null)
    if (error) return
    router.refresh()
  }

  function startEdit(t: Transaction) {
    setEditingId(t.id)
    setEditData({
      type: t.type as 'expense' | 'income',
      amount: String(t.amount),
      category: t.category,
      note: t.note ?? '',
      date: t.date,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditData(null)
  }

  async function saveEdit(id: string) {
    if (!editData) return
    const parsed = parseFloat(editData.amount.replace(/\D/g, ''))
    if (!parsed || parsed <= 0) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('transactions').update({
      type: editData.type,
      amount: parsed,
      category: editData.category,
      note: editData.note.trim() || null,
      date: editData.date,
    }).eq('id', id).eq('user_id', userId)
    setSaving(false)
    if (error) return
    setEditingId(null)
    setEditData(null)
    router.refresh()
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-stone-400">
        <p className="text-sm">Chưa có giao dịch nào.</p>
        <p className="text-xs mt-1">Thêm thu chi bên trên nhé.</p>
      </div>
    )
  }

  const grouped: Record<string, Transaction[]> = {}
  for (const t of filtered) {
    if (!grouped[t.date]) grouped[t.date] = []
    grouped[t.date].push(t)
  }
  const sortedDates = Object.keys(grouped).sort().reverse()

  return (
    <div className="space-y-3">
      {/* Type filter tabs */}
      <div className="flex rounded-2xl overflow-hidden border border-stone-200 bg-white">
        {([['all', 'Tất cả'], ['expense', 'Chi tiêu'], ['income', 'Thu nhập']] as const).map(([type, label]) => (
          <button
            key={type}
            onClick={() => { setFilterType(type); setFilterCategory(null) }}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors',
              filterType === type
                ? type === 'expense' ? 'bg-red-50 text-red-600'
                  : type === 'income' ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-violet-600 text-white'
                : 'text-stone-400 hover:text-stone-600'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category filter chips */}
      {presentCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filterCategory === null
                ? 'bg-violet-600 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            )}
          >
            Tất cả
          </button>
          {presentCategories.map(cat => {
            const c = catByKey(categories, cat)
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  filterCategory === cat
                    ? 'bg-violet-600 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                )}
              >
                {c?.emoji ?? '📦'} {c?.name ?? cat}
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-6 text-stone-400">
          <p className="text-sm">Không có giao dịch nào trong danh mục này.</p>
        </div>
      )}

      {sortedDates.map(date => {
        const items = grouped[date]
        const dayIncome = items.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const dayExpense = items.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        const dayNet = dayIncome - dayExpense
        const isCollapsed = !expandedDates.has(date)

        return (
          <div key={date}>
            <button
              onClick={() => toggleDate(date)}
              className="w-full flex items-center justify-between mb-1.5 px-1 group"
            >
              <div className="flex items-center gap-1.5">
                <ChevronDown
                  size={13}
                  className={cn(
                    'text-stone-400 transition-transform duration-200',
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  )}
                />
                <p className="text-xs font-semibold text-stone-500 capitalize">
                  {formatDateLabel(date)}
                </p>
              </div>
              <p className={cn('text-xs font-semibold', dayNet >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                {dayNet >= 0 ? '+' : ''}{formatVND(dayNet)}
              </p>
            </button>

            {!isCollapsed && <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-50">
              {items.map(t => {
                if (editingId === t.id && editData) {
                  const cats = editData.type === 'expense' ? expCats : incCats
                  return (
                    <div key={t.id} className="px-4 py-3 space-y-2 bg-stone-50">
                      <div className="flex rounded-lg overflow-hidden border border-stone-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, type: 'expense', category: expCats[0]?.key ?? 'other' })}
                          className={cn('flex-1 py-1.5 font-medium transition-colors',
                            editData.type === 'expense' ? 'bg-red-50 text-red-600' : 'text-stone-400'
                          )}
                        >
                          Chi tiêu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditData({ ...editData, type: 'income', category: incCats[0]?.key ?? 'salary' })}
                          className={cn('flex-1 py-1.5 font-medium transition-colors',
                            editData.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'text-stone-400'
                          )}
                        >
                          Thu nhập
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatAmount(editData.amount)}
                          onChange={e => setEditData({ ...editData, amount: e.target.value.replace(/\D/g, '') })}
                          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800 focus:outline-none focus:border-violet-400"
                          placeholder="Số tiền"
                        />
                        <div className="relative">
                          <select
                            value={editData.category}
                            onChange={e => setEditData({ ...editData, category: e.target.value })}
                            className="appearance-none px-3 py-2 pr-7 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-violet-400 bg-white"
                          >
                            {cats.map(c => (
                              <option key={c.key} value={c.key}>{c.emoji} {c.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editData.note}
                          onChange={e => setEditData({ ...editData, note: e.target.value })}
                          placeholder="Ghi chú"
                          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 focus:outline-none focus:border-violet-400 placeholder:text-stone-300"
                        />
                        <input
                          type="date"
                          value={editData.date}
                          max={today}
                          onChange={e => setEditData({ ...editData, date: e.target.value })}
                          className="px-2 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 focus:outline-none focus:border-violet-400 bg-white w-32"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="flex items-center justify-center w-9 h-9 rounded-xl border border-stone-200 text-stone-400 hover:bg-stone-100"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => saveEdit(t.id)}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                        >
                          <Check size={14} />
                          {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                      </div>
                    </div>
                  )
                }

                const cat = catByKey(categories, t.category)
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-stone-50 transition-colors">
                    <span className="text-xl shrink-0">{cat?.emoji ?? '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700">{cat?.name ?? t.category}</p>
                      {t.note && (
                        <p className="text-xs text-stone-400 mt-0.5 truncate">{t.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        'text-sm font-semibold',
                        t.type === 'income' ? 'text-emerald-600' : 'text-stone-800'
                      )}>
                        {t.type === 'income' ? '+' : '-'}{formatVND(Number(t.amount))}
                      </span>
                      <button
                        onClick={() => startEdit(t)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-stone-100 text-stone-300 hover:text-stone-500 transition-all"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteItem(t.id)}
                        disabled={deleting === t.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-400 transition-all disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>}
          </div>
        )
      })}
    </div>
  )
}
