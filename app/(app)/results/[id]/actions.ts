'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const SAVE_ERROR = "Couldn't finalize the report. Please try again."

export async function finalizeReport(
  examinationId: string,
  clinicianNotes: string,
  recommendation: string,
): Promise<{ error?: string }> {
  const trimmedRecommendation = recommendation.trim()
  if (!trimmedRecommendation) return { error: 'Enter a recommendation.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session has expired. Please sign in again.' }

  const { data: examination, error: readError } = await supabase
    .from('examinations')
    .select('status')
    .eq('id', examinationId)
    .maybeSingle()
  if (readError) console.error('Reading examination failed:', readError.message)
  if (readError || !examination) return { error: SAVE_ERROR }
  if (examination.status === 'finalized') return { error: 'This report is already finalized.' }
  if (examination.status === 'draft') {
    return { error: 'This examination was not fully submitted, so it can’t be finalized.' }
  }

  // No result row exists until AI analysis is added, so create it if needed.
  const { error: resultError } = await supabase.from('screening_results').upsert(
    {
      examination_id: examinationId,
      clinician_notes: clinicianNotes.trim() || null,
      recommendation: trimmedRecommendation,
      finalized: true,
      finalized_at: new Date().toISOString(),
      finalized_by: user.id,
    },
    { onConflict: 'examination_id' },
  )
  if (resultError) {
    console.error('Saving report failed:', resultError.message)
    return { error: SAVE_ERROR }
  }

  // Updated last, so a failure here can be retried: the check above only blocks finished reports.
  const { error: statusError } = await supabase
    .from('examinations')
    .update({ status: 'finalized' })
    .eq('id', examinationId)
  if (statusError) {
    console.error('Updating examination status failed:', statusError.message)
    return { error: SAVE_ERROR }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/results/${examinationId}`)
  return {}
}
