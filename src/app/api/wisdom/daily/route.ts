import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001'

// Vietnam UTC+7
function todayVN(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const today = todayVN()

  // Check cache
  const { data: cached } = await supabase
    .from('wisdom_daily_cache')
    .select('content')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (cached) return NextResponse.json({ content: cached.content, cached: true })

  // Read context from URL params
  const url = new URL(req.url)
  const lunarDate = url.searchParams.get('lunarDate') ?? ''
  const dayCanChi = url.searchParams.get('dayCanChi') ?? ''
  const yearCanChi = url.searchParams.get('yearCanChi') ?? ''
  const quality = url.searchParams.get('quality') ?? ''
  const luckyHours = url.searchParams.get('luckyHours') ?? ''
  const birthYear = url.searchParams.get('birthYear') ?? ''
  const zodiacName = url.searchParams.get('zodiacName') ?? ''
  const zodiacRelation = url.searchParams.get('zodiacRelation') ?? ''

  const contextLines: string[] = [
    `Ngày hôm nay: ${dayCanChi || today}`,
    `Năm: ${yearCanChi}`,
    `Âm lịch: ${lunarDate}`,
    `Chất lượng ngày: ${quality === 'hoang-dao' ? 'Hoàng đạo (tốt)' : quality === 'hac-dao' ? 'Hắc đạo (cần cẩn thận)' : 'Bình thường'}`,
  ]
  if (luckyHours) contextLines.push(`Giờ hoàng đạo: ${luckyHours}`)
  if (zodiacName && birthYear) {
    contextLines.push(`Người dùng tuổi ${zodiacName} (sinh ${birthYear})`)
    if (zodiacRelation) contextLines.push(`Năm nay với tuổi: ${zodiacRelation}`)
  }

  const userPrompt = contextLines.join('\n') +
    '\n\nDựa vào thông tin trên, hãy viết 3-4 câu nhận định ngắn gọn cho ngày hôm nay — bao gồm tinh thần chung của ngày, lời khuyên thực tế (nên làm gì, tránh gì), và khoảng thời gian tốt nếu có. Giọng điệu ấm áp, thực tế, không huyền bí.'

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 280,
    system: [{
      type: 'text',
      text: 'Bạn là người am hiểu lịch pháp và tử vi Việt Nam, đưa ra nhận định ngày theo phong cách thực tế, gần gũi. Chỉ trả lời bằng tiếng Việt. Không dùng markdown hay bullet points — chỉ viết đoạn văn xuôi ngắn gọn.',
      cache_control: { type: 'ephemeral' },
    }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''

  // Store in cache (upsert in case of race)
  await supabase.from('wisdom_daily_cache').upsert(
    { user_id: user.id, date: today, content },
    { onConflict: 'user_id,date' }
  )

  return NextResponse.json({ content, cached: false })
}
