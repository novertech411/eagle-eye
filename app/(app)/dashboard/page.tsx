import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Panel, TopBar } from '@/components/app-shell/top-bar'
import { ClinicLoadChart, OutcomeDonut, TrendChart, WeeklyChart } from '@/components/dashboard/charts'
import { MiniCalendar, PeriodChip, ProgressRing, QualityBars, StatBlock } from '@/components/dashboard/widgets'
import { examinationHistory } from '@/lib/data'

export const metadata = { title: 'Dashboard — Eagle Lense' }

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <TopBar title="Good morning, Dr. Ade" subtitle="Here's how screening is going across your clinics." />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
        <Panel title="Screenings" action={<PeriodChip label="Week" />} className="xl:col-span-3">
          <div className="flex flex-col gap-5">
            <StatBlock value="148" label="Patients screened" description="Up 18% from last week" trend="up" />
            <div className="h-px bg-border" />
            <StatBlock value="7" label="Awaiting review" description="Down from 12 last week" trend="down" />
          </div>
        </Panel>

        <Panel className="xl:col-span-3">
          <MiniCalendar />
        </Panel>

        <Panel title="Image quality" className="xl:col-span-3">
          <QualityBars />
        </Panel>

        <Panel title="Reviews" className="xl:col-span-3 xl:row-span-2">
          <ProgressRing value={75} />
          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">Referral outcomes</h3>
            <OutcomeDonut />
            <ul className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-highlight" />
                No referral
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                Referred
              </li>
            </ul>
          </div>
        </Panel>

        <Panel title="Screening trend" action={<PeriodChip label="6 months" />} className="md:col-span-2 xl:col-span-9">
          <TrendChart />
        </Panel>

        <Panel title="Clinic load" className="xl:col-span-4">
          <ClinicLoadChart />
        </Panel>

        <Panel title="This week" className="xl:col-span-4">
          <WeeklyChart />
        </Panel>

        <Panel
          title="Recent examinations"
          action={
            <Link
              href="/examination"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              New
            </Link>
          }
          className="md:col-span-2 xl:col-span-4"
        >
          <ul className="flex flex-col divide-y divide-border">
            {examinationHistory.map((e) => (
              <li key={e.id}>
                <Link href="/results" className="flex items-center gap-3 py-3 hover:opacity-80">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {e.patient
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.patient}</span>
                    <span className="block truncate text-xs text-muted-foreground">{e.notes}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{e.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
