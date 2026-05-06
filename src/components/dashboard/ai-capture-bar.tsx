'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatVND } from '@/lib/format'

type Classified =
  | { type: 'expense'; amount: number; category: string; description: string }
  | { type: 'income'; amount: number; description: string }
  | { type: 'task'; title: string; is_mit: boolean }
  | { type: 'note'; content: string }

interface Props {
  userId: string
}

export function AICaptureBar({ userId }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [classifying, setClassifying] = useState(false)
  const [result, setResult] = useState<Classified | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || classifying || result) return

    setClassifying(true)
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (!res.ok) throw new Error('classify failed')
      setResult(await res.json())
    } catch {
      setResult({ type: 'note', content: text.trim() })
    }
    setClassifying(false)
  }

  async function handleConfirm() {
    if (!result) return
    setSaving(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    if (result.type === 'expense' || result.type === 'income') {
      await supabase.from('transactions').insert({
        user_id: userId,
        date: today,
        type: result.type,
        amount: result.amount,
        category: result.type === 'expense' ? result.category : 'salary',
        note: result.description || null,
      })
    } else if (result.type === 'task') {
      await supabase.from('tasks').insert({
        user_id: userId,
        title: result.title,
        is_mit: result.is_mit,
      })
    } else {
      await supabase.from('inbox_items').insert({
        user_id: userId,
        content: result.content,
      })
    }

    setText('')
    setResult(null)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const label = result ? getLabel(result) : null

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Ghi nhanh... (ăn phở 50k, họp 3h chiều, nhớ gọi mẹ...)"
          className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
          disabled={classifying}
        />
        <button
          type="submit"
          disabled={!text.trim() || classifying || !!result}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl text-white transition-all active:scale-95 disabled:opacity-40',
            saved ? 'bg-green-500' : 'bg-violet-600'
          )}
        >
          {classifying ? (
            <Loader2 size={18} className="animate-spin" />
          ) : saved ? (
            <Check size={18} />
          ) : (
            <Sparkles size={18} />
          )}
        </button>
      </form>

      {result && label && (
        <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-400 mb-0.5">{label.typeLabel}</p>
            <p className="text-sm font-semibold text-stone-800 truncate">{label.main}</p>
            {label.sub && <p className="text-xs text-stone-400 mt-0.5 truncate">{label.sub}</p>}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => setResult(null)}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"
            >
              <X size={14} />
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white disabled:opacity-50 active:scale-95 transition-transform"
            >
              {saving ? '...' : 'Lưu'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const CAT_LABELS: Record<string, string> = {
  food: 'Ăn uống', transport: 'Di chuyển', shopping: 'Mua sắm',
  entertainment: 'Giải trí', health: 'Sức khỏe', education: 'Học tập',
  bills: 'Hóa đơn', investment: 'Đầu tư', other: 'Khác',
  salary: 'Lương', freelance: 'Freelance', gift: 'Quà tặng',
}

function getLabel(r: Classified): { typeLabel: string; main: string; sub?: string } {
  if (r.type === 'expense') {
    const catLabel = CAT_LABELS[r.category] ?? r.category
    return { typeLabel: `💸 Chi tiêu · ${catLabel}`, main: formatVND(r.amount), sub: r.description }
  }
  if (r.type === 'income') {
    return { typeLabel: '💰 Thu nhập', main: formatVND(r.amount), sub: r.description }
  }
  if (r.type === 'task') {
    return { typeLabel: r.is_mit ? '⭐ MIT Task' : '✓ Task', main: r.title }
  }
  return { typeLabel: '📝 Ghi chú (Inbox)', main: r.content }
}
