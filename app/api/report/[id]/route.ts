import { NextResponse } from 'next/server'
import { parseStoredAnalysis } from '@/lib/ai-result'
import { formatIsoDate } from '@/lib/format'
import { renderReportPdf, type ReportEye } from '@/lib/pdf/report-template'
import { getExamination, latestImage } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import type { EyeLabel, RetinalImage } from '@/lib/supabase/types'

type Supabase = Awaited<ReturnType<typeof createClient>>

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

// Header values must be plain ASCII, so accents are dropped: "Ọlá Adé" becomes "ola-ade".
function fileNameSlug(name: string) {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'patient'
}

async function loadEye(
  supabase: Supabase,
  eye: EyeLabel,
  image: RetinalImage | undefined,
): Promise<ReportEye> {
  if (!image) return { eye, imageDataUri: null, quality: null }

  const { data, error } = await supabase.storage.from('retinal-images').download(image.storage_path)
  if (error) {
    console.error(`Downloading the ${eye} eye image for a report failed:`, error.message)
    return { eye, imageDataUri: null, quality: image.quality_status }
  }

  // Every stored image is JPEG: lib/capture-images.ts re-encodes them all before upload.
  const base64 = Buffer.from(await data.arrayBuffer()).toString('base64')
  return { eye, imageDataUri: `data:image/jpeg;base64,${base64}`, quality: image.quality_status }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return jsonError(401, 'Not signed in')

    const examination = await getExamination(id)
    // Same response for both cases, so this doesn't reveal which examination IDs exist.
    if (!examination || examination.created_by !== user.id) {
      return jsonError(404, 'Examination not found')
    }
    // Only a report signed off by a clinician may leave the app.
    if (examination.status !== 'finalized') return jsonError(409, 'Report is not finalized')

    const { patient, images, result } = examination
    const analysis = parseStoredAnalysis(result?.ai_result)
    const eyes = await Promise.all(
      (['right', 'left'] as const).map((eye) => loadEye(supabase, eye, latestImage(images, eye))),
    )

    const reportDate = result?.finalized_at ?? new Date().toISOString()
    const pdf = await renderReportPdf({
      reportId: id.slice(0, 8),
      examinationDate: examination.created_at,
      reportDate,
      // The requester is the examination's creator, because of the ownership check above.
      examiner: user.user_metadata?.full_name ?? user.email ?? '—',
      patient,
      symptoms: examination.symptoms,
      eyes,
      analysis: analysis?.state === 'complete' ? analysis : null,
      clinicianNotes: result?.clinician_notes ?? null,
      clinicianRecommendation: result?.recommendation ?? null,
    })

    const fileName = `screening-report-${fileNameSlug(patient.name)}-${formatIsoDate(examination.created_at ?? reportDate)}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Generating report failed:', error instanceof Error ? error.message : error)
    return jsonError(500, 'Report could not be generated')
  }
}
