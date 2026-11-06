const FRAME_COUNT = 5
const JPEG_QUALITY = 0.92
const VIDEO_EVENT_TIMEOUT_MS = 10_000
const DURATION_LOOKUP_TIMEOUT_MS = 3_000

export function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

export function drawToCanvas(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available')
  context.drawImage(source, 0, 0, width, height)
  return canvas
}

// Re-encodes every image file as JPEG, which removes metadata such as GPS location.
export async function imageFileToJpeg(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    return await canvasToJpeg(drawToCanvas(bitmap, bitmap.width, bitmap.height))
  } finally {
    bitmap.close()
  }
}

function waitForVideoEvent(video: HTMLVideoElement, event: 'loadedmetadata' | 'seeked') {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer)
      video.removeEventListener(event, onEvent)
      video.removeEventListener('error', onError)
    }
    const onEvent = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Could not read video'))
    }
    const timer = setTimeout(onError, VIDEO_EVENT_TIMEOUT_MS)
    video.addEventListener(event, onEvent)
    video.addEventListener('error', onError)
  })
}

// Recorded WebM files often report an infinite duration until the browser seeks to the end.
async function resolveDuration(video: HTMLVideoElement, knownDuration?: number) {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration

  await new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer)
      video.removeEventListener('durationchange', onChange)
      resolve()
    }
    const onChange = () => {
      if (Number.isFinite(video.duration)) done()
    }
    const timer = setTimeout(done, DURATION_LOOKUP_TIMEOUT_MS)
    video.addEventListener('durationchange', onChange)
    video.currentTime = Number.MAX_SAFE_INTEGER
  })

  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration
  if (knownDuration && knownDuration > 0) return knownDuration
  throw new Error('Could not read video length')
}

// Returns evenly spaced JPEG frames, taken from the middle of each slice to avoid black first frames.
export async function extractVideoFrames(source: Blob, knownDuration?: number): Promise<Blob[]> {
  const url = URL.createObjectURL(source)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'

  try {
    const loaded = waitForVideoEvent(video, 'loadedmetadata')
    video.src = url
    await loaded
    if (!video.videoWidth || !video.videoHeight) throw new Error('Video has no picture')

    const duration = await resolveDuration(video, knownDuration)
    const frames: Blob[] = []
    for (let i = 0; i < FRAME_COUNT; i++) {
      const seeked = waitForVideoEvent(video, 'seeked')
      video.currentTime = (duration * (i + 0.5)) / FRAME_COUNT
      await seeked
      frames.push(await canvasToJpeg(drawToCanvas(video, video.videoWidth, video.videoHeight)))
    }
    return frames
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}
