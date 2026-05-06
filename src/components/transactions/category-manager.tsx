'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/categories'
import { Settings, Plus, Check, X, Eye, EyeOff, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  categories: Category[]
  userId: string
}

interface AddForm {
  name: string
  emoji: string
  tx_type: 'expense' | 'income' | 'both'
}

interface EditForm {
  name: string
  emoji: string
}

function generateKey(): string {
  return 'cat_' + Math.random().toString(36).slice(2, 8)
}

export function CategoryManager({ categories, userId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', emoji: '' })
  const [addingType, setAddingType] = useState<'expense' | 'income' | null>(null)
  const [addForm, setAddForm] = useState<AddForm>({ name: '', emoji: '', tx_type: 'expense' })
  const [saving, setSaving] = useState(false)

  const expenseCats = categories.filter(c => c.tx_type === 'expense' || c.tx_type === 'both')
  const incomeCats  = categories.filter(c => c.tx_type === 'income'  || c.tx_type === 'both')

  async function toggleActive(cat: Category) {
    const supabase = createClient()
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    router.refresh()
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditForm({ name: cat.name, emoji: cat.emoji })
  }

  async function saveEdit(id: string) {
    if (!editForm.name.trim() || !editForm.emoji.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('categories')
      .update({ name: editForm.name.trim(), emoji: editForm.emoji.trim() })
      .eq('id', id)
    setSaving(false)
    setEditingId(null)
    router.refresh()
  }

  async function addCategory() {
    if (!addForm.name.trim() || !addForm.emoji.trim()) return
    setSaving(true)
    const supabase = createClient()
    const maxOrder = Math.max(...categories.map(c => c.sort_order), -1)
    await supabase.from('categories').insert({
      user_id: userId,
      key: generateKey(),
      name: addForm.name.trim(),
      emoji: addForm.emoji.trim(),
      tx_type: addForm.tx_type,
      sort_order: maxOrder + 1,
      is_active: true,
    })
    setSaving(false)
    setAddingType(null)
    setAddForm({ name: '', emoji: '', tx_type: 'expense' })
    router.refresh()
  }

  function openAddForm(type: 'expense' | 'income') {
    setAddingType(type)
    setAddForm({ name: '', emoji: '📦', tx_type: type })
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-stone-100 text-left"
      >
        <div className="flex items-center gap-2">
          <Settings size={15} className="text-stone-400" />
          <span className="text-sm font-medium text-stone-600">Quản lý danh mục</span>
        </div>
        <span className="text-xs text-stone-400">{categories.filter(c => c.is_active).length} đang dùng</span>
      </button>

      {open && (
        <div className="mt-2 bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {/* Expense categories */}
          <CategorySection
            title="Chi tiêu"
            cats={expenseCats}
            editingId={editingId}
            editForm={editForm}
            saving={saving}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onEditFormChange={setEditForm}
            onToggleActive={toggleActive}
          />
          {addingType === 'expense' ? (
            <AddForm
              form={addForm}
              onChange={setAddForm}
              onSave={addCategory}
              onCancel={() => setAddingType(null)}
              saving={saving}
              typeFixed="expense"
            />
          ) : (
            <button
              onClick={() => openAddForm('expense')}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 border-t border-stone-50 transition-colors"
            >
              <Plus size={13} /> Thêm danh mục chi tiêu
            </button>
          )}

          {/* Income categories */}
          <div className="border-t border-stone-100" />
          <CategorySection
            title="Thu nhập"
            cats={incomeCats}
            editingId={editingId}
            editForm={editForm}
            saving={saving}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onEditFormChange={setEditForm}
            onToggleActive={toggleActive}
          />
          {addingType === 'income' ? (
            <AddForm
              form={addForm}
              onChange={setAddForm}
              onSave={addCategory}
              onCancel={() => setAddingType(null)}
              saving={saving}
              typeFixed="income"
            />
          ) : (
            <button
              onClick={() => openAddForm('income')}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 border-t border-stone-50 transition-colors"
            >
              <Plus size={13} /> Thêm danh mục thu nhập
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CategorySection({
  title, cats, editingId, editForm, saving,
  onStartEdit, onSaveEdit, onCancelEdit, onEditFormChange, onToggleActive,
}: {
  title: string
  cats: Category[]
  editingId: string | null
  editForm: EditForm
  saving: boolean
  onStartEdit: (c: Category) => void
  onSaveEdit: (id: string) => void
  onCancelEdit: () => void
  onEditFormChange: (f: EditForm) => void
  onToggleActive: (c: Category) => void
}) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
        {title}
      </p>
      {cats.map(cat => (
        editingId === cat.id ? (
          <div key={cat.id} className="flex items-center gap-2 px-4 py-2 border-t border-stone-50">
            <input
              value={editForm.emoji}
              onChange={e => onEditFormChange({ ...editForm, emoji: e.target.value })}
              className="w-10 text-center text-lg border border-stone-200 rounded-lg py-1 focus:outline-none"
              maxLength={2}
            />
            <input
              value={editForm.name}
              onChange={e => onEditFormChange({ ...editForm, name: e.target.value })}
              className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-violet-400"
              autoFocus
            />
            <button
              onClick={() => onSaveEdit(cat.id)}
              disabled={saving}
              className="p-1.5 rounded-lg bg-violet-600 text-white disabled:opacity-50"
            >
              <Check size={13} />
            </button>
            <button onClick={onCancelEdit} className="p-1.5 rounded-lg border border-stone-200 text-stone-400">
              <X size={13} />
            </button>
          </div>
        ) : (
          <div
            key={cat.id}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 border-t border-stone-50 group',
              !cat.is_active && 'opacity-40'
            )}
          >
            <span className="text-lg w-7 text-center shrink-0">{cat.emoji}</span>
            <span className="flex-1 text-sm text-stone-700">{cat.name}</span>
            {cat.tx_type === 'both' && (
              <span className="text-[10px] text-stone-400 border border-stone-200 rounded px-1">cả hai</span>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onStartEdit(cat)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => onToggleActive(cat)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                title={cat.is_active ? 'Ẩn danh mục' : 'Hiện danh mục'}
              >
                {cat.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>
        )
      ))}
    </div>
  )
}

function AddForm({
  form, onChange, onSave, onCancel, saving, typeFixed,
}: {
  form: AddForm
  onChange: (f: AddForm) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  typeFixed: 'expense' | 'income'
}) {
  return (
    <div className="px-4 py-3 border-t border-stone-50 space-y-2 bg-stone-50/50">
      <div className="flex gap-2">
        <input
          value={form.emoji}
          onChange={e => onChange({ ...form, emoji: e.target.value })}
          className="w-12 text-center text-lg border border-stone-200 rounded-xl py-2 bg-white focus:outline-none"
          placeholder="📦"
          maxLength={2}
          autoFocus
        />
        <input
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          placeholder="Tên danh mục"
          className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-violet-400"
          onKeyDown={e => e.key === 'Enter' && onSave()}
        />
      </div>
      {typeFixed === 'expense' && (
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ ...form, tx_type: 'expense' })}
            className={cn('flex-1 py-1.5 text-xs rounded-lg border transition-colors',
              form.tx_type === 'expense' ? 'bg-violet-600 text-white border-violet-600' : 'border-stone-200 text-stone-500'
            )}
          >Chi tiêu</button>
          <button
            onClick={() => onChange({ ...form, tx_type: 'both' })}
            className={cn('flex-1 py-1.5 text-xs rounded-lg border transition-colors',
              form.tx_type === 'both' ? 'bg-violet-600 text-white border-violet-600' : 'border-stone-200 text-stone-500'
            )}
          >Cả hai</button>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 text-xs rounded-xl border border-stone-200 text-stone-400">
          Huỷ
        </button>
        <button
          onClick={onSave}
          disabled={saving || !form.name.trim() || !form.emoji.trim()}
          className="flex-1 py-2 text-xs rounded-xl bg-violet-600 text-white disabled:opacity-50"
        >
          {saving ? '...' : 'Thêm'}
        </button>
      </div>
    </div>
  )
}
