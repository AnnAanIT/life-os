import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserCategories, expenseCategories, incomeCategories } from '@/lib/categories'

export async function POST(req: Request) {
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ type: 'note', content: text })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ type: 'note', content: text })
  }

  // Build category lists from user's settings (fallback to defaults if unauthenticated)
  let expenseCatStr = 'food (Ăn uống), transport (Di chuyển), shopping (Mua sắm), entertainment (Giải trí), health (Sức khỏe), education (Học tập), bills (Hóa đơn), investment (Đầu tư), other (Khác)'
  let incomeCatStr  = 'salary (Lương), freelance (Freelance), gift (Quà tặng), investment (Đầu tư), other (Khác)'

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const cats = await getUserCategories(supabase, user.id)
      expenseCatStr = expenseCategories(cats).map(c => `${c.key} (${c.name})`).join(', ')
      incomeCatStr  = incomeCategories(cats).map(c => `${c.key} (${c.name})`).join(', ')
    }
  } catch { /* use defaults */ }

  const systemPrompt = `Classify Vietnamese personal finance text. Return ONLY valid JSON, no markdown, no explanation.

Types:
- expense: {"type":"expense","amount":number,"category":string,"description":string}
- income:  {"type":"income","amount":number,"category":string,"description":string}
- task:    {"type":"task","title":string,"is_mit":boolean}
- note:    {"type":"note","content":string}

Amount rules: k=×1000, tr/triệu=×1000000. Examples: "50k"→50000, "1.5tr"→1500000.

Expense category keys (ONLY use these): ${expenseCatStr}
Income category keys  (ONLY use these): ${incomeCatStr}

Format examples:
"ăn phở 50k"        → {"type":"expense","amount":50000,"category":"food","description":"ăn phở"}
"tiền điện 200k"    → {"type":"expense","amount":200000,"category":"bills","description":"tiền điện"}
"xăng xe 150k"      → {"type":"expense","amount":150000,"category":"transport","description":"xăng xe"}
"khám bệnh 300k"    → {"type":"expense","amount":300000,"category":"health","description":"khám bệnh"}
"học phí 2tr"       → {"type":"expense","amount":2000000,"category":"education","description":"học phí"}
"mua quần 300k"     → {"type":"expense","amount":300000,"category":"shopping","description":"mua quần"}
"lương 15tr"        → {"type":"income","amount":15000000,"category":"salary","description":"lương"}
"freelance 3tr"     → {"type":"income","amount":3000000,"category":"freelance","description":"freelance"}
"họp 3h chiều"      → {"type":"task","title":"Họp 3h chiều","is_mit":false}`

  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }],
    })

    const raw = message.content[0]
    if (raw.type !== 'text') return NextResponse.json({ type: 'note', content: text })

    let jsonText = raw.text.trim()
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
    if (fenceMatch) jsonText = fenceMatch[1].trim()

    return NextResponse.json(JSON.parse(jsonText))
  } catch {
    return NextResponse.json({ type: 'note', content: text })
  }
}
