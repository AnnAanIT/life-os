import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001'

// ── Coin IDs for CoinGecko ─────────────────────────────────────────────────
const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
  XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', USDT: 'tether',
  TON: 'the-open-network', TRX: 'tron', AVAX: 'avalanche-2',
  MATIC: 'matic-network', DOT: 'polkadot', LINK: 'chainlink',
  LTC: 'litecoin', BCH: 'bitcoin-cash', UNI: 'uniswap', ATOM: 'cosmos', APT: 'aptos',
}

// ── Tool implementations ───────────────────────────────────────────────────
async function getCryptoPrices(symbols: string[]): Promise<Record<string, number>> {
  const ids = symbols.map(s => COIN_IDS[s.toUpperCase()]).filter(Boolean)
  if (!ids.length) return {}
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=vnd`
    )
    if (!res.ok) return {}
    const data = await res.json()
    const result: Record<string, number> = {}
    for (const sym of symbols) {
      const id = COIN_IDS[sym.toUpperCase()]
      if (id && data[id]?.vnd) result[sym.toUpperCase()] = data[id].vnd
    }
    return result
  } catch { return {} }
}

async function getVnGoldPrice(): Promise<{ sjc: number; nhan9999: number; source: string } | null> {
  // 1. Claude web_search — returns separate SJC and nhẫn 9999 prices
  try {
    const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const webSearchTool = { type: 'web_search_20250305', name: 'web_search' } as unknown as Anthropic.Tool
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      tools: [webSearchTool],
      messages: [{
        role: 'user',
        content:
          `Ngày hôm nay là ${today}. Tìm giá vàng mua vào tại Việt Nam hôm nay:\n` +
          '1. Giá vàng miếng SJC mua vào (VND/lượng)\n' +
          '2. Giá vàng nhẫn 9999 mua vào (VND/lượng)\n' +
          'Chỉ trả lời JSON: {"sjc": <số VND>, "nhan9999": <số VND>, "source": "<PNJ hoặc DOJI hoặc SJC>"}',
      }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    const match = text.match(/\{[^{}]*"sjc"[^{}]*"nhan9999"[^{}]*\}/) ??
                  text.match(/\{[^{}]*"nhan9999"[^{}]*"sjc"[^{}]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      const sjc: number   = parsed.sjc
      const nhan: number  = parsed.nhan9999
      if (sjc >= 50_000_000 && sjc <= 500_000_000 && nhan >= 50_000_000 && nhan <= 500_000_000) {
        return {
          sjc:      Math.round(sjc),
          nhan9999: Math.round(nhan),
          source:   String(parsed.source ?? 'Web Search'),
        }
      }
    }
  } catch { /* fall through */ }

  // 2. Fallback: international XAU/USD — open.er-api.com
  //    rates.XAU = XAU per USD → invert → USD/troy oz; 1 lượng = 37.5 g / 31.1035 g/troy oz
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) return null
    const data = await res.json()
    const xauPerUsd: number = data.rates?.XAU
    const usdVnd: number    = data.rates?.VND
    if (!xauPerUsd || !usdVnd) return null
    const intl = Math.round((1 / xauPerUsd) * (37.5 / 31.1035) * usdVnd)
    // SJC historically trades ~5-10% above international; nhẫn tracks international more closely
    return { sjc: intl, nhan9999: intl, source: 'Giá quốc tế (XAU/USD)' }
  } catch { return null }
}

async function getVnStockPrice(ticker: string): Promise<{ priceVND: number; source: string } | null> {
  const sym = ticker.toUpperCase()
  const now  = Math.floor(Date.now() / 1000)
  const from = now - 14 * 86400  // 14 days back to cover weekends/holidays

  // 1. Claude web_search — most reliable (same pattern as gold price)
  try {
    const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const webSearchTool = { type: 'web_search_20250305', name: 'web_search' } as unknown as Anthropic.Tool
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      tools: [webSearchTool],
      messages: [{
        role: 'user',
        content:
          `Ngày ${today}. Giá cổ phiếu ${sym} trên sàn HOSE hoặc HNX hôm nay là bao nhiêu VND/cổ phiếu?\n` +
          `Chỉ trả lời JSON: {"price": <số VND nguyên>, "source": "<tên sàn hoặc nguồn>"}`,
      }],
    })
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
    const match = text.match(/\{[^{}]*"price"[^{}]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      const price: number = parsed.price
      // VN stock prices are typically 1,000–999,000 VND (some can be millions for BRK-style)
      if (price && price > 1000 && price < 10_000_000) {
        return { priceVND: Math.round(price), source: String(parsed.source ?? 'Web Search') }
      }
    }
  } catch { /* fall through to REST APIs */ }

  // 2. Yahoo Finance — VN stocks use .HM (HOSE) or .HN (HNX)
  for (const suffix of ['.HM', '.HN']) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${sym}${suffix}?interval=1d&range=5d`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }
      )
      if (res.ok) {
        const data = await res.json()
        const price: number | undefined = data?.chart?.result?.[0]?.meta?.regularMarketPrice
        const currency: string | undefined = data?.chart?.result?.[0]?.meta?.currency
        // Yahoo returns VND prices for Vietnamese stocks (e.g. 65600 = 65,600 VND)
        if (price && price > 1000 && (currency === 'VND' || currency == null)) {
          return { priceVND: Math.round(price), source: 'Yahoo Finance' }
        }
      }
    } catch { /* try next suffix */ }
  }

  // 3. TCBS public API — returns daily OHLCV, close price in VND
  try {
    const res = await fetch(
      `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term?ticker=${sym}&type=stock&resolution=D&from=${from}&to=${now}`,
      { headers: { 'Accept': 'application/json' } }
    )
    if (res.ok) {
      const data = await res.json()
      const bars: Array<{ close?: number }> = data?.data ?? []
      const last = bars.at(-1)
      const price = last?.close
      // TCBS returns actual VND (e.g. 70000 = 70,000 VND/cp)
      if (price && price > 1000) return { priceVND: price, source: 'TCBS' }
    }
  } catch { /* try next */ }

  // 4. VNDirect finfo API (matchedPrice is in thousands VND)
  try {
    const res = await fetch(
      `https://finfo-api.vndirect.com.vn/v4/stocks?code=${sym}&fields=code,matchedPrice`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      const price: number | undefined = data?.data?.[0]?.matchedPrice
      if (price) return { priceVND: price * 1000, source: 'VNDirect' }
    }
  } catch { /* try next */ }

  // 5. SSI iBoard API
  try {
    const res = await fetch(
      `https://iboard.ssi.com.vn/dchart/api/history?symbol=${sym}&resolution=D&from=${from}&to=${now}`,
      { headers: { 'Accept': 'application/json', 'Referer': 'https://iboard.ssi.com.vn' } }
    )
    if (res.ok) {
      const data = await res.json()
      const closes: number[] = data?.c ?? []
      const price = closes.at(-1)
      if (price && price > 1000) return { priceVND: price, source: 'SSI' }
    }
  } catch { /* fall through */ }

  return null
}

