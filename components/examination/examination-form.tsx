'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Info,
  Phone,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Upload,
  Video,
} from 'lucide-react'
import { Panel } from '@/components/app-shell/top-bar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { samplePatient } from '@/lib/data'
import { cn } from '@/lib/utils'

const captureModes = [
  { id: 'photo', label: 'Take Photo', icon: Camera },
  { id: 'video', label: 'Record Video', icon: Video },
  { id: 'upload', label: 'Upload File', icon: Upload },
] as const

const frames = [
  'brightness-90',
  'brightness-100 saturate-110',
  'brightness-110',
  'brightness-95 hue-rotate-[-8deg]',
  'brightness-105 contrast-110',
]

const fieldClass = 'h-11 rounded-xl bg-white text-base md:text-sm'

function Required() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  )
}

export function ExaminationForm() {
  const router = useRouter()
  const [eye, setEye] = useState<'right' | 'left'>('right')
  const [mode, setMode] = useState<(typeof captureModes)[number]['id']>('video')
  const [frame, setFrame] = useState(2)
  const [consent, setConsent] = useState(true)

  const eyeLabel = eye === 'right' ? 'Right eye' : 'Left eye'
  const imageSrc = eye === 'right' ? '/images/fundus-right.png' : '/images/fundus-left.png'

  return (
    <form
      className="grid gap-5 xl:grid-cols-12"
      onSubmit={(e) => {
        e.preventDefault()
        router.push('/results')
      }}
    >
      <div className="flex flex-col gap-5 xl:col-span-5">
        <Panel title="Find existing patient">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="patient-search" className="sr-only">
                Search by name or phone number
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="patient-search"
                type="search"
                placeholder="Search by name or phone number"
                className={cn(fieldClass, 'pl-10')}
              />
            </div>
            <Button type="button" className="h-11 rounded-xl px-6 font-semibold">
              Search
            </Button>
          </div>
        </Panel>

        <Panel title="Patient details">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">
                  Name <Required />
                </Label>
                <Input id="name" required defaultValue={samplePatient.name} className={fieldClass} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="age">
                  Age <Required />
                </Label>
                <Input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={130}
                  required
                  defaultValue={samplePatient.age}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone number (optional)</Label>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="e.g. 0803 123 4567"
                  className={cn(fieldClass, 'pl-10')}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="symptoms">Brief symptoms or notes (optional)</Label>
              <Textarea
                id="symptoms"
                rows={3}
                defaultValue={samplePatient.symptoms}
                className="rounded-xl bg-white text-base md:text-sm"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-accent/60 px-4 py-3 text-sm">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} />
              Patient consents to screening.
            </label>
          </div>
        </Panel>

        <Panel title="Eye to capture" action={<span className="text-xs text-destructive">Required *</span>}>
          <RadioGroup
            value={eye}
            onValueChange={(v) => setEye(v as 'right' | 'left')}
            aria-label="Eye to capture"
            className="grid grid-cols-2 gap-3"
          >
            {(['right', 'left'] as const).map((value) => (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                  eye === value ? 'border-primary bg-accent text-accent-foreground' : 'border-border',
                )}
              >
                <RadioGroupItem value={value} />
                {value === 'right' ? 'Right eye' : 'Left eye'}
              </label>
            ))}
          </RadioGroup>
        </Panel>
      </div>

      <div className="flex flex-col gap-5 xl:col-span-7">
        <Panel title="Capture">
          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Capture method">
            {captureModes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                aria-pressed={mode === id}
                className={cn(
                  'flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border text-xs font-medium transition-colors sm:text-sm',
                  mode === id
                    ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'border-border bg-white hover:border-primary/50 hover:bg-accent/50',
                )}
              >
                <Icon className="size-6" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_14rem]">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-black lg:aspect-auto lg:h-80">
              <span className="absolute top-3 left-3 z-10 rounded-lg bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                {eyeLabel}
              </span>
              <Image
                src={imageSrc}
                alt={`${eyeLabel} retinal fundus capture, frame ${frame + 1}`}
                fill
                sizes="(min-width: 1024px) 480px, 100vw"
                className={cn('object-contain', frames[frame])}
              />
            </div>

            <div className="flex flex-col">
              <p className="text-sm font-semibold">Select video frame</p>
              <p className="text-xs text-muted-foreground">Frame {frame + 1} of {frames.length}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous frame"
                  onClick={() => setFrame((f) => Math.max(0, f - 1))}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border hover:bg-muted"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <div className="flex gap-2 overflow-x-auto py-1 lg:grid lg:grid-cols-2 lg:overflow-visible">
                  {frames.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFrame(i)}
                      aria-label={`Frame ${i + 1}`}
                      aria-pressed={frame === i}
                      className={cn(
                        'relative size-16 shrink-0 overflow-hidden rounded-xl bg-black ring-offset-2 transition',
                        frame === i ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100',
                      )}
                    >
                      <Image src={imageSrc} alt="" fill sizes="64px" className={cn('object-cover', f)} />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Next frame"
                  onClick={() => setFrame((f) => Math.min(frames.length - 1, f + 1))}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border hover:bg-muted"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Retake', icon: RefreshCw },
              { label: 'Replace', icon: Repeat },
              { label: eye === 'right' ? 'Add Left Eye' : 'Add Right Eye', icon: Plus },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={label.startsWith('Add') ? () => setEye(eye === 'right' ? 'left' : 'right') : undefined}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-white text-sm font-semibold text-primary hover:bg-accent"
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <p className="mt-5 flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Info className="size-4 shrink-0 text-blue-600" aria-hidden="true" />
            Use the retinal imaging adapter.
          </p>
        </Panel>

        <Button type="submit" disabled={!consent} className="h-14 rounded-2xl text-base font-bold">
          Submit Examination
        </Button>
      </div>
    </form>
  )
}
