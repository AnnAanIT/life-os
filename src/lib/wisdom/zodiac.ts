export interface ZodiacSign {
  key: string
  nameVi: string
  animal: string
  element: 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ'
  yinYang: 'âm' | 'dương'
  birthYears: number[]
  characteristics: string[]
  strengths: string[]
  weaknesses: string[]
  clashesWith: string[]   // xung
  compatibleWith: string[] // lục hợp
  tripleHarmony: string[] // tam hợp
}

// Chu kỳ 12 năm, bắt đầu từ 1900 (Canh Tý)
// birthYears chứa các năm từ 1900–2031
export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    key: 'rat',
    nameVi: 'Tý',
    animal: 'Chuột',
    element: 'Thủy',
    yinYang: 'dương',
    birthYears: [1900, 1912, 1924, 1936, 1948, 1960, 1972, 1984, 1996, 2008, 2020],
    characteristics: [
      'Thông minh và nhanh nhẹn',
      'Khéo léo trong giao tiếp',
      'Có bản năng kinh doanh tốt',
      'Thích nghi nhanh với môi trường mới',
      'Cẩn thận và hay suy nghĩ kỹ',
    ],
    strengths: ['Nhạy bén', 'Thực dụng', 'Kiên trì', 'Tháo vát'],
    weaknesses: ['Hay lo lắng', 'Đôi khi tính toán quá mức', 'Khó buông bỏ'],
    clashesWith: ['horse'], // Tý xung Ngọ
    compatibleWith: ['ox'],  // Tý hợp Sửu (lục hợp)
    tripleHarmony: ['monkey', 'dragon'], // Thân-Tý-Thìn
  },
  {
    key: 'ox',
    nameVi: 'Sửu',
    animal: 'Trâu',
    element: 'Thổ',
    yinYang: 'âm',
    birthYears: [1901, 1913, 1925, 1937, 1949, 1961, 1973, 1985, 1997, 2009, 2021],
    characteristics: [
      'Chăm chỉ và bền bỉ',
      'Đáng tin cậy và trung thành',
      'Kiên định với mục tiêu đã đặt ra',
      'Cẩn thận và có trách nhiệm',
      'Thực tế và không thích phô trương',
    ],
    strengths: ['Kiên nhẫn', 'Đáng tin', 'Kỷ luật', 'Thực tế'],
    weaknesses: ['Cứng đầu', 'Khó thay đổi quan điểm', 'Đôi khi quá bảo thủ'],
    clashesWith: ['goat'], // Sửu xung Mùi
    compatibleWith: ['rat'], // Sửu hợp Tý
    tripleHarmony: ['snake', 'rooster'], // Tỵ-Dậu-Sửu
  },
  {
    key: 'tiger',
    nameVi: 'Dần',
    animal: 'Hổ',
    element: 'Mộc',
    yinYang: 'dương',
    birthYears: [1902, 1914, 1926, 1938, 1950, 1962, 1974, 1986, 1998, 2010, 2022],
    characteristics: [
      'Dũng cảm và quyết đoán',
      'Có sức hút lãnh đạo tự nhiên',
      'Bảo vệ người thân hết mình',
      'Thích thử thách và không ngại rủi ro',
      'Nhiệt tình và đam mê',
    ],
    strengths: ['Dũng cảm', 'Lãnh đạo', 'Nhiệt huyết', 'Bảo vệ'],
    weaknesses: ['Bốc đồng', 'Khó kiểm soát cảm xúc', 'Đôi khi quá tự tin'],
    clashesWith: ['monkey'], // Dần xung Thân
    compatibleWith: ['pig'],  // Dần hợp Hợi
    tripleHarmony: ['horse', 'dog'], // Dần-Ngọ-Tuất
  },
  {
    key: 'rabbit',
    nameVi: 'Mão',
    animal: 'Mèo',
    element: 'Mộc',
    yinYang: 'âm',
    birthYears: [1903, 1915, 1927, 1939, 1951, 1963, 1975, 1987, 1999, 2011, 2023],
    characteristics: [
      'Tinh tế và nhạy cảm',
      'Khéo léo trong ngoại giao',
      'Yêu cái đẹp và sự hài hòa',
      'Thích cuộc sống bình yên, tránh xung đột',
      'Trực giác tốt và hiểu người',
    ],
    strengths: ['Tinh tế', 'Ngoại giao', 'Sáng tạo', 'Thấu cảm'],
    weaknesses: ['Hay né tránh vấn đề', 'Dễ bị tổn thương', 'Đôi khi thiếu quyết đoán'],
    clashesWith: ['rooster'], // Mão xung Dậu
    compatibleWith: ['dog'],  // Mão hợp Tuất
    tripleHarmony: ['pig', 'goat'], // Hợi-Mão-Mùi
  },
  {
    key: 'dragon',
    nameVi: 'Thìn',
    animal: 'Rồng',
    element: 'Thổ',
    yinYang: 'dương',
    birthYears: [1904, 1916, 1928, 1940, 1952, 1964, 1976, 1988, 2000, 2012, 2024],
    characteristics: [
      'Tự tin và có sức hút mạnh mẽ',
      'Tư duy lớn và tầm nhìn xa',
      'Năng lượng dồi dào và nhiệt huyết',
      'Độc lập và không thích bị kiểm soát',
      'Sáng tạo và hay có ý tưởng đột phá',
    ],
    strengths: ['Tự tin', 'Tầm nhìn', 'Năng lượng', 'Sáng tạo'],
    weaknesses: ['Hay kiêu ngạo', 'Thiếu kiên nhẫn', 'Đòi hỏi cao'],
    clashesWith: ['dog'],   // Thìn xung Tuất
    compatibleWith: ['rooster'], // Thìn hợp Dậu
    tripleHarmony: ['monkey', 'rat'], // Thân-Tý-Thìn
  },
  {
    key: 'snake',
    nameVi: 'Tỵ',
    animal: 'Rắn',
    element: 'Hỏa',
    yinYang: 'âm',
    birthYears: [1905, 1917, 1929, 1941, 1953, 1965, 1977, 1989, 2001, 2013, 2025],
    characteristics: [
      'Sâu sắc và hay suy nghĩ',
      'Trực giác nhạy bén',
      'Ưa tìm tòi và khám phá',
      'Bí ẩn và giữ kín nội tâm',
      'Quyết tâm và không bỏ cuộc dễ dàng',
    ],
    strengths: ['Trực giác', 'Sâu sắc', 'Quyết tâm', 'Khôn ngoan'],
    weaknesses: ['Hay đa nghi', 'Khó tin người', 'Đôi khi quá bí ẩn'],
    clashesWith: ['pig'],    // Tỵ xung Hợi
    compatibleWith: ['monkey'], // Tỵ hợp Thân
    tripleHarmony: ['ox', 'rooster'], // Tỵ-Dậu-Sửu
  },
  {
    key: 'horse',
    nameVi: 'Ngọ',
    animal: 'Ngựa',
    element: 'Hỏa',
    yinYang: 'dương',
    birthYears: [1906, 1918, 1930, 1942, 1954, 1966, 1978, 1990, 2002, 2014, 2026],
    characteristics: [
      'Tự do và không thích bị ràng buộc',
      'Năng động và luôn hành động',
      'Vui vẻ và hòa đồng',
      'Thích phiêu lưu và trải nghiệm mới',
      'Bộc trực và thẳng thắn',
    ],
    strengths: ['Năng động', 'Tự do', 'Lạc quan', 'Thẳng thắn'],
    weaknesses: ['Thiếu kiên nhẫn', 'Khó kiên định', 'Hay bốc đồng'],
    clashesWith: ['rat'],    // Ngọ xung Tý
    compatibleWith: ['goat'], // Ngọ hợp Mùi
    tripleHarmony: ['tiger', 'dog'], // Dần-Ngọ-Tuất
  },
  {
    key: 'goat',
    nameVi: 'Mùi',
    animal: 'Dê',
    element: 'Thổ',
    yinYang: 'âm',
    birthYears: [1907, 1919, 1931, 1943, 1955, 1967, 1979, 1991, 2003, 2015, 2027],
    characteristics: [
      'Nghệ thuật và sáng tạo',
      'Tốt bụng và hay quan tâm người khác',
      'Nhạy cảm với cái đẹp',
      'Thích sự hài hòa và bình yên',
      'Kiên nhẫn và không thích ép buộc',
    ],
    strengths: ['Nghệ thuật', 'Nhân từ', 'Nhạy cảm', 'Hòa bình'],
    weaknesses: ['Hay lo âu', 'Dựa dẫm', 'Khó đưa ra quyết định'],
    clashesWith: ['ox'],    // Mùi xung Sửu
    compatibleWith: ['horse'], // Mùi hợp Ngọ
    tripleHarmony: ['rabbit', 'pig'], // Hợi-Mão-Mùi
  },
  {
    key: 'monkey',
    nameVi: 'Thân',
    animal: 'Khỉ',
    element: 'Kim',
    yinYang: 'dương',
    birthYears: [1908, 1920, 1932, 1944, 1956, 1968, 1980, 1992, 2004, 2016, 2028],
    characteristics: [
      'Thông minh và nhanh trí',
      'Sáng tạo và giỏi giải quyết vấn đề',
      'Thích giao tiếp và kết bạn',
      'Linh hoạt và thích nghi nhanh',
      'Hài hước và vui tính',
    ],
    strengths: ['Thông minh', 'Linh hoạt', 'Sáng tạo', 'Giao tiếp'],
    weaknesses: ['Hay nóng vội', 'Đôi khi thiếu tập trung', 'Có thể gian xảo'],
    clashesWith: ['tiger'],  // Thân xung Dần
    compatibleWith: ['snake'], // Thân hợp Tỵ
    tripleHarmony: ['rat', 'dragon'], // Thân-Tý-Thìn
  },
  {
    key: 'rooster',
    nameVi: 'Dậu',
    animal: 'Gà',
    element: 'Kim',
    yinYang: 'âm',
    birthYears: [1909, 1921, 1933, 1945, 1957, 1969, 1981, 1993, 2005, 2017, 2029],
    characteristics: [
      'Cẩn thận và tỉ mỉ',
      'Trung thực và thẳng thắn',
      'Có óc quan sát tốt',
      'Chăm chỉ và có trách nhiệm',
      'Tự hào và hay chú ý đến hình thức',
    ],
    strengths: ['Tỉ mỉ', 'Trung thực', 'Trách nhiệm', 'Quan sát'],
    weaknesses: ['Hay chỉ trích', 'Cứng nhắc', 'Quá cầu toàn'],
    clashesWith: ['rabbit'],  // Dậu xung Mão
    compatibleWith: ['dragon'], // Dậu hợp Thìn
    tripleHarmony: ['snake', 'ox'], // Tỵ-Dậu-Sửu
  },
  {
    key: 'dog',
    nameVi: 'Tuất',
    animal: 'Chó',
    element: 'Thổ',
    yinYang: 'dương',
    birthYears: [1910, 1922, 1934, 1946, 1958, 1970, 1982, 1994, 2006, 2018, 2030],
    characteristics: [
      'Trung thành và đáng tin cậy',
      'Công bằng và ghét bất công',
      'Bảo vệ người thân hết lòng',
      'Thực tế và có trách nhiệm',
      'Thẳng thắn và không thích giả dối',
    ],
    strengths: ['Trung thành', 'Công bằng', 'Đáng tin', 'Bảo vệ'],
    weaknesses: ['Hay lo lắng', 'Đôi khi quá bi quan', 'Khó buông bỏ'],
    clashesWith: ['dragon'], // Tuất xung Thìn
    compatibleWith: ['rabbit'], // Tuất hợp Mão
    tripleHarmony: ['tiger', 'horse'], // Dần-Ngọ-Tuất
  },
  {
    key: 'pig',
    nameVi: 'Hợi',
    animal: 'Lợn',
    element: 'Thủy',
    yinYang: 'âm',
    birthYears: [1911, 1923, 1935, 1947, 1959, 1971, 1983, 1995, 2007, 2019, 2031],
    characteristics: [
      'Chân thật và không thích giả dối',
      'Hào phóng và hay giúp đỡ',
      'Lạc quan và yêu cuộc sống',
      'Kiên nhẫn và bao dung',
      'Thích tận hưởng và trân trọng những điều tốt đẹp',
    ],
    strengths: ['Chân thật', 'Hào phóng', 'Lạc quan', 'Bao dung'],
    weaknesses: ['Hay cả tin', 'Dễ bị lợi dụng', 'Đôi khi thiếu quyết đoán'],
    clashesWith: ['snake'],  // Hợi xung Tỵ
    compatibleWith: ['tiger'], // Hợi hợp Dần
    tripleHarmony: ['rabbit', 'goat'], // Hợi-Mão-Mùi
  },
]

