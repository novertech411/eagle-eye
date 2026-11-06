'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CircleAlert, Loader2, Square, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { canvasToJpeg, drawToCanvas } from '@/lib/capture-images'

const MAX_RECORDING_SECONDS = 15
const RECORDING_TYPES = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4']
const RECORDING_BITRATE = 8_000_000

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('insecure-context')
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
    })
  } catch (error) {
    // Devices that can't meet the preferred settings fall back to any available camera.
    const name = error instanceof DOMException ? error.name : ''
    if (name === 'OverconstrainedError' || name === 'NotFoundError') {
      return navigator.mediaDevices.getUserMedia({ video: true })
    }
    throw error
  }
}

function cameraErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === 'insecure-context') {
    return 'The camera only works over a secure (HTTPS) connection. Use Upload File instead.'
  }
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera access was blocked. Allow the camera in your browser’s site settings and try again, or use Upload File instead.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera was found on this device. Use Upload File instead.'
  }
  if (name === 'NotReadableError') {
    return 'The camera is being used by another app. Close it and try again.'
  }
  return "Couldn't start the camera. Please try again."
}

function formatSeconds(seconds: number) {
  return `0:${String(seconds).padStart(2, '0')}`
}

export function CameraCapture({
  mode,
  onPhoto,
  onVideo,
  onCancel,
}: {
  mode: 'photo' | 'video'
  onPhoto: (image: Blob) => void
  onVideo: (video: Blob, durationSeconds: number) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let cancelled = false

    openCamera()
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch((cameraError) => {
        if (!cancelled) setError(cameraErrorMessage(cameraError))
      })

    return () => {
      cancelled = true
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null
        recorder.stop()
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!recording) return
    const startedAt = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.min(
        MAX_RECORDING_SECONDS,
        Math.floor((Date.now() - startedAt) / 1000),
      )
      setSeconds(elapsed)
      if (elapsed >= MAX_RECORDING_SECONDS) recorderRef.current?.stop()
    }, 200)
    return () => clearInterval(timer)
  }, [recording])

  async function takePhoto() {
    const video = videoRef.current
    if (!video) return
    try {
      onPhoto(await canvasToJpeg(drawToCanvas(video, video.videoWidth, video.videoHeight)))
    } catch {
      setError("Couldn't capture the image. Please try again.")
    }
  }

  function startRecording() {
    const stream = streamRef.current
    if (!stream) return
    if (typeof MediaRecorder === 'undefined') {
      setError("This browser can't record video. Use Take Photo or Upload File instead.")
      return
    }

    const mimeType = RECORDING_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: RECORDING_BITRATE,
    })
    const chunks: Blob[] = []
    const startedAt = Date.now()

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      setRecording(false)
      const durationSeconds = (Date.now() - startedAt) / 1000
      const video = new Blob(chunks, { type: recorder.mimeType || mimeType })
      if (video.size === 0) {
        setError("Couldn't record video. Please try again.")
        return
      }
      onVideo(video, durationSeconds)
    }

    recorderRef.current = recorder
    recorder.start()
    setSeconds(0)
    setRecording(true)
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
        <Button type="button" variant="outline" className="self-start rounded-xl" onClick={onCancel}>
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => setReady(true)}
          aria-label="Live camera view"
          className="aspect-video w-full object-contain"
        />
        {!ready ? (
          <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Starting camera…
          </p>
        ) : null}
        {recording ? (
          <p
            role="timer"
            className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white tabular-nums"
          >
            <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
            {formatSeconds(seconds)} / {formatSeconds(MAX_RECORDING_SECONDS)}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        {mode === 'photo' ? (
          <Button
            type="button"
            disabled={!ready}
            className="h-12 flex-1 rounded-xl text-base font-semibold"
            onClick={() => void takePhoto()}
          >
            <Camera aria-hidden="true" />
            Capture
          </Button>
        ) : recording ? (
          <Button
            type="button"
            variant="destructive"
            className="h-12 flex-1 rounded-xl text-base font-semibold"
            onClick={() => recorderRef.current?.stop()}
          >
            <Square aria-hidden="true" />
            Stop Recording
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!ready}
            className="h-12 flex-1 rounded-xl text-base font-semibold"
            onClick={startRecording}
          >
            <Video aria-hidden="true" />
            Start Recording
          </Button>
        )}
        <Button type="button" variant="outline" className="h-12 rounded-xl" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
