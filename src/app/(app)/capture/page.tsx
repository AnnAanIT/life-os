import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CaptureForm } from '@/components/capture/capture-form'
import { InboxList } from '@/components/capture/inbox-list'

const TYPE_LABEL: Record<string, string> = {
  task:    'Tasks',
  expense: 'Chi tiêu',
  idea:    'Ý tưởng',
  note:    'Ghi chú',
}

export default async function CapturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: items } = await supabase
    .from('inbox_items')
    .select('id, content, classified_as, created_at')
    .eq('user_id', user.id)
    .eq('is_processed', false)
    .order('created_at', { ascending: false })

  const allItems = items ?? []

  // Count by type for summary chips
  const countByType: Record<string, number> = {}
  for (const item of allItems) {
    const t = item.classified_as ?? 'note'
    countByType[t] = (countByType[t] ?? 0) + 1
  }

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Quick Capture</h1>
          <p className="text-stone-500 text-sm">Ghi lại bất cứ điều gì, phân loại sau</p>
        </div>
        {allItems.length > 0 && (
          <span className="mt-1 text-xs font-medium bg-stone-100 text-stone-600 px-2 py-1 rounded-lg">
            {allItems.length} chưa xử lý
          </span>
        )}
      </div>

      {allItems.length > 0 && Object.keys(countByType).length > 1 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(countByType).map(([type, count]) => (
            <span key={type} className="text-xs bg-white border border-stone-100 text-stone-600 px-3 py-1 rounded-full">
              {TYPE_LABEL[type] ?? type} · {count}
            </span>
          ))}
        </div>
      )}

      <CaptureForm userId={user.id} />
      <InboxList items={allItems} userId={user.id} />
    </div>
  )
}
