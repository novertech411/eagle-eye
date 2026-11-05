'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Upload,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { scans } from '@/lib/data'
import { cn } from '@/lib/utils'

type Eye = 'right' | 'left'
type CaptureMode = 'photo' | 'video' | 'upload'

interface CapturedImage {
  src: string
  mode: CaptureMode
  frame: number
}

const captureModes = [
  { id: 'photo', label: 'Take Photo', icon: Camera },
  { id: 'video', label: 'Record Video', icon: Video },
  { id: 'upload', label: 'Upload File', icon: Upload },
] as const

const eyeImages: Record<Eye, string> = {
  right: '/images/fundus-right.png',
  left: '/images/fundus-left.png',
}

const frameFilters = [
  'brightness-90',
  'brightness-100 saturate-110',
  'brightness-110',
  'brightness-95 hue-rotate-[-8deg]',
  'brightness-105 contrast-110',
]

const eyeLabel = (eye: Eye) => (eye === 'right' ? 'Right eye' : 'Left eye')
const otherEye = (eye: Eye): Eye => (eye === 'right' ? 'left' : 'right')
const fieldClass = 'h-11 rounded-xl bg-white text-base md:text-sm'

function Required() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {' *'}
    </span>
  )
}

function StepSection({
  step,
  title,
  description,
  done,
  children,
}: {
  step: number
  title: string
  description: string
  done: boolean
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={`step-${step}-title`}
      className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6"
    >
      <header className="mb-5 flex items-start gap-3">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            done ? 'bg-primary text-primary-foreground' : 'bg-accent text-primary',
          )}
        >
          {done ? <Check className="size-4" aria-label="Complete" /> : step}
        </span>
        <div>
          <h2 id={`step-${step}-title`} className="text-base font-semibold">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

