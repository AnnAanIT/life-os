'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

interface Props {
  userId: string
}

export function QuickCaptureBar({ userId }: Props) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || saving) return

    setSaving(true)
    const supabase = createClient()

    await supabase.from('inbox_items').insert({
      user_id: userId,
      content: text.trim(),
    })

    setText('')
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Ghi nhanh bất cứ điều gì..."
        className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
      />
      <button
        type="submit"
        disabled={!text.trim() || saving}
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600 text-white disabled:opacity-40 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>
    </form>
  )
}