export function getZodiacByYear(year: number): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find(z => z.birthYears.includes(year))
}

export function getZodiacByKey(key: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find(z => z.key === key)
}

// Tính con giáp từ năm sinh (không cần tra bảng birthYears)
export function zodiacKeyFromYear(year: number): string {
  const keys = ['rat','ox','tiger','rabbit','dragon','snake','horse','goat','monkey','rooster','dog','pig']
  return keys[(year - 4) % 12]
}

// Xác định quan hệ giữa 2 năm (dùng cho "năm nay xung/hợp gì")
export type ZodiacRelation = 'clash' | 'harmony' | 'triple' | 'neutral'

export function getZodiacRelation(birthYear: number, checkYear: number): {
  relation: ZodiacRelation
  description: string
} {
  const birthKey = zodiacKeyFromYear(birthYear)
  const checkKey = zodiacKeyFromYear(checkYear)
  const sign = getZodiacByKey(birthKey)

  if (!sign) return { relation: 'neutral', description: 'Không xác định được mối quan hệ.' }

  if (sign.clashesWith.includes(checkKey)) {
    return {
      relation: 'clash',
      description: `Năm ${checkYear} xung với tuổi ${sign.nameVi}. Nên thận trọng trong các quyết định lớn, tránh xung đột không cần thiết.`,
    }
  }
  if (sign.compatibleWith.includes(checkKey)) {
    return {
      relation: 'harmony',
      description: `Năm ${checkYear} hợp với tuổi ${sign.nameVi}. Năng lượng thuận lợi cho hợp tác và các mối quan hệ.`,
    }
  }
  if (sign.tripleHarmony.includes(checkKey)) {
    return {
      relation: 'triple',
      description: `Năm ${checkYear} thuộc nhóm tam hợp với tuổi ${sign.nameVi}. Tốt cho sự phát triển và mở rộng.`,
    }
  }
  return {
    relation: 'neutral',
    description: `Năm ${checkYear} trung tính với tuổi ${sign.nameVi}. Kết quả phụ thuộc vào nỗ lực cá nhân.`,
  }
}
