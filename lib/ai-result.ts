import type { EyeLabel, Json, RiskLevel } from '@/lib/supabase/types'

export const ANALYSIS_FAILED_NOTE =
  'Analysis could not be completed. Please retry or assess manually.'

export type ImageQuality = 'suitable' | 'insufficient'

export interface RetinalAnalysis {
  risk_level: RiskLevel
  confidence: number | null
  cdr_estimate: string | null
  findings: string[]
  recommendation: string | null
  image_quality: ImageQuality | null
  quality_notes: string | null
  analysis_failed: boolean
}

export interface CompletedAnalysis extends RetinalAnalysis {
  state: 'complete'
  eyes: Partial<Record<EyeLabel, RetinalAnalysis>>
  model: string
  analyzed_at: string
}

export interface ProcessingAnalysis {
  state: 'processing'
  started_at: string
}

export type StoredAnalysis = ProcessingAnalysis | CompletedAnalysis

export function failedAnalysis(): RetinalAnalysis {
  return {
    risk_level: 'inconclusive',
    confidence: null,
    cdr_estimate: null,
    findings: [],
    recommendation: null,
    image_quality: null,
    quality_notes: ANALYSIS_FAILED_NOTE,
    analysis_failed: true,
  }
}

export function parseStoredAnalysis(value: Json | null | undefined): StoredAnalysis | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (value.state === 'processing' || value.state === 'complete') {
    return value as unknown as StoredAnalysis
  }
  return null
}

// An inconclusive eye ranks above a low one, so one eye's "low" never hides an eye nobody could assess.
const RISK_SEVERITY: Record<RiskLevel, number> = { low: 0, inconclusive: 1, moderate: 2, high: 3 }

const eyeName = (eye: EyeLabel) => (eye === 'right' ? 'Right eye' : 'Left eye')

export function combineAnalyses(
  eyes: Partial<Record<EyeLabel, RetinalAnalysis>>,
  model: string,
): CompletedAnalysis {
  const entries = (['right', 'left'] as const).flatMap((eye) => {
    const analysis = eyes[eye]
    return analysis ? [{ eye, analysis }] : []
  })
  const label = (eye: EyeLabel, text: string) =>
    entries.length > 1 ? `${eyeName(eye)}: ${text}` : text

  const worst = entries.reduce((top, entry) =>
    RISK_SEVERITY[entry.analysis.risk_level] > RISK_SEVERITY[top.analysis.risk_level] ? entry : top,
  )
  const atWorstRisk = entries.filter(
    (entry) => entry.analysis.risk_level === worst.analysis.risk_level,
  )
  const confidences = atWorstRisk.flatMap(({ analysis }) =>
    analysis.confidence === null ? [] : [analysis.confidence],
  )
  const qualities = entries.flatMap(({ analysis }) =>
    analysis.image_quality ? [analysis.image_quality] : [],
  )
  const estimates = entries.flatMap(({ eye, analysis }) =>
    analysis.cdr_estimate ? [label(eye, analysis.cdr_estimate)] : [],
  )
  const notes = entries.flatMap(({ eye, analysis }) =>
    analysis.quality_notes && !analysis.analysis_failed
      ? [label(eye, analysis.quality_notes)]
      : [],
  )

  return {
    state: 'complete',
    risk_level: worst.analysis.risk_level,
    confidence: confidences.length > 0 ? Math.min(...confidences) : null,
    cdr_estimate: estimates.length > 0 ? estimates.join(', ') : null,
    findings: entries.flatMap(({ eye, analysis }) =>
      analysis.findings.map((finding) => label(eye, finding)),
    ),
    // Comes from one eye only, and its reasoning describes that eye, so say which one.
    recommendation: worst.analysis.recommendation
      ? label(worst.eye, worst.analysis.recommendation)
      : null,
    image_quality: qualities.includes('insufficient')
      ? 'insufficient'
      : qualities.length > 0
        ? 'suitable'
        : null,
    quality_notes: notes.length > 0 ? notes.join(' ') : null,
    analysis_failed: entries.some(({ analysis }) => analysis.analysis_failed),
    eyes,
    model,
    analyzed_at: new Date().toISOString(),
  }
}
