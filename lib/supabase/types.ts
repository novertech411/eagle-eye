// Mirrors supabase/migrations/001_initial_schema.sql.
// Columns without a NOT NULL constraint are nullable, even when they have a default.

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined }

export type ExaminationStatus = 'draft' | 'submitted' | 'analyzed' | 'finalized'
export type EyeLabel = 'right' | 'left'
export type QualityStatus = 'pending' | 'suitable' | 'insufficient'
export type RiskLevel = 'low' | 'moderate' | 'high' | 'inconclusive'

export interface Patient {
  id: string
  name: string
  age: number
  phone: string | null
  created_by: string
  created_at: string | null
}

export interface Examination {
  id: string
  patient_id: string
  symptoms: string | null
  consent: boolean
  status: ExaminationStatus
  created_by: string
  created_at: string | null
}

export interface RetinalImage {
  id: string
  examination_id: string
  eye: EyeLabel
  storage_path: string
  quality_status: QualityStatus
  quality_score: number | null
  is_from_video: boolean | null
  frame_index: number | null
  created_at: string | null
}

export interface ScreeningResult {
  id: string
  examination_id: string
  ai_result: Json | null
  risk_level: RiskLevel | null
  clinician_notes: string | null
  recommendation: string | null
  finalized: boolean | null
  finalized_at: string | null
  finalized_by: string | null
  created_at: string | null
}
