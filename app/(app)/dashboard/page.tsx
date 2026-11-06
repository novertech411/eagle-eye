import Link from 'next/link'
import { Plus } from 'lucide-react'
import { TopBar } from '@/components/app-shell/top-bar'
import { ScansTable } from '@/components/dashboard/scans-table'
import { buttonVariants } from '@/components/ui/button'
import { getDashboardStats, getScansPage } from '@/lib/supabase/queries'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Dashboard — Eagle Lense' }

type SearchParams = Record<string, string | string[] | undefined>

function single(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const query = single(params.q)
  const requestedPage = Number.parseInt(single(params.page), 10)
  const newestFirst = single(params.sort) !== 'oldest'

  const [counts, scans] = await Promise.all([
    getDashboardStats(),
    getScansPage(query, requestedPage > 0 ? requestedPage : 1, newestFirst),
  ])

  const stats = [
    { label: 'Total Scans', value: counts.total },
    { label: 'Awaiting Review', value: counts.awaiting },
    { label: 'Completed Today', value: counts.completedToday },
    { label: 'Referrals Made', value: counts.referrals },
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

      {counts.total === 0 ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-5 py-14 text-center">
          <p className="text-base font-medium">No scans yet. Start your first examination.</p>
          <Link href="/examination" className={cn(buttonVariants(), 'rounded-xl px-5')}>
            Start Examination
          </Link>
        </section>
      ) : (
        <ScansTable
          rows={scans.rows}
          total={scans.total}
          page={scans.page}
          pageCount={scans.pageCount}
          query={query}
          newestFirst={newestFirst}
        />
      )}
    </div>
  )
}
