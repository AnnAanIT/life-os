export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-24 bg-stone-200 rounded-lg" />
        <div className="h-4 w-40 bg-stone-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-4">
        <div className="h-4 w-32 bg-stone-200 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-24 bg-stone-100 rounded-lg" />
            <div className="h-16 bg-stone-50 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-4">
        <div className="h-4 w-28 bg-stone-200 rounded-lg" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-24 bg-stone-100 rounded-lg" />
            <div className="h-16 bg-stone-50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
