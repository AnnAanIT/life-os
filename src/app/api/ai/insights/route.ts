import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic()

const CACHE_TTL_HOURS = 24

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const forceRefresh = new URL(req.url).searchParams.get('refresh') === '1'

  // ── 1. Compute stats (always — cheap, no AI) ──────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { data: happinessData },
    { data: habitLogs },
    { data: allHabits },
    { data: transactions },
    { data: sleepLogs },
    { data: movementLogs },
    { data: energyLogs },
  ] = await Promise.all([
    supabase.from('happiness_scores').select('date, score').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('habit_logs').select('habit_id, date').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('habits').select('id, name').eq('user_id', user.id).eq('is_active', true),
    supabase.from('transactions').select('date, type, amount, category').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('sleep_logs').select('date, duration_hours, quality').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('movement_logs').select('date, did_move, felt_after').eq('user_id', user.id).gte('date', thirtyDaysAgo),
    supabase.from('energy_logs').select('date, score').eq('user_id', user.id).gte('date', thirtyDaysAgo),
  ])

  const scores    = happinessData ?? []
  const logs      = habitLogs ?? []
  const habits    = allHabits ?? []
  const txs       = transactions ?? []
  const sleeps    = sleepLogs ?? []
  const movements = movementLogs ?? []
  const energies  = energyLogs ?? []

  const movedDates      = new Set(movements.filter(m => m.did_move).map(m => m.date))
  const goodSleepDates  = new Set(sleeps.filter(s => (s.quality ?? 0) >= 4).map(s => s.date))
  const highEnergyDates = new Set(energies.filter(e => e.score >= 4).map(e => e.date))
  const lowEnergyDates  = new Set(energies.filter(e => e.score <= 2).map(e => e.date))

  const avg    = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  const round1 = (n: number | null) => n != null ? Math.round(n * 10) / 10 : null

  const habitMap: Record<string, number> = {}
  logs.forEach(l => { habitMap[l.habit_id] = (habitMap[l.habit_id] ?? 0) + 1 })
  const habitStats = habits.map(h => ({
    name: h.name,
    completions: habitMap[h.id] ?? 0,
    rate: Math.round(((habitMap[h.id] ?? 0) / 30) * 100),
  })).sort((a, b) => b.completions - a.completions)

  const expenses    = txs.filter(t => t.type === 'expense')
  const totalSpend  = expenses.reduce((s, t) => s + Number(t.amount), 0)
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const spendByCategory: Record<string, number> = {}
  expenses.forEach(t => { spendByCategory[t.category] = (spendByCategory[t.category] ?? 0) + Number(t.amount) })

  const stats = {
    period: '30 ngày qua',
    happiness: {
      average: round1(avg(scores.map(s => s.score))),
      entries: scores.length,
    },
    habits: {
      totalHabits: habits.length,
      completionRate: habits.length > 0 ? Math.round((logs.length / (habits.length * 30)) * 100) : null,
      topHabits: habitStats.slice(0, 4),
    },
    finance: {
      totalSpend,
      totalIncome,
      byCategory: spendByCategory,
      transactionCount: txs.length,
    },
    sleep: {
      avgHours:   round1(avg(sleeps.map(s => Number(s.duration_hours)).filter(Boolean))),
      avgQuality: round1(avg(sleeps.map(s => s.quality ?? 0).filter(Boolean))),
      entries: sleeps.length,
    },
    energy: {
      average: round1(avg(energies.map(e => e.score))),
      entries: energies.length,
    },
    movement: {
      movedDays: movements.filter(m => m.did_move).length,
      totalDays: movements.length,
    },
    correlations: {
      happinessWithMovement:    round1(avg(scores.filter(s => movedDates.has(s.date)).map(s => s.score))),
      happinessWithoutMovement: round1(avg(scores.filter(s => !movedDates.has(s.date)).map(s => s.score))),
      happinessHighEnergy:      round1(avg(scores.filter(s => highEnergyDates.has(s.date)).map(s => s.score))),
      happinessLowEnergy:       round1(avg(scores.filter(s => lowEnergyDates.has(s.date)).map(s => s.score))),
      happinessGoodSleep:       round1(avg(scores.filter(s => goodSleepDates.has(s.date)).map(s => s.score))),
      happinessOtherSleep:      round1(avg(scores.filter(s => !goodSleepDates.has(s.date)).map(s => s.score))),
    },
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ insights: [], monthly_story: null, stats, cached: false })
  }

  // ── 2. Check cache ────────────────────────────────────────────────────────
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from('ai_insights_cache')
      .select('monthly_story, insights, generated_at')
      .eq('user_id', user.id)
      .single()

    if (cached) {
      const ageHours = (Date.now() - new Date(cached.generated_at).getTime()) / 3_600_000
      if (ageHours < CACHE_TTL_HOURS) {
        return NextResponse.json({
          monthly_story: cached.monthly_story,
          insights:      cached.insights,
          stats,
          cached:        true,
          generated_at:  cached.generated_at,
        })
      }
    }
  }

  // ── 3. Call AI ────────────────────────────────────────────────────────────
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Phân tích dữ liệu 30 ngày qua của tôi. Tìm 3-4 insight có ý nghĩa thực tế.
Viết bằng tiếng Việt, giọng như người bạn thân — cụ thể, ấm áp, không phán xét.
Chỉ đưa ra insight khi có đủ dữ liệu (ít nhất 5 data points cho correlation).
Nếu dữ liệu ít, nhận xét nhẹ nhàng và khuyến khích tiếp tục.

Dữ liệu:
${JSON.stringify(stats, null, 2)}

Trả về JSON duy nhất (ONLY JSON, không có markdown, không có backtick):
{
  "monthly_story": "2-3 câu tóm tắt tháng, giọng thân thiện, đề cập số liệu cụ thể",
  "insights": [
    {
      "title": "tiêu đề ngắn 4-6 từ",
      "body": "1-2 câu cụ thể, có số liệu nếu có",
      "type": "positive"
    }
  ]
}
type có thể là: "positive", "tip", "neutral"`,
      }],
    })

    const raw = message.content[0]
    if (raw.type !== 'text') throw new Error('unexpected response type')

    const result = JSON.parse(raw.text) as { monthly_story: string; insights: unknown[] }

    // ── 4. Save to cache ──────────────────────────────────────────────────
    const now = new Date().toISOString()
    await supabase.from('ai_insights_cache').upsert({
      user_id:       user.id,
      monthly_story: result.monthly_story,
      insights:      result.insights,
      generated_at:  now,
    }, { onConflict: 'user_id' })

    return NextResponse.json({ ...result, stats, cached: false, generated_at: now })
  } catch {
    return NextResponse.json({ insights: [], monthly_story: null, stats, cached: false })
  }
}
