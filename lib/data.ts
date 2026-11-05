export interface Patient {
  id: string
  name: string
  age: number
  phone?: string
  symptoms?: string
  consent: boolean
}

export interface RetinalImage {
  id: string
  examinationId: string
  eyeLabel: 'right' | 'left'
  imageUrl: string
  qualityStatus: 'suitable' | 'insufficient' | 'pending'
  selectedFrameIndex?: number
}

export interface Examination {
  id: string
  patientId: string
  patient: Patient
  date: string
  images: RetinalImage[]
  status: 'draft' | 'submitted' | 'analyzed' | 'finalized'
}

export interface ScreeningResult {
  examinationId: string
  aiResult: string | null
  clinicianNotes: string
  recommendation: string
  finalized: boolean
}

export const samplePatient: Patient = {
  id: 'p-001',
  name: 'Amina Musa',
  age: 48,
  phone: '',
  symptoms: 'Blurred vision, especially at near.',
  consent: true,
}

export const sampleExamination: Examination = {
  id: 'ex-1105',
  patientId: samplePatient.id,
  patient: samplePatient,
  date: '05 Nov 2026',
  status: 'submitted',
  images: [
    {
      id: 'img-r',
      examinationId: 'ex-1105',
      eyeLabel: 'right',
      imageUrl: '/images/fundus-right.png',
      qualityStatus: 'suitable',
      selectedFrameIndex: 2,
    },
    {
      id: 'img-l',
      examinationId: 'ex-1105',
      eyeLabel: 'left',
      imageUrl: '/images/fundus-left.png',
      qualityStatus: 'suitable',
    },
  ],
}

export const sampleResult: ScreeningResult = {
  examinationId: sampleExamination.id,
  aiResult: null,
  clinicianNotes: 'Retinal images captured for screening. No additional notes.',
  recommendation: 'Further ophthalmic evaluation recommended.',
  finalized: false,
}

export const examinationHistory = [
  { id: 'ex-1105', date: '05 Nov 2026', patient: 'Amina Musa', age: 48, notes: 'Sample examination' },
  { id: 'ex-1028', date: '28 Oct 2026', patient: 'Amina Musa', age: 48, notes: 'Routine screening' },
  { id: 'ex-1021', date: '21 Oct 2026', patient: 'Tunde Bello', age: 62, notes: 'Diabetic follow-up' },
  { id: 'ex-1014', date: '14 Oct 2026', patient: 'Grace Okafor', age: 55, notes: 'Hypertension check' },
]

export type ScanStatus = 'awaiting' | 'completed' | 'referred'

export interface ScanRow {
  id: string
  date: string
  patient: string
  age: number
  eyes: 'Both' | 'Right' | 'Left'
  status: ScanStatus
}

export const scans: ScanRow[] = [
  { id: 'ex-1105', date: '2026-11-05', patient: 'Amina Musa', age: 48, eyes: 'Both', status: 'awaiting' },
  { id: 'ex-1104', date: '2026-11-05', patient: 'Ibrahim Sani', age: 57, eyes: 'Both', status: 'completed' },
  { id: 'ex-1103', date: '2026-11-05', patient: 'Chioma Eze', age: 39, eyes: 'Right', status: 'completed' },
  { id: 'ex-1102', date: '2026-11-04', patient: 'Yusuf Abdullahi', age: 66, eyes: 'Both', status: 'referred' },
  { id: 'ex-1101', date: '2026-11-04', patient: 'Funke Adeyemi', age: 51, eyes: 'Left', status: 'awaiting' },
  { id: 'ex-1099', date: '2026-11-03', patient: 'Emeka Nwosu', age: 44, eyes: 'Both', status: 'completed' },
  { id: 'ex-1097', date: '2026-11-03', patient: 'Hauwa Garba', age: 60, eyes: 'Both', status: 'referred' },
  { id: 'ex-1094', date: '2026-11-02', patient: 'Segun Ojo', age: 35, eyes: 'Right', status: 'completed' },
  { id: 'ex-1090', date: '2026-11-01', patient: 'Zainab Lawal', age: 72, eyes: 'Both', status: 'awaiting' },
  { id: 'ex-1086', date: '2026-10-31', patient: 'Peter Okon', age: 58, eyes: 'Both', status: 'completed' },
  { id: 'ex-1081', date: '2026-10-30', patient: 'Maryam Bello', age: 47, eyes: 'Left', status: 'referred' },
  { id: 'ex-1077', date: '2026-10-29', patient: 'Daniel Akpan', age: 63, eyes: 'Both', status: 'completed' },
  { id: 'ex-1072', date: '2026-10-28', patient: 'Aisha Umar', age: 41, eyes: 'Both', status: 'completed' },
  { id: 'ex-1068', date: '2026-10-27', patient: 'Kelechi Obi', age: 54, eyes: 'Right', status: 'awaiting' },
  { id: 'ex-1061', date: '2026-10-25', patient: 'Ngozi Udeh', age: 69, eyes: 'Both', status: 'referred' },
  { id: 'ex-1055', date: '2026-10-24', patient: 'Tunde Bello', age: 62, eyes: 'Both', status: 'completed' },
  { id: 'ex-1049', date: '2026-10-22', patient: 'Grace Okafor', age: 55, eyes: 'Both', status: 'completed' },
]

export const weeklyScreenings = [
  { day: 'Mon', screenings: 18, referrals: 4 },
  { day: 'Tue', screenings: 26, referrals: 7 },
  { day: 'Wed', screenings: 21, referrals: 5 },
  { day: 'Thu', screenings: 32, referrals: 9 },
  { day: 'Fri', screenings: 28, referrals: 6 },
  { day: 'Sat', screenings: 14, referrals: 3 },
  { day: 'Sun', screenings: 9, referrals: 2 },
]

export const monthlyTrend = [
  { month: 'May', screenings: 210, referrals: 48 },
  { month: 'Jun', screenings: 260, referrals: 61 },
  { month: 'Jul', screenings: 240, referrals: 72 },
  { month: 'Aug', screenings: 310, referrals: 58 },
  { month: 'Sep', screenings: 290, referrals: 80 },
  { month: 'Oct', screenings: 360, referrals: 66 },
  { month: 'Nov', screenings: 340, referrals: 74 },
]

export const clinicLoad = [
  { clinic: 'Kano', normal: 42, referred: 14, pending: 8 },
  { clinic: 'Abuja', normal: 36, referred: 10, pending: 12 },
  { clinic: 'Lagos', normal: 50, referred: 18, pending: 6 },
  { clinic: 'Jos', normal: 24, referred: 8, pending: 10 },
]

export const outcomeSplit = [
  { name: 'No referral', value: 70 },
  { name: 'Referred', value: 30 },
]

export const qualityBreakdown = [
  { label: 'Suitable for review', value: 82 },
  { label: 'Needs retake', value: 12 },
  { label: 'Ungradable', value: 6 },
]
