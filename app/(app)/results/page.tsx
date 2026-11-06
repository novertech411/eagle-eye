import { redirect } from 'next/navigation'
import { getLatestExaminationId } from '@/lib/supabase/queries'

// The "Results" nav item opens the most recent examination.
export default async function ResultsIndexPage() {
  const id = await getLatestExaminationId()
  redirect(id ? `/results/${id}` : '/dashboard')
}
