'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2, Sparkles } from 'lucide-react'
import {
  solarToLunarFromDate, formatLunarDate,
  getDaySummary, getYearCanChi,
  getZodiacByYear, getZodiacRelation,
  CHI_HOURS,
} from '@/lib/wisdom'

interface Props {
  birthDate: string | null
  birthHour: number | null
}

const QUALITY_STYLE = {
  'hoang-dao': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'hac-dao':   'bg-stone-100 text-stone-500 border border-stone-200',
}

const RELATION_STYLE: Record<string, string> = {
  clash:   'bg-rose-50 border border-rose-100 text-rose-700',
  harmony: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
  triple:  'bg-sky-50 border border-sky-100 text-sky-700',
  neutral: 'bg-stone-50 border border-stone-100 text-stone-600',
}

export function TuViTab({ birthDate, birthHour }: Props) {
  const today = useMemo(() => new Date(), [])

  const lunar   = useMemo(() => solarToLunarFromDate(today), [today])
  const summary = useMemo(() => getDaySummary(today), [today])
  const yearCC  = useMemo(() => getYearCanChi(today.getFullYear()), [today])

  const [aiReading, setAiReading] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({
      lunarDate:  formatLunarDate(lunar),
      dayCanChi:  summary.canChi.full,
      yearCanChi: yearCC.full,
      quality:    summary.quality.quality,
      luckyHours: summary.luckyHours.map(h => `${h.chi} (${h.label})`).join(', '),
    })
    if (birthDate) {
      const yy = parseInt(birthDate.split('-')[0], 10)
      const z = getZodiacByYear(yy)
      if (z) {
        params.set('birthYear', String(yy))
        params.set('zodiacName', z.nameVi)
        const rel = getZodiacRelation(yy, today.getFullYear())
        if (rel) params.set('zodiacRelation', rel.description)
      }
    }
    fetch(`/api/wisdom/daily?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.content) setAiReading(d.content) })
      .catch(() => {})
      .finally(() => setAiLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Find the chi-hour label for birth_hour (stored as slot start: 23,1,3,...21)
  const birthHourEntry = useMemo(
    () => birthHour != null ? CHI_HOURS.find(h => h.start === birthHour) ?? null : null,
    [birthHour]
  )

  const birth = useMemo(() => {
    if (!birthDate) return null
    const yy = parseInt(birthDate.split('-')[0], 10)
    const zodiac  = getZodiacByYear(yy)
    const relation = zodiac ? getZodiacRelation(yy, today.getFullYear()) : null
    return { yy, zodiac, relation }
  }, [birthDate, today])

  return (
    <div className="space-y-4">

      {/* Ngày hôm nay */}
      <div className="bg-white rounded-2xl p-4 border border-stone-100">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">Hôm nay</p>

        <div className="mb-3">
          <p className="text-lg font-bold text-stone-800">{formatLunarDate(lunar)}</p>
          <p className="text-xs text-stone-400 mt-0.5">Âm lịch Việt Nam (UTC+7)</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-sm font-medium text-stone-700 bg-stone-50 px-3 py-1 rounded-lg border border-stone-200">
            Ngày {summary.canChi.full}
          </span>
          <span className="text-sm font-medium text-stone-700 bg-stone-50 px-3 py-1 rounded-lg border border-stone-200">
            Năm {yearCC.full}
          </span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${QUALITY_STYLE[summary.quality.quality]}`}>
            {summary.quality.label}
          </span>
        </div>

        <p className="text-xs text-stone-500 mb-4">{summary.quality.description}</p>

        {/* Giờ hoàng đạo */}
        {summary.luckyHours.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Giờ hoàng đạo hôm nay</p>
            <div className="flex flex-wrap gap-1.5">
              {summary.luckyHours.map(h => (
                <span
                  key={h.chi}
                  className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-medium"
                >
                  {h.chi} · {h.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Daily Reading */}
      {(aiLoading || aiReading) && (
        <div className="bg-white rounded-2xl p-4 border border-stone-100">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles size={12} className="text-violet-400" />
            <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest">Nhận định hôm nay</p>
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2 py-1">
              <Loader2 size={14} className="text-stone-300 animate-spin" />
              <p className="text-xs text-stone-400">Đang phân tích ngày...</p>
            </div>
          ) : (
            <p className="text-sm text-stone-700 leading-relaxed">{aiReading}</p>
          )}
        </div>
      )}

      {/* Thông tin cá nhân */}
      {birth?.zodiac ? (
        <div className="bg-white rounded-2xl p-4 border border-stone-100">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">Của bạn</p>

          {/* Zodiac identity */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-indigo-600">{birth.zodiac.nameVi}</span>
            </div>
            <div>
              <p className="font-semibold text-stone-800">Tuổi {birth.zodiac.nameVi} — {birth.zodiac.animal}</p>
              <p className="text-sm text-stone-500">{birth.zodiac.element} · {birth.zodiac.yinYang} · Sinh {birth.yy}</p>
              {birthHourEntry && (
                <p className="text-xs text-stone-400 mt-0.5">
                  Giờ {birthHourEntry.chi} ({birthHourEntry.label})
                </p>
              )}
            </div>
          </div>

          {/* Relation with current year */}
          {birth.relation && (
            <div className={`rounded-xl px-3 py-2.5 mb-4 ${RELATION_STYLE[birth.relation.relation]}`}>
              <p className="text-xs font-semibold mb-0.5">
                Tuổi {birth.zodiac.nameVi} · Năm {yearCC.full}
              </p>
              <p className="text-xs leading-relaxed">{birth.relation.description}</p>
            </div>
          )}

          {/* Characteristics */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Đặc điểm</p>
            <div className="flex flex-wrap gap-1.5">
              {birth.zodiac.characteristics.slice(0, 4).map((c, i) => (
                <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Điểm mạnh</p>
            <div className="flex flex-wrap gap-1.5">
              {birth.zodiac.strengths.slice(0, 3).map((s, i) => (
                <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Link
          href="/me"
          className="flex items-center justify-between bg-white rounded-2xl p-4 border border-stone-100 hover:border-indigo-200 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-stone-700">Thêm ngày sinh để xem Tử Vi</p>
            <p className="text-xs text-stone-400 mt-0.5">Vào Hồ sơ → nhập ngày sinh và giờ sinh</p>
          </div>
          <ChevronRight size={16} className="text-stone-300 shrink-0" />
        </Link>
      )}
    </div>
  )
}
