// Lunar calendar
export { solarToLunar, solarToLunarFromDate, formatLunarDate, jdFromDate } from './lunar'
export type { LunarDate } from './lunar'

// Can Chi (Thiên Can × Địa Chi)
export {
  THIEN_CAN, DIA_CHI, CHI_HOURS,
  getYearCanChi, getDayCanChi,
  getLuckyHours, getDayQuality, getDaySummary,
} from './can-chi'
export type { ThienCan, DiaChi, LuckyHour, DayQuality, DaySummary } from './can-chi'

// I-Ching hexagrams
export { HEXAGRAMS, getHexagram } from './hexagrams'
export type { Hexagram } from './hexagrams'

// Hexagram engine
export { drawHexagram, drawHexagramByCoins } from './hexagram-engine'
export type { HexagramReading } from './hexagram-engine'

// Zodiac (Tử Vi / Can Chi năm)
export {
  ZODIAC_SIGNS, getZodiacByYear, getZodiacByKey,
  zodiacKeyFromYear, getZodiacRelation,
} from './zodiac'
export type { ZodiacSign, ZodiacRelation } from './zodiac'
