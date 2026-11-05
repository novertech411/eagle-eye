'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ScanEye, FileText, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/examination', label: 'Examination', icon: ScanEye },
  { href: '/results', label: 'Results', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-20 shrink-0 flex-col items-center rounded-3xl bg-sidebar py-6 text-sidebar-foreground md:flex">
      <div className="flex size-11 items-center justify-center rounded-full bg-white text-sm font-extrabold text-primary">
        EL
      </div>
      <nav aria-label="Main" className="mt-10 flex flex-1 flex-col items-center gap-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              title={label}
              className={cn(
                'flex size-12 items-center justify-center rounded-2xl transition-colors',
                active
                  ? 'bg-white text-primary shadow-lg shadow-black/10'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </Link>
          )
        })}
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-2xl opacity-60"
        >
          <Settings className="size-5" />
        </span>
      </nav>
      <Link
        href="/"
        aria-label="Sign out"
        title="Sign out"
        className="flex size-12 items-center justify-center rounded-2xl transition-colors hover:bg-sidebar-accent hover:text-white"
      >
        <LogOut className="size-5" aria-hidden="true" />
      </Link>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full',
                    active && 'bg-accent',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
