'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthError } from '@supabase/supabase-js'
import { CheckCircle2, CircleAlert, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup'
type Message = { kind: 'error' | 'success'; text: string }

const inputClass = 'h-12 rounded-xl bg-white pl-10 text-base md:text-sm'
const iconClass =
  'pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground'
const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again."

function errorMessage(error: AuthError) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.'
    case 'email_not_confirmed':
      return 'Please confirm your email address before signing in.'
    case 'weak_password':
      return 'Please choose a stronger password.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (error.name === 'AuthRetryableFetchError') return NETWORK_ERROR
  return error.message
}

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)

  async function run(action: () => Promise<void>) {
    setLoading(true)
    setMessage(null)
    try {
      await action()
    } catch {
      setMessage({ kind: 'error', text: NETWORK_ERROR })
    } finally {
      setLoading(false)
    }
  }

  function signIn() {
    return run(async () => {
      const { error } = await createClient().auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ kind: 'error', text: errorMessage(error) })
        return
      }
      router.replace('/dashboard')
      router.refresh()
    })
  }

  function signUp() {
    if (password !== confirmPassword) {
      setMessage({ kind: 'error', text: 'Passwords do not match.' })
      return
    }
    return run(async () => {
      const { data, error } = await createClient().auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() } },
      })
      if (error) {
        setMessage({ kind: 'error', text: errorMessage(error) })
        return
      }
      // A session is only returned when email confirmation is turned off in Supabase.
      if (data.session) {
        router.replace('/dashboard')
        router.refresh()
        return
      }
      setPassword('')
      setConfirmPassword('')
      setMessage({ kind: 'success', text: 'Check your email to confirm your account.' })
    })
  }

  function forgotPassword() {
    if (!email.trim()) {
      setMessage({ kind: 'error', text: 'Enter your email address first.' })
      return
    }
    return run(async () => {
      const { error } = await createClient().auth.resetPasswordForEmail(email)
      setMessage(
        error
          ? { kind: 'error', text: errorMessage(error) }
          : { kind: 'success', text: 'Check your email for a reset link.' },
      )
    })
  }

  function switchMode(next: Mode) {
    setMode(next)
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setMessage(null)
  }

  const isSignUp = mode === 'signup'

  return (
    <form
      className="flex w-full flex-col gap-5"
      aria-busy={loading}
      onSubmit={(e) => {
        e.preventDefault()
        if (loading) return
        void (isSignUp ? signUp() : signIn())
      }}
    >
      {isSignUp ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <User className={iconClass} aria-hidden="true" />
            <Input
              id="name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className={iconClass} aria-hidden="true" />
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className={iconClass} aria-hidden="true" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
            className={`${inputClass} pr-11`}
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

      {isSignUp ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <div className="relative">
            <Lock className={iconClass} aria-hidden="true" />
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      <Button type="submit" disabled={loading} className="h-12 rounded-xl text-base font-bold">
        {loading ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
        {isSignUp ? 'Create Account' : 'Sign In'}
      </Button>

      {!isSignUp ? (
        <button
          type="button"
          onClick={() => void forgotPassword()}
          disabled={loading}
          className="self-center text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 disabled:opacity-50"
        >
          Forgot Password
        </button>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
          disabled={loading}
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 disabled:opacity-50"
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>

      <div aria-live="polite">
        {message?.kind === 'error' ? (
          <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {message.text}
          </p>
        ) : null}
        {message?.kind === 'success' ? (
          <p className="flex items-start gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  )
}
