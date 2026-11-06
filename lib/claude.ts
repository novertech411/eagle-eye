import Anthropic from '@anthropic-ai/sdk'
import { failedAnalysis, type RetinalAnalysis } from '@/lib/ai-result'
import type { RiskLevel } from '@/lib/supabase/types'

export const ANALYSIS_MODEL = 'claude-sonnet-5-5'

const MAX_TOKENS = 16000
const REQUEST_TIMEOUT_MS = 90_000
const MAX_RETRIES = 1
const MAX_IMAGE_BASE64_LENGTH = 10 * 1024 * 1024

const SYSTEM_PROMPT = `You are an ophthalmology screening assistant integrated into Eagle Lense, a retinal screening platform. Analyze the provided fundus image for signs of glaucoma.

Evaluate:
- Cup-to-disc ratio (CDR) estimation
- Neuroretinal rim thinning or notching
- Disc hemorrhages
- Retinal nerve fiber layer (RNFL) defects
- Any other observable abnormalities

Return ONLY valid JSON with this exact structure:
{
  "risk_level": "low" | "moderate" | "high" | "inconclusive",
  "confidence": 0.0 to 1.0,
  "cdr_estimate": "e.g. 0.3" or null,
  "findings": ["finding 1", "finding 2"],
  "recommendation": "2-3 sentence recommendation for the clinician",
  "image_quality": "suitable" | "insufficient",
  "quality_notes": "optional note about image quality"
}

Write the recommendation in plain language for the clinician, in 2-3 sentences. Start with the next step and how soon it should happen, then give the findings in this image that support it.

If the image is not a fundus image or is too poor quality to assess, set risk_level to "inconclusive", image_quality to "insufficient", explain in quality_notes, and recommend recapturing the image or assessing the patient manually.

This is a screening aid only. It does not replace clinical diagnosis.`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    risk_level: { type: 'string', enum: ['low', 'moderate', 'high', 'inconclusive'] },
    confidence: { type: 'number' },
    cdr_estimate: { type: ['string', 'null'] },
    findings: { type: 'array', items: { type: 'string' } },
    recommendation: { type: 'string' },
    image_quality: { type: 'string', enum: ['suitable', 'insufficient'] },
    quality_notes: { type: ['string', 'null'] },
  },
  required: [
    'risk_level',
    'confidence',
    'cdr_estimate',
    'findings',
    'recommendation',
    'image_quality',
    'quality_notes',
  ],
  additionalProperties: false,
}

const RISK_LEVELS: readonly string[] = ['low', 'moderate', 'high', 'inconclusive']

function parseAnalysis(text: string): RetinalAnalysis {
  const data = JSON.parse(text) as Record<string, unknown>

  if (
    typeof data.risk_level !== 'string' ||
    !RISK_LEVELS.includes(data.risk_level) ||
    typeof data.confidence !== 'number' ||
    !Array.isArray(data.findings) ||
    !data.findings.every((finding) => typeof finding === 'string') ||
    typeof data.recommendation !== 'string' ||
    (data.image_quality !== 'suitable' && data.image_quality !== 'insufficient')
  ) {
    throw new Error('Response did not match the expected structure')
  }

  const risk = data.risk_level as RiskLevel
  return {
    // An image too poor to assess must never read as a reassuring result.
    risk_level: data.image_quality === 'insufficient' && risk === 'low' ? 'inconclusive' : risk,
    confidence: Math.min(1, Math.max(0, data.confidence)),
    cdr_estimate: typeof data.cdr_estimate === 'string' ? data.cdr_estimate : null,
    findings: data.findings,
    recommendation: data.recommendation,
    image_quality: data.image_quality,
    quality_notes: typeof data.quality_notes === 'string' ? data.quality_notes : null,
    analysis_failed: false,
  }
}

function logFailure(eyeLabel: string, error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error('Retinal analysis failed: ANTHROPIC_API_KEY was rejected.')
  } else if (error instanceof Anthropic.NotFoundError) {
    console.error(`Retinal analysis failed: model ${ANALYSIS_MODEL} is not available.`)
  } else if (error instanceof Anthropic.RateLimitError) {
    console.error(`Retinal analysis of the ${eyeLabel} eye failed: rate limited.`)
  } else if (error instanceof Anthropic.APIConnectionError) {
    console.error(`Retinal analysis of the ${eyeLabel} eye failed: could not reach the API.`)
  } else if (error instanceof Anthropic.APIError) {
    console.error(`Retinal analysis of the ${eyeLabel} eye failed: API error ${error.status}.`)
  } else {
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error(`Retinal analysis of the ${eyeLabel} eye failed: ${message}`)
  }
}

// Never throws: any failure returns an inconclusive result flagged as failed, so it can be retried.
export async function analyzeRetinalImage(
  imageBase64: string,
  eyeLabel: string,
): Promise<RetinalAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Retinal analysis skipped: ANTHROPIC_API_KEY is not set.')
    return failedAnalysis()
  }
  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    console.error(`Retinal analysis of the ${eyeLabel} eye skipped: image is over the 10 MB limit.`)
    return failedAnalysis()
  }

  try {
    const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES })
    const response = await client.beta.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: MAX_TOKENS,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM_PROMPT,
      output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: `Analyze this fundus image of the ${eyeLabel} eye.` },
          ],
        },
      ],
    })

    if (response.stop_reason !== 'end_turn') {
      throw new Error(`Unexpected stop reason: ${response.stop_reason}`)
    }
    const text = response.content.find((block) => block.type === 'text')
    if (!text || text.type !== 'text') throw new Error('Response contained no text')

    return parseAnalysis(text.text)
  } catch (error) {
    logFailure(eyeLabel, error)
    return failedAnalysis()
  }
}
