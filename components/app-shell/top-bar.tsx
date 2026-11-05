import { Bell, Search } from 'lucide-react'
import { BrandMark } from '@/components/brand'

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-3">
          <p className="hidden text-sm font-medium italic text-primary lg:block">
            Your Eye Care Squad
          </p>
          <div className="relative hidden sm:block">
            <label htmlFor="global-search" className="sr-only">
              Search patients
            </label>
            <input
              id="global-search"
              type="search"
              placeholder="Search..."
              className="h-10 w-56 rounded-full border border-border bg-white pr-11 pl-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
            />
            <span className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Search className="size-4" aria-hidden="true" />
            </span>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-full bg-white text-foreground ring-1 ring-border"
          >
            <Bell className="size-4" aria-hidden="true" />
            <span className="absolute top-2 right-2.5 size-2 rounded-full bg-highlight" />
          </button>
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
    </header>
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
