// ─── Thiên Can & Địa Chi ───────────────────────────────────────────────────

export const THIEN_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const
export const DIA_CHI   = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const

export type ThienCan = typeof THIEN_CAN[number]
export type DiaChi   = typeof DIA_CHI[number]

// Giờ tương ứng với từng Địa Chi (mỗi giờ = 2 tiếng đồng hồ)
export const CHI_HOURS: { chi: DiaChi; start: number; end: number; label: string }[] = [
  { chi: 'Tý',  start: 23, end: 1,  label: '23:00–01:00' },
  { chi: 'Sửu', start: 1,  end: 3,  label: '01:00–03:00' },
  { chi: 'Dần', start: 3,  end: 5,  label: '03:00–05:00' },
  { chi: 'Mão', start: 5,  end: 7,  label: '05:00–07:00' },
  { chi: 'Thìn',start: 7,  end: 9,  label: '07:00–09:00' },
  { chi: 'Tỵ',  start: 9,  end: 11, label: '09:00–11:00' },
  { chi: 'Ngọ', start: 11, end: 13, label: '11:00–13:00' },
  { chi: 'Mùi', start: 13, end: 15, label: '13:00–15:00' },
  { chi: 'Thân',start: 15, end: 17, label: '15:00–17:00' },
  { chi: 'Dậu', start: 17, end: 19, label: '17:00–19:00' },
  { chi: 'Tuất',start: 19, end: 21, label: '19:00–21:00' },
  { chi: 'Hợi', start: 21, end: 23, label: '21:00–23:00' },
]

// ─── Tính Can Chi từ năm dương lịch ────────────────────────────────────────

export function getYearCanChi(year: number): { can: ThienCan; chi: DiaChi; full: string } {
  const can = THIEN_CAN[(year - 4) % 10]
  const chi = DIA_CHI[(year - 4) % 12]
  return { can, chi, full: `${can} ${chi}` }
}

// ─── Tính Can Chi từ ngày dương lịch ───────────────────────────────────────
// Thuật toán: dùng Julian Day Number (JDN) làm neo
// JDN 0 (01/01/4713 TCN) có ngày can chi là Giáp Tý (index 0)

function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

