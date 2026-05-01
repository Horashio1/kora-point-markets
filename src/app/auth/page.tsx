'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

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
        toast.error('Invalid email or password')
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
        toast.error('This email is already registered. Try logging in instead.')
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Bet.lk</h1>
          <p className="text-muted-foreground">Predict the future, win big</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to start making predictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin}>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleEmailLogin} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleEmailSignup} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
