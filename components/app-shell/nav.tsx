'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LayoutGrid, Loader2, Eye, ScanEye, FileText, LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { withBasePath } from '@/lib/base-path'

import { initials } from '@/lib/format'

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, mobileIcon: LayoutDashboard },
  { href: '/examination', label: 'Examination', icon: Eye, mobileIcon: ScanEye },
  { href: '/results', label: 'Results', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function isActive(pathname: string, href: string) {
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
    window.location.assign(withBasePath('/'))
  }

  return { signingOut, signOut }
}

function SignOutIcon({ signingOut, size = 'size-5' }: { signingOut: boolean; size?: string }) {
  return signingOut ? (
    <Loader2 className={cn(size, 'motion-safe:animate-spin')} aria-hidden="true" />
  ) : (
    <LogOut className={size} aria-hidden="true" />
  )
}

function SidebarSignOut() {
  const { signingOut, signOut } = useSignOut()
  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={signingOut}
      aria-label={signingOut ? 'Signing out' : 'Sign out'}
      title="Sign out"
      className="sidebar-sign-out"
    >
      <SignOutIcon signingOut={signingOut} size="size-4" />
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

export function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname()
  const displayName = name || email
  return (
    <aside className="clinic-sidebar">
      <div className="sidebar-brand">
        <Image src={withBasePath('/icon.png')} alt="" width={40} height={40} />
        <div>
          <p>EAGLE LENSE</p>
          <span>by Eagle Eye Tech Ltd</span>
        </div>
      </div>
      <nav aria-label="Main" className="sidebar-nav">
        <p>Workspace</p>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={isActive(pathname, href) ? 'page' : undefined}>
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-user">
        {displayName && (
          <>
            <span className="sidebar-avatar" aria-hidden="true">{initials(displayName)}</span>
            <div className="sidebar-user-text">
              <p className="truncate">{displayName}</p>
              {name && email && <p className="truncate">{email}</p>}
            </div>
          </>
        )}
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
        {navItems.map(({ href, label, icon, mobileIcon }) => {
          const Icon = mobileIcon ?? icon
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
