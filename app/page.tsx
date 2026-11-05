import Image from 'next/image'
import { CheckCircle2, ScanEye, Users } from 'lucide-react'
import { LoginForm } from '@/components/login/login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-stretch justify-center bg-surface md:items-center md:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden bg-white md:rounded-[2rem] md:shadow-[0_20px_60px_-20px_rgba(76,29,149,0.35)] lg:grid-cols-2">
        <section className="flex flex-col items-center px-6 py-10 sm:px-12 md:py-14">
          <Image
            src="/images/eagle-eye-logo.jpg"
            alt="Eagle Eye"
            width={1600}
            height={820}
            priority
            className="h-auto w-56 sm:w-64"
          />
          <p className="mt-2 text-xl font-extrabold tracking-wide">EAGLE LENSE</p>
          <p className="text-xs text-muted-foreground">by Eagle Eye Tech Ltd</p>

          <h1 className="mt-8 text-center text-2xl font-bold text-balance">
            Welcome to Eagle Lense
          </h1>
          <div className="mt-2 flex w-full max-w-xs items-center gap-3" aria-hidden="false">
            <span className="h-px flex-1 bg-primary/40" />
            <p className="text-sm font-medium whitespace-nowrap italic text-primary">
              Your Eye Care Squad
            </p>
            <span className="h-px flex-1 bg-primary/40" />
          </div>

          <div className="mt-8 w-full max-w-md">
            <LoginForm />
          </div>
        </section>

        <aside className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div>
            <p className="text-sm font-medium text-white/70">Today across clinics</p>
            <p className="mt-2 text-3xl font-bold text-balance">
              Faster retinal screening for every patient.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white p-5 text-foreground">
              <div className="flex items-center gap-4">
                <div
                  className="relative flex size-20 items-center justify-center rounded-full"
                  style={{
                    background:
                      'conic-gradient(var(--color-primary) 0 82%, var(--color-accent) 82% 100%)',
                  }}
                  role="img"
                  aria-label="82 percent of images suitable for review"
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-white text-lg font-bold">
                    82%
                  </span>
                </div>
                <div>
                  <p className="font-semibold">Image quality</p>
                  <p className="text-sm text-muted-foreground">Suitable for clinical review</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <ScanEye className="size-5 text-highlight" aria-hidden="true" />
                <p className="mt-3 text-2xl font-bold">148</p>
                <p className="text-xs text-white/70">Screenings this week</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <Users className="size-5 text-highlight" aria-hidden="true" />
                <p className="mt-3 text-2xl font-bold">36</p>
                <p className="text-xs text-white/70">Referrals made</p>
              </div>
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs text-white/70">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Supports clinical assessment, not a replacement for a full eye exam.
          </p>
        </aside>
      </div>
    </main>
  )
}
