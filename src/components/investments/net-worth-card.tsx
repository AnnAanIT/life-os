import { formatVND } from '@/lib/format'

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  gold: { label: 'Vàng', icon: '🪙', color: 'text-amber-500' },
  stock: { label: 'Chứng khoán', icon: '📈', color: 'text-blue-500' },
  savings: { label: 'Tiết kiệm', icon: '🏦', color: 'text-green-500' },
  real_estate: { label: 'Bất động sản', icon: '🏠', color: 'text-purple-500' },
  cash: { label: 'Tiền mặt', icon: '💵', color: 'text-stone-400' },
  other: { label: 'Khác', icon: '💼', color: 'text-stone-400' },
}

interface Asset {
  asset_type: string
  current_value: number
}

interface Props {
  assets: Asset[]
}

export function NetWorthCard({ assets }: Props) {
  const total = assets.reduce((s, a) => s + Number(a.current_value), 0)

  const byType: Record<string, number> = {}
  for (const a of assets) {
    byType[a.asset_type] = (byType[a.asset_type] ?? 0) + Number(a.current_value)
  }

  return (
    <div className="bg-stone-800 rounded-2xl p-5 text-white">
      <p className="text-xs text-stone-400 mb-1">Tổng tài sản (Net Worth)</p>
      <p className="text-3xl font-bold mb-4">{formatVND(total)}</p>
      <div className="space-y-2">
        {Object.entries(byType)
          .sort(([, a], [, b]) => b - a)
          .map(([type, value]) => {
            const meta = TYPE_META[type] ?? TYPE_META.other
            const pct = total > 0 ? Math.round((value / total) * 100) : 0
            return (
              <div key={type} className="flex items-center gap-2">
                <span className="text-sm">{meta.icon}</span>
                <span className="text-xs text-stone-400 flex-1">{meta.label}</span>
                <span className="text-xs text-stone-300">{pct}%</span>
                <span className="text-xs font-medium text-white w-28 text-right">{formatVND(value)}</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}
