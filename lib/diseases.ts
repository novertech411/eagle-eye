import type { ScreeningDisease } from '@/lib/supabase/types'

export const DEFAULT_DISEASE: ScreeningDisease = 'glaucoma'

export const DISEASES: readonly { value: ScreeningDisease; label: string; description: string }[] = [
  { value: 'glaucoma', label: 'Glaucoma', description: 'Optic disc and cup changes' },
  {
    value: 'diabetic_retinopathy',
    label: 'Diabetic retinopathy',
    description: 'Referable (moderate or worse) DR',
  },
]

export function isScreeningDisease(value: unknown): value is ScreeningDisease {
  return DISEASES.some((disease) => disease.value === value)
}

export function diseaseLabel(disease: ScreeningDisease) {
  return DISEASES.find((d) => d.value === disease)?.label ?? disease
}
