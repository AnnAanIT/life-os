export default function Loading() {
  return (
    <div className="px-4 pt-12 lg:px-8 lg:pt-8 pb-4 animate-pulse">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded-lg" />
        <div className="h-4 w-64 bg-stone-100 rounded-lg" />
        <div className="flex gap-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-2 w-8 bg-stone-200 rounded-full" />
          ))}
        </div>
        <div className="h-12 w-48 bg-stone-200 rounded-2xl mt-4" />
      </div>
    </div>
  )
}
