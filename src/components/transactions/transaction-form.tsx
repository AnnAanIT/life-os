'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { localDateStr } from '@/lib/format'

const EXPENSE_CATEGORIES = [
  { value: 'food', label: '🍜 Ăn uống' },
  { value: 'transport', label: '🚗 Di chuyển' },
  { value: 'shopping', label: '🛍️ Mua sắm' },
  { value: 'entertainment', label: '🎬 Giải trí' },
  { value: 'health', label: '💊 Sức khỏe' },
  { value: 'education', label: '📚 Học tập' },
  { value: 'bills', label: '🏠 Hóa đơn' },
  { value: 'investment', label: '📈 Đầu tư' },
  { value: 'other', label: '📦 Khác' },
]

const INCOME_CATEGORIES = [
  { value: 'salary', label: '💼 Lương' },
  { value: 'freelance', label: '💻 Freelance' },
  { value: 'investment', label: '📈 Đầu tư' },
  { value: 'gift', label: '🎁 Quà tặng' },
  { value: 'other', label: '📦 Khác' },
]

interface Props {
  userId: string
}

export function TransactionForm({ userId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => localDateStr())
  const [saving, setSaving] = useState(false)

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const today = localDateStr()

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    return digits ? Number(digits).toLocaleString('vi-VN') : ''
  }

  function handleTypeChange(t: 'expense' | 'income') {
    setType(t)
    setCategory(t === 'expense' ? 'food' : 'salary')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount.replace(/\D/g, ''))
    if (!parsed || parsed <= 0) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      amount: parsed,
      type,
      category,
      note: note.trim() || null,
      date,
    })
    setSaving(false)
    if (error) return
    setAmount('')
    setNote('')
    setCategory(type === 'expense' ? 'food' : 'salary')
    setDate(today)
    setOpen(false)
    router.refresh()
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    setAmount(digits)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-stone-100 text-stone-400 hover:text-stone-600 hover:border-stone-200 transition-colors text-sm"
      >
        <Plus size={16} className="shrink-0" />
        <span>Thêm giao dịch</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-stone-200">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={cn('flex-1 py-2 text-sm font-medium transition-colors',
            type === 'expense' ? 'bg-red-50 text-red-600' : 'text-stone-400 hover:text-stone-600'
          )}
        >
          Chi tiêu
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={cn('flex-1 py-2 text-sm font-medium transition-colors',
            type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'text-stone-400 hover:text-stone-600'
          )}
        >
          Thu nhập
        </button>
      </div>

      {/* Amount */}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={formatAmount(amount)}
          onChange={handleAmountChange}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-xl font-semibold placeholder:text-stone-300 placeholder:font-normal focus:outline-none focus:border-violet-400"
          required
          autoFocus
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium">₫</span>
      </div>

      {/* Category */}
      <div className="relative">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm focus:outline-none focus:border-violet-400 bg-white pr-8"
        >
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
      </div>

      {/* Note + Date in one row */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ghi chú (tuỳ chọn)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm placeholder:text-stone-400 focus:outline-none focus:border-violet-400"
        />
        <div className="relative">
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 focus:outline-none focus:border-violet-400 bg-white w-36"
          />
          {date !== today && (
            <span className="absolute -top-1.5 -right-1 text-[10px] bg-amber-400 text-white rounded-full px-1 leading-4 font-medium">
              hôm qua+
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-stone-200 text-stone-400 hover:bg-stone-50"
        >
          <X size={16} />
        </button>
        <button
          type="submit"
          disabled={saving || !amount}
          className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  )
}
