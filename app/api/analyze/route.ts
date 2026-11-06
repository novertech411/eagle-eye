import { NextResponse } from 'next/server'
import {
  combineAnalyses,
  failedAnalysis,
  parseStoredAnalysis,
  type ProcessingAnalysis,
  type RetinalAnalysis,
} from '@/lib/ai-result'
import { analyzeRetinalImage, ANALYSIS_MODEL } from '@/lib/claude'
import { getExamination, latestImage, type ExaminationDetails } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import type { Json, EyeLabel, RetinalImage } from '@/lib/supabase/types'

export const maxDuration = 300

// A run still marked as processing after this long is assumed to have crashed and can be taken over.
const STALE_CLAIM_MS = 5 * 60 * 1000

type Supabase = Awaited<ReturnType<typeof createClient>>

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status })
}

// Claims the examination so only one paid analysis runs at a time. Each write only
// succeeds if the row is still in the state read below, so simultaneous requests can't both win.
async function claimAnalysis(supabase: Supabase, examination: ExaminationDetails) {
  const claim: ProcessingAnalysis = { state: 'processing', started_at: new Date().toISOString() }
  const aiResult = claim as unknown as Json
  const results = supabase.from('screening_results')
  const current = examination.result
  const stored = parseStoredAnalysis(current?.ai_result)

  if (!current) {
    const { data, error } = await results
      .upsert(
        { examination_id: examination.id, ai_result: aiResult },
        { onConflict: 'examination_id', ignoreDuplicates: true },
      )
      .select('id')
    if (error) throw new Error(error.message)
    return data.length > 0
  }

  let update = results.update({ ai_result: aiResult }).eq('id', current.id)
  if (!stored) {
    update = update.is('ai_result', null)
  } else if (stored.state === 'processing') {
    if (Date.now() - new Date(stored.started_at).getTime() < STALE_CLAIM_MS) return false
    update = update.eq('ai_result->>started_at', stored.started_at)
  } else {
    update = update.eq('ai_result->>analysis_failed', 'true')
  }

  const { data, error } = await update.select('id')
  if (error) throw new Error(error.message)
  return data.length > 0
}

async function analyzeImage(supabase: Supabase, image: RetinalImage): Promise<RetinalAnalysis> {
  const { data, error } = await supabase.storage
    .from('retinal-images')
    .download(image.storage_path)
  if (error) {
    console.error(`Downloading the ${image.eye} eye image failed:`, error.message)
    return failedAnalysis()
  }
  const base64 = Buffer.from(await data.arrayBuffer()).toString('base64')
  return analyzeRetinalImage(base64, image.eye)
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { examinationId?: unknown } | null
  const examinationId = body?.examinationId
  if (typeof examinationId !== 'string') return json(400, { error: 'examinationId is required' })

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return json(401, { error: 'Not signed in' })

    // Row-level security means another user's examination simply isn't found.
    const examination = await getExamination(examinationId)
    if (!examination) return json(404, { error: 'Examination not found' })
    if (examination.status === 'draft') return json(409, { error: 'Examination not submitted' })

    const stored = parseStoredAnalysis(examination.result?.ai_result)
    if (examination.status === 'finalized') {
      return json(409, { error: 'Report already finalized' })
    }
    if (stored?.state === 'complete' && !stored.analysis_failed) {
      return json(200, { status: 'complete', result: stored })
    }

    const images = (['right', 'left'] as const).flatMap((eye) => {
      const image = latestImage(examination.images, eye)
      return image ? [image] : []
    })
    if (images.length === 0) return json(409, { error: 'Examination has no images' })

    if (!(await claimAnalysis(supabase, examination))) {
      return json(202, { status: 'processing' })
    }

    const analyses = await Promise.all(images.map((image) => analyzeImage(supabase, image)))
    const eyes: Partial<Record<EyeLabel, RetinalAnalysis>> = {}
    images.forEach((image, index) => {
      eyes[image.eye] = analyses[index]
    })
    const result = combineAnalyses(eyes, ANALYSIS_MODEL)

    // A report finalized during the analysis stays exactly as the clinician signed it.
    const { data: saved, error: saveError } = await supabase
      .from('screening_results')
      .update({ ai_result: result as unknown as Json, risk_level: result.risk_level })
      .eq('examination_id', examinationId)
      .eq('finalized', false)
      .select('id')
    if (saveError) throw new Error(saveError.message)
    if (saved.length === 0) return json(409, { error: 'Report already finalized' })

    await Promise.all(
      images.map(async (image, index) => {
        const quality = analyses[index].image_quality
        if (!quality) return
        const { error } = await supabase
          .from('retinal_images')
          .update({ quality_status: quality })
          .eq('id', image.id)
        if (error) console.error('Saving image quality failed:', error.message)
      }),
    )

    const { error: statusError } = await supabase
      .from('examinations')
      .update({ status: 'analyzed' })
      .eq('id', examinationId)
      .eq('status', 'submitted')
    if (statusError) throw new Error(statusError.message)

    return json(200, { status: 'complete', result })
  } catch (error) {
    console.error('Analysis request failed:', error instanceof Error ? error.message : error)
    return json(500, { error: 'Analysis could not be saved' })
  }
}