// ── Execute tool call from Claude ──────────────────────────────────────────
async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_crypto_prices':
      return getCryptoPrices(input.symbols as string[])
    case 'get_vn_gold_price':
      return getVnGoldPrice()
    case 'get_vn_stock_price':
      return getVnStockPrice(input.ticker as string)
    default:
      return { error: 'Unknown tool' }
  }
}

// ── Tool definitions for Claude ────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_crypto_prices',
    description: 'Lấy giá crypto hiện tại theo VND từ CoinGecko. Dùng cho tài sản loại crypto.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'Danh sách symbol crypto, ví dụ: ["BTC", "ETH", "SOL"]',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'get_vn_gold_price',
    description: 'Lấy giá vàng tại Việt Nam hôm nay theo VND/lượng. Trả về riêng giá SJC và giá nhẫn 9999. Dùng cho mọi tài sản loại vàng (gold).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_vn_stock_price',
    description: 'Lấy giá cổ phiếu niêm yết trên HOSE/HNX theo VND/cổ phiếu từ VNDirect.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Mã cổ phiếu, ví dụ: VNM, BID, TCB, HPG',
        },
      },
      required: ['ticker'],
    },
  },
]

// ── Request body types ─────────────────────────────────────────────────────
interface AssetInput {
  id: string
  name: string
  asset_type: string
  symbol: string | null
  quantity: number | null
  unit: string | null
  buy_price_per_unit: number | null
  buy_value: number | null
  current_value: number
}

function buildPrompt(assets: AssetInput[]): string {
  const lines = assets.map((a, i) => {
    const qty  = a.quantity ? `${a.quantity} ${a.unit ?? ''}` : null
    const cost = a.buy_price_per_unit
      ? `giá vốn ${a.buy_price_per_unit.toLocaleString('vi-VN')} VND/${a.unit ?? 'đơn vị'}`
      : a.buy_value
        ? `giá vốn ban đầu ${a.buy_value.toLocaleString('vi-VN')} VND`
        : 'không có giá vốn'
    const sym  = a.symbol ? ` (symbol: ${a.symbol})` : ''
    return `${i + 1}. [${a.id}] ${a.name}${sym} | Loại: ${a.asset_type} | ${qty ? qty + ' | ' : ''}${cost}`
  })

  return `Danh mục đầu tư cần lấy giá realtime:

${lines.join('\n')}

Hãy dùng tools để lấy giá hiện tại cho các tài sản phù hợp:
- crypto → get_crypto_prices
- gold (vàng) → get_vn_gold_price
- stock (cổ phiếu) → get_vn_stock_price với mã ticker

Lưu ý: savings, cash, real_estate, other không cần lấy giá — giữ nguyên.
Sau khi lấy đủ giá, hãy dừng lại (không cần giải thích thêm).`
}

