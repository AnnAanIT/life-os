export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4 animate-pulse">
      {/* Greeting */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
        <div className="h-5 w-40 bg-stone-200 rounded-lg" />
        <div className="h-4 w-56 bg-stone-100 rounded-lg" />
        <div className="flex gap-2 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 flex-1 bg-stone-100 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Capture bar */}
      <div className="h-12 bg-white rounded-2xl border border-stone-100" />

      {/* MIT */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-2">
        <div className="h-4 w-32 bg-stone-200 rounded-lg mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 bg-stone-50 rounded-xl" />
        ))}
      </div>

      {/* Habits */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-2">
        <div className="h-4 w-24 bg-stone-200 rounded-lg mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 flex-1 bg-stone-50 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Context zone */}
      <div className="h-28 bg-white rounded-2xl border border-stone-100" />
    </div>
  )
}
