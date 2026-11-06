'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2, CircleAlert, Loader2, Plus } from 'lucide-react'
import { finalizeReport } from '@/app/(app)/results/[id]/actions'
import { DownloadReportButton } from '@/components/results/download-report-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const outlineAction =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-white text-sm font-semibold text-primary hover:bg-accent'

// Text rather than a disabled input, which would cut off a longer recommendation.
function SavedValue({ label, value }: { label: string; value: string }) {
  return (
    <>
      <p className="text-sm leading-none font-medium">{label}</p>
      <p className="min-h-11 rounded-xl bg-white px-3 py-2.5 text-sm whitespace-pre-wrap ring-1 ring-inset ring-border">
        {value || '—'}
      </p>
    </>
  )
}

export function ReportForm({
  examinationId,
  clinicianNotes,
  recommendation,
  finalized: initiallyFinalized,
}: {
  examinationId: string
  clinicianNotes: string
  recommendation: string
  finalized: boolean
}) {
  const [finalized, setFinalized] = useState(initiallyFinalized)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (isPending || finalized) return
        const form = new FormData(e.currentTarget)
        setError(null)
        startTransition(async () => {
          try {
            const result = await finalizeReport(
              examinationId,
              String(form.get('notes') ?? ''),
              String(form.get('recommendation') ?? ''),
            )
            if (result.error) setError(result.error)
            else setFinalized(true)
          } catch {
            setError("Couldn't reach the server. Check your connection and try again.")
          }
        })
      }}
    >
      <div className="flex flex-col gap-2">
        {finalized ? (
          <SavedValue label="Clinician notes" value={clinicianNotes} />
        ) : (
          <>
            <Label htmlFor="notes">Clinician notes</Label>
            <Input
              id="notes"
              name="notes"
              defaultValue={clinicianNotes}
              className="h-11 rounded-xl bg-white text-base md:text-sm"
            />
          </>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {finalized ? (
          <SavedValue label="Recommendation" value={recommendation} />
        ) : (
          <>
            <Label htmlFor="recommendation">
              Recommendation{' '}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Input
              id="recommendation"
              name="recommendation"
              required
              defaultValue={recommendation}
              className="h-11 rounded-xl bg-white text-base md:text-sm"
            />
          </>
        )}
      </div>

      <Button
        type="submit"
        disabled={finalized || isPending}
        className="h-12 rounded-xl text-base font-bold"
      >
        {finalized ? (
          <>
            <CheckCircle2 className="size-5" aria-hidden="true" />
            Report Finalized
          </>
        ) : (
          <>
            {isPending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
            Finalize Report
          </>
        )}
      </Button>
      <p className="sr-only" role="status">
        {finalized ? 'Report finalized.' : ''}
      </p>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <DownloadReportButton
          examinationId={examinationId}
          disabled={!finalized}
          className={cn(outlineAction, 'disabled:cursor-not-allowed disabled:opacity-60')}
          onError={setError}
        />
        <Link href="/examination" className={outlineAction}>
          <Plus className="size-4" aria-hidden="true" />
          New Examination
        </Link>
      </div>
      {!finalized ? (
        <p className="text-xs text-muted-foreground">Finalize report to enable download.</p>
      ) : null}
    </form>
  )
}
