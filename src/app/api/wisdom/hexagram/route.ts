import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { LINE_POSITION } from '@/lib/wisdom'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001'

interface RequestBody {
  hexagram_num:    number
  nameHan:         string
  nameVi:          string
  meaning:         string
  advice:          string
  keywords:        string[]
  energy:          string
  movingLines:     number[]   // 1-indexed positions
  lineValues:      number[]   // 6,7,8,9 for each line
  relatedHexagram?: { number: number; nameHan: string; nameVi: string; meaning: string }
  question?:       string
  dayCanChi?:      string
  lunarDate?:      string
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
    `Quẻ chính: ${body.hexagram_num}. ${body.nameHan} (${body.nameVi})`,
    `Ý nghĩa: ${body.meaning}`,
    `Năng lượng: ${body.energy === 'favorable' ? 'thuận lợi' : body.energy === 'neutral' ? 'trung tính' : 'cần thận trọng'}`,
  ]

  // Moving lines with traditional notation
  if (body.movingLines?.length > 0) {
    const movingDesc = body.movingLines.map(pos => {
      const posName = LINE_POSITION[pos - 1] ?? pos
      const val = body.lineValues?.[pos - 1]
      if (val === 9) return `${posName} Cửu (hào ${pos} — dương đang biến thành âm)`
      if (val === 6) return `${posName} Lục (hào ${pos} — âm đang biến thành dương)`
      return `hào ${pos}`
    })
    contextLines.push(`Hào động: ${movingDesc.join('; ')}`)
  } else {
    contextLines.push('Không có hào động (quẻ thuần)')
  }

  if (body.relatedHexagram) {
    contextLines.push(
      `Quẻ biến (sau khi hào động chuyển hóa): ${body.relatedHexagram.number}. ${body.relatedHexagram.nameHan} (${body.relatedHexagram.nameVi})`,
      `Ý nghĩa quẻ biến: ${body.relatedHexagram.meaning}`,
    )
  }

  if (body.dayCanChi) contextLines.push(`Ngày: ${body.dayCanChi}`)
  if (body.lunarDate) contextLines.push(`Âm lịch: ${body.lunarDate}`)
  if (body.question) contextLines.push(`Câu hỏi: "${body.question}"`)

  const hasMoving = body.movingLines?.length > 0
  const userPrompt = contextLines.join('\n') +
    (hasMoving
      ? '\n\nLuận giải: Đây là quẻ có hào động. Hãy giải thích quẻ chính nói gì về hiện tại, các hào động đang chuyển hóa điều gì, và quẻ biến cho thấy hướng đi tới là gì. Viết 4-5 câu, thực tế, gần gũi. Không dùng markdown.'
      : '\n\nLuận giải: Quẻ thuần — không có hào động, thông điệp ổn định. Hãy giải thích ý nghĩa cho ngày hôm nay trong 3-4 câu thực tế. Không dùng markdown.'
    )

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 350,
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
