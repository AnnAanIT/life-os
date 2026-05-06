// VN shorthand suffixes — ordered longest first to avoid prefix collision
const VN_SUFFIXES: Array<[string, number]> = [
  ['triệu', 1_000_000],
  ['nghìn', 1_000],
  ['ngàn',  1_000],
  ['tỷ',    1_000_000_000],
  ['ty',    1_000_000_000],
  ['tr',    1_000_000],
  ['k',     1_000],
]

// Foreign currency symbols — ordered longest first so "USD" is matched before "D"
const FX_SYMBOLS: Array<[string, string]> = [
  ['usd', 'USD'], ['eur', 'EUR'], ['sgd', 'SGD'],
  ['jpy', 'JPY'], ['gbp', 'GBP'], ['cny', 'CNY'],
  ['$',   'USD'], ['€',   'EUR'], ['£',   'GBP'],
]

export interface ParseResult {
  vnd:        number | null  // resolved VND (if no FX needed)
  fxCurrency: string | null  // e.g. "USD"
  fxAmount:   number | null  // original foreign amount
}

function toNum(s: string): number | null {
  const n = parseFloat(s.replace(/[,\s_]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

export function parseSmartAmount(input: string): ParseResult {
  const s = input.trim()
  const none: ParseResult = { vnd: null, fxCurrency: null, fxAmount: null }
  if (!s) return none

  const low = s.toLowerCase()

  // 1. Currency prefix: $3000, USD3000
  for (const [sym, code] of FX_SYMBOLS) {
    if (!low.startsWith(sym)) continue
    const num = toNum(s.slice(sym.length))
    if (num !== null) return { vnd: null, fxCurrency: code, fxAmount: num }
  }

  // 2. Currency suffix: 3000USD, 3000$
  for (const [sym, code] of FX_SYMBOLS) {
    if (!low.endsWith(sym)) continue
    const num = toNum(s.slice(0, s.length - sym.length))
    if (num !== null) return { vnd: null, fxCurrency: code, fxAmount: num }
  }

  // 3. VN shorthand suffix: 80tr, 1.5tỷ, 500k
  for (const [suffix, mult] of VN_SUFFIXES) {
    if (!low.endsWith(suffix)) continue
    const num = toNum(s.slice(0, s.length - suffix.length))
    if (num !== null) return { vnd: Math.round(num * mult), fxCurrency: null, fxAmount: null }
  }

  // 4. Plain number
  const plain = toNum(s)
  if (plain !== null) return { vnd: plain, fxCurrency: null, fxAmount: null }

  return none
}
