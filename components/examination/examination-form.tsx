'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { unstable_rethrow } from 'next/navigation'
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Upload,
  Video,
} from 'lucide-react'
import { completeExamination, createDraftExamination } from '@/app/(app)/examination/actions'
import { CameraCapture } from '@/components/camera-capture'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { extractVideoFrames, imageFileToJpeg } from '@/lib/capture-images'
import { createClient } from '@/lib/supabase/client'
import { containsPattern, quoteFilterValue } from '@/lib/supabase/search'
import type { EyeLabel as Eye, Patient } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

type PatientMatch = Pick<Patient, 'id' | 'name' | 'age' | 'phone'>
type PatientSearch = { term: string; matches: PatientMatch[]; failed: boolean }
type CameraMode = 'photo' | 'video'

interface Frame {
  blob: Blob
  url: string
}

// A photo or image file has one frame; a video has several for the user to choose from.
interface CapturedImage {
  frames: Frame[]
  frame: number
  fromVideo: boolean
  video?: Blob
}

// Remembers what is already saved, so retrying a failed submit doesn't save it twice.
interface SavedImage {
  path: string
  rowCreated: boolean
}

const DEFAULT_VIDEO_FRAME = 2

const eyeLabel = (eye: Eye) => (eye === 'right' ? 'Right eye' : 'Left eye')
const otherEye = (eye: Eye): Eye => (eye === 'right' ? 'left' : 'right')
const fieldClass = 'h-11 rounded-xl bg-white text-base md:text-sm'

function toFrames(blobs: Blob[]): Frame[] {
  return blobs.map((blob) => ({ blob, url: URL.createObjectURL(blob) }))
}

function revokeFrames(image: CapturedImage | undefined) {
  image?.frames.forEach((frame) => URL.revokeObjectURL(frame.url))
}

