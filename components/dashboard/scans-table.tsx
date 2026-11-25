'use client'

import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatTime, initials } from '@/lib/format'
import type { ScanFilter, ScanRow, ScanStatus } from '@/lib/supabase/queries'

const PAGE_SIZE = 10
const SEARCH_DELAY_MS = 300

const filters = [
  { id: 'all', label: 'All' },
  { id: 'referred', label: 'Referred' },
  { id: 'analysed', label: 'Analysed' },
  { id: 'awaiting', label: 'Awaiting review' },
] as const

const statusLabels: Record<ScanStatus, string> = {
  draft: 'Draft',
  awaiting: 'Awaiting review',
  analyzed: 'Analysed',
  completed: 'Completed',
  referred: 'Referred',
}

type ScanNavigation = { query: string; page: number; newestFirst: boolean; status: ScanFilter | undefined }

function dashboardUrl({ query, page, newestFirst, status }: ScanNavigation) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (page > 1) params.set('page', String(page))
  if (!newestFirst) params.set('sort', 'oldest')
  if (status) params.set('status', status)
  const search = params.toString()
  return search ? `/dashboard?${search}` : '/dashboard'
}

function EyeChip({ right, included }: { right?: boolean; included: boolean }) {
  return (
    <span className="scan-eye" data-included={included}>
      <span aria-hidden="true">{right ? 'OD' : 'OS'}</span>
      <span className="sr-only">{right ? 'Right eye' : 'Left eye'} {included ? 'included' : 'not included'}</span>
    </span>
  )
}

export function ScansTable({
  rows, total, page, pageCount, query, newestFirst, status, counts,
}: ScanNavigation & {
  rows: ScanRow[]
  total: number
  pageCount: number
  counts: Record<ScanFilter | 'all', number>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [navigation, setNavigation] = useOptimistic({ query, page, newestFirst, status })
  const [draft, setDraft] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const search = draft ?? navigation.query
  const SortIcon = navigation.newestFirst ? ArrowDown : ArrowUp

  useEffect(() => () => clearTimeout(searchTimer.current), [])

  function navigate(next: ScanNavigation) {
    clearTimeout(searchTimer.current)
    searchTimer.current = undefined
    startTransition(() => {
      setNavigation(next)
      router.replace(dashboardUrl(next), { scroll: false })
    })
  }

  function updateSearch(value: string) {
    setDraft(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      searchTimer.current = undefined
      if (value.trim() !== navigation.query) {
        navigate({ ...navigation, query: value.trim(), page: 1 })
      }
    }, SEARCH_DELAY_MS)
  }

  function changeView(changes: Partial<ScanNavigation>) {
    const term = search.trim()
    navigate({
      ...navigation,
      ...changes,
      query: term,
      page: term === navigation.query ? (changes.page ?? 1) : 1,
    })
  }

  // Preserve in-progress typing while accepting URL changes from outside the table.
  useEffect(() => {
    if (!isPending && searchTimer.current === undefined) {
      setDraft((value) => value?.trim() === query ? value : null)
    }
  }, [isPending, query])

  // Back and forward can change the history entry without changing the query.
  useEffect(() => {
    function resetSearch() {
      clearTimeout(searchTimer.current)
      searchTimer.current = undefined
      setDraft(null)
    }
    window.addEventListener('popstate', resetSearch)
    return () => window.removeEventListener('popstate', resetSearch)
  }, [])

  const firstRow = (page - 1) * PAGE_SIZE + 1
  const lastRow = Math.min(page * PAGE_SIZE, total)

  return (
    <section className="dashboard-card scans-card" aria-labelledby="scans-title">
      <div className="scans-toolbar">
        <div className="scans-toolbar-group">
          <h2 id="scans-title">All scans</h2>
          <div className="scan-filters" role="group" aria-label="Scan status">
            {filters.map(({ id, label }) => {
              const selected = (navigation.status ?? 'all') === id
              return (
                <button key={id} type="button" aria-pressed={selected}
                  onClick={() => changeView({ status: id === 'all' ? undefined : id })}>
                  {label}<span>{counts[id]}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="scan-search">
          <Search size={15} aria-hidden="true" />
          <label className="sr-only" htmlFor="scan-search">Search scans by patient name or phone</label>
          <Input id="scan-search" type="search" placeholder="Search name or phone"
            value={search} onChange={(event) => updateSearch(event.target.value)} />
        </div>
      </div>

      <div aria-busy={isPending}>
        <Table className="scans-table" aria-labelledby="scans-title">
          <colgroup>
            <col className="scan-col-date" /><col className="scan-col-patient" />
            <col className="scan-col-age" /><col className="scan-col-eyes" />
            <col className="scan-col-status" /><col className="scan-col-action" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" aria-sort={newestFirst ? 'descending' : 'ascending'}>
                <button type="button" className="scan-sort" disabled={isPending}
                  aria-label={navigation.newestFirst ? 'Sort by oldest date first' : 'Sort by newest date first'}
                  onClick={() => changeView({ newestFirst: !navigation.newestFirst })}>
                  Date <SortIcon size={11} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </TableHead>
              <TableHead scope="col">Patient</TableHead>
              <TableHead scope="col">Age</TableHead>
              <TableHead scope="col">Eyes</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((scan) => (
              <TableRow key={scan.id}>
                <TableCell className="tabular-nums">
                  {formatDate(scan.createdAt)}
                  {scan.createdAt && <span className="scan-time">{formatTime(scan.createdAt)}</span>}
                </TableCell>
                <TableCell>
                  <div className="scan-patient">
                    <span aria-hidden="true">{initials(scan.patient)}</span>
                    <span>{scan.patient}</span>
                  </div>
                </TableCell>
                <TableCell className="scan-age">{scan.age}</TableCell>
                <TableCell>
                  <div className="scan-eyes">
                    <EyeChip right included={scan.eyes === 'Both' || scan.eyes === 'Right'} />
                    <EyeChip included={scan.eyes === 'Both' || scan.eyes === 'Left'} />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="scan-status" data-status={scan.status}>{statusLabels[scan.status]}</span>
                </TableCell>
                <TableCell>
                  <Link href={`/results/${scan.id}`} className="scan-report">
                    View report <span className="sr-only">for {scan.patient}</span>
                    <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && <p className="scans-no-results">No scans match this filter.</p>}

        <div className="scans-footer">
          <p>Showing {total ? `${firstRow}–${lastRow}` : '0'} of {total}</p>
          <nav aria-label="Pagination">
            <button type="button" aria-label="Previous page" disabled={isPending || page === 1}
              onClick={() => changeView({ page: page - 1 })}>
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
            <span>Page {page} of {pageCount}</span>
            <button type="button" aria-label="Next page" disabled={isPending || page === pageCount}
              onClick={() => changeView({ page: page + 1 })}>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </section>
  )
}
