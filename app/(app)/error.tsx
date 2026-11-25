'use client'

import { Button } from '@/components/ui/button'

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 dashboard-card px-5 py-12 text-center">
      <p className="clinic-section-title">Couldn&rsquo;t load this page</p>
      <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
      <Button variant="outline" className="rounded-xl" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
