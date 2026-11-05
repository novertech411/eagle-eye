import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { qualityBreakdown } from '@/lib/data'
import { cn } from '@/lib/utils'

export function PeriodChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
      {label}
    </span>
  )
}

export function StatBlock({
  value,
  label,
  description,
  trend,
}: {
  value: string
  label: string
  description: string
  trend: 'up' | 'down'
}) {
  const Icon = trend === 'up' ? ArrowUp : ArrowDown
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon
          className={cn('size-6', trend === 'up' ? 'text-primary' : 'text-highlight')}
          aria-hidden="true"
        />
        <span className="text-3xl font-bold">{value}</span>
        <span className="sr-only">{trend === 'up' ? 'increase' : 'decrease'}</span>
      </div>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function MiniCalendar() {
  const year = 2026
  const month = 10
  const today = 5
  const scheduled = new Set([12, 19, 28])
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-4">
        <button type="button" aria-label="Previous month" className="rounded-full p-1 text-muted-foreground hover:bg-muted">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <p className="text-sm font-semibold">November 2026</p>
        <button type="button" aria-label="Next month" className="rounded-full p-1 text-muted-foreground hover:bg-muted">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {weekdays.map((d) => (
          <span key={d} className="pb-1 text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((d, i) => (
          <span key={i} className="flex items-center justify-center">
            {d ? (
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full',
                  d === today && 'bg-primary font-semibold text-primary-foreground',
                  scheduled.has(d) && 'ring-1 ring-highlight text-highlight font-medium',
                )}
                aria-current={d === today ? 'date' : undefined}
              >
                {d}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  )
}

export function QualityBars() {
  const colors = ['bg-primary', 'bg-highlight', 'bg-chart-3']
  return (
    <ul className="flex flex-col gap-4">
      {qualityBreakdown.map((q, i) => (
        <li key={q.label}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{q.label}</span>
            <span className="font-semibold">{q.value}%</span>
          </div>
          <div
            className="h-2 rounded-full bg-muted"
            role="progressbar"
            aria-label={q.label}
            aria-valuenow={q.value}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={cn('h-full rounded-full', colors[i])} style={{ width: `${q.value}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ProgressRing({ value }: { value: number }) {
  const r = 58
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative size-40">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="12" />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value / 100)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-4xl font-light">
          {value}%
        </span>
      </div>
      <p className="mt-4 text-xs text-muted-foreground text-pretty">
        Referral reviews completed by clinicians this week.
      </p>
      <Link
        href="/results"
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Review reports
      </Link>
    </div>
  )
}
