import { containsPattern, quoteFilterValue } from '@/lib/supabase/search'
import { createClient } from '@/lib/supabase/server'
import type {
  Examination,
  ExaminationStatus,
  EyeLabel,
  Patient,
  RetinalImage,
  RiskLevel,
  ScreeningResult,
} from '@/lib/supabase/types'

export const PAGE_SIZE = 10
const SIGNED_URL_SECONDS = 60 * 60

// "Completed today" is counted in clinic time, not the server's time zone.
const CLINIC_TIME_ZONE = 'Africa/Lagos'
const CLINIC_UTC_OFFSET = '+01:00'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ScanStatus = 'draft' | 'awaiting' | 'analyzed' | 'completed' | 'referred'

export interface ScanRow {
  id: string
  createdAt: string | null
  patient: string
  age: number
  eyes: 'Both' | 'Right' | 'Left' | null
  status: ScanStatus
}

export interface ExaminationDetails extends Examination {
  patient: Patient
  images: RetinalImage[]
  result: ScreeningResult | null
}

function startOfClinicDay() {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: CLINIC_TIME_ZONE }).format(new Date())
  return new Date(`${day}T00:00:00${CLINIC_UTC_OFFSET}`).toISOString()
}

function eyesLabel(images: { eye: EyeLabel }[]): ScanRow['eyes'] {
  const right = images.some((image) => image.eye === 'right')
  const left = images.some((image) => image.eye === 'left')
  if (right && left) return 'Both'
  if (right) return 'Right'
  return left ? 'Left' : null
}

function scanStatus(status: ExaminationStatus, risk: RiskLevel | null | undefined): ScanStatus {
  if (risk === 'moderate' || risk === 'high') return 'referred'
  if (status === 'finalized') return 'completed'
  if (status === 'analyzed') return 'analyzed'
  return status === 'submitted' ? 'awaiting' : 'draft'
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const count = { count: 'exact', head: true } as const

  const [total, awaiting, completedToday, referrals] = await Promise.all([
    supabase.from('examinations').select('id', count),
    supabase.from('examinations').select('id', count).eq('status', 'submitted'),
    supabase
      .from('screening_results')
      .select('id', count)
      .eq('finalized', true)
      .gte('finalized_at', startOfClinicDay()),
    supabase.from('screening_results').select('id', count).in('risk_level', ['moderate', 'high']),
  ])

  const failed = total.error ?? awaiting.error ?? completedToday.error ?? referrals.error
  if (failed) throw new Error(failed.message)

  return {
    total: total.count ?? 0,
    awaiting: awaiting.count ?? 0,
    completedToday: completedToday.count ?? 0,
    referrals: referrals.count ?? 0,
  }
}

export async function getScansPage(query: string, requestedPage: number, newestFirst: boolean) {
  const supabase = await createClient()
  const term = query.trim()
  const pattern = quoteFilterValue(containsPattern(term))
  const patientFilter = `name.ilike.${pattern},phone.ilike.${pattern}`

  // Count first: requesting a range past the last row is an error, so the page must be clamped.
  let countQuery = supabase
    .from('examinations')
    .select('id, patients!inner(id)', { count: 'exact', head: true })
  if (term) countQuery = countQuery.or(patientFilter, { referencedTable: 'patients' })
  const { count, error: countError } = await countQuery
  if (countError) throw new Error(countError.message)

  const total = count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount)
  if (total === 0) return { rows: [] as ScanRow[], total, page, pageCount }

  const from = (page - 1) * PAGE_SIZE
  let rowsQuery = supabase
    .from('examinations')
    .select(
      'id, created_at, status, patients!inner(name, age), retinal_images(eye), screening_results(risk_level)',
    )
  if (term) rowsQuery = rowsQuery.or(patientFilter, { referencedTable: 'patients' })
  const { data, error } = await rowsQuery
    .order('created_at', { ascending: !newestFirst })
    .order('id')
    .range(from, from + PAGE_SIZE - 1)
  if (error) throw new Error(error.message)

  const rows = (data as unknown as ScanQueryRow[]).map(
    (row): ScanRow => ({
      id: row.id,
      createdAt: row.created_at,
      patient: row.patients.name,
      age: row.patients.age,
      eyes: eyesLabel(row.retinal_images),
      status: scanStatus(row.status, row.screening_results?.risk_level),
    }),
  )

  return { rows, total, page, pageCount }
}

interface ScanQueryRow {
  id: string
  created_at: string | null
  status: ExaminationStatus
  patients: Pick<Patient, 'name' | 'age'>
  retinal_images: { eye: EyeLabel }[]
  screening_results: { risk_level: RiskLevel | null } | null
}

export async function getExamination(id: string): Promise<ExaminationDetails | null> {
  if (!UUID_PATTERN.test(id)) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('examinations')
    .select('*, patients(*), retinal_images(*), screening_results(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const { patients, retinal_images, screening_results, ...examination } =
    data as unknown as Examination & {
      patients: Patient
      retinal_images: RetinalImage[]
      screening_results: ScreeningResult | null
    }

  return { ...examination, patient: patients, images: retinal_images, result: screening_results }
}

export function latestImage(images: RetinalImage[], eye: EyeLabel): RetinalImage | undefined {
  return images
    .filter((image) => image.eye === eye)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0]
}

// Maps each storage path to a temporary viewing URL. Paths that can't be signed are left out.
export async function getSignedImageUrls(images: RetinalImage[]) {
  if (images.length === 0) return new Map<string, string>()

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('retinal-images').createSignedUrls(
    images.map((image) => image.storage_path),
    SIGNED_URL_SECONDS,
  )
  if (error) console.error('Signing image URLs failed:', error.message)

  const urls = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
  }
  return urls
}

export async function getOtherExaminations(patientId: string, excludeId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('examinations')
    .select('*')
    .eq('patient_id', patientId)
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) throw new Error(error.message)
  return data as Examination[]
}

export async function getLatestExaminationId() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('examinations')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.id as string | undefined) ?? null
}
