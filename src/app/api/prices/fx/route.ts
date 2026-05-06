import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const currency = searchParams.get('currency')?.toUpperCase() ?? 'USD'

  // USD: use USDT from CoinGecko (already integrated, reliable peg)
  if (currency === 'USD') {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=vnd',
        { next: { revalidate: 3600 } }
      )
      if (res.ok) {
        const data = await res.json()
        const rate: number | undefined = data?.tether?.vnd
        if (rate) return NextResponse.json({ rate, source: 'USDT' })
      }
    } catch { /* fall through */ }
  }

  // General FX: open.er-api.com (free, no key needed)
  try {
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${currency}`,
      { next: { revalidate: 3600 } }
    )
    if (res.ok) {
      const data = await res.json()
      const rate: number | undefined = data?.rates?.VND
      if (rate) return NextResponse.json({ rate })
    }
  } catch { /* fall through */ }

  return NextResponse.json({}, { status: 503 })
}
