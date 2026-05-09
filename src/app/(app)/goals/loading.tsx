export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-28 bg-stone-200 rounded-lg" />
        <div className="h-4 w-44 bg-stone-100 rounded-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1">
              <div className="h-5 w-48 bg-stone-200 rounded-lg" />
              <div className="h-3.5 w-32 bg-stone-100 rounded-lg" />
            </div>
            <div className="h-6 w-16 bg-stone-100 rounded-full ml-3" />
          </div>
          <div className="h-2 bg-stone-100 rounded-full">
            <div className="h-2 bg-stone-200 rounded-full" style={{ width: `${30 + i * 20}%` }} />
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-8 bg-stone-50 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
