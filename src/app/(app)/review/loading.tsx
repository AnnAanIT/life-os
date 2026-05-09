export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-36 bg-stone-200 rounded-lg" />
        <div className="h-4 w-52 bg-stone-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 h-24" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
        <div className="h-4 w-32 bg-stone-200 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-28 bg-stone-100 rounded-lg" />
            <div className="h-20 bg-stone-50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
