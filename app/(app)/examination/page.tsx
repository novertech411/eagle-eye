import { TopBar } from '@/components/app-shell/top-bar'
import { ExaminationForm } from '@/components/examination/examination-form'

export const metadata = { title: 'Eye Examination — Eagle Lense' }

export default function ExaminationPage() {
  return (
    <div className="flex flex-col gap-5">
      <TopBar title="Eye Examination" subtitle="Register the patient, then capture retinal images." />
      <ExaminationForm />
    </div>
  )
}
