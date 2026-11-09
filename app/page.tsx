import Image from 'next/image'
import { LoginForm } from '@/components/login/login-form'
import { withBasePath } from '@/lib/base-path'

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-[#2e1065] lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div
          className="pointer-events-none absolute -right-32 -bottom-32 size-[28rem] rounded-full border-[40px] border-white/5"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full border-[28px] border-white/5"
          aria-hidden="true"
        />
        <Image
          src={withBasePath('/images/fundus-right.png')}
          alt=""
          width={600}
          height={600}
          className="pointer-events-none absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-10 mix-blend-luminosity"
          aria-hidden="true"
        />

        <div className="relative flex max-w-sm flex-col items-center text-center">
          <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-black/20">
            <Image
              src={withBasePath('/images/eagle-eye-logo.jpg')}
              alt="Eagle Eye"
              width={1600}
              height={820}
              priority
              className="h-auto w-64"
            />
          </div>
          <p className="mt-8 text-2xl font-bold text-balance text-white">
            AI-powered retinal screening for every clinic
          </p>
          <p className="mt-3 text-sm text-white/70">Eagle Lense by Eagle Eye Tech Ltd</p>
        </div>
      </aside>

      <section className="flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="flex w-full max-w-sm flex-col">
          <Image
            src={withBasePath('/images/eagle-eye-logo.jpg')}
            alt="Eagle Eye"
            width={1600}
            height={820}
            priority
            className="mx-auto mb-8 h-auto w-44 lg:hidden"
          />
          <h1 className="text-3xl font-bold tracking-tight text-balance text-foreground">
            Welcome to Eagle Lense
          </h1>
          <p className="mt-2 text-sm font-medium italic text-primary">Your Eye Care Squad</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  )
}