function ErrorMessage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive',
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}

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
  const hasFrames = image.frames.length > 1

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the captured image */}
        <img
          src={image.frames[image.frame].url}
          alt={`Retinal image of the ${eyeLabel(eye).toLowerCase()}`}
          className={cn('mx-auto aspect-square w-full object-contain', large ? 'max-w-md' : 'max-w-xs')}
        />
        <figcaption className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary">
          {eyeLabel(eye)}
        </figcaption>
      </div>

      {hasFrames ? (
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
            <div className="flex flex-1 gap-2 overflow-x-auto p-0.5">
              {image.frames.map((frame, i) => (
                <button
                  key={frame.url}
                  type="button"
                  onClick={() => onFrameChange(i)}
                  aria-label={`Select frame ${i + 1}`}
                  aria-pressed={image.frame === i}
                  className={cn(
                    'relative size-12 shrink-0 overflow-hidden rounded-lg ring-2 transition',
                    image.frame === i ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local video frame */}
                  <img src={frame.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-lg"
              onClick={() => onFrameChange(Math.min(image.frames.length - 1, image.frame + 1))}
              disabled={image.frame === image.frames.length - 1}
              aria-label="Next frame"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground" aria-live="polite">
            Frame {image.frame + 1} of {image.frames.length}
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
  const [patientSearch, setPatientSearch] = useState('')
  const [searchResult, setSearchResult] = useState<PatientSearch | null>(null)
  const [existingPatientId, setExistingPatientId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState('')
  const [isSubmitting, startSubmit] = useTransition()
  const [examinationId, setExaminationId] = useState<string | null>(null)
  const savedImages = useRef<Partial<Record<Eye, SavedImage>>>({})
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [consent, setConsent] = useState(false)

  const [activeEye, setActiveEye] = useState<Eye>('right')
  const [captures, setCaptures] = useState<Partial<Record<Eye, CapturedImage>>>({})
  const [capturing, setCapturing] = useState(true)
  const [cameraMode, setCameraMode] = useState<CameraMode | null>(null)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const uploadEye = useRef<Eye>('right')

  // Release image memory when leaving the page.
  const latestCaptures = useRef(captures)
  useEffect(() => {
    latestCaptures.current = captures
  }, [captures])
  useEffect(
    () => () => {
      revokeFrames(latestCaptures.current.right)
      revokeFrames(latestCaptures.current.left)
    },
    [],
  )

  const searchTerm = patientSearch.trim()

  useEffect(() => {
    if (searchTerm.length < 2) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const value = quoteFilterValue(containsPattern(searchTerm))
      const { data, error } = await createClient()
        .from('patients')
        .select('id, name, age, phone')
        .or(`name.ilike.${value},phone.ilike.${value}`)
        .order('name')
        .limit(5)
      if (cancelled) return
      setSearchResult({ term: searchTerm, matches: data ?? [], failed: Boolean(error) })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchTerm])

  // Ignore a result that belongs to an earlier search term.
  const currentSearch = searchTerm.length >= 2 && searchResult?.term === searchTerm ? searchResult : null

  function selectPatient(patient: PatientMatch) {
    setExistingPatientId(patient.id)
    setName(patient.name)
    setAge(String(patient.age))
    setPhone(patient.phone ?? '')
    setPatientSearch('')
  }

  function clearExistingPatient() {
    setExistingPatientId(null)
    setName('')
    setAge('')
    setPhone('')
  }

  const capturedEyes = (['right', 'left'] as const).filter((e) => captures[e])
  const bothCaptured = capturedEyes.length === 2
  const patientDone = name.trim() !== '' && age.trim() !== '' && consent
  const imagesDone = capturedEyes.length > 0
  const canSubmit = patientDone && imagesDone
  // Once the draft exists, the details can't change: a retry only finishes saving the images.
  const locked = examinationId !== null

  function storeCapture(eye: Eye, image: CapturedImage) {
    setCaptures((prev) => {
      revokeFrames(prev[eye])
      return { ...prev, [eye]: image }
    })
    setCameraMode(null)
    setCapturing(false)
    setCaptureError(null)
  }

  function storePhoto(eye: Eye, blob: Blob) {
    storeCapture(eye, { frames: toFrames([blob]), frame: 0, fromVideo: false })
  }

  async function storeVideo(eye: Eye, video: Blob, durationSeconds?: number) {
    setCameraMode(null)
    setCaptureError(null)
    setProcessing(true)
    try {
      const blobs = await extractVideoFrames(video, durationSeconds)
      storeCapture(eye, {
        frames: toFrames(blobs),
        frame: DEFAULT_VIDEO_FRAME,
        fromVideo: true,
        video,
      })
    } catch {
      setCaptureError("Couldn't read frames from this video. Try another file or use Take Photo.")
    } finally {
      setProcessing(false)
    }
  }

  async function handleFile(file: File) {
    const eye = uploadEye.current
    if (file.type.startsWith('video/')) {
      await storeVideo(eye, file)
      return
    }
    setCaptureError(null)
    setProcessing(true)
    try {
      storePhoto(eye, await imageFileToJpeg(file))
    } catch {
      setCaptureError("Couldn't read this file. Choose a JPEG or PNG image, or a video.")
    } finally {
      setProcessing(false)
    }
  }

  function openFilePicker(eye: Eye) {
    uploadEye.current = eye
    setCaptureError(null)
    fileInput.current?.click()
  }

  function openCamera(eye: Eye, mode: CameraMode) {
    setActiveEye(eye)
    setCapturing(true)
    setCaptureError(null)
    setCameraMode(mode)
  }

  function startCapture(eye: Eye) {
    setActiveEye(eye)
    setCapturing(true)
    setCaptureError(null)
  }

  function cancelCamera() {
    setCameraMode(null)
    if (capturedEyes.length > 0) setCapturing(false)
  }

  function updateFrame(eye: Eye, frame: number) {
    setCaptures((prev) => {
      const current = prev[eye]
      return current ? { ...prev, [eye]: { ...current, frame } } : prev
    })
  }

  // Uploads directly from the browser, because images are too large for a server action.
  // Returns an error message, or null when every image is saved.
  async function saveImages(id: string) {
    const supabase = createClient()

    for (const eye of capturedEyes) {
      const image = captures[eye]
      if (!image) continue
      const label = eyeLabel(eye).toLowerCase()
      let saved = savedImages.current[eye]

      if (!saved) {
        setSubmitStatus(`Uploading ${label} image…`)
        const path = `${id}/${eye}_${Date.now()}.jpg`
        const { error } = await supabase.storage
          .from('retinal-images')
          .upload(path, image.frames[image.frame].blob, { contentType: 'image/jpeg' })
        if (error) {
          console.error('Uploading image failed:', error.message)
          return `Couldn't upload the ${label} image. Check your connection and try again.`
        }
        saved = { path, rowCreated: false }
        savedImages.current[eye] = saved
      }

      if (!saved.rowCreated) {
        const { error } = await supabase.from('retinal_images').insert({
          examination_id: id,
          eye,
          storage_path: saved.path,
          is_from_video: image.fromVideo,
          frame_index: image.fromVideo ? image.frame : null,
        })
        if (error) {
          console.error('Saving image record failed:', error.message)
          return `Couldn't save the ${label} image. Please try again.`
        }
        saved.rowCreated = true
      }
    }
    return null
  }

  async function submit() {
    try {
      let id = examinationId
      if (!id) {
        setSubmitStatus('Saving patient details…')
        const draft = await createDraftExamination({
          patientId: existingPatientId,
          name,
          age,
          phone,
          symptoms: notes,
          consent,
        })
        if ('error' in draft) {
          setSubmitError(draft.error)
          return
        }
        id = draft.examinationId
        setExaminationId(id)
      }

      const imageError = await saveImages(id)
      if (imageError) {
        setSubmitError(imageError)
        return
      }

      setSubmitStatus('Finishing up…')
      const result = await completeExamination(id)
      setSubmitError(result.error)
    } catch (error) {
      // A successful submit redirects by throwing, and Next must receive that error.
      unstable_rethrow(error)
      setSubmitError("Couldn't reach the server. Check your connection and try again.")
    }
  }

  const showCaptureControls = capturing || capturedEyes.length === 0

  return (
    <form
      className="mx-auto flex w-full max-w-4xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit || isSubmitting || processing || cameraMode) return
        setSubmitError(null)
        startSubmit(submit)
      }}
    >
      <Stepper
        steps={[
          { label: 'Patient Details', done: patientDone },
          { label: 'Capture Images', done: imagesDone },
          { label: 'Submit', done: false },
        ]}
      />

      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*"
        aria-label="Upload a retinal image or video"
        className="sr-only"
        tabIndex={-1}
        disabled={locked}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void handleFile(file)
        }}
      />

      <fieldset disabled={locked} className="contents">
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
            {currentSearch ? (
              <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                {currentSearch.failed ? (
                  <li className="px-4 py-2.5 text-sm text-destructive">
                    Couldn&rsquo;t search patients. Please try again.
                  </li>
                ) : currentSearch.matches.length === 0 ? (
                  <li className="px-4 py-2.5 text-sm text-muted-foreground">No matching patients.</li>
                ) : (
                  currentSearch.matches.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-accent"
                        onClick={() => selectPatient(m)}
                      >
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">
                          {m.phone ? `${m.phone} · ` : ''}Age {m.age}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>

          {existingPatientId ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-accent/60 px-4 py-3 text-sm">
              <p>Using an existing patient. Changes below will update their record.</p>
              <Button type="button" variant="ghost" size="sm" onClick={clearExistingPatient}>
                Clear
              </Button>
            </div>
          ) : null}

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
                disabled={locked}
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
              <fieldset disabled={cameraMode !== null || processing}>
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

              {cameraMode ? (
                <CameraCapture
                  key={`${activeEye}-${cameraMode}`}
                  mode={cameraMode}
                  onPhoto={(blob) => storePhoto(activeEye, blob)}
                  onVideo={(video, seconds) => void storeVideo(activeEye, video, seconds)}
                  onCancel={cancelCamera}
                />
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => openCamera(activeEye, 'photo')}
                      className={captureButtonClass}
                    >
                      <CaptureIcon icon={Camera} />
                      Take Photo
                    </button>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => openCamera(activeEye, 'video')}
                      className={captureButtonClass}
                    >
                      <CaptureIcon icon={Video} />
                      Record Video
                    </button>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => openFilePicker(activeEye)}
                      className={captureButtonClass}
                    >
                      <CaptureIcon icon={Upload} />
                      Upload File
                    </button>
                  </div>

                  {capturedEyes.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="self-start"
                      onClick={() => setCapturing(false)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </>
              )}
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
                      onRetake={() => openCamera(e, image.fromVideo ? 'video' : 'photo')}
                      onReplace={() => openFilePicker(e)}
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

          {processing ? (
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Preparing image…
            </p>
          ) : null}
          {captureError ? <ErrorMessage className="mt-5">{captureError}</ErrorMessage> : null}

          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Use the retinal imaging adapter for best results.
          </p>
        </StepSection>
      </fieldset>

      <StepSection
        step={3}
        title="Submit"
        description="Review the details above, then submit for analysis."
        done={false}
      >
        <Button
          type="submit"
          disabled={!canSubmit || isSubmitting || processing || cameraMode !== null}
          className="h-12 w-full rounded-xl text-base font-bold"
        >
          {isSubmitting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
          {locked && !isSubmitting ? 'Retry Submit' : 'Submit Examination'}
        </Button>
        {isSubmitting ? (
          <p className="mt-3 text-center text-xs text-muted-foreground" role="status">
            {submitStatus}
          </p>
        ) : null}
        {!canSubmit ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Requires name, age, consent and at least one captured image.
          </p>
        ) : null}
        {submitError ? <ErrorMessage className="mt-3">{submitError}</ErrorMessage> : null}
      </StepSection>
    </form>
  )
}

const captureButtonClass =
  'flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-accent/40 px-3 py-6 text-sm font-semibold text-primary transition hover:border-primary hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-50'

function CaptureIcon({ icon: Icon }: { icon: typeof Camera }) {
  return (
    <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}
