"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logoSrc, setLogoSrc] = useState("/logo.png")
  const router = useRouter()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/retiro-settings", { cache: "no-store" })
        if (!response.ok) return
        const settings = await response.json()
        if (settings.logo_url) setLogoSrc(settings.logo_url)
      } catch {
        // keep default logo
      }
    }

    void loadSettings()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Attempting login with email:", email)

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Sign in response:", { data: signInData, error: signInError })

      if (signInError) {
        console.error("[v0] Sign in error:", signInError)
        throw signInError
      }

      // Check if user is admin or servidor
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Current user:", user)

      if (user) {
        // Check if admin
        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("*")
          .eq("id", user.id)
          .single()

        console.log("[v0] Admin check:", { adminData, adminError })

        if (adminData) {
          console.log("[v0] User is admin, redirecting to /admin")
          router.push("/admin")
          return
        }

        // Check if servidor
        const { data: servidorData, error: servidorError } = await supabase
          .from("servidores")
          .select("*")
          .eq("auth_user_id", user.id)
          .single()

        console.log("[v0] Servidor check:", { servidorData, servidorError })

        if (servidorData) {
          console.log("[v0] User is servidor, redirecting to /servidor")
          router.push("/servidor")
          return
        }

        // User exists but has no role
        console.log("[v0] User has no role, signing out")
        await supabase.auth.signOut()
        throw new Error("No tienes permisos para acceder al sistema")
      }
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al iniciar sesión"

      if (errorMessage.includes("Invalid login credentials")) {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.")
      } else if (errorMessage.includes("Email not confirmed")) {
        setError("Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <Image src={logoSrc} alt="El Camino de Emaús" width={80} height={80} className="object-contain" />
            <h1 className="text-2xl font-bold">El Camino de Emaús</h1>
            <CountdownTimer />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <div className="flex flex-col gap-2">
                    <Link href="/" className="underline underline-offset-4">
                      Volver al inicio
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