export function getDayCanChi(date: Date): { can: ThienCan; chi: DiaChi; full: string } {
  const jdn = toJDN(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const can = THIEN_CAN[jdn % 10]
  const chi = DIA_CHI[jdn % 12]
  return { can, chi, full: `${can} ${chi}` }
}

// ─── Giờ hoàng đạo theo ngày (index của Địa Chi ngày) ──────────────────────
// Bảng này theo hệ thống "Lục Diệu" truyền thống Việt Nam
// Key: index của Địa Chi ngày (0=Tý … 11=Hợi)
// Value: mảng index các giờ hoàng đạo trong ngày đó
const LUCKY_HOUR_INDICES: Record<number, number[]> = {
  0:  [1, 2, 3, 6, 8, 9],   // Ngày Tý  → giờ Sửu, Dần, Mão, Ngọ, Thân, Dậu
  1:  [2, 4, 5, 7, 8, 10],  // Ngày Sửu → giờ Dần, Thìn, Tỵ, Mùi, Thân, Tuất
  2:  [0, 3, 4, 7, 9, 10],  // Ngày Dần → giờ Tý, Mão, Thìn, Mùi, Dậu, Tuất
  3:  [0, 2, 5, 8, 10, 11], // Ngày Mão → giờ Tý, Dần, Tỵ, Thân, Tuất, Hợi
  4:  [1, 2, 6, 8, 9, 11],  // Ngày Thìn→ giờ Sửu, Dần, Ngọ, Thân, Dậu, Hợi
  5:  [0, 1, 3, 6, 7, 10],  // Ngày Tỵ  → giờ Tý, Sửu, Mão, Ngọ, Mùi, Tuất
  6:  [1, 2, 5, 7, 9, 10],  // Ngày Ngọ → giờ Sửu, Dần, Tỵ, Mùi, Dậu, Tuất
  7:  [0, 2, 3, 6, 8, 11],  // Ngày Mùi → giờ Tý, Dần, Mão, Ngọ, Thân, Hợi
  8:  [0, 1, 4, 6, 7, 9],   // Ngày Thân→ giờ Tý, Sửu, Thìn, Ngọ, Mùi, Dậu
  9:  [2, 4, 5, 7, 10, 11], // Ngày Dậu → giờ Dần, Thìn, Tỵ, Mùi, Tuất, Hợi
  10: [0, 3, 4, 5, 8, 11],  // Ngày Tuất→ giờ Tý, Mão, Thìn, Tỵ, Thân, Hợi
  11: [1, 3, 6, 8, 9, 10],  // Ngày Hợi → giờ Sửu, Mão, Ngọ, Thân, Dậu, Tuất
}

export interface LuckyHour {
  chi: DiaChi
  label: string  // ví dụ: "07:00–09:00"
}

export function getLuckyHours(date: Date): LuckyHour[] {
  const { chi } = getDayCanChi(date)
  const dayChiIndex = DIA_CHI.indexOf(chi)
  const indices = LUCKY_HOUR_INDICES[dayChiIndex] ?? []
  return indices.map(i => ({
    chi: CHI_HOURS[i].chi,
    label: CHI_HOURS[i].label,
  }))
}

// ─── Chất lượng ngày (Hoàng Đạo / Hắc Đạo) ────────────────────────────────
// Theo hệ thống 12 ngày tốt/xấu luân phiên dựa trên Địa Chi ngày
// Hoàng đạo (6 ngày): Thanh Long, Minh Đường, Kim Quỹ, Thiên Đức, Ngọc Đường, Tư Mệnh
// Hắc đạo (6 ngày): Thiên Hình, Chu Tước, Bạch Hổ, Thiên Lao, Huyền Vũ, Câu Trận

const DAY_QUALITY: Record<number, 'hoang-dao' | 'hac-dao'> = {
  0:  'hoang-dao', // Tý   — Thanh Long
  1:  'hac-dao',   // Sửu  — Thiên Hình
  2:  'hoang-dao', // Dần  — Minh Đường
  3:  'hac-dao',   // Mão  — Chu Tước
  4:  'hoang-dao', // Thìn — Kim Quỹ
  5:  'hac-dao',   // Tỵ   — Bạch Hổ
  6:  'hoang-dao', // Ngọ  — Thiên Đức
  7:  'hac-dao',   // Mùi  — Thiên Lao
  8:  'hoang-dao', // Thân — Ngọc Đường
  9:  'hac-dao',   // Dậu  — Huyền Vũ
  10: 'hoang-dao', // Tuất — Tư Mệnh
  11: 'hac-dao',   // Hợi  — Câu Trận
}

export type DayQuality = 'hoang-dao' | 'hac-dao'

export function getDayQuality(date: Date): { quality: DayQuality; label: string; description: string } {
  const { chi } = getDayCanChi(date)
  const index = DIA_CHI.indexOf(chi)
  const quality = DAY_QUALITY[index] ?? 'hoang-dao'
  return {
    quality,
    label: quality === 'hoang-dao' ? 'Hoàng Đạo' : 'Hắc Đạo',
    description: quality === 'hoang-dao'
      ? 'Ngày thuận lợi để khởi sự việc quan trọng.'
      : 'Nên thận trọng, tránh khởi sự việc lớn.',
  }
}

// ─── Tóm tắt ngày hôm nay ─────────────────────────────────────────────────

export interface DaySummary {
  canChi: { can: ThienCan; chi: DiaChi; full: string }
  quality: { quality: DayQuality; label: string; description: string }
  luckyHours: LuckyHour[]
}

export function getDaySummary(date: Date = new Date()): DaySummary {
  return {
    canChi:     getDayCanChi(date),
    quality:    getDayQuality(date),
    luckyHours: getLuckyHours(date),
  }
}
