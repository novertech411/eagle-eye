import { MobileNav, Sidebar } from '@/components/app-shell/nav'
import { TopNav } from '@/components/app-shell/top-nav'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const fullName = user?.user_metadata.full_name
  const name = typeof fullName === 'string' ? fullName.trim() : ''
  const email = user?.email ?? ''

  return (
    <div className="clinic-shell clinic-theme min-h-dvh">
      <Sidebar name={name} email={email} />
      <TopNav />
      <main className="clinic-main">
        <div className="clinic-content">{children}</div>
      </main>
      <MobileNav />
    </div>
  )
}
