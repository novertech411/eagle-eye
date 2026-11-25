import { failedAnalysis, type RetinalAnalysis } from '@/lib/ai-result'
import { diseaseLabel } from '@/lib/diseases'
import type { RiskLevel, ScreeningDisease } from '@/lib/supabase/types'

// Client for the ONNX inference server (eagle-eye-inference, POST /api/screen).

const DEFAULT_SERVER_URL = 'http://localhost:8000'
const REQUEST_TIMEOUT_MS = 30_000
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const MODELS: Record<ScreeningDisease, string> = {
  glaucoma: 'onnx-glaucoma-v3',
  diabetic_retinopathy: 'onnx-dr-v1',
}

export function inferenceModel(disease: ScreeningDisease) {
  return MODELS[disease]
}

const INCONCLUSIVE_RECOMMENDATION =
  'Image quality is too poor to rule out disease. Recapture the image or assess the patient manually.'

interface ScreenQuality {
  passed: boolean
  issues: string[]
}

interface ScreenResponse {
  risk_score: number // 0-100
  decision: string // "REFER" or "LOW RISK"
  recommendation: string
  threshold_used: number // 0-1
  quality: ScreenQuality
}

function parseResponse(data: unknown): ScreenResponse {
  const body = data as Record<string, unknown> | null
  const quality = body?.quality as Record<string, unknown> | null | undefined
  if (
    !body ||
    typeof body.risk_score !== 'number' ||
    !Number.isFinite(body.risk_score) ||
    typeof body.decision !== 'string' ||
    typeof body.recommendation !== 'string' ||
    typeof body.threshold_used !== 'number' ||
    !Number.isFinite(body.threshold_used) ||
    !quality ||
    typeof quality.passed !== 'boolean' ||
    !Array.isArray(quality.issues) ||
    !quality.issues.every((issue) => typeof issue === 'string')
  ) {
    throw new Error('Response did not match the expected structure')
  }
  return {
    risk_score: Math.min(100, Math.max(0, body.risk_score)),
    decision: body.decision,
    recommendation: body.recommendation,
    threshold_used: body.threshold_used,
    quality: { passed: quality.passed, issues: quality.issues as string[] },
  }
}

function toRetinalAnalysis(
  response: ScreenResponse,
  disease: ScreeningDisease,
): RetinalAnalysis {
  const score = response.risk_score
  const threshold = response.threshold_used * 100
  // Halfway between the referral threshold and 100: glaucoma ~71, DR ~91.
  const highCutoff = threshold + (100 - threshold) / 2
  // The server says "LOW RISK" (with a space); anything other than REFER is treated as low.
  const refer = response.decision === 'REFER'

  let risk: RiskLevel = refer ? (score > highCutoff ? 'high' : 'moderate') : 'low'
  // An image too poor to assess must never read as a reassuring result.
  const forcedInconclusive = risk === 'low' && !response.quality.passed
  if (forcedInconclusive) risk = 'inconclusive'

  const name = diseaseLabel(disease)
  const findings = [
    `${name} model risk score ${score.toFixed(1)}/100 (referral threshold ${threshold.toFixed(1)})`,
  ]
  if (forcedInconclusive) {
    findings.push('Score is below the referral threshold, but image quality checks failed')
  }

  return {
    risk_level: risk,
    // Probability of the predicted outcome, so a confident low-risk result doesn't read as "5%".
    confidence: forcedInconclusive ? null : refer ? score / 100 : 1 - score / 100,
    cdr_estimate: null,
    findings,
    recommendation: forcedInconclusive ? INCONCLUSIVE_RECOMMENDATION : response.recommendation,
    image_quality: response.quality.passed ? 'suitable' : 'insufficient',
    quality_notes: response.quality.issues.length > 0 ? response.quality.issues.join('; ') : null,
    analysis_failed: false,
  }
}

// Never throws: any failure returns an inconclusive result flagged as failed, so it can be retried.
export async function screenRetinalImage(
  image: ArrayBuffer,
  eyeLabel: string,
  disease: ScreeningDisease,
): Promise<RetinalAnalysis> {
  if (image.byteLength > MAX_IMAGE_BYTES) {
    console.error(`Retinal screening of the ${eyeLabel} eye skipped: image is over the 10 MB limit.`)
    return failedAnalysis()
  }

  const baseUrl = (process.env.INFERENCE_SERVER_URL || DEFAULT_SERVER_URL).replace(/\/+$/, '')
  // Shared secret the inference server checks; unset only when running it locally without auth.
  const apiKey = process.env.INFERENCE_API_KEY

  try {
    const form = new FormData()
    form.append('image', new Blob([image], { type: 'image/jpeg' }), `${eyeLabel}.jpg`)
    form.append('disease', disease)

    const response = await fetch(`${baseUrl}/api/screen`, {
      method: 'POST',
      headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`server returned ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`)
    }

    return toRetinalAnalysis(parseResponse(await response.json()), disease)
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'TimeoutError'
        ? `no response within ${REQUEST_TIMEOUT_MS / 1000}s`
        : error instanceof Error
          ? error.message
          : 'unknown error'
    console.error(
      `Retinal screening (${disease}) of the ${eyeLabel} eye failed at ${baseUrl}: ${message}`,
    )
    return failedAnalysis()
  }
}
