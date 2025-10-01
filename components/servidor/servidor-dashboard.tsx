"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Servidor, Mesa, Caminante } from "@/lib/types"
import { CaminanteCard } from "@/components/servidor/caminante-card"
import { Badge } from "@/components/ui/badge"

interface ServidorDashboardProps {
  servidor: Servidor
  mesa: Mesa | null
  caminantes: Caminante[]
}

export function ServidorDashboard({ servidor, mesa, caminantes: initialCaminantes }: ServidorDashboardProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [caminantes, setCaminantes] = useState(initialCaminantes)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const refreshCaminantes = async () => {
    if (!mesa) return

    const response = await fetch(`/api/mesas/${mesa.id}/caminantes`)
    const data = await response.json()
    setCaminantes(data)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="El Camino de Emaús" width={50} height={50} className="object-contain" />
              <div>
                <h1 className="text-2xl font-bold">Panel de Servidor</h1>
                <p className="text-sm text-muted-foreground">
                  {servidor.nombre_completo} -{" "}
                  <Badge variant="secondary">{servidor.tipo_servidor === "lider" ? "Líder" : "Colíder"}</Badge>
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!mesa ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin Mesa Asignada</CardTitle>
              <CardDescription>Aún no has sido asignado a una mesa. Contacta al administrador.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Mesa {mesa.numero}
                </CardTitle>
                <CardDescription>
                  {caminantes.length} caminante{caminantes.length !== 1 ? "s" : ""} asignado
                  {caminantes.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
            </Card>

            {caminantes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay caminantes asignados a esta mesa aún.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {caminantes.map((caminante) => (
                  <CaminanteCard key={caminante.id} caminante={caminante} onUpdate={refreshCaminantes} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
