export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 animate-pulse">
      <div className="mb-4 space-y-2">
        <div className="h-7 w-24 bg-stone-200 rounded-lg" />
        <div className="h-4 w-40 bg-stone-100 rounded-lg" />
      </div>
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-stone-100 h-32" />
        <div className="bg-white rounded-2xl border border-stone-100 h-56" />
        <div className="bg-white rounded-2xl border border-stone-100 h-40" />
      </div>
    </div>
  )
}
