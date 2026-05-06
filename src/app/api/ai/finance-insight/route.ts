import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { localMonthRange, localDateStr } from '@/lib/format'

const CATEGORY_LABELS: Record<string, string> = {
  food: 'ăn uống', transport: 'di chuyển', shopping: 'mua sắm',
  entertainment: 'giải trí', health: 'sức khỏe', education: 'học tập',
  bills: 'hóa đơn', salary: 'lương', freelance: 'freelance',
  investment: 'đầu tư', gift: 'quà tặng', other: 'khác',
}

function calcStats(txs: { amount: number; type: string; category: string }[] | null) {
  const income = txs?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const expense = txs?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const byCategory: Record<string, number> = {}
  for (const t of txs ?? []) {
    if (t.type === 'expense') byCategory[t.category] = (byCategory[t.category] ?? 0) + Number(t.amount)
  }
  const topCat = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0]
  return { income, expense, savings: income - expense, topCat }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const today = localDateStr(now)
    const { start: curStart } = localMonthRange(now)
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const { start: prevStart, end: prevEnd } = localMonthRange(prevDate)

    const [{ data: curTx }, { data: prevTx }] = await Promise.all([
      supabase.from('transactions').select('amount, type, category')
        .eq('user_id', user.id).gte('date', curStart).lte('date', today),
      supabase.from('transactions').select('amount, type, category')
        .eq('user_id', user.id).gte('date', prevStart).lte('date', prevEnd),
    ])

    const cur = calcStats(curTx)
    const prev = calcStats(prevTx)

    const daysPassed = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const projectedExpense = daysPassed > 0 ? Math.round((cur.expense / daysPassed) * daysInMonth) : 0
    const expenseChange = prev.expense > 0
      ? Math.round(((cur.expense - prev.expense) / prev.expense) * 100) : null

    const topCatLabel = cur.topCat ? (CATEGORY_LABELS[cur.topCat[0]] ?? cur.topCat[0]) : null

    const contextLines = [
      `Hôm nay ngày ${daysPassed}/${daysInMonth} trong tháng.`,
      cur.income > 0 ? `Thu nhập tháng này: ${cur.income.toLocaleString('vi-VN')}₫.` : '',
      `Chi tiêu đến nay: ${cur.expense.toLocaleString('vi-VN')}₫${expenseChange !== null ? ` (${expenseChange > 0 ? '+' : ''}${expenseChange}% so tháng trước)` : ''}.`,
      topCatLabel ? `Chi nhiều nhất: ${topCatLabel} (${cur.topCat![1].toLocaleString('vi-VN')}₫).` : '',
      projectedExpense > 0 && cur.income > 0 ? `Nếu tiếp tục, dự kiến chi ${projectedExpense.toLocaleString('vi-VN')}₫ cuối tháng.` : '',
      cur.income > 0 ? `Tiết kiệm hiện tại: ${cur.savings.toLocaleString('vi-VN')}₫.` : '',
    ].filter(Boolean).join(' ')

    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system: 'Bạn là trợ lý tài chính thân thiện. Viết 1-2 câu nhận xét ngắn gọn, ấm áp bằng tiếng Việt thuần. Không dùng markdown, không liệt kê số liệu, không dùng emoji. Tập trung vào 1 điểm quan trọng nhất và đưa ra gợi ý nhẹ nhàng nếu cần. Giọng điệu như người bạn, không phải chuyên gia.',
      messages: [{ role: 'user', content: contextLines }],
    })

    const insight = message.content[0].type === 'text' ? message.content[0].text.trim() : null

    return NextResponse.json({ insight })
  } catch {
    return NextResponse.json({ insight: null })
  }
}
