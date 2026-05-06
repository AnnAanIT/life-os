'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/categories'
import { expenseCategories, incomeCategories, catByKey } from '@/lib/categories'
import { Sparkles, Loader2, Check, X, Pencil, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatVND, localDateStr } from '@/lib/format'

type Mode = 'idle' | 'loading' | 'preview' | 'multi-preview' | 'editing'

type ParsedTx = {
  type: 'expense' | 'income'
  amount: number
  category: string
  description: string
}

interface EditState {
  type: 'expense' | 'income'
  amount: string
  category: string
  note: string
  date: string
}

interface Props {
  userId: string
  categories: Category[]
}

function formatAmt(val: string) {
  const digits = val.replace(/\D/g, '')
  return digits ? Number(digits).toLocaleString('vi-VN') : ''
}

function extractAmount(text: string): string {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(k|tr|triệu)?(?:\s|$)/i)
  if (!match) return ''
  const raw = parseFloat(match[1].replace(',', '.'))
  const unit = (match[2] ?? '').toLowerCase()
  const num = unit === 'k' ? Math.round(raw * 1000)
    : unit === 'tr' || unit === 'triệu' ? Math.round(raw * 1000000)
    : Math.round(raw)
  return num > 0 ? String(num) : ''
}

function splitParts(text: string): string[] {
  return text.split(/\.\s+|\n+|,\s+/).map(p => p.trim()).filter(Boolean)
}

