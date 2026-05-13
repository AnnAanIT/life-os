'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Plus, Search, Loader2, X } from 'lucide-react'
import { localDateStr } from '@/lib/format'

interface GoogleBook {
  id: string
  title: string
  author: string
  cover: string | null
}

interface Props {
  userId: string
}

async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
  if (!query.trim()) return []
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6&printType=books`
  )
  if (!res.ok) return []
  const data = await res.json()
  interface BookItem { id: string; volumeInfo?: { title?: string; authors?: string[]; imageLinks?: { smallThumbnail?: string } } }
  return (data.items ?? [] as BookItem[]).map((item: BookItem) => ({
    id:     item.id,
    title:  item.volumeInfo?.title ?? '',
    author: (item.volumeInfo?.authors ?? []).join(', '),
    cover:  item.volumeInfo?.imageLinks?.smallThumbnail ?? null,
  })).filter((b: GoogleBook) => b.title)
}

export function AddBookForm({ userId }: Props) {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<GoogleBook[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected]   = useState<GoogleBook | null>(null)
  const [title,   setTitle]   = useState('')
  const [author,  setAuthor]  = useState('')
  const [status,  setStatus]  = useState('want')
  const [saving,  setSaving]  = useState(false)
  const [saveError, setSaveError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selected || !query.trim() || query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      return
    }
    setSearching(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const books = await searchGoogleBooks(query)
        setResults(books)
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selected])

  function pickBook(book: GoogleBook) {
    setSelected(book)
    setTitle(book.title)
    setAuthor(book.author)
    setQuery(book.title)
    setResults([])
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
    setTitle('')
    setAuthor('')
  }

  function handleClose() {
    setOpen(false)
    setQuery('')
    setTitle('')
    setAuthor('')
    setSelected(null)
    setResults([])
    setStatus('want')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setSaveError(false)
    const supabase = createClient()

    // Try insert with cover_url first; fall back without it if column doesn't exist
    let { error } = await supabase.from('books').insert({
      user_id:    userId,
      title:      title.trim(),
      author:     author.trim() || null,
      cover_url:  selected?.cover ?? null,
      status,
      finished_at: status === 'done' ? localDateStr() : null,
    })

    if (error?.code === '42703') {
      // cover_url column doesn't exist yet — retry without it
      const retry = await supabase.from('books').insert({
        user_id:    userId,
        title:      title.trim(),
        author:     author.trim() || null,
        status,
        finished_at: status === 'done' ? localDateStr() : null,
      })
      error = retry.error
    }

    setSaving(false)
    if (error) { setSaveError(true); return }
    handleClose()
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-stone-100 text-stone-400 hover:text-stone-600 hover:border-stone-200 transition-colors text-sm"
      >
        <Plus size={16} /> Thêm sách
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">

      {/* Search input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative flex items-center">
          {searching
            ? <Loader2 size={15} className="absolute left-3 text-stone-400 animate-spin" />
            : <Search size={15} className="absolute left-3 text-stone-400" />
          }
          <input
            type="text"
            placeholder="Tìm sách..."
            value={query}
            onChange={e => { setQuery(e.target.value); if (selected) setSelected(null) }}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400"
            autoFocus
          />
          {query && (
            <button type="button" onClick={clearSelection} className="absolute right-3 text-stone-300 hover:text-stone-500">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {results.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden">
            {results.map(book => (
              <button
                key={book.id}
                type="button"
                onClick={() => pickBook(book)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors text-left"
              >
                {book.cover
                  ? <Image src={book.cover} alt="" width={32} height={44} className="w-8 h-11 object-cover rounded shrink-0" />
                  : <div className="w-8 h-11 bg-stone-100 rounded shrink-0 flex items-center justify-center text-stone-300 text-xs">📖</div>
                }
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{book.title}</p>
                  {book.author && <p className="text-xs text-stone-400 truncate">{book.author}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected book preview */}
      {selected && (
        <div className="flex items-center gap-3 bg-violet-50 rounded-xl px-3 py-2 border border-violet-100">
          {selected.cover
            ? <Image src={selected.cover} alt="" width={32} height={44} className="w-8 h-11 object-cover rounded shrink-0" />
            : <div className="w-8 h-11 bg-violet-100 rounded shrink-0 flex items-center justify-center text-violet-300 text-xs">📖</div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-800 truncate">{selected.title}</p>
            {selected.author && <p className="text-xs text-violet-500 truncate">{selected.author}</p>}
          </div>
        </div>
      )}

      {/* Manual override fields — shown when no selection yet or to edit */}
      {!selected && query.length > 0 && results.length === 0 && !searching && (
        <div className="space-y-2">
          <p className="text-xs text-stone-400">Không tìm thấy — nhập thủ công:</p>
          <input
            type="text"
            placeholder="Tên sách"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400"
          />
          <input
            type="text"
            placeholder="Tác giả (tuỳ chọn)"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-400"
          />
        </div>
      )}

      {/* Status selector */}
      <div className="flex rounded-xl overflow-hidden border border-stone-200">
        {[
          { value: 'want',    label: 'Muốn đọc' },
          { value: 'reading', label: 'Đang đọc' },
          { value: 'done',    label: 'Đã đọc'   },
        ].map(s => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(s.value)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              status === s.value ? 'bg-violet-600 text-white' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {saveError && (
        <p className="text-xs text-red-500 text-center">Lưu thất bại — thử lại hoặc kiểm tra kết nối.</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
        >
          {saving ? 'Đang lưu...' : 'Thêm'}
        </button>
      </div>
    </form>
  )
}
