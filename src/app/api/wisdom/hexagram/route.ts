import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001'

interface RequestBody {
  hexagram_num: number
  nameHan: string
  nameVi: string
  meaning: string
  advice: string
  keywords: string[]
  energy: string
  question?: string
  dayCanChi?: string
  lunarDate?: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const body: RequestBody = await req.json()
  if (!body.hexagram_num) return NextResponse.json({ error: 'Missing hexagram' }, { status: 400 })

  const contextLines: string[] = [
    `Quẻ ${body.hexagram_num}: ${body.nameHan} (${body.nameVi})`,
    `Ý nghĩa: ${body.meaning}`,
    `Từ khóa: ${body.keywords.join(', ')}`,
    `Năng lượng: ${body.energy === 'favorable' ? 'thuận lợi' : body.energy === 'neutral' ? 'trung tính' : 'cần thận trọng'}`,
  ]
  if (body.dayCanChi) contextLines.push(`Ngày: ${body.dayCanChi}`)
  if (body.lunarDate) contextLines.push(`Âm lịch: ${body.lunarDate}`)
  if (body.question) contextLines.push(`Câu hỏi người hỏi: "${body.question}"`)

  const userPrompt = contextLines.join('\n') +
    '\n\nHãy luận giải quẻ này trong 3-4 câu ngắn gọn, thực tế, gắn với hoàn cảnh người hỏi nếu có câu hỏi. Không giải thích lý thuyết, chỉ đưa ra thông điệp thiết thực cho ngày hôm nay.'

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 250,
    system: [{
      type: 'text',
      text: 'Bạn là người thông thái về Kinh Dịch, giải quẻ theo phong cách Việt Nam — thực tế, gần gũi, không huyền bí. Chỉ trả lời bằng tiếng Việt. Không dùng markdown hay bullet points. Chỉ viết đoạn văn xuôi ngắn.',
      cache_control: { type: 'ephemeral' },
    }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ interpretation: text })
}
