'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Trash2, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Book {
  id: string
  title: string
  author: string | null
  status: string
  rating: number | null
  notes: string | null
  key_takeaway: string | null
  finished_at: string | null
  cover_url: string | null
}

interface Props {
  books: Book[]
  userId: string
  visibleStatuses?: string[]
  defaultTab?: string
}

const STATUS_TABS = [
  { value: 'reading', label: 'Đang đọc', emoji: '📖' },
  { value: 'want',    label: 'Muốn đọc', emoji: '📌' },
  { value: 'done',    label: 'Đã đọc',   emoji: '✅' },
]

export function BookShelf({ books, userId, visibleStatuses, defaultTab }: Props) {
  const router = useRouter()
  const tabs = visibleStatuses
    ? STATUS_TABS.filter(t => visibleStatuses.includes(t.value))
    : STATUS_TABS
  const initialTab = defaultTab && tabs.find(t => t.value === defaultTab)
    ? defaultTab
    : (tabs[0]?.value ?? 'reading')
  const [activeTab,   setActiveTab]   = useState(initialTab)
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [finishing,   setFinishing]   = useState<string | null>(null)
  const [editNotes,   setEditNotes]   = useState('')
  const [editRating,  setEditRating]  = useState(0)
  const [finishNote,  setFinishNote]  = useState('')
  const [finishRating, setFinishRating] = useState(0)
  const [saving,      setSaving]      = useState(false)

  const visibleBooks = books.filter(b => b.status === activeTab)
  const counts = Object.fromEntries(STATUS_TABS.map(t => [t.value, books.filter(b => b.status === t.value).length]))

  async function moveStatus(book: Book, newStatus: string) {
    const supabase = createClient()
    await supabase.from('books').update({
      status: newStatus,
      finished_at: newStatus === 'done' ? new Date().toISOString().split('T')[0] : null,
    }).eq('id', book.id).eq('user_id', userId)
    router.refresh()
  }

  function startFinish(book: Book) {
    setFinishing(book.id)
    setFinishNote(book.key_takeaway ?? '')
    setFinishRating(book.rating ?? 0)
  }

  async function confirmFinish(bookId: string) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('books').update({
      status:       'done',
      finished_at:  new Date().toISOString().split('T')[0],
      key_takeaway: finishNote.trim() || null,
      rating:       finishRating || null,
    }).eq('id', bookId).eq('user_id', userId)
    setSaving(false)
    if (error) return
    setFinishing(null)
    router.refresh()
  }

  async function saveNotesAndRating(book: Book) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('books').update({
      notes:  editNotes.trim() || null,
      rating: editRating || null,
    }).eq('id', book.id).eq('user_id', userId)
    setSaving(false)
    if (error) return
    setExpanded(null)
    router.refresh()
  }

  async function deleteBook(id: string) {
    const supabase = createClient()
    await supabase.from('books').delete().eq('id', id).eq('user_id', userId)
    router.refresh()
  }

  function openExpand(book: Book) {
    if (expanded === book.id) { setExpanded(null); return }
    setExpanded(book.id)
    setEditNotes(book.notes ?? '')
    setEditRating(book.rating ?? 0)
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-xl overflow-hidden border border-stone-200 bg-white">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1',
              activeTab === tab.value ? 'bg-violet-600 text-white' : 'text-stone-400 hover:text-stone-600'
            )}
          >
            {tab.emoji} {tab.label}
            {counts[tab.value] > 0 && (
              <span className={`text-xs ${activeTab === tab.value ? 'text-white/60' : 'text-stone-300'}`}>
                ({counts[tab.value]})
              </span>
            )}
          </button>
        ))}
      </div>

      {visibleBooks.length === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <p className="text-sm">Chưa có sách nào ở mục này.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleBooks.map(book => (
            <div key={book.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden group">
              <div className="px-4 py-3 flex items-start gap-3">
                {book.cover_url
                  ? <Image src={book.cover_url} alt="" width={36} height={48} className="w-9 h-12 object-cover rounded-lg shrink-0" />
                  : <span className="text-xl shrink-0 mt-0.5">
                      {activeTab === 'reading' ? '📖' : activeTab === 'want' ? '📌' : '✅'}
                    </span>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 leading-snug">{book.title}</p>
                  {book.author && <p className="text-xs text-stone-400 mt-0.5">{book.author}</p>}
                  {book.rating && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < book.rating! ? 'text-amber-400 fill-amber-400' : 'text-stone-200'} />
                      ))}
                    </div>
                  )}
                  {book.key_takeaway && activeTab === 'done' && (
                    <p className="text-xs text-emerald-600 mt-1 line-clamp-2 italic">→ {book.key_takeaway}</p>
                  )}
                  {book.notes && activeTab === 'done' && !book.key_takeaway && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">{book.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {activeTab === 'want' && (
                    <button
                      onClick={() => moveStatus(book, 'reading')}
                      className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Đọc ngay
                    </button>
                  )}
                  {activeTab === 'reading' && finishing !== book.id && (
                    <button
                      onClick={() => startFinish(book)}
                      className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      Xong
                    </button>
                  )}
                  {activeTab === 'done' && (
                    <button
                      onClick={() => openExpand(book)}
                      className="text-stone-400 hover:text-stone-600 p-1"
                    >
                      {expanded === book.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                  <button
                    onClick={() => deleteBook(book.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-stone-300 hover:text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Finish book flow — inline when "Xong" clicked on reading book */}
              {finishing === book.id && activeTab === 'reading' && (
                <div className="px-4 pb-4 border-t border-stone-50 pt-3 space-y-3">
                  <p className="text-xs font-medium text-stone-600">Hoàn thành &ldquo;{book.title}&rdquo; 🎉</p>
                  <div>
                    <p className="text-xs text-stone-400 mb-1.5">Bạn sẽ áp dụng gì từ cuốn này?</p>
                    <textarea
                      value={finishNote}
                      onChange={e => setFinishNote(e.target.value)}
                      placeholder="1 điều cụ thể bạn sẽ làm khác đi..."
                      rows={2}
                      autoFocus
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400 resize-none"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 mb-1.5">Đánh giá <span className="text-stone-300">(tuỳ chọn)</span></p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} onClick={() => setFinishRating(i + 1)} className="p-0.5">
                          <Star size={20} className={i < finishRating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 hover:text-amber-200'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFinishing(null)}
                      className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={() => confirmFinish(book.id)}
                      disabled={saving}
                      className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu & hoàn thành'}
                    </button>
                  </div>
                </div>
              )}

              {/* Edit notes for done books */}
              {expanded === book.id && activeTab === 'done' && (
                <div className="px-4 pb-4 border-t border-stone-50 pt-3 space-y-3">
                  <div>
                    <p className="text-xs text-stone-400 mb-1.5">Đánh giá</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} onClick={() => setEditRating(i + 1)} className="p-0.5">
                          <Star size={20} className={i < editRating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 hover:text-amber-200'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 mb-1.5">Ghi chú / Insight</p>
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Điều bạn học được từ cuốn sách này..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400 resize-none"
                    />
                  </div>
                  <button
                    onClick={() => saveNotesAndRating(book)}
                    disabled={saving}
                    className="w-full py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
