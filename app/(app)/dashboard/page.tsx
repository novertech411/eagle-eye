import Link from 'next/link'
import { Plus } from 'lucide-react'
import { TopBar } from '@/components/app-shell/top-bar'
import { ScansTable } from '@/components/dashboard/scans-table'
import { buttonVariants } from '@/components/ui/button'
import { scans } from '@/lib/data'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Dashboard — Eagle Lense' }

const TODAY = '2026-11-05'

export default function DashboardPage() {
  const stats = [
    { label: 'Total Scans', value: scans.length },
    { label: 'Awaiting Review', value: scans.filter((s) => s.status === 'awaiting').length },
    {
      label: 'Completed Today',
      value: scans.filter((s) => s.status === 'completed' && s.date === TODAY).length,
    },
    { label: 'Referrals Made', value: scans.filter((s) => s.status === 'referred').length },
  ]

  return (
    <div className="flex flex-col gap-6">
      <TopBar title="Dashboard" subtitle="Overview of retinal scans across your clinic." />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <dl className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col-reverse gap-1 rounded-2xl border border-border bg-card p-5"
            >
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <Link
          href="/examination"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-12 gap-2 rounded-xl px-6 text-base font-semibold hover:bg-primary/90 lg:h-auto',
          )}
        >
          <Plus aria-hidden="true" />
          New Scan
        </Link>
      </div>

      <ScansTable scans={scans} />
    </div>
  )
}
