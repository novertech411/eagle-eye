import { MobileNav, Sidebar } from '@/components/app-shell/nav'
import { TopNav } from '@/components/app-shell/top-bar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <TopNav />
      {/* Offsets match the fixed sidebar (w-64) and top nav (h-16). */}
      <main className="px-4 pt-22 pb-28 md:ml-64 md:px-8 md:pb-8">{children}</main>
      <MobileNav />
    </div>
  )
}
