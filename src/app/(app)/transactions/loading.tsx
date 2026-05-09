export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 animate-pulse">
      <div className="mb-4 space-y-2">
        <div className="h-7 w-28 bg-stone-200 rounded-lg" />
        <div className="h-4 w-44 bg-stone-100 rounded-lg" />
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 h-20" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 h-12" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-100 h-14" />
        ))}
      </div>
    </div>
  )
}
