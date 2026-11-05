'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Download, Plus, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sampleResult } from '@/lib/data'

const outlineAction =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-white text-sm font-semibold text-primary hover:bg-accent'

export function ReportForm() {
  const [finalized, setFinalized] = useState(sampleResult.finalized)

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        setFinalized(true)
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Clinician notes</Label>
        <Input
          id="notes"
          defaultValue={sampleResult.clinicianNotes}
          disabled={finalized}
          className="h-11 rounded-xl bg-white text-base md:text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="recommendation">
          Recommendation{' '}
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="recommendation"
          required
          defaultValue={sampleResult.recommendation}
          disabled={finalized}
          className="h-11 rounded-xl bg-white text-base md:text-sm"
        />
      </div>

      <Button type="submit" disabled={finalized} className="h-12 rounded-xl text-base font-bold">
        {finalized ? (
          <>
            <CheckCircle2 className="size-5" aria-hidden="true" />
            Report Finalized
          </>
        ) : (
          'Finalize Report'
        )}
      </Button>
      <p className="sr-only" role="status">
        {finalized ? 'Report finalized.' : ''}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <button type="button" className={outlineAction}>
          <Download className="size-4" aria-hidden="true" />
          Download Report
        </button>
        <button type="button" onClick={() => window.print()} className={outlineAction}>
          <Printer className="size-4" aria-hidden="true" />
          Print Report
        </button>
        <Link href="/examination" className={outlineAction}>
          <Plus className="size-4" aria-hidden="true" />
          New Examination
        </Link>
      </div>
    </form>
  )
}
