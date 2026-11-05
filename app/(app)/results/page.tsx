import Image from 'next/image'
import { CheckCircle2, Sparkles } from 'lucide-react'
import { Panel, TopBar } from '@/components/app-shell/top-bar'
import { ReportForm } from '@/components/results/report-form'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { examinationHistory, sampleExamination, sampleResult } from '@/lib/data'

export const metadata = { title: 'Results & Report — Eagle Lense' }

export default function ResultsPage() {
  const { patient, date, images } = sampleExamination

  return (
    <div className="flex flex-col gap-5">
      <TopBar title="Results & Report" />

      <Panel className="!py-4">
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Patient:</dt>
            <dd className="font-semibold">{patient.name}</dd>
          </div>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Age:</dt>
            <dd className="font-semibold">{patient.age}</dd>
          </div>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Date:</dt>
            <dd className="font-semibold">{date}</dd>
          </div>
          <Badge variant="outline" className="border-primary text-primary">
            Sample examination
          </Badge>
        </dl>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-12">
        <Panel title="Retinal images" className="xl:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((img) => {
              const label = img.eyeLabel === 'right' ? 'Right eye' : 'Left eye'
              return (
                <figure key={img.id} className="overflow-hidden rounded-2xl ring-1 ring-border">
                  <figcaption className="bg-gradient-to-r from-primary to-violet-500 px-4 py-2 text-sm font-semibold text-white">
                    {label}
                  </figcaption>
                  <div className="relative aspect-square bg-black">
                    <Image
                      src={img.imageUrl}
                      alt={`${label} retinal fundus image for ${patient.name}`}
                      fill
                      sizes="(min-width: 640px) 320px, 100vw"
                      className="object-contain"
                    />
                  </div>
                </figure>
              )
            })}
          </div>
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-foreground">
            <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
            Image quality: Suitable for review.
          </p>
        </Panel>

        <div className="flex flex-col gap-5 xl:col-span-5">
          <Panel>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-accent px-4 py-4">
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                AI screening result
              </p>
              <p className="font-semibold italic text-primary">
                {sampleResult.aiResult ?? 'Awaiting analysis'}
              </p>
            </div>
            <div className="mt-5">
              <ReportForm />
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Examination history">
        <div className="overflow-x-auto">
          <Table className="min-w-[520px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examinationHistory.map((row) => (
                <TableRow key={row.id} className="cursor-pointer hover:bg-accent/50">
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="font-medium">{row.patient}</TableCell>
                  <TableCell>{row.age}</TableCell>
                  <TableCell className="text-muted-foreground">{row.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <p className="rounded-2xl bg-accent px-5 py-4 text-sm italic text-accent-foreground">
        Screening supports clinical assessment and does not replace a comprehensive eye examination.
      </p>
    </div>
  )
}
