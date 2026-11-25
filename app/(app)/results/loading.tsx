import { Loader2 } from 'lucide-react'
import { TopBar } from '@/components/app-shell/top-bar'

export default function ResultsLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-7">
      <TopBar title="Results & Report" />
      <p
        role="status"
        className="flex items-center justify-center gap-2 dashboard-card px-5 py-16 text-sm font-medium"
      >
        <Loader2 className="size-5 motion-safe:animate-spin text-primary" aria-hidden="true" />
        Loading examination…
      </p>
    </div>
  )
}
