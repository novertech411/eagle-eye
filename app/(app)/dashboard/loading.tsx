import { TopBar } from '@/components/app-shell/top-bar'
import { Skeleton } from '@/components/ui/skeleton'

const STAT_COUNT = 4
const ROW_COUNT = 6

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <TopBar title="Dashboard" subtitle="Overview of retinal scans across your clinic." />
      <p className="sr-only" role="status">
        Loading dashboard…
      </p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: STAT_COUNT }, (_, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-9 w-14" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 rounded-xl lg:h-auto lg:w-36" />
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full rounded-xl sm:w-72" />
        </div>
        <div className="flex flex-col divide-y divide-border">
          {Array.from({ length: ROW_COUNT }, (_, index) => (
            <div key={index} className="flex items-center gap-6 px-4 py-3.5 md:px-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-16 sm:block" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
