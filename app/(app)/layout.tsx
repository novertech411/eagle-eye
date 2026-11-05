import { MobileNav, Sidebar } from '@/components/app-shell/nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface md:p-4">
      <div className="mx-auto flex max-w-[1440px] gap-4 md:rounded-[2rem] md:bg-background md:p-4">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pt-5 pb-28 md:px-2 md:pt-2 md:pb-4">{children}</main>
      </div>
      <MobileNav />
    </div>
  )
}
