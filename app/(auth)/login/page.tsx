"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Forgot password
  const [showReset, setShowReset] = useState(false)
  const [resetMessage, setResetMessage] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (userProfile?.role === "owner") router.push("/owner")
      else if (userProfile?.role === "admin") router.push("/admin")
      else router.push("/")
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    setResetMessage("")
    setError("")

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      return
    }

    setResetMessage("Password reset link sent! Check your email.")
  }

  return (
    <Card className="p-8 bg-white shadow-lg w-full max-w-md mx-auto mt-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">TaqyeemDZ</h1>
        <p className="text-muted-foreground">Professional Feedback Management</p>
      </div>

      {/* ========================== */}
      {/*     LOGIN FORM            */}
      {/* ========================== */}
      {!showReset ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="block mb-2">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="block mb-2">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <button
            type="button"
            onClick={() => setShowReset(true)}
            className="text-sm text-primary hover:underline mx-auto block mt-2"
          >
            Forgot password?
          </button>
        </form>
      ) : (
        /* ========================== */
        /*    RESET PASSWORD FORM    */
        /* ========================== */
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <Label>Enter your email to reset your password</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
          {resetMessage && <div className="p-3 bg-primary/10 text-primary rounded-md text-sm">{resetMessage}</div>}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Send Reset Link
          </Button>

          <button
            type="button"
            onClick={() => setShowReset(false)}
            className="text-sm text-muted-foreground hover:underline mx-auto block mt-2"
          >
            ← Back to login
          </button>
        </form>
      )}

      {/* Signup link */}
      {!showReset && (
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      )}
    </Card>
  )
}
