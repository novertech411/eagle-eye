import { BrandMark } from '@/components/brand'

export function TopNav() {
  return (
    <header className="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-white px-4 md:left-64 md:justify-end md:px-8">
      <BrandMark className="md:hidden" />
      {/* <p className="hidden text-sm font-medium italic text-primary lg:block">Your Eye Care Squad</p> */}
    </header>
  )
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-balance md:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

export function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-3xl bg-card p-5 text-card-foreground shadow-[0_8px_30px_-12px_rgba(76,29,149,0.18)] md:p-6 ${className}`}
    >
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
