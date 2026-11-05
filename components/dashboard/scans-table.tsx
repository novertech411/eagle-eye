'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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
import type { ScanRow, ScanStatus } from '@/lib/data'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 8

const statusStyles: Record<ScanStatus, { label: string; className: string }> = {
  awaiting: { label: 'Awaiting Review', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  referred: { label: 'Referred', className: 'bg-accent text-primary ring-primary/20' },
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function ScansTable({ scans }: { scans: ScanRow[] }) {
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scans
      .filter((s) => s.patient.toLowerCase().includes(q))
      .sort((a, b) => (newestFirst ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))
  }, [scans, query, newestFirst])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const firstRow = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastRow = Math.min(currentPage * PAGE_SIZE, filtered.length)

  return (
    <section className="rounded-2xl border border-border bg-card text-card-foreground">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
        <h2 className="text-base font-semibold">All scans</h2>
        <div className="relative w-full sm:w-72">
          <label htmlFor="scan-search" className="sr-only">
            Search patients by name
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="scan-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search patient name..."
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
                onClick={() => setNewestFirst((v) => !v)}
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
                    {dateFormatter.format(new Date(scan.date))}
                  </TableCell>
                  <TableCell className="font-medium">{scan.patient}</TableCell>
                  <TableCell>{scan.age}</TableCell>
                  <TableCell>{scan.eyes}</TableCell>
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
                      href={`/results?id=${scan.id}`}
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
          Showing {firstRow}–{lastRow} of {filtered.length}
        </p>
        <nav className="flex items-center gap-2" aria-label="Pagination">
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="min-w-16 text-center text-muted-foreground">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-lg"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </section>
  )
}
