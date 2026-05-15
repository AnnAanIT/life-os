import { HEXAGRAMS, getHexagram, type Hexagram } from './hexagrams'

export interface HexagramReading {
  hexagram:        Hexagram
  lineValues:      (6 | 7 | 8 | 9)[]  // index 0 = line 1 (bottom) … index 5 = line 6 (top)
  movingLines:     number[]            // 1-indexed positions of lines 6 or 9
  relatedHexagram?: Hexagram           // present when movingLines.length > 0
  question?:       string
  timestamp:       Date
}

// Generate a random hexagram (1–64) using crypto if available, fallback to Math.random
function secureRandom64(): number {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    const buf = new Uint8Array(1)
    let n: number
    do {
      globalThis.crypto.getRandomValues(buf)
      n = buf[0]
    } while (n >= 192) // reject to avoid modulo bias (192 = 3 * 64)
    return (n % 64) + 1
  }
  return Math.floor(Math.random() * 64) + 1
}

export function drawHexagram(question?: string): HexagramReading {
  const num = secureRandom64()
  const hexagram = getHexagram(num)!
  return { hexagram, lineValues: [], movingLines: [], question, timestamp: new Date() }
}

// Classic yarrow-stalk simulation: 3 coin tosses × 6 lines
// Each coin: heads=3 (yang), tails=2 (yin)
// Line value = sum of 3 coins: 6=old-yin, 7=young-yang, 8=young-yin, 9=old-yang
// Lines build from bottom (line 1) to top (line 6)
// Trigram = 3 lines; lower = lines 1-3, upper = lines 4-6
function tossCoins(): 6 | 7 | 8 | 9 {
  let sum = 0
  for (let i = 0; i < 3; i++) {
    sum += Math.random() < 0.5 ? 3 : 2
  }
  return sum as 6 | 7 | 8 | 9
}

function lineToYin(value: number): boolean {
  // 6=old-yin(moving), 7=young-yang, 8=young-yin, 9=old-yang(moving)
  return value === 6 || value === 8
}

const TRIGRAM_NUMBERS: Record<string, number> = {
  '111': 1, // ☰ Kiền (Heaven)
  '000': 2, // ☷ Khôn (Earth)
  '100': 3, // ☳ Chấn (Thunder)  — corrected: bottom line yang
  '010': 4, // ☵ Khảm (Water)
  '001': 5, // ☶ Cấn (Mountain)
  '011': 6, // ☴ Tốn (Wind)
  '101': 7, // ☲ Ly (Fire)
  '110': 8, // ☱ Đoài (Lake)
}

// King Wen hexagram lookup: upper trigram (key) × lower trigram → hexagram number
// Rows = upper, cols = lower (Kiền, Đoài, Ly, Chấn, Tốn, Khảm, Cấn, Khôn)
const KING_WEN: Record<number, Record<number, number>> = {
  1: { 1:1,  2:43, 3:14, 4:34, 5:9,  6:5,  7:26, 8:11 },
  2: { 1:10, 2:58, 3:38, 4:54, 5:61, 6:60, 7:41, 8:19 },
  3: { 1:13, 2:49, 3:30, 4:55, 5:37, 6:63, 7:22, 8:36 },
  4: { 1:25, 2:17, 3:21, 4:51, 5:42, 6:3,  7:27, 8:24 },
  5: { 1:44, 2:28, 3:50, 4:32, 5:57, 6:48, 7:18, 8:46 },
  6: { 1:6,  2:47, 3:64, 4:40, 5:59, 6:29, 7:4,  8:7  },
  7: { 1:33, 2:31, 3:56, 4:62, 5:53, 6:39, 7:52, 8:15 },
  8: { 1:12, 2:45, 3:35, 4:16, 5:20, 6:8,  7:23, 8:2  },
}

// TRIGRAM_NUMBERS: '100'→3(Chấn), '010'→4(Khảm) — so order must match actual values
const TRIGRAM_ORDER = [1, 8, 7, 3, 6, 4, 5, 2] // Kiền,Đoài,Ly,Chấn,Tốn,Khảm,Cấn,Khôn

function trigramIndex(t: string): number {
  const n = TRIGRAM_NUMBERS[t] ?? 1
  return TRIGRAM_ORDER.indexOf(n) + 1
}

export function drawHexagramByCoins(question?: string): HexagramReading {
  const lineValues = Array.from({ length: 6 }, tossCoins)
  const lines = lineValues.map(v => (lineToYin(v) ? '0' : '1'))

  const lower = lines.slice(0, 3).join('')
  const upper = lines.slice(3, 6).join('')

  const upperIdx = trigramIndex(upper)
  const lowerIdx = trigramIndex(lower)

  // Table is indexed [lower][upper] — match King Wen convention
  const num = KING_WEN[lowerIdx]?.[upperIdx] ?? secureRandom64()
  const hexagram = getHexagram(num) ?? getHexagram(1)!

  // Moving lines: 6 = old yin (→ yang), 9 = old yang (→ yin)
  const movingLines = lineValues
    .map((v, i) => (v === 6 || v === 9 ? i + 1 : 0))
    .filter(Boolean)

  // Related hexagram: flip every moving line to its opposite
  let relatedHexagram: Hexagram | undefined
  if (movingLines.length > 0) {
    const relLines = lineValues.map(v => {
      if (v === 6) return '1'  // old yin  → yang
      if (v === 9) return '0'  // old yang → yin
      return lineToYin(v) ? '0' : '1'
    })
    const relLower = relLines.slice(0, 3).join('')
    const relUpper = relLines.slice(3, 6).join('')
    const relNum   = KING_WEN[trigramIndex(relLower)]?.[trigramIndex(relUpper)]
    if (relNum) relatedHexagram = getHexagram(relNum) ?? undefined
  }

  return { hexagram, lineValues, movingLines, relatedHexagram, question, timestamp: new Date() }
}

export { HEXAGRAMS }
