'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface DraftExaminationInput {
  patientId: string | null
  name: string
  age: string
  phone: string
  symptoms: string
  consent: boolean
}

const SAVE_ERROR = "Couldn't save the examination. Please try again."

// Creates the patient and a draft examination. The browser then uploads the images
// to this examination's folder before completeExamination marks it as submitted.
export async function createDraftExamination(
  input: DraftExaminationInput,
): Promise<{ error: string } | { examinationId: string }> {
  const name = input.name.trim()
  const age = Number(input.age)
  const phone = input.phone.trim() || null
  const symptoms = input.symptoms.trim() || null

  if (!name) return { error: 'Enter the patient’s name.' }
  if (!input.age.trim() || !Number.isInteger(age) || age < 0 || age > 120) {
    return { error: 'Enter an age between 0 and 120.' }
  }
  if (input.consent !== true) return { error: 'Patient consent is required.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session has expired. Please sign in again.' }

  const details = { name, age, phone }
  let patientId = input.patientId
  const isNewPatient = !patientId

  if (patientId) {
    const { data, error } = await supabase
      .from('patients')
      .update(details)
      .eq('id', patientId)
      .select('id')
      .maybeSingle()
    if (error) console.error('Updating patient failed:', error.message)
    if (error || !data) return { error: SAVE_ERROR }
  } else {
    const { data, error } = await supabase
      .from('patients')
      .insert({ ...details, created_by: user.id })
      .select('id')
      .single()
    if (error) console.error('Creating patient failed:', error.message)
    if (error) return { error: SAVE_ERROR }
    patientId = data.id as string
  }

  const { data: examination, error } = await supabase
    .from('examinations')
    .insert({
      patient_id: patientId,
      symptoms,
      consent: true,
      status: 'draft',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Creating examination failed:', error.message)
    // Don't leave a duplicate patient behind when the user retries.
    if (isNewPatient) await supabase.from('patients').delete().eq('id', patientId)
    return { error: SAVE_ERROR }
  }

  return { examinationId: examination.id as string }
}

// Returns an error for the form to show; on success it redirects to the results page.
export async function completeExamination(examinationId: string): Promise<{ error: string }> {
  const supabase = await createClient()

  const { count, error: imagesError } = await supabase
    .from('retinal_images')
    .select('id', { count: 'exact', head: true })
    .eq('examination_id', examinationId)
  if (imagesError) console.error('Checking images failed:', imagesError.message)
  if (imagesError) return { error: SAVE_ERROR }
  if (!count) return { error: 'At least one retinal image is required.' }

  const { data, error } = await supabase
    .from('examinations')
    .update({ status: 'submitted' })
    .eq('id', examinationId)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle()
  if (error) console.error('Submitting examination failed:', error.message)
  if (error || !data) return { error: SAVE_ERROR }

  revalidatePath('/dashboard')
  redirect(`/results/${examinationId}`)
}