function Stepper({ steps }: { steps: { label: string; done: boolean }[] }) {
  const activeIndex = steps.findIndex((s) => !s.done)
  return (
    <ol className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 md:gap-4 md:p-4">
      {steps.map((s, i) => {
        const active = i === activeIndex
        return (
          <li key={s.label} className="flex flex-1 items-center gap-2 md:gap-4">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                s.done && 'bg-primary text-primary-foreground',
                active && 'bg-accent text-primary ring-2 ring-primary',
                !s.done && !active && 'bg-muted text-muted-foreground',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {s.done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={cn(
                'text-xs font-medium md:text-sm',
                s.done || active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 ? (
              <span className={cn('h-px flex-1', s.done ? 'bg-primary' : 'bg-border')} aria-hidden="true" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function EyePreview({
  eye,
  image,
  onRetake,
  onReplace,
  onFrameChange,
  large,
}: {
  eye: Eye
  image: CapturedImage
  onRetake: () => void
  onReplace: () => void
  onFrameChange: (frame: number) => void
  large: boolean
}) {
  return (
    <figure className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <Image
          src={image.src || '/placeholder.svg'}
          alt={`Retinal image of the ${eyeLabel(eye).toLowerCase()}`}
          width={800}
          height={800}
          className={cn(
            'mx-auto aspect-square w-full object-cover',
            large ? 'max-w-md' : 'max-w-xs',
            image.mode === 'video' && frameFilters[image.frame],
          )}
        />
        <figcaption className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary">
          {eyeLabel(eye)}
        </figcaption>
      </div>

      {image.mode === 'video' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-lg"
              onClick={() => onFrameChange(Math.max(0, image.frame - 1))}
              disabled={image.frame === 0}
              aria-label="Previous frame"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <div className="flex flex-1 gap-2 overflow-x-auto">
              {frameFilters.map((filter, i) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onFrameChange(i)}
                  aria-label={`Select frame ${i + 1}`}
                  aria-pressed={image.frame === i}
                  className={cn(
                    'relative size-12 shrink-0 overflow-hidden rounded-lg ring-2 transition',
                    image.frame === i ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100',
                  )}
                >
                  <Image src={image.src || '/placeholder.svg'} alt="" fill sizes="48px" className={cn('object-cover', filter)} />
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-lg"
              onClick={() => onFrameChange(Math.min(frameFilters.length - 1, image.frame + 1))}
              disabled={image.frame === frameFilters.length - 1}
              aria-label="Next frame"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground" aria-live="polite">
            Frame {image.frame + 1} of {frameFilters.length}
          </p>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onRetake}>
          <RefreshCw aria-hidden="true" />
          Retake
        </Button>
        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onReplace}>
          <Repeat aria-hidden="true" />
          Replace
        </Button>
      </div>
    </figure>
  )
}

export function ExaminationForm() {
  const router = useRouter()
  const [patientSearch, setPatientSearch] = useState('')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [consent, setConsent] = useState(false)

  const [activeEye, setActiveEye] = useState<Eye>('right')
  const [captures, setCaptures] = useState<Partial<Record<Eye, CapturedImage>>>({})
  const [capturing, setCapturing] = useState(true)

  const matches =
    patientSearch.trim().length > 1
      ? Array.from(new Map(scans.map((s) => [s.patient, s])).values())
          .filter((s) => s.patient.toLowerCase().includes(patientSearch.trim().toLowerCase()))
          .slice(0, 4)
      : []

  const capturedEyes = (Object.keys(captures) as Eye[]).filter((e) => captures[e])
  const bothCaptured = capturedEyes.length === 2
  const patientDone = name.trim() !== '' && age.trim() !== '' && consent
  const imagesDone = capturedEyes.length > 0
  const canSubmit = patientDone && imagesDone

  function capture(mode: CaptureMode) {
    setCaptures((prev) => ({ ...prev, [activeEye]: { src: eyeImages[activeEye], mode, frame: 2 } }))
    setCapturing(false)
  }

  function startCapture(eye: Eye) {
    setActiveEye(eye)
    setCapturing(true)
  }

  function updateFrame(eye: Eye, frame: number) {
    setCaptures((prev) => {
      const current = prev[eye]
      return current ? { ...prev, [eye]: { ...current, frame } } : prev
    })
  }

  const showCaptureControls = capturing || capturedEyes.length === 0

  return (
    <form
      className="mx-auto flex w-full max-w-4xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) router.push('/results')
      }}
    >
      <Stepper
        steps={[
          { label: 'Patient Details', done: patientDone },
          { label: 'Capture Images', done: imagesDone },
          { label: 'Submit', done: false },
        ]}
      />

      <StepSection
        step={1}
        title="Patient Details"
        description="Find an existing patient or enter new patient details."
        done={patientDone}
      >
        <div className="relative">
          <Label htmlFor="patient-search" className="sr-only">
            Find existing patient
          </Label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="patient-search"
            type="search"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Find existing patient by name or phone..."
            className={cn(fieldClass, 'pl-10')}
            autoComplete="off"
          />
          {matches.length > 0 ? (
            <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setName(m.patient)
                      setAge(String(m.age))
                      setPatientSearch('')
                    }}
                  >
                    <span className="font-medium">{m.patient}</span>
                    <span className="text-muted-foreground">Age {m.age}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or enter new patient
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              Name
              <Required />
            </Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="off"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="age">
              Age
              <Required />
            </Label>
            <Input
              id="age"
              required
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="phone">
              Phone number <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0803 123 4567"
              autoComplete="off"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="notes">
              Symptoms or notes <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brief description of symptoms"
              className="min-h-24 rounded-xl bg-white text-base md:text-sm"
            />
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-accent/60 p-4 sm:col-span-2">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              aria-required="true"
              className="mt-0.5"
            />
            <Label htmlFor="consent" className="leading-snug font-normal">
              <span>
                Patient consents to retinal screening
                <Required />
              </span>
            </Label>
          </div>
        </div>
      </StepSection>

      <StepSection
        step={2}
        title="Capture Retinal Images"
        description="Capture at least one eye. Both eyes are recommended."
        done={imagesDone}
      >
        {showCaptureControls ? (
          <div className="flex flex-col gap-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Eye to capture</legend>
              <div className="inline-flex rounded-xl bg-muted p-1">
                {(['right', 'left'] as const).map((e) => (
                  <label
                    key={e}
                    className={cn(
                      'cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition has-focus-visible:ring-2 has-focus-visible:ring-ring',
                      activeEye === e ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground',
                    )}
                  >
                    <input
                      type="radio"
                      name="eye"
                      value={e}
                      checked={activeEye === e}
                      onChange={() => setActiveEye(e)}
                      className="sr-only"
                    />
                    {eyeLabel(e)}
                    {captures[e] ? <Check className="ml-1.5 inline size-3.5" aria-label="captured" /> : null}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-3 gap-3">
              {captureModes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => capture(id)}
                  className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-accent/40 px-3 py-6 text-sm font-semibold text-primary transition hover:border-primary hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {label}
                </button>
              ))}
            </div>

            {capturedEyes.length > 0 ? (
              <Button type="button" variant="ghost" className="self-start" onClick={() => setCapturing(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className={cn('grid gap-5', bothCaptured && 'md:grid-cols-2')}>
              {capturedEyes.map((e) => {
                const image = captures[e]
                if (!image) return null
                return (
                  <EyePreview
                    key={e}
                    eye={e}
                    image={image}
                    large={!bothCaptured}
                    onRetake={() => capture(image.mode)}
                    onReplace={() => startCapture(e)}
                    onFrameChange={(f) => updateFrame(e, f)}
                  />
                )
              })}
            </div>
            {!bothCaptured ? (
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl border-dashed border-primary/40 text-primary hover:bg-accent hover:text-primary"
                onClick={() => startCapture(otherEye(capturedEyes[0]))}
              >
                <Plus aria-hidden="true" />
                Add {eyeLabel(otherEye(capturedEyes[0]))}
              </Button>
            ) : null}
          </div>
        )}

        <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
          Use the retinal imaging adapter for best results.
        </p>
      </StepSection>

      <StepSection
        step={3}
        title="Submit"
        description="Review the details above, then submit for analysis."
        done={false}
      >
        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-12 w-full rounded-xl text-base font-bold"
        >
          Submit Examination
        </Button>
        {!canSubmit ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Requires name, age, consent and at least one captured image.
          </p>
        ) : null}
      </StepSection>
    </form>
  )
}
