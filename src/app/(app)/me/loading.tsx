export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-8 animate-pulse">
      <div className="mb-5 space-y-1">
        <div className="h-7 w-32 bg-stone-200 rounded-lg" />
        <div className="h-4 w-48 bg-stone-100 rounded-lg" />
      </div>
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-100 h-48" />
          <div className="bg-white rounded-2xl border border-stone-100 h-36" />
          <div className="bg-white rounded-2xl border border-stone-100 h-28" />
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 h-80" />
      </div>
    </div>
  )
}
