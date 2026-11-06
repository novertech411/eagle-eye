import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, ImageOff, TriangleAlert } from 'lucide-react'
import { Panel, TopBar } from '@/components/app-shell/top-bar'
import { AiResultPanel } from '@/components/results/ai-result-panel'
import { ReportForm } from '@/components/results/report-form'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { parseStoredAnalysis } from '@/lib/ai-result'
import { formatDate, qualityLabels } from '@/lib/format'
import {
  getExamination,
  getOtherExaminations,
  getSignedImageUrls,
  latestImage,
} from '@/lib/supabase/queries'
import type { ExaminationStatus, EyeLabel } from '@/lib/supabase/types'

export const metadata = { title: 'Results & Report — Eagle Lense' }

const statusLabels: Record<ExaminationStatus, string> = {
  draft: 'Draft',
  submitted: 'Awaiting review',
  analyzed: 'Analyzed',
  finalized: 'Finalized',
}

const eyeSlots: { eye: EyeLabel; label: string }[] = [
  { eye: 'right', label: 'Right eye' },
  { eye: 'left', label: 'Left eye' },
]

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const examination = await getExamination(id)
  if (!examination) notFound()

  const { patient, images, result } = examination
  const [history, imageUrls] = await Promise.all([
    getOtherExaminations(patient.id, examination.id),
    getSignedImageUrls(images),
  ])

  return (
    <div className="flex flex-col gap-5">
      <TopBar title="Results & Report" />

      <Panel className="!py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <dl className="contents">
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
            {patient.phone ? (
              <>
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Phone:</dt>
                  <dd className="font-semibold">{patient.phone}</dd>
                </div>
                <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
              </>
            ) : null}
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Date:</dt>
              <dd className="font-semibold">{formatDate(examination.created_at)}</dd>
            </div>
          </dl>
          <Badge variant="outline" className="border-primary text-primary">
            {statusLabels[examination.status]}
          </Badge>
        </div>
        {examination.symptoms ? (
          <p className="mt-3 border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Symptoms or notes: </span>
            {examination.symptoms}
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-12">
        <Panel title="Retinal images" className="xl:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {eyeSlots.map(({ eye, label }) => {
              const image = latestImage(images, eye)
              const url = image ? imageUrls.get(image.storage_path) : undefined
              return (
                <figure key={eye} className="overflow-hidden rounded-2xl ring-1 ring-border">
                  <figcaption className="bg-gradient-to-r from-primary to-violet-500 px-4 py-2 text-sm font-semibold text-white">
                    {label}
                  </figcaption>
                  <div className="relative flex aspect-square items-center justify-center bg-black">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- temporary signed URL
                      <img
                        src={url}
                        alt={`${label} retinal image for ${patient.name}`}
                        className="size-full object-contain"
                      />
                    ) : (
                      <p className="flex flex-col items-center gap-2 px-4 text-center text-sm text-white/70">
                        <ImageOff className="size-6" aria-hidden="true" />
                        {image ? 'Image unavailable' : 'No image captured'}
                      </p>
                    )}
                  </div>
                  {image ? (
                    <p className="flex items-center gap-2 px-4 py-3 text-sm">
                      {image.quality_status === 'suitable' ? (
                        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
                      ) : (
                        <TriangleAlert
                          className="size-5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      {qualityLabels[image.quality_status]}
                    </p>
                  ) : null}
                </figure>
              )
            })}
          </div>
        </Panel>

        <div className="flex flex-col gap-5 xl:col-span-5">
          <Panel>
            <AiResultPanel
              examinationId={examination.id}
              status={examination.status}
              analysis={parseStoredAnalysis(result?.ai_result)}
            />
            <div className="mt-5">
              <ReportForm
                examinationId={examination.id}
                clinicianNotes={result?.clinician_notes ?? ''}
                recommendation={result?.recommendation ?? ''}
                finalized={examination.status === 'finalized'}
              />
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Examination history">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other examinations for this patient.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id} className="relative">
                    <TableCell>
                      {/* The link's overlay covers the row, so the whole row is one real link. */}
                      <Link
                        href={`/results/${row.id}`}
                        className="font-medium text-primary underline underline-offset-4 after:absolute after:inset-0"
                      >
                        {formatDate(row.created_at)}
                      </Link>
                    </TableCell>
                    <TableCell>{statusLabels[row.status]}</TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {row.symptoms ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <p className="rounded-2xl bg-accent px-5 py-4 text-sm italic text-accent-foreground">
        Screening supports clinical assessment and does not replace a comprehensive eye examination.
      </p>
    </div>
  )
}
