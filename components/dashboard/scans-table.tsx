'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/format'
import type { ScanRow, ScanStatus } from '@/lib/supabase/queries'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10
const SEARCH_DELAY_MS = 300

const statusStyles: Record<ScanStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground ring-border' },
  awaiting: { label: 'Awaiting Review', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  analyzed: { label: 'Analyzed', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  referred: { label: 'Referred', className: 'bg-accent text-primary ring-primary/20' },
}

function dashboardUrl(query: string, page: number, newestFirst: boolean) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (page > 1) params.set('page', String(page))
  if (!newestFirst) params.set('sort', 'oldest')
  const search = params.toString()
  return search ? `/dashboard?${search}` : '/dashboard'
}

export function ScansTable({
  rows,
  total,
  page,
  pageCount,
  query,
  newestFirst,
}: {
  rows: ScanRow[]
  total: number
  page: number
  pageCount: number
  query: string
  newestFirst: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(query)

  const navigate = (url: string) => startTransition(() => router.replace(url, { scroll: false }))

  useEffect(() => {
    if (search.trim() === query.trim()) return
    const timer = setTimeout(() => navigate(dashboardUrl(search, 1, newestFirst)), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
    // Only a change to the search text should schedule a new search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastRow = Math.min(page * PAGE_SIZE, total)

  return (
    <section
      aria-busy={isPending}
      className="rounded-2xl border border-border bg-card text-card-foreground"
    >
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
        <h2 className="text-base font-semibold">All scans</h2>
        <div className="relative w-full sm:w-72">
          <label htmlFor="scan-search" className="sr-only">
            Search patients by name or phone
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="scan-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="h-10 rounded-xl bg-white pl-9 text-base md:text-sm"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4 md:pl-5">
              <button
                type="button"
                onClick={() => navigate(dashboardUrl(query, 1, !newestFirst))}
                className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                aria-label={`Sort by date, currently ${newestFirst ? 'newest first' : 'oldest first'}`}
              >
                Date
                {newestFirst ? (
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                ) : (
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                )}
              </button>
            </TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Eye(s)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right md:pr-5">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No patients match &ldquo;{query}&rdquo;.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((scan) => {
              const status = statusStyles[scan.status]
              return (
                <TableRow key={scan.id}>
                  <TableCell className="pl-4 text-muted-foreground md:pl-5">
                    {formatDate(scan.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{scan.patient}</TableCell>
                  <TableCell>{scan.age}</TableCell>
                  <TableCell>{scan.eyes ?? '—'}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right md:pr-5">
                    <Link
                      href={`/results/${scan.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-lg')}
                    >
                      View<span className="sr-only"> scan for {scan.patient}</span>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-3 border-t border-border p-4 text-sm md:px-5">
        <p className="text-muted-foreground">
          Showing {firstRow}–{lastRow} of {total}
        </p>
        <nav className="flex items-center gap-2" aria-label="Pagination">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            onClick={() => navigate(dashboardUrl(query, page - 1, newestFirst))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="min-w-16 text-center text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            onClick={() => navigate(dashboardUrl(query, page + 1, newestFirst))}
            disabled={page === pageCount}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </section>
  )
}
