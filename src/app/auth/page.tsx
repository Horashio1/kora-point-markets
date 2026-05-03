'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LogoFull } from '@/components/Logo'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function AuthPage() {
  const router = useRouter()
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tab, setTab] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle()
    if (error) {
      toast.error(error.message)
    }
  }

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password })
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      if (errors.email?.[0]) toast.error(errors.email[0])
      else if (errors.password?.[0]) toast.error(errors.password[0])
      return false
    }
    return true
  }

  const handleEmailLogin = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)
    const { error } = await signInWithEmail(email, password)
    setIsSubmitting(false)
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Wrong email or password')
      } else {
        toast.error(error.message)
      }
    }
  }

  const handleEmailSignup = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)
    const { error } = await signUpWithEmail(email, password)
    setIsSubmitting(false)
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Email already registered — try logging in.')
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('Check your email to confirm your account!')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 overflow-hidden">

      {/* Background glow blobs */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(ellipse, hsl(var(--neon-blue)/0.6), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[500px] rounded-full opacity-15 blur-[100px]"
        style={{ background: "radial-gradient(ellipse, hsl(var(--neon-purple)/0.5), transparent 70%)" }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center">
            <LogoFull width={160} />
          </div>
          <p className="text-sm text-muted-foreground">Predict outcomes. Win points.</p>
        </div>

        {/* Google button — primary CTA */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:border-border hover:bg-accent hover:shadow-md active:scale-[0.98]"
        >
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">or</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* Email/password panel */}
        <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 shadow-sm">

          {/* Tab toggle */}
          <div className="mb-5 flex rounded-xl border border-border/50 bg-background/40 p-1">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-150 outline-none",
                  tab === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (tab === 'login' ? handleEmailLogin() : handleEmailSignup())}
              className="border-border/70 bg-background/50 text-foreground placeholder:text-muted-foreground/35 focus-visible:ring-[hsl(var(--neon-blue)/0.3)] focus-visible:border-[hsl(var(--neon-blue)/0.5)]"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (tab === 'login' ? handleEmailLogin() : handleEmailSignup())}
              className="border-border/70 bg-background/50 text-foreground placeholder:text-muted-foreground/35 focus-visible:ring-[hsl(var(--neon-blue)/0.3)] focus-visible:border-[hsl(var(--neon-blue)/0.5)]"
            />

            <button
              type="button"
              onClick={tab === 'login' ? handleEmailLogin : handleEmailSignup}
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, hsl(var(--neon-blue)), hsl(var(--neon-indigo)))",
                boxShadow: "0 0 20px -6px hsl(var(--neon-blue)/0.5)",
              }}
            >
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : tab === 'login' ? 'Log in' : 'Create account'
              }
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-muted-foreground/40">
          By continuing you agree to our terms of service.
        </p>
      </div>
    </div>
  )
}
