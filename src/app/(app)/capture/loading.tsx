export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-36 bg-stone-200 rounded-lg" />
        <div className="h-4 w-52 bg-stone-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
        <div className="h-20 bg-stone-50 rounded-xl" />
        <div className="h-10 w-36 bg-stone-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-2">
        <div className="h-4 w-32 bg-stone-200 rounded-lg mb-3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-stone-50 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