async function classifyOne(text: string): Promise<ParsedTx | null> {
  try {
    const res = await fetch('/api/ai/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const data = await res.json()
    if ((data.type === 'expense' || data.type === 'income') && data.amount > 0) {
      return {
        type: data.type,
        amount: data.amount,
        category: data.category ?? (data.type === 'expense' ? 'other' : 'salary'),
        description: data.description ?? '',
      }
    }
  } catch { /* ignore */ }
  return null
}

export function QuickEntry({ userId, categories }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [mode, setMode] = useState<Mode>('idle')
  const [parsed, setParsed] = useState<ParsedTx | null>(null)
  const [multiParsed, setMultiParsed] = useState<ParsedTx[]>([])
  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const today = localDateStr()

  const expCats = expenseCategories(categories)
  const incCats = incomeCategories(categories)

  function getCat(key: string) {
    return catByKey(categories, key)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || mode !== 'idle') return
    setMode('loading')

    const parts = splitParts(text.trim())

    if (parts.length > 1) {
      const results = await Promise.all(parts.map(classifyOne))
      const valid = results.filter((r): r is ParsedTx => r !== null)
      if (valid.length > 0) { setMultiParsed(valid); setMode('multi-preview') }
      else openManualForm()
    } else {
      const result = await classifyOne(parts[0] ?? text.trim())
      if (result) { setParsed(result); setMode('preview') }
      else openManualForm()
    }
  }

  function openManualForm() {
    const defaultCat = expCats[0]?.key ?? 'other'
    setEdit({ type: 'expense', amount: extractAmount(text.trim()), category: defaultCat, note: text.trim(), date: today })
    setMode('editing')
  }

  function startEdit() {
    if (!parsed) return
    setEdit({ type: parsed.type, amount: String(parsed.amount), category: parsed.category, note: parsed.description, date: today })
    setMode('editing')
  }

  async function saveFromPreview() {
    if (!parsed) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('transactions').insert({
      user_id: userId, type: parsed.type, amount: parsed.amount,
      category: parsed.category, note: parsed.description || null, date: today,
    })
    reset(); router.refresh()
  }

  async function saveFromMulti() {
    if (!multiParsed.length) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('transactions').insert(
      multiParsed.map(tx => ({
        user_id: userId, type: tx.type, amount: tx.amount,
        category: tx.category, note: tx.description || null, date: today,
      }))
    )
    reset(); router.refresh()
  }

  async function saveFromEdit() {
    if (!edit) return
    const amount = parseFloat(edit.amount.replace(/\D/g, ''))
    if (!amount || amount <= 0) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('transactions').insert({
      user_id: userId, type: edit.type, amount,
      category: edit.category, note: edit.note.trim() || null, date: edit.date,
    })
    reset(); router.refresh()
  }

  function removeMultiItem(i: number) {
    const next = multiParsed.filter((_, idx) => idx !== i)
    if (!next.length) reset(); else setMultiParsed(next)
  }

  function reset() {
    setText(''); setParsed(null); setMultiParsed([]); setEdit(null); setSaving(false); setMode('idle')
  }

  const editCats = edit?.type === 'expense' ? expCats : incCats

  return (
    <div className="space-y-2">
      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text" value={text} onChange={e => setText(e.target.value)}
          placeholder="cà phê 45k. xăng 50k. lương 15tr..."
          className="flex-1 bg-white border border-stone-200 rounded-2xl px-4 py-3.5 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm"
          disabled={mode === 'loading'}
        />
        <button type="submit" disabled={!text.trim() || mode !== 'idle'}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-800 text-white transition-all active:scale-95 disabled:opacity-30 shadow-sm"
        >
          {mode === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        </button>
      </form>

      {/* Single preview */}
      {mode === 'preview' && parsed && (() => {
        const cat = getCat(parsed.category)
        return (
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cat?.emoji ?? '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-400 mb-0.5">
                  {parsed.type === 'expense' ? '💸 Chi tiêu' : '💰 Thu nhập'} · {cat?.name ?? parsed.category}
                </p>
                <p className="text-lg font-bold text-stone-800">{formatVND(parsed.amount)}</p>
                {parsed.description && <p className="text-xs text-stone-400 mt-0.5 truncate">{parsed.description}</p>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={startEdit} className="p-2 rounded-xl border border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50">
                  <Pencil size={14} />
                </button>
                <button onClick={reset} className="p-2 rounded-xl border border-stone-200 text-stone-400 hover:text-stone-600 hover:bg-stone-50">
                  <X size={14} />
                </button>
              </div>
            </div>
            <button onClick={saveFromPreview} disabled={saving}
              className="mt-3 w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Check size={15} />{saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        )
      })()}

      {/* Multi preview */}
      {mode === 'multi-preview' && multiParsed.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
            <p className="text-xs font-medium text-stone-400">{multiParsed.length} giao dịch</p>
            <button onClick={reset} className="p-1 text-stone-300 hover:text-stone-500"><X size={14} /></button>
          </div>
          <div className="divide-y divide-stone-50">
            {multiParsed.map((tx, i) => {
              const cat = getCat(tx.category)
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl shrink-0">{cat?.emoji ?? '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-400">{cat?.name ?? tx.category}</p>
                    <p className="text-sm font-semibold text-stone-800">{formatVND(tx.amount)}</p>
                    {tx.description && <p className="text-xs text-stone-400 truncate">{tx.description}</p>}
                  </div>
                  <button onClick={() => removeMultiItem(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-400 shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="px-4 pb-4 pt-2">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2 px-1">
              <span>Tổng chi</span>
              <span className="font-semibold text-stone-700">
                {formatVND(multiParsed.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
              </span>
            </div>
            <button onClick={saveFromMulti} disabled={saving}
              className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Check size={15} />{saving ? 'Đang lưu...' : `Lưu ${multiParsed.length} giao dịch`}
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {mode === 'editing' && edit && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
          <div className="flex rounded-xl overflow-hidden border border-stone-200">
            <button type="button" onClick={() => setEdit({ ...edit, type: 'expense', category: expCats[0]?.key ?? 'other' })}
              className={cn('flex-1 py-2 text-sm font-medium transition-colors', edit.type === 'expense' ? 'bg-red-50 text-red-600' : 'text-stone-400')}
            >Chi tiêu</button>
            <button type="button" onClick={() => setEdit({ ...edit, type: 'income', category: incCats[0]?.key ?? 'salary' })}
              className={cn('flex-1 py-2 text-sm font-medium transition-colors', edit.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'text-stone-400')}
            >Thu nhập</button>
          </div>

          <div className="relative">
            <input type="text" inputMode="numeric" placeholder="0"
              value={formatAmt(edit.amount)}
              onChange={e => setEdit({ ...edit, amount: e.target.value.replace(/\D/g, '') })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-xl font-semibold placeholder:text-stone-300 placeholder:font-normal focus:outline-none focus:border-stone-300"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">₫</span>
          </div>

          <div className="flex gap-2">
            {[50000, 100000, 200000, 500000].map(p => (
              <button key={p} type="button" onClick={() => setEdit({ ...edit, amount: String(p) })}
                className="flex-1 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-xs font-medium hover:bg-stone-200 transition-colors"
              >
                {p >= 1000000 ? `${p / 1000000}tr` : `${p / 1000}k`}
              </button>
            ))}
          </div>

          <div className="relative">
            <select value={edit.category} onChange={e => setEdit({ ...edit, category: e.target.value })}
              className="w-full appearance-none px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm focus:outline-none focus:border-stone-300 bg-white pr-8"
            >
              {editCats.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>

          <div className="flex gap-2">
            <input type="text" placeholder="Ghi chú (tuỳ chọn)"
              value={edit.note} onChange={e => setEdit({ ...edit, note: e.target.value })}
              className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm placeholder:text-stone-400 focus:outline-none focus:border-stone-300"
            />
            <div className="relative shrink-0">
              <input type="date" value={edit.date} max={today}
                onChange={e => setEdit({ ...edit, date: e.target.value })}
                className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 focus:outline-none focus:border-stone-300 bg-white w-36"
              />
              {edit.date !== today && (
                <span className="absolute -top-1.5 -right-1 text-[10px] bg-amber-400 text-white rounded-full px-1 leading-4 font-medium">hôm qua+</span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={reset}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-stone-200 text-stone-400 hover:bg-stone-50"
            >
              <X size={16} />
            </button>
            <button type="button" onClick={saveFromEdit} disabled={saving || !edit.amount}
              className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
