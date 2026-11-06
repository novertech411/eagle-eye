'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Loader2, ScanEye, FileText, LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/examination', label: 'Examination', icon: ScanEye },
  { href: '/results', label: 'Results', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const sidebarItemClass =
  'flex h-12 items-center gap-3 px-6 text-sm font-medium transition-colors'

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function useSignOut() {
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signOut()
      // If Supabase can't be reached, still end the session on this device.
      if (error) await supabase.auth.signOut({ scope: 'local' })
    } catch {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
    }
    // A full page load also clears any patient data held in the client.
    window.location.assign('/')
  }

  return { signingOut, signOut }
}

function SignOutIcon({ signingOut }: { signingOut: boolean }) {
  return signingOut ? (
    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
  ) : (
    <LogOut className="size-5" aria-hidden="true" />
  )
}

function SidebarSignOut() {
  const { signingOut, signOut } = useSignOut()
  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={signingOut}
      className={cn(sidebarItemClass, 'w-full hover:bg-sidebar-accent hover:text-white disabled:opacity-60')}
    >
      <SignOutIcon signingOut={signingOut} />
      Sign Out
    </button>
  )
}

function MobileSignOut() {
  const { signingOut, signOut } = useSignOut()
  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={signingOut}
      className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground disabled:opacity-60"
    >
      <span className="flex h-7 w-12 items-center justify-center rounded-full">
        <SignOutIcon signingOut={signingOut} />
      </span>
      Sign Out
    </button>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="bg-white px-5 py-4">
        <div className="relative aspect-[2/1] w-full">
          <Image
            src="/images/eagle-eye-logo.jpg"
            alt="Eagle Eye logo"
            fill
            priority
            sizes="216px"
            className="object-contain mix-blend-multiply"
          />
        </div>
        <div className="mt-2 text-center leading-tight">
          <p className="text-sm font-extrabold tracking-wide text-foreground">EAGLE LENSE</p>
          <p className="text-[11px] text-muted-foreground">by Eagle Eye Tech Ltd</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col overflow-y-auto py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                sidebarItemClass,
                active
                  ? 'bg-white text-primary'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border py-2">
        <SidebarSignOut />
      </div>
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
      <ul className="grid grid-cols-5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
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
        <li>
          <MobileSignOut />
        </li>
      </ul>
    </nav>
  )
}
