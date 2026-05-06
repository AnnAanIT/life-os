import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001'

interface AssetRow {
  name: string
  type: string
  currentValue: number
  costBasis: number | null
  pnl: number | null
  pnlPct: number | null
  allocationPct: number
}

interface RequestBody {
  totalValue: number
  totalCost: number | null
  totalPnl: number | null
  totalPnlPct: number | null
  assets: AssetRow[]
}

function formatVND(n: number): string {
  if (Math.abs(n) >= 1_000_000_000)
    return (n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + ' tỷ ₫'
  if (Math.abs(n) >= 1_000_000)
    return Math.round(n / 1_000_000) + ' tr ₫'
  return n.toLocaleString('vi-VN') + ' ₫'
}

function fmtPct(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%' }

function buildPrompt(body: RequestBody): string {
  const { totalValue, totalPnl, totalPnlPct, assets } = body

  const assetLines = assets
    .sort((a, b) => b.currentValue - a.currentValue)
    .map(a => {
      const pnlStr = a.pnl !== null && a.pnlPct !== null
        ? ` | Lãi/Lỗ: ${a.pnl >= 0 ? '+' : ''}${formatVND(a.pnl)} (${fmtPct(a.pnlPct)})`
        : ''
      return `- ${a.name} [${a.type}]: ${formatVND(a.currentValue)} (${a.allocationPct.toFixed(0)}% danh mục)${pnlStr}`
    })
    .join('\n')

  const pnlLine = totalPnl !== null && totalPnlPct !== null
    ? `Lãi/Lỗ tổng: ${totalPnl >= 0 ? '+' : ''}${formatVND(totalPnl)} (${fmtPct(totalPnlPct)})`
    : 'Chưa đủ dữ liệu giá vốn để tính lãi/lỗ.'

  return `Đây là danh mục đầu tư cá nhân tại thời điểm hiện tại:

Tổng tài sản: ${formatVND(totalValue)}
${pnlLine}

Chi tiết:
${assetLines}

Hãy đưa ra nhận xét ngắn gọn (3-4 câu) bằng tiếng Việt. Giọng điệu thân thiện, trung lập — không phán xét, không khuyên mua/bán cụ thể. Nêu tài sản hiệu quả nhất, tài sản kém nhất (nếu có), và nhận xét về mức độ tập trung rủi ro nếu đáng chú ý.`
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: RequestBody = await req.json()
  if (!body.assets?.length) return NextResponse.json({ error: 'No assets' }, { status: 400 })

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: [{
      type: 'text',
      text: 'Bạn là trợ lý tài chính cá nhân. Chỉ trả lời bằng tiếng Việt. Không dùng markdown, không dùng bullet points — chỉ viết đoạn văn xuôi ngắn gọn.',
      cache_control: { type: 'ephemeral' },
    }],
    messages: [{ role: 'user', content: buildPrompt(body) }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ insight: text })
}