// ── Main route ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assets }: { assets: AssetInput[] } = await req.json()
  if (!assets?.length) return NextResponse.json({ error: 'No assets' }, { status: 400 })

  // ── Agentic tool-use loop ──────────────────────────────────────────────
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: buildPrompt(assets) }
  ]

  // Collect all prices returned by tools
  const collectedPrices: {
    crypto?:   Record<string, number>
    gold?:     { sjc: number; nhan9999: number; source: string }
    stocks?:   Record<string, number>    // ticker → VND per share
    stockSrc?: Record<string, string>    // ticker → source name
  } = {}

  for (let iteration = 0; iteration < 5; iteration++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools: TOOLS,
      messages,
    })

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason !== 'tool_use') break

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      const result = await executeTool(block.name, block.input as Record<string, unknown>)

      // Collect prices for our own calculation
      if (block.name === 'get_crypto_prices' && result) {
        collectedPrices.crypto = { ...collectedPrices.crypto, ...(result as Record<string, number>) }
      }
      if (block.name === 'get_vn_gold_price' && result) {
        collectedPrices.gold = result as typeof collectedPrices.gold
      }
      if (block.name === 'get_vn_stock_price' && result) {
        const r = result as { priceVND: number; source: string } | null
        if (r) {
          const ticker = (block.input as { ticker: string }).ticker.toUpperCase()
          collectedPrices.stocks  = { ...(collectedPrices.stocks  ?? {}), [ticker]: r.priceVND }
          collectedPrices.stockSrc = { ...(collectedPrices.stockSrc ?? {}), [ticker]: r.source }
        }
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result ?? { error: 'No data available' }),
      })
    }

    messages.push({ role: 'user', content: toolResults })
  }

  // ── Calculate P&L per asset using collected prices ─────────────────────
  const results = assets.map(asset => {
    let currentPricePerUnit: number | null = null
    let priceSource = ''

    if (asset.asset_type === 'crypto' && asset.symbol) {
      const p = collectedPrices.crypto?.[asset.symbol.toUpperCase()]
      if (p) { currentPricePerUnit = p; priceSource = 'CoinGecko' }
    } else if (asset.asset_type === 'gold' && collectedPrices.gold) {
      const sym = asset.symbol?.toUpperCase()
      if (sym === 'NHAN9999') {
        currentPricePerUnit = collectedPrices.gold.nhan9999
      } else if (sym === 'TIEM') {
        currentPricePerUnit = Math.max(0, collectedPrices.gold.nhan9999 - 10_000_000)
      } else {
        currentPricePerUnit = collectedPrices.gold.sjc  // SJC default
      }
      priceSource = collectedPrices.gold.source
    } else if (asset.asset_type === 'stock') {
      const ticker = asset.symbol?.toUpperCase() ?? asset.name.toUpperCase().split(' ')[0]
      const p = collectedPrices.stocks?.[ticker]
      if (p) { currentPricePerUnit = p; priceSource = collectedPrices.stockSrc?.[ticker] ?? 'Stock API' }
    }

    if (!currentPricePerUnit || !asset.quantity) {
      return {
        id: asset.id,
        updated: false,
        currentValue: asset.current_value,
        priceSource: null,
      }
    }

    const currentValue = Math.round(currentPricePerUnit * asset.quantity)
    const costBasis    = asset.buy_price_per_unit
      ? asset.buy_price_per_unit * asset.quantity
      : (asset.buy_value ?? null)
    const pnl    = costBasis !== null ? currentValue - costBasis : null
    const pnlPct = pnl !== null && costBasis ? (pnl / costBasis) * 100 : null

    return {
      id:                 asset.id,
      updated:            true,
      currentPricePerUnit,
      currentValue,
      pnl:                pnl    !== null ? Math.round(pnl) : null,
      pnlPct:             pnlPct !== null ? Math.round(pnlPct * 10) / 10 : null,
      priceSource,
    }
  })

  const totalCurrentValue = results.reduce((s, r) => s + r.currentValue, 0)
  const assetsWithPnl     = results.filter(r => r.pnl !== null)
  const totalPnl          = assetsWithPnl.reduce((s, r) => s + r.pnl!, 0)
  const totalCost         = assets.reduce((s, a) => {
    const cost = a.buy_price_per_unit && a.quantity
      ? a.buy_price_per_unit * a.quantity
      : (a.buy_value ?? 0)
    return s + cost
  }, 0)
  const totalPnlPct = totalCost > 0 ? Math.round((totalPnl / totalCost) * 1000) / 10 : null

  return NextResponse.json({ results, totalCurrentValue, totalPnl, totalPnlPct })
}
