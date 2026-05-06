'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  userId:           string
  annualTheme:      string | null
  purposeStatement: string | null
  lifeChapter:      string | null
  coreValues:       string[]
}

const CHAPTERS = [
  { key: 'foundation',    label: 'Xây dựng nền tảng', sub: 'Tài chính · Kỹ năng · Sức khỏe',     emoji: '🏗️' },
  { key: 'acceleration',  label: 'Tăng tốc',           sub: 'Đầu tư · Công việc · Mạng lưới',       emoji: '🚀' },
  { key: 'peak',          label: 'Đỉnh cao',            sub: 'Tác động · Mentoring · Di sản',         emoji: '⛰️' },
  { key: 'transition',    label: 'Chuyển đổi',          sub: 'Tinh thần · Thử nghiệm · Tái định hướng', emoji: '🔄' },
]

export function LifeDesignCard({ userId, annualTheme, purposeStatement, lifeChapter, coreValues }: Props) {
  const router  = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  const [theme,   setTheme]   = useState(annualTheme ?? '')
  const [purpose, setPurpose] = useState(purposeStatement ?? '')
  const [chapter, setChapter] = useState(lifeChapter ?? '')
  const [values,  setValues]  = useState(coreValues.join('\n'))

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const parsedValues = values
      .split('\n')
      .map(v => v.trim())
      .filter(Boolean)
    await supabase.from('profiles').update({
      annual_theme:      theme.trim()   || null,
      purpose_statement: purpose.trim() || null,
      life_chapter:      chapter        || null,
      core_values:       parsedValues,
      updated_at:        new Date().toISOString(),
    }).eq('id', userId)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  function handleCancel() {
    setTheme(annualTheme ?? '')
    setPurpose(purposeStatement ?? '')
    setChapter(lifeChapter ?? '')
    setValues(coreValues.join('\n'))
    setEditing(false)
  }

  const currentChapter = CHAPTERS.find(c => c.key === lifeChapter)

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-stone-100 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700">Thiết kế cuộc sống</p>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            <Pencil size={11} /> Chỉnh sửa
          </button>
        </div>

        <div className="space-y-3">
          {/* Annual Theme */}
          <div>
            <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Chủ đề năm</p>
            {annualTheme
              ? <p className="text-sm font-semibold text-stone-800">✦ {annualTheme}</p>
              : <p className="text-xs text-stone-300 italic">Chưa đặt chủ đề</p>
            }
          </div>

          {/* Purpose */}
          <div>
            <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Mục đích sống</p>
            {purposeStatement
              ? <p className="text-sm text-stone-700 leading-relaxed">&ldquo;{purposeStatement}&rdquo;</p>
              : <p className="text-xs text-stone-300 italic">Chưa viết purpose statement</p>
            }
          </div>

          {/* Life Chapter */}
          <div>
            <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Giai đoạn hiện tại</p>
            {currentChapter
              ? <p className="text-sm text-stone-700">{currentChapter.emoji} {currentChapter.label}</p>
              : <p className="text-xs text-stone-300 italic">Chưa xác định giai đoạn</p>
            }
          </div>

          {/* Core Values */}
          {coreValues.length > 0 && (
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-1.5">Giá trị cốt lõi</p>
              <div className="flex flex-wrap gap-1.5">
                {coreValues.map(v => (
                  <span key={v} className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full">{v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-4">
      <p className="text-sm font-semibold text-stone-700">Chỉnh sửa thiết kế cuộc sống</p>

      {/* Annual Theme */}
      <div>
        <label className="text-xs text-stone-400 block mb-1">Chủ đề năm nay</label>
        <input
          value={theme}
          onChange={e => setTheme(e.target.value)}
          placeholder="VD: Nền tảng · Sức khỏe · Tập trung"
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 outline-none focus:border-violet-400"
        />
        <p className="text-[10px] text-stone-300 mt-1">1 từ/cụm làm kim chỉ nam cho cả năm</p>
      </div>

      {/* Purpose Statement */}
      <div>
        <label className="text-xs text-stone-400 block mb-1">Mục đích sống</label>
        <textarea
          value={purpose}
          onChange={e => setPurpose(e.target.value)}
          rows={2}
          placeholder='VD: "Tôi tồn tại để giúp những người xung quanh sống tự do hơn về tài chính..."'
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 outline-none focus:border-violet-400 resize-none placeholder:text-stone-300"
        />
      </div>

      {/* Life Chapter */}
      <div>
        <label className="text-xs text-stone-400 block mb-2">Giai đoạn cuộc sống hiện tại</label>
        <div className="space-y-1.5">
          {CHAPTERS.map(c => (
            <button
              key={c.key}
              onClick={() => setChapter(c.key === chapter ? '' : c.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                chapter === c.key
                  ? 'bg-violet-600 border-violet-600'
                  : 'border-stone-100 hover:border-stone-300',
              )}
            >
              <span className="text-base leading-none">{c.emoji}</span>
              <div>
                <p className={cn('text-xs font-medium', chapter === c.key ? 'text-white' : 'text-stone-700')}>
                  {c.label}
                </p>
                <p className={cn('text-[10px]', chapter === c.key ? 'text-stone-300' : 'text-stone-400')}>
                  {c.sub}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Core Values */}
      <div>
        <label className="text-xs text-stone-400 block mb-1">Giá trị cốt lõi <span className="text-stone-300">(mỗi giá trị 1 dòng)</span></label>
        <textarea
          value={values}
          onChange={e => setValues(e.target.value)}
          rows={4}
          placeholder={'Tự do tài chính\nSức khỏe\nHọc hỏi liên tục\nGia đình'}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 outline-none focus:border-violet-400 resize-none placeholder:text-stone-300"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <X size={13} /> Huỷ
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Check size={14} /> {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  )
}
