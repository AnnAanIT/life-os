interface Props {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: Props) {
  return (
    <div className={`px-4 pt-10 pb-6 space-y-4 lg:px-8 lg:pt-8 lg:pb-10 lg:max-w-3xl lg:mx-auto ${className ?? ''}`}>
      {children}
    </div>
  )
}
