'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { BookOpen, Trash2 } from 'lucide-react'

interface Book {
  id: string
  title: string
  author: string | null
  cover_url: string | null
}

interface Props {
  books: Book[]
  userId: string
}

export function WantList({ books, userId }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function startReading(id: string) {
    setLoadingId(id)
    const supabase = createClient()
    await supabase.from('books').update({ status: 'reading' }).eq('id', id).eq('user_id', userId)
    setLoadingId(null)
    router.refresh()
  }

  async function deleteBook(id: string) {
    setLoadingId(id)
    const supabase = createClient()
    await supabase.from('books').delete().eq('id', id).eq('user_id', userId)
    setLoadingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-stone-200 rounded-full" />
        <p className="text-sm font-semibold text-stone-700">Muốn đọc</p>
        {books.length > 0 && <span className="text-xs text-stone-400">({books.length})</span>}
      </div>

      {books.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 px-4 py-6 text-center">
          <p className="text-sm text-stone-400">Danh sách trống — thêm sách bên trên.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {books.map((book, i) => (
            <div
              key={book.id}
              className={`bg-white rounded-2xl border overflow-hidden group ${
                i === 0 ? 'border-violet-200' : 'border-stone-100'
              }`}
            >
              <div className="px-4 py-3 flex items-center gap-3">
                {book.cover_url ? (
                  <Image src={book.cover_url} alt="" width={32} height={44} className="w-8 h-11 object-cover rounded shrink-0" />
                ) : (
                  <div className={`w-8 h-11 rounded flex items-center justify-center shrink-0 ${
                    i === 0 ? 'bg-violet-50' : 'bg-stone-50'
                  }`}>
                    <BookOpen size={14} className={i === 0 ? 'text-violet-300' : 'text-stone-300'} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{book.title}</p>
                  {book.author && <p className="text-xs text-stone-400 truncate">{book.author}</p>}
                  {i === 0 && (
                    <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide mt-0.5">Đọc tiếp</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {i === 0 ? (
                    <button
                      onClick={() => startReading(book.id)}
                      disabled={loadingId === book.id}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors disabled:opacity-50 active:scale-95"
                    >
                      Bắt đầu
                    </button>
                  ) : (
                    <button
                      onClick={() => startReading(book.id)}
                      disabled={loadingId === book.id}
                      className="px-2.5 py-1.5 rounded-xl text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Đọc ngay
                    </button>
                  )}
                  <button
                    onClick={() => deleteBook(book.id)}
                    disabled={loadingId === book.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-stone-300 hover:text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
