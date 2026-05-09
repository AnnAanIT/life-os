export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 animate-pulse">
      <div className="mb-4 space-y-2">
        <div className="h-7 w-28 bg-stone-200 rounded-lg" />
        <div className="h-4 w-52 bg-stone-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-stone-100 h-48" />
        ))}
      </div>
    </div>
  )
}
