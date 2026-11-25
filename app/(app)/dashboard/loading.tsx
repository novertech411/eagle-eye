import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="clinic-dashboard">
      <p className="sr-only" role="status">Loading dashboard…</p>
      <header className="dashboard-header">
        <div className="dashboard-heading">
          <Skeleton className="h-[15px] w-56" />
          <h1>Retinal screening overview</h1>
          <p className="dashboard-description">Every scan across your clinic, analysed by Eagle Lense AI.</p>
        </div>
        <Skeleton className="h-12 w-[139px] rounded-[12px]" />
      </header>
      <div className="dashboard-card dashboard-kpis">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="dashboard-kpi">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-14" />
            <Skeleton className="h-[15px] w-20" />
          </div>
        ))}
      </div>
      <div className="dashboard-card scans-card" aria-hidden="true">
        <div className="scans-toolbar">
          <div className="scans-toolbar-group">
            <h2>All scans</h2>
            <Skeleton className="h-9 w-[390px] max-w-full rounded-[10px]" />
          </div>
          <Skeleton className="h-[38px] w-[280px] max-w-full rounded-[10px]" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="scan-loading-row scan-loading-head">
              {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-3 w-10" />)}
            </div>
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="scan-loading-row">
                <Skeleton className="h-8 w-20" />
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-6 w-18" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="ml-auto h-8 w-24" />
              </div>
            ))}
          </div>
        </div>
        <div className="scans-footer">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
    </div>
  )
}
