import { NextResponse } from 'next/server'

// Map common symbols → CoinGecko IDs
const COIN_IDS: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  USDT: 'tether',
  BNB:  'binancecoin',
  SOL:  'solana',
  USDC: 'usd-coin',
  XRP:  'ripple',
  ADA:  'cardano',
  DOGE: 'dogecoin',
  TON:  'the-open-network',
  TRX:  'tron',
  AVAX: 'avalanche-2',
  MATIC:'matic-network',
  DOT:  'polkadot',
  LINK: 'chainlink',
  LTC:  'litecoin',
  BCH:  'bitcoin-cash',
  UNI:  'uniswap',
  ATOM: 'cosmos',
  APT:  'aptos',
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('symbols') ?? ''
  const symbols = raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)

  const ids = symbols
    .map(s => COIN_IDS[s])
    .filter((id): id is string => Boolean(id))

  if (!ids.length) return NextResponse.json({})

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=vnd`,
      { next: { revalidate: 60 } } // cache 60s
    )
    if (!res.ok) throw new Error('CoinGecko error')
    const data = await res.json()

    // Map back to symbol → vnd price
    const result: Record<string, number> = {}
    for (const sym of symbols) {
      const id = COIN_IDS[sym]
      if (id && data[id]?.vnd) result[sym] = data[id].vnd
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({}, { status: 503 })
  }
}
