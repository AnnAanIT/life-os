'use client'

import { useState } from 'react'
import { Sparkles, BookOpen, ChevronDown, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { drawHexagramByCoins, HEXAGRAMS } from '@/lib/wisdom'
import type { HexagramReading } from '@/lib/wisdom'
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

export function KinhDichTab({ userId, initialReadings }: Props) {
  const [question,  setQuestion]  = useState('')
  const [reading,   setReading]   = useState<HexagramReading | null>(null)
  const [readings,  setReadings]  = useState<Reading[]>(initialReadings)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  function handleDraw() {
    setReading(drawHexagramByCoins(question.trim() || undefined))
    setSaved(false)
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

      {/* Draw panel */}
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
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
        >
          <Sparkles size={15} />
          Gieo quẻ
        </button>
      </div>

      {/* Result */}
      {reading && (
        <div className="bg-white rounded-2xl p-4 border border-indigo-100">

          {/* Hexagram header */}
          <div className="flex items-start gap-4 mb-4">
            <span className="text-6xl leading-none select-none text-indigo-800 shrink-0">
              {reading.hexagram.symbol}
            </span>
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
            </div>
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {reading.hexagram.keywords.map(k => (
              <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg">
                {k}
              </span>
            ))}
          </div>

          {/* Meaning */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Ý nghĩa</p>
            <p className="text-sm text-stone-700 leading-relaxed">{reading.hexagram.meaning}</p>
          </div>

          {/* Advice */}
          <div className="bg-indigo-50 rounded-xl px-3 py-3 mb-4">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Lời khuyên</p>
            <p className="text-sm text-indigo-800 leading-relaxed">{reading.hexagram.advice}</p>
          </div>

          {/* Question echo */}
          {reading.question && (
            <p className="text-xs text-stone-400 italic mb-3">
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
            {saved ? 'Đã lưu vào lịch sử' : saving ? 'Đang lưu...' : 'Lưu lại'}
          </button>
        </div>
      )}

      {/* History */}
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
