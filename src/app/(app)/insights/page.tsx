import { requireUser } from '@/lib/auth'
import { InsightsClient } from '@/components/insights/insights-client'

export default async function InsightsPage() {
  await requireUser()

  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Insights</h1>
        <p className="text-stone-400 text-sm">Pattern từ dữ liệu 30 ngày qua</p>
      </div>
      <InsightsClient />
    </div>
  )
}
