'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Trash2 } from 'lucide-react'

interface InboxItem {
  id: string
  content: string
  classified_as: string | null
  created_at: string
}

interface Props {
  items: InboxItem[]
  userId: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export function InboxList({ items, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function markDone(id: string) {
    setLoading(id)
    const supabase = createClient()
    await supabase
      .from('inbox_items')
      .update({ is_processed: true })
      .eq('id', id)
      .eq('user_id', userId)
    setLoading(null)
    router.refresh()
  }

  async function deleteItem(id: string) {
    setLoading(id)
    const supabase = createClient()
    await supabase
      .from('inbox_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    setLoading(null)
    router.refresh()
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-stone-400">
        <p className="text-sm">Inbox trống.</p>
        <p className="text-xs mt-1">Ghi điều gì đó bên trên nhé.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
        Inbox — {items.length} mục
      </p>
      {items.map(item => (
        <div
          key={item.id}
          className="bg-white rounded-xl px-4 py-3 border border-stone-100 flex items-start gap-3 group"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-stone-700 leading-relaxed">{item.content}</p>
            <p className="text-xs text-stone-400 mt-1">{timeAgo(item.created_at)}</p>
          </div>
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => markDone(item.id)}
              disabled={loading === item.id}
              className="p-1.5 rounded-lg hover:bg-green-50 text-stone-400 hover:text-green-600 transition-colors"
            >
              <Check size={15} />
            </button>
            <button
              onClick={() => deleteItem(item.id)}
              disabled={loading === item.id}
              className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
