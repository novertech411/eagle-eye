'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form
      className="flex w-full flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        router.push('/dashboard')
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            className="h-12 rounded-xl bg-white pl-10 text-base md:text-sm"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="h-12 rounded-xl bg-white pr-11 pl-10 text-base md:text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <Button type="submit" className="h-12 rounded-xl text-base font-bold">
        Sign In
      </Button>
      <a
        href="#"
        className="self-center text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Forgot Password
      </a>
    </form>
  )
}
