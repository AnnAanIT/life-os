'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

export function FinanceInsight() {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ai/finance-insight')
      .then(r => r.json())
      .then(d => setInsight(d.insight ?? null))
      .catch(() => setInsight(null))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && !insight) return null

  return (
    <div className="bg-amber-50 rounded-2xl px-4 py-3.5 border border-amber-100 flex gap-3">
      <Sparkles size={15} className="text-amber-500 shrink-0 mt-0.5" />
      {loading ? (
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-amber-100 rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-amber-100 rounded-full animate-pulse w-1/2" />
        </div>
      ) : (
        <p className="text-sm text-amber-800 leading-relaxed">{insight}</p>
      )}
    </div>
  )
}
