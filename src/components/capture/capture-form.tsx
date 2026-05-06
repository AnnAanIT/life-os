'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

interface Props {
  userId: string
}

export function CaptureForm({ userId }: Props) {
  const router = useRouter()
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
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Ghi bất cứ điều gì đang trong đầu bạn..."
        rows={3}
        className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
        onKeyDown={e => {
          if (e.key === 'Enter' && e.metaKey) handleSubmit(e as unknown as React.FormEvent)
        }}
      />
      <button
        type="submit"
        disabled={!text.trim() || saving}
        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm rounded-xl disabled:opacity-40 active:scale-95 transition-all"
      >
        <Send size={15} />
        {saving ? 'Đang lưu...' : 'Lưu vào Inbox'}
      </button>
    </form>
  )
}
