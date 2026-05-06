'use client'

import { Download } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  type: string
  category: string
  note: string | null
  date: string
}

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống', transport: 'Di chuyển', shopping: 'Mua sắm',
  entertainment: 'Giải trí', health: 'Sức khỏe', education: 'Học tập',
  bills: 'Hóa đơn', salary: 'Lương', freelance: 'Freelance',
  investment: 'Đầu tư', gift: 'Quà tặng', other: 'Khác',
}

interface Props {
  transactions: Transaction[]
  monthLabel: string
}

export function ExportButton({ transactions, monthLabel }: Props) {
  function handleExport() {
    const rows = [
      ['Ngày', 'Loại', 'Danh mục', 'Số tiền', 'Ghi chú'],
      ...transactions.map(t => [
        t.date,
        t.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
        CATEGORY_LABELS[t.category] ?? t.category,
        t.amount,
        t.note ?? '',
      ]),
    ]

    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `giao-dich-${monthLabel}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-700 hover:border-stone-300 text-xs font-medium transition-colors"
    >
      <Download size={13} />
      Xuất CSV
    </button>
  )
}
