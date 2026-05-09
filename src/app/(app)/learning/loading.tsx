export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-24 bg-stone-200 rounded-lg" />
        <div className="h-4 w-44 bg-stone-100 rounded-lg" />
      </div>
      <div className="h-10 bg-white rounded-2xl border border-stone-100" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-stone-100 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 h-52" />
        ))}
      </div>
    </div>
  )
}
