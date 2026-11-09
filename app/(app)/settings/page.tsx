import { redirect } from 'next/navigation'
import { Panel, TopBar } from '@/components/app-shell/top-bar'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Settings — Eagle Lense' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const fullName: unknown = user.user_metadata?.full_name
  const profile = [
    { label: 'Name', value: typeof fullName === 'string' && fullName ? fullName : 'Not set' },
    { label: 'Email', value: user.email ?? 'Not set' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <TopBar title="Settings" />
      <Panel title="Profile" className="max-w-xl">
        <dl className="flex flex-col gap-4 text-sm">
          {profile.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  )
}
