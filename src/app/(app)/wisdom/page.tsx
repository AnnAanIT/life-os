import { Wand2 } from 'lucide-react'

export default function WisdomPage() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800">Tuệ Giác</h1>
        <p className="text-stone-400 text-sm mt-1">Tử vi · Kinh Dịch · Lịch âm</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
          <Wand2 size={28} className="text-indigo-400" />
        </div>
        <p className="text-stone-600 font-medium">Đang xây dựng</p>
        <p className="text-stone-400 text-sm mt-1 max-w-xs">
          Module Tuệ Giác đang được phát triển. Sẽ có Kinh Dịch, Tử vi và lịch âm dương sớm.
        </p>
      </div>
    </div>
  )
}
