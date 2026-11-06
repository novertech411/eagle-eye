import type { QualityStatus } from '@/lib/supabase/types'

export const qualityLabels: Record<QualityStatus, string> = {
  pending: 'Quality check pending',
  suitable: 'Suitable for review',
  insufficient: 'Insufficient quality',
}

// Fixed locale and time zone so server and browser always render the same date.
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Lagos',
})

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' })

// YYYY-MM-DD, for file names.
export function formatIsoDate(value: string) {
  return isoDateFormatter.format(new Date(value))
}

export function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : '—'
}
