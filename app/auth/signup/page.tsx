"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      console.log("[v0] Attempting signup with email:", email)

      // Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: {
            nombre_completo: nombreCompleto,
          },
        },
      })

      console.log("[v0] Signup response:", { data, error: signUpError })

      if (signUpError) throw signUpError

      if (data.user) {
        console.log("[v0] User created:", data.user.id)

        // NOTE: We do NOT automatically create an admin record from the client side.
        // If the user provides an invite code, call a server-side endpoint that
        // validates a server-only secret and inserts into `admin_users` safely.
        if (inviteCode && inviteCode.trim().length > 0) {
          try {
            const res = await fetch("/api/admins/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: data.user.id, nombreCompleto, token: inviteCode }),
            })

            if (!res.ok) {
              const body = await res.json().catch(() => ({}))
              throw new Error(body?.message || "No autorizado para crear admin")
            }
          } catch (e) {
            // If invite verification failed, we don't block account creation but show an error.
            console.error("[v0] Invite code validation failed:", e)
            setError(e instanceof Error ? e.message : String(e))
            setIsLoading(false)
            return
          }
        }

        setSuccess(true)

        if (data.user.identities && data.user.identities.length === 0) {
          setError("Este correo ya está registrado. Por favor inicia sesión.")
          setSuccess(false)
          setIsLoading(false)
          return
        }

        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      }
    } catch (error: unknown) {
      console.error("[v0] Signup error:", error)
      setError(error instanceof Error ? error.message : "Error al crear la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Cuenta Creada</CardTitle>
            <CardDescription>Tu cuenta de administrador ha sido creada exitosamente</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Redirigiendo al inicio de sesión...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <Image src="/logo.png" alt="El Camino de Emaús" width={80} height={80} className="object-contain" />
            <h1 className="text-2xl font-bold">El Camino de Emaús</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Crear Cuenta de Administrador</CardTitle>
              <CardDescription>Completa los datos para crear tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="nombreCompleto">Nombre Completo</Label>
                    <Input
                      id="nombreCompleto"
                      type="text"
                      placeholder="Juan Pérez"
                      required
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@emaus.com"
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
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inviteCode">Código de Invitación (opcional)</Label>
                    <Input
                      id="inviteCode"
                      type="text"
                      placeholder="Ingresa el código de invitación"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <Link href="/auth/login" className="underline underline-offset-4">
                    ¿Ya tienes cuenta? Inicia sesión
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
