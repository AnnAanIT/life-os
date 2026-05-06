import Link from 'next/link'
import {
  DollarSign, CheckSquare, RotateCcw, TrendingUp,
  BookOpen, Heart, Sparkles, Landmark, Users, Brain,
} from 'lucide-react'

const modules = [
  {
    id: 'investments',
    name: 'Đầu tư',
    desc: 'Tài sản & Net Worth',
    icon: Landmark,
    color: 'bg-amber-50 text-amber-700',
    href: '/investments',
  },
  {
    id: 'finance',
    name: 'Tài chính',
    desc: 'Thu chi & ngân sách',
    icon: DollarSign,
    color: 'bg-emerald-50 text-emerald-600',
    href: '/transactions',
  },
  {
    id: 'tasks',
    name: 'Tasks',
    desc: '3 MIT mỗi ngày',
    icon: CheckSquare,
    color: 'bg-blue-50 text-blue-600',
    href: '/tasks',
  },
  {
    id: 'habits',
    name: 'Thói quen',
    desc: 'Xây dựng từng ngày',
    icon: RotateCcw,
    color: 'bg-amber-50 text-amber-600',
    href: '/habits',
  },
  {
    id: 'goals',
    name: 'Mục tiêu',
    desc: 'OKRs & milestones',
    icon: TrendingUp,
    color: 'bg-purple-50 text-purple-600',
    href: '/goals',
  },
  {
    id: 'learning',
    name: 'Học tập',
    desc: 'Sách, khóa học',
    icon: BookOpen,
    color: 'bg-sky-50 text-sky-600',
    href: '/learning',
  },
  {
    id: 'health',
    name: 'Sức khỏe',
    desc: 'Vận động & giấc ngủ',
    icon: Heart,
    color: 'bg-red-50 text-red-500',
    href: '/health',
  },
  {
    id: 'spirit',
    name: 'Tinh thần',
    desc: 'Nhật ký & cảm xúc',
    icon: Sparkles,
    color: 'bg-rose-50 text-rose-500',
    href: '/journal',
  },
  {
    id: 'relationships',
    name: 'Quan hệ',
    desc: 'Giữ kết nối',
    icon: Users,
    color: 'bg-pink-50 text-pink-500',
    href: '/relationships',
  },
  {
    id: 'insights',
    name: 'Insights',
    desc: 'Pattern từ dữ liệu',
    icon: Brain,
    color: 'bg-violet-50 text-violet-500',
    href: '/insights',
  },
]

export default function ModulesPage() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-stone-800">Modules</h1>
        <p className="text-stone-400 text-sm">10 lĩnh vực cuộc sống</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {modules.map(mod => {
          const Icon = mod.icon
          return (
            <Link key={mod.id} href={mod.href}>
              <div className="bg-white rounded-2xl p-4 border border-stone-100 active:scale-95 transition-all h-full flex flex-col gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${mod.color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">{mod.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5 leading-snug">{mod.desc}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
