'use client'

import { Button } from '@/components/ui/button'

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-5 py-12 text-center">
      <p className="text-lg font-semibold">Couldn&rsquo;t load this page</p>
      <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
      <Button variant="outline" className="rounded-xl" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
