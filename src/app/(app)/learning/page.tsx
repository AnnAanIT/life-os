import { requireUser } from '@/lib/auth'
import { BookShelf } from '@/components/learning/book-shelf'
import { AddBookForm } from '@/components/learning/add-book-form'
import { WantList } from '@/components/learning/want-list'
import { TakeawaysWall } from '@/components/learning/takeaways-wall'
import { ReadingGoalBar } from '@/components/learning/reading-goal-bar'

export default async function LearningPage() {
  const { user, supabase } = await requireUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('reading_goal')
    .eq('id', user.id)
    .single()

  // Try with cover_url; if column missing (migration not yet run), fall back without it
  let allBooks: Array<{
    id: string; title: string; author: string | null; status: string
    rating: number | null; notes: string | null; key_takeaway: string | null
    finished_at: string | null; cover_url: string | null
  }> = []

  const { data: booksWithCover, error: coverError } = await supabase
    .from('books')
    .select('id, title, author, status, rating, notes, key_takeaway, finished_at, cover_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (booksWithCover) {
    allBooks = booksWithCover
  } else if (coverError) {
    // Fallback: try without cover_url (column may not exist yet)
    const { data: booksNoCover, error: noCoverError } = await supabase
      .from('books')
      .select('id, title, author, status, rating, notes, key_takeaway, finished_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (booksNoCover) {
      allBooks = booksNoCover.map(b => ({ ...b, cover_url: null }))
    } else if (noCoverError) {
      // Last resort: select only guaranteed base columns
      const { data: booksBase } = await supabase
        .from('books')
        .select('id, title, author, status, rating, notes, finished_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      allBooks = (booksBase ?? []).map(b => ({ ...b, cover_url: null, key_takeaway: null }))
    }
  }
  const currentYear  = new Date().getFullYear()
  const wantBooks    = allBooks.filter(b => b.status === 'want')
  const readingBooks = allBooks.filter(b => b.status === 'reading')
  const doneBooks    = allBooks.filter(b => b.status === 'done')
  const doneThisYear = doneBooks.filter(b => b.finished_at?.startsWith(String(currentYear))).length
  const readingGoal  = profile?.reading_goal ?? 12
  const takeaways    = doneBooks.filter(b => b.key_takeaway)

  const monthsElapsed = new Date().getMonth() + 1
  const pace = doneThisYear > 0
    ? Math.round((doneThisYear / monthsElapsed) * 10) / 10
    : 0

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Học tập</h1>
        <p className="text-stone-400 text-sm">Kệ sách cá nhân</p>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">

        {/* ── Left col ── */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <StatCard value={readingBooks.length} label="Đang đọc"        color="text-blue-500"   />
            <StatCard value={doneThisYear}        label={`Đọc năm ${currentYear}`} color="text-emerald-500" />
            <StatCard value={doneBooks.length}    label="Tổng đã đọc"     color="text-stone-800"  />
            <StatCard value={pace}                label="Cuốn/tháng"      color="text-violet-500" />
          </div>

          <ReadingGoalBar
            userId={user.id}
            goal={readingGoal}
            done={doneThisYear}
            year={currentYear}
          />

          <AddBookForm userId={user.id} />

          <WantList books={wantBooks} userId={user.id} />
        </div>

        {/* ── Right col ── */}
        <div className="space-y-4">
          <BookShelf
            books={[...readingBooks, ...doneBooks]}
            userId={user.id}
            visibleStatuses={['reading', 'done']}
            defaultTab="reading"
          />
          {takeaways.length > 0 && (
            <TakeawaysWall books={takeaways} />
          )}
        </div>

      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-3.5 border border-stone-100">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-stone-400 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}
