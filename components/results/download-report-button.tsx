'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

const DOWNLOAD_ERROR = "Couldn't generate the report. Please try again."

export function DownloadReportButton({
  examinationId,
  disabled,
  className,
  onError,
}: {
  examinationId: string
  disabled: boolean
  className?: string
  onError: (message: string | null) => void
}) {
  const [loading, setLoading] = useState(false)

  async function download() {
    setLoading(true)
    onError(null)
    try {
      const response = await fetch(`/api/report/${examinationId}`)
      if (!response.ok) {
        onError(
          response.status === 401
            ? 'Your session has expired. Please sign in again.'
            : DOWNLOAD_ERROR,
        )
        return
      }

      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download =
        response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        'screening-report.pdf'
      link.click()
      // Some browsers start the download after this tick, so the URL can't be revoked straight away.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      onError("Couldn't reach the server. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      title={disabled ? 'Finalize report to enable download' : undefined}
      aria-busy={loading}
      onClick={() => void download()}
      className={className}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="size-4" aria-hidden="true" />
      )}
      {loading ? 'Generating…' : 'Download Report'}
    </button>
  )
}
