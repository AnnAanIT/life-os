'use client'

import { useState } from 'react'
import { Sparkles, BookOpen, ChevronDown, Save, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { drawHexagramByCoins, HEXAGRAMS, getDaySummary, solarToLunarFromDate, formatLunarDate, LINE_POSITION } from '@/lib/wisdom'
import type { HexagramReading, Hexagram } from '@/lib/wisdom'
import type { Reading } from './wisdom-tabs'

interface Props {
  userId: string
  initialReadings: Reading[]
}

const ENERGY_STYLE: Record<string, string> = {
  favorable: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  neutral:   'bg-amber-50 text-amber-700 border-amber-200',
  caution:   'bg-rose-50 text-rose-600 border-rose-200',
}
const ENERGY_LABEL: Record<string, string> = {
  favorable: 'Thuận lợi',
  neutral:   'Trung tính',
  caution:   'Thận trọng',
}

// ── Visual hexagram lines ─────────────────────────────────────────────────────
function HexLines({ lineValues }: { lineValues: (6 | 7 | 8 | 9)[] }) {
  // lineValues[0] = line 1 (bottom), reversed for top-to-bottom display
  return (
    <div className="flex flex-col gap-[5px]">
      {[...lineValues].reverse().map((value, displayIdx) => {
        const lineNum = 6 - displayIdx
        const isYang   = value === 7 || value === 9
        const isMoving = value === 6 || value === 9

        return (
          <div key={lineNum} className="flex items-center gap-2">
            <div className="flex items-center gap-[5px] flex-1">
              {isYang ? (
                <div className={cn(
                  'h-[3px] flex-1 rounded-full transition-colors',
                  isMoving ? 'bg-amber-500' : 'bg-stone-700'
                )} />
              ) : (
                <>
                  <div className={cn(
                    'h-[3px] rounded-full transition-colors',
                    isMoving ? 'bg-amber-500' : 'bg-stone-700'
                  )} style={{ flex: 2 }} />
                  <div style={{ flex: 1 }} />
                  <div className={cn(
                    'h-[3px] rounded-full transition-colors',
                    isMoving ? 'bg-amber-500' : 'bg-stone-700'
                  )} style={{ flex: 2 }} />
                </>
              )}
            </div>
            <span className={cn(
              'text-[10px] font-bold w-3 text-center shrink-0',
              isMoving ? 'text-amber-500' : 'text-transparent'
            )}>
              {value === 9 ? '○' : value === 6 ? '×' : ' '}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Relating hexagram mini-card ───────────────────────────────────────────────
function RelatedHexCard({ hex, movingLines }: { hex: Hexagram; movingLines: number[] }) {
  const posNames = movingLines
    .map(n => LINE_POSITION[n - 1] ?? n)
    .join(', ')

  return (
    <div className="bg-stone-50 rounded-xl px-3 py-3 border border-stone-100">
      <div className="flex items-center gap-1.5 mb-2">
        <ArrowRight size={10} className="text-stone-400" />
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
          Quẻ biến · Hào {posNames} động
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none select-none text-stone-600">{hex.symbol}</span>
        <div>
          <p className="text-sm font-semibold text-stone-700">
            {hex.number}. {hex.nameHan} — {hex.nameVi}
          </p>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed line-clamp-2">{hex.meaning}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function KinhDichTab({ userId, initialReadings }: Props) {
  const [question,       setQuestion]       = useState('')
  const [reading,        setReading]        = useState<HexagramReading | null>(null)
  const [readings,       setReadings]       = useState<Reading[]>(initialReadings)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [tossing,        setTossing]        = useState(false)
  const [showHistory,    setShowHistory]    = useState(false)
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [aiLoading,      setAiLoading]      = useState(false)

  async function handleDraw() {
    if (tossing) return
    setTossing(true)
    setReading(null)
    setInterpretation(null)
    setSaved(false)

    // Brief ritual pause — feels intentional, not mechanical
    await new Promise(r => setTimeout(r, 700))

    const newReading = drawHexagramByCoins(question.trim() || undefined)
    setReading(newReading)
    setTossing(false)

    // Fetch AI interpretation in parallel
    setAiLoading(true)
    try {
      const today   = new Date()
      const summary = getDaySummary(today)
      const lunar   = solarToLunarFromDate(today)
      const res = await fetch('/api/wisdom/hexagram', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hexagram_num:    newReading.hexagram.number,
          nameHan:         newReading.hexagram.nameHan,
          nameVi:          newReading.hexagram.nameVi,
          meaning:         newReading.hexagram.meaning,
          advice:          newReading.hexagram.advice,
          keywords:        newReading.hexagram.keywords,
          energy:          newReading.hexagram.energy,
          lineValues:      newReading.lineValues,
          movingLines:     newReading.movingLines,
          relatedHexagram: newReading.relatedHexagram
            ? {
                number:  newReading.relatedHexagram.number,
                nameHan: newReading.relatedHexagram.nameHan,
                nameVi:  newReading.relatedHexagram.nameVi,
                meaning: newReading.relatedHexagram.meaning,
              }
            : undefined,
          question:   question.trim() || undefined,
          dayCanChi:  summary.canChi.full,
          lunarDate:  formatLunarDate(lunar),
        }),
      })
      if (res.ok) {
        const { interpretation: text } = await res.json()
        setInterpretation(text ?? null)
      }
    } catch {
      // AI unavailable — static content still shows
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSave() {
    if (!reading || saved) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('wisdom_readings')
      .insert({
        user_id:     userId,
        hexagram_num: reading.hexagram.number,
        question:    question.trim() || null,
      })
      .select('id, created_at, hexagram_num, question, reflection')
      .single()
    setSaving(false)
    if (data) {
      setSaved(true)
      setReadings(prev => [data, ...prev])
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Draw panel ── */}
      <div className="bg-white rounded-2xl p-4 border border-stone-100">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-3">Gieo Quẻ</p>

        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Nhập câu hỏi của bạn... (không bắt buộc)"
          rows={2}
          className="w-full text-sm text-stone-700 placeholder-stone-300 bg-stone-50 rounded-xl px-3 py-2.5 border border-stone-100 focus:outline-none focus:border-indigo-200 resize-none mb-3"
        />

        <button
          onClick={handleDraw}
          disabled={tossing}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
        >
          {tossing
            ? <><Loader2 size={15} className="animate-spin" />Đang gieo đồng tiền...</>
            : <><Sparkles size={15} />Gieo quẻ</>
          }
        </button>
      </div>

      {/* ── Result ── */}
      {reading && (
        <div className="bg-white rounded-2xl p-4 border border-indigo-100 space-y-4">

          {/* Header: symbol + visual lines side-by-side */}
          <div className="flex items-start gap-4">
            {/* Left: symbol + line visual */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <span className="text-5xl leading-none select-none text-indigo-800">
                {reading.hexagram.symbol}
              </span>
              {reading.lineValues.length === 6 && (
                <div className="w-12">
                  <HexLines lineValues={reading.lineValues as (6|7|8|9)[]} />
                </div>
              )}
            </div>

            {/* Right: name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-lg font-bold text-stone-800">
                  {reading.hexagram.number}. {reading.hexagram.nameHan}
                </p>
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                  ENERGY_STYLE[reading.hexagram.energy]
                )}>
                  {ENERGY_LABEL[reading.hexagram.energy]}
                </span>
              </div>
              <p className="text-sm text-indigo-600 font-medium">{reading.hexagram.nameVi}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {reading.hexagram.upperTrigram} trên · {reading.hexagram.lowerTrigram} dưới
              </p>

              {/* Moving lines indicator */}
              {reading.movingLines.length > 0 ? (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <p className="text-[11px] text-amber-600 font-medium">
                    {reading.movingLines.length === 1
                      ? `Hào ${LINE_POSITION[reading.movingLines[0] - 1]} động`
                      : `${reading.movingLines.length} hào động`
                    }
                    {reading.relatedHexagram && ` → Quẻ ${reading.relatedHexagram.nameVi}`}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-stone-400 mt-2">Quẻ thuần · không có hào động</p>
              )}
            </div>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-1.5">
            {reading.hexagram.keywords.map(k => (
              <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg">
                {k}
              </span>
            ))}
          </div>

          {/* Meaning */}
          <div>
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Ý nghĩa</p>
            <p className="text-sm text-stone-700 leading-relaxed">{reading.hexagram.meaning}</p>
          </div>

          {/* Advice */}
          <div className="bg-indigo-50 rounded-xl px-3 py-3">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Lời khuyên</p>
            <p className="text-sm text-indigo-800 leading-relaxed">{reading.hexagram.advice}</p>
          </div>

          {/* Quẻ biến */}
          {reading.relatedHexagram && (
            <RelatedHexCard
              hex={reading.relatedHexagram}
              movingLines={reading.movingLines}
            />
          )}

          {/* AI Interpretation */}
          {(aiLoading || interpretation) && (
            <div className="bg-violet-50 rounded-xl px-3 py-3 border border-violet-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles size={11} className="text-violet-400" />
                <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Luận giải AI</p>
                {reading.movingLines.length > 0 && !aiLoading && (
                  <span className="text-[9px] text-violet-300 ml-1">· có hào động</span>
                )}
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 size={13} className="text-violet-400 animate-spin" />
                  <p className="text-xs text-violet-400">Đang luận giải...</p>
                </div>
              ) : (
                <p className="text-sm text-violet-900 leading-relaxed">{interpretation}</p>
              )}
            </div>
          )}

          {/* Question echo */}
          {reading.question && (
            <p className="text-xs text-stone-400 italic">
              Câu hỏi: &ldquo;{reading.question}&rdquo;
            </p>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
              saved
                ? 'text-emerald-600 bg-emerald-50 cursor-default'
                : 'text-stone-500 hover:text-stone-700 bg-stone-50 hover:bg-stone-100'
            )}
          >
            <Save size={12} />
            {saved ? 'Đã lưu' : saving ? 'Đang lưu...' : 'Lưu vào lịch sử'}
          </button>
        </div>
      )}

      {/* ── History ── */}
      {readings.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-stone-400" />
              <p className="text-xs font-semibold text-stone-600">
                Lịch sử gieo quẻ ({readings.length})
              </p>
            </div>
            <ChevronDown
              size={14}
              className={cn('text-stone-400 transition-transform', showHistory && 'rotate-180')}
            />
          </button>

          {showHistory && (
            <div className="divide-y divide-stone-50">
              {readings.map(r => {
                const hex  = HEXAGRAMS.find(h => h.number === r.hexagram_num)
                const date = new Date(r.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })
                return (
                  <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl leading-none select-none text-indigo-700 shrink-0 w-8 text-center">
                      {hex?.symbol ?? '?'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate">
                        {r.hexagram_num}. {hex?.nameVi ?? 'Quẻ ' + r.hexagram_num}
                      </p>
                      {r.question && (
                        <p className="text-xs text-stone-400 truncate italic">
                          &ldquo;{r.question}&rdquo;
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 shrink-0">{date}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
