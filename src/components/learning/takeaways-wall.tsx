'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface Book {
  id: string
  title: string
  key_takeaway: string | null
  rating: number | null
}

interface Props {
  books: Book[]
}

const INITIAL_SHOW = 4

export function TakeawaysWall({ books }: Props) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? books : books.slice(0, INITIAL_SHOW)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-emerald-400 rounded-full" />
        <p className="text-sm font-semibold text-stone-700">Tri thức tích lũy</p>
        <span className="text-xs text-stone-400">({books.length})</span>
      </div>

      <div className="space-y-2">
        {visible.map(book => (
          <div key={book.id} className="bg-emerald-50 rounded-2xl px-4 py-3.5 border border-emerald-100">
            <p className="text-sm text-emerald-800 leading-relaxed italic">&ldquo;{book.key_takeaway}&rdquo;</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-emerald-600 truncate pr-2">— {book.title}</p>
              {book.rating && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: book.rating }).map((_, i) => (
                    <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {books.length > INITIAL_SHOW && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          {expanded ? 'Thu gọn' : `Xem thêm ${books.length - INITIAL_SHOW} insight`}
        </button>
      )}
    </div>
  )
}
