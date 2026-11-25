'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { BrandMark } from '@/components/brand'
import { isActive, navItems } from './nav'

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const focusRequested = useRef(false)
  const observer = useRef<MutationObserver | null>(null)

  const focusDashboard = useCallback(() => {
    observer.current?.disconnect()
    const focusTarget = () => {
      const target = document.getElementById('scan-search')
        ?? document.getElementById('dashboard-empty')
      if (!target) return false
      target.focus()
      focusRequested.current = false
      return true
    }
    if (focusTarget()) return
    observer.current = new MutationObserver(() => {
      if (focusTarget()) observer.current?.disconnect()
    })
    const main = document.querySelector('main')
    if (main) observer.current.observe(main, { childList: true, subtree: true })
  }, [])

  const jump = useCallback(() => {
    focusRequested.current = true
    if (pathname === '/dashboard') focusDashboard()
    else router.push('/dashboard')
  }, [pathname, router, focusDashboard])

  useEffect(() => {
    if (pathname === '/dashboard' && focusRequested.current) focusDashboard()
    return () => observer.current?.disconnect()
  }, [pathname, focusDashboard])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (!event.repeat) jump()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [jump])

  const section = navItems.find(({ href }) => isActive(pathname, href))?.label

  return (
    <header className="clinic-top-bar">
      <BrandMark className="md:hidden" />
      <nav aria-label="Breadcrumb" className="clinic-breadcrumb">
        <span>Eagle Lense</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{section}</span>
      </nav>
      <button type="button" className="clinic-jump" onClick={jump} aria-label="Jump to patient"
        aria-keyshortcuts="Meta+K Control+K">
        <Search size={15} aria-hidden="true" />
        <span>Jump to patient…</span>
        <kbd aria-hidden="true">⌘K</kbd>
      </button>
    </header>
  )
}
