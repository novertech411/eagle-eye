import Link from 'next/link'
import { Panel, TopBar } from '@/components/app-shell/top-bar'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ScanNotFound() {
  return (
    <div className="flex flex-col gap-5">
      <TopBar title="Results & Report" />
      <Panel className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-lg font-semibold">Scan not found</p>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-xl')}>
          Back to Dashboard
        </Link>
      </Panel>
    </div>
  )
}
