export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-32 bg-stone-200 rounded-lg" />
        <div className="h-4 w-48 bg-stone-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
        <div className="h-4 w-28 bg-stone-200 rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 flex-1 bg-stone-50 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-2">
        <div className="h-4 w-24 bg-stone-200 rounded-lg mb-3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-stone-50 rounded-xl" />
        ))}
      </div>
      <div className="h-36 bg-white rounded-2xl border border-stone-100" />
    </div>
  )
}
