import type { SupabaseClient } from '@supabase/supabase-js'

export interface Category {
  id: string
  key: string
  name: string
  emoji: string
  tx_type: 'expense' | 'income' | 'both'
  sort_order: number
  is_active: boolean
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { key: 'food',          name: 'Ăn uống',   emoji: '🍜', tx_type: 'expense', sort_order: 0,  is_active: true },
  { key: 'transport',     name: 'Di chuyển',  emoji: '🚗', tx_type: 'expense', sort_order: 1,  is_active: true },
  { key: 'shopping',      name: 'Mua sắm',    emoji: '🛍️', tx_type: 'expense', sort_order: 2,  is_active: true },
  { key: 'entertainment', name: 'Giải trí',   emoji: '🎬', tx_type: 'expense', sort_order: 3,  is_active: true },
  { key: 'health',        name: 'Sức khỏe',   emoji: '💊', tx_type: 'expense', sort_order: 4,  is_active: true },
  { key: 'education',     name: 'Học tập',    emoji: '📚', tx_type: 'expense', sort_order: 5,  is_active: true },
  { key: 'bills',         name: 'Hóa đơn',    emoji: '🏠', tx_type: 'expense', sort_order: 6,  is_active: true },
  { key: 'investment',    name: 'Đầu tư',     emoji: '📈', tx_type: 'both',    sort_order: 7,  is_active: true },
  { key: 'other',         name: 'Khác',       emoji: '📦', tx_type: 'both',    sort_order: 8,  is_active: true },
  { key: 'salary',        name: 'Lương',      emoji: '💼', tx_type: 'income',  sort_order: 9,  is_active: true },
  { key: 'freelance',     name: 'Freelance',  emoji: '💻', tx_type: 'income',  sort_order: 10, is_active: true },
  { key: 'gift',          name: 'Quà tặng',   emoji: '🎁', tx_type: 'income',  sort_order: 11, is_active: true },
]

export async function getUserCategories(
  supabase: SupabaseClient,
  userId: string,
): Promise<Category[]> {
  const { data } = await supabase
    .from('categories')
    .select('id, key, name, emoji, tx_type, sort_order, is_active')
    .eq('user_id', userId)
    .order('sort_order')

  if (data && data.length > 0) return data as Category[]

  // First time: seed defaults
  const toInsert = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, user_id: userId, sort_order: i }))
  const { data: seeded } = await supabase
    .from('categories')
    .insert(toInsert)
    .select('id, key, name, emoji, tx_type, sort_order, is_active')

  return (seeded ?? []) as Category[]
}

export function expenseCategories(cats: Category[]): Category[] {
  return cats.filter(c => c.is_active && (c.tx_type === 'expense' || c.tx_type === 'both'))
}

export function incomeCategories(cats: Category[]): Category[] {
  return cats.filter(c => c.is_active && (c.tx_type === 'income' || c.tx_type === 'both'))
}

// Look up by key across all categories (including inactive — for display of old transactions)
export function catByKey(cats: Category[], key: string): Category | undefined {
  return cats.find(c => c.key === key)
}
