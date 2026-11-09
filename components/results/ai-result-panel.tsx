'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleAlert, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ANALYSIS_FAILED_NOTE, type CompletedAnalysis, type StoredAnalysis } from '@/lib/ai-result'
import type { ExaminationStatus, RiskLevel } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { withBasePath } from '@/lib/base-path'

const POLL_INTERVAL_MS = 3000
const MAX_WAIT_MS = 5 * 60 * 1000
const TIMED_OUT_NOTE = 'This is taking longer than expected. Please retry or assess manually.'

const riskStyles: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: 'Low risk', className: 'bg-emerald-100 text-emerald-800 ring-emerald-300' },
  moderate: { label: 'Moderate risk', className: 'bg-orange-100 text-orange-800 ring-orange-300' },
  high: { label: 'High risk', className: 'bg-red-100 text-red-800 ring-red-300' },
  inconclusive: { label: 'Inconclusive', className: 'bg-gray-100 text-gray-700 ring-gray-300' },
}

function requestAnalysis(examinationId: string) {
  return fetch(withBasePath('/api/analyze'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examinationId }),
  })
}

function AnalysisDetails({ analysis }: { analysis: CompletedAnalysis }) {
  const risk = riskStyles[analysis.risk_level]
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className={cn(
            'inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset',
            risk.className,
          )}
        >
          {risk.label}
        </span>
        {analysis.confidence !== null ? (
          <span className="text-muted-foreground">
            Confidence: {Math.round(analysis.confidence * 100)}%
          </span>
        ) : null}
      </div>

      {analysis.cdr_estimate ? (
        <p>
          <span className="text-muted-foreground">CDR estimate: </span>
          <span className="font-medium">{analysis.cdr_estimate}</span>
        </p>
      ) : null}

      {analysis.findings.length > 0 ? (
        <div>
          <h3 className="mb-1 font-semibold">Findings</h3>
          <ul className="list-disc space-y-1 pl-5">
            {analysis.findings.map((finding, index) => (
              <li key={index}>{finding}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.recommendation ? (
        <section className="rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-primary/40">
          <h3 className="mb-1 font-semibold text-primary">Clinical Recommendation</h3>
          <p>{analysis.recommendation}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            AI-assisted screening — confirm with clinical examination
          </p>
        </section>
      ) : null}

      {analysis.image_quality ? (
        <p>
          <span className="text-muted-foreground">Image quality: </span>
          <span className="font-medium">
            {analysis.image_quality === 'suitable' ? 'Suitable' : 'Insufficient'}
          </span>
          {analysis.quality_notes ? (
            <span className="text-muted-foreground"> — {analysis.quality_notes}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}

export function AiResultPanel({
  examinationId,
  status,
  analysis,
}: {
  examinationId: string
  status: ExaminationStatus
  analysis: StoredAnalysis | null
}) {
  const router = useRouter()
  const started = useRef(false)
  const [retrying, setRetrying] = useState(false)
  const [startFailed, setStartFailed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  const finalized = status === 'finalized'
  const pending = !finalized && (status === 'submitted' || analysis?.state === 'processing')
  const waiting = pending && !startFailed && !timedOut
  const completed = analysis?.state === 'complete' ? analysis : null

  // Runs here rather than at submit, so an analysis also resumes if the browser closed before it started.
  useEffect(() => {
    if (status !== 'submitted' || started.current) return
    started.current = true
    requestAnalysis(examinationId)
      .then((response) => {
        if (!response.ok) setStartFailed(true)
        router.refresh()
      })
      .catch(() => setStartFailed(true))
  }, [examinationId, status, router])

  useEffect(() => {
    if (!waiting) return
    const poll = setInterval(() => router.refresh(), POLL_INTERVAL_MS)
    const giveUp = setTimeout(() => setTimedOut(true), MAX_WAIT_MS)
    return () => {
      clearInterval(poll)
      clearTimeout(giveUp)
    }
  }, [waiting, router])

  async function retry() {
    setRetrying(true)
    setStartFailed(false)
    setTimedOut(false)
    try {
      const response = await requestAnalysis(examinationId)
      if (!response.ok) setStartFailed(true)
    } catch {
      setStartFailed(true)
    }
    router.refresh()
    setRetrying(false)
  }

  const failed = completed?.analysis_failed && !finalized
  const showRetry = !retrying && (failed || (pending && (startFailed || timedOut)))
  const note = failed || startFailed ? ANALYSIS_FAILED_NOTE : timedOut ? TIMED_OUT_NOTE : null

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-accent px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          AI screening result
        </h2>
        {!waiting && !retrying && !completed ? (
          <p className="font-semibold italic text-primary">
            {finalized ? 'Not analyzed' : 'Awaiting analysis'}
          </p>
        ) : null}
      </div>

      {waiting || retrying ? (
        <p className="flex items-center gap-2 text-sm font-medium" role="status">
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
          Analyzing retinal images...
        </p>
      ) : completed ? (
        <AnalysisDetails analysis={completed} />
      ) : null}

      {note && !retrying ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {note}
        </p>
      ) : null}

      {showRetry ? (
        <Button
          type="button"
          variant="outline"
          className="self-start rounded-xl"
          onClick={() => void retry()}
        >
          <RefreshCw aria-hidden="true" />
          Retry Analysis
        </Button>
      ) : null}
    </div>
  )
}
