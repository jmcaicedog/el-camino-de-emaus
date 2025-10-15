"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CaminanteCard } from "@/components/servidor/caminante-card"
import { ServidorCard } from "@/components/servidor/servidor-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users, UserCog } from "lucide-react"
import type { Mesa, Caminante, Servidor } from "@/lib/types"

export function MesasManagement() {
  const { toast } = useToast()
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [caminantes, setCaminantes] = useState<Caminante[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [mesasRes, caminantesRes, servidoresRes] = await Promise.all([
        fetch("/api/mesas"),
        fetch("/api/caminantes"),
        fetch("/api/servidores"),
      ])

      const [mesasData, caminantesData, servidoresData] = await Promise.all([
        mesasRes.json(),
        caminantesRes.json(),
        servidoresRes.json(),
      ])

      setMesas(mesasData)
      setCaminantes(caminantesData)
      setServidores(servidoresData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCaminantesByMesa = (mesaId: string) => {
    return caminantes.filter((c) => c.mesa_id === mesaId)
  }

  const getServidoresByMesa = (mesaId: string) => {
    return servidores.filter((s) => s.mesa_id === mesaId)
  }

  const assignToMesa = async (personId: string, mesaId: string, type: "caminante" | "servidor") => {
    setIsAssigning(true)
    try {
      const endpoint = type === "caminante" ? "/api/caminantes" : "/api/servidores"
      const response = await fetch(`${endpoint}/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesa_id: mesaId }),
      })

      if (!response.ok) throw new Error("Error al asignar")

      toast({
        title: "Éxito",
        description: `${type === "caminante" ? "Caminante" : "Servidor"} asignado correctamente`,
      })

      await loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al asignar a la mesa",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const unassignFromMesa = async (personId: string, type: "caminante" | "servidor") => {
    setIsAssigning(true)
    try {
      const endpoint = type === "caminante" ? "/api/caminantes" : "/api/servidores"
      const response = await fetch(`${endpoint}/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesa_id: null }),
      })

      if (!response.ok) throw new Error("Error al desasignar")

      toast({
        title: "Éxito",
        description: `${type === "caminante" ? "Caminante" : "Servidor"} desasignado correctamente`,
      })

      await loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al desasignar de la mesa",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Mesas</h2>
          <p className="text-muted-foreground">Organiza caminantes y servidores en mesas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mesas.map((mesa) => {
          const mesaCaminantes = getCaminantesByMesa(mesa.id)
          const mesaServidores = getServidoresByMesa(mesa.id)
          const lider = mesaServidores.find((s) => s.tipo_servidor === "lider")
          const colider = mesaServidores.find((s) => s.tipo_servidor === "colider")

          return (
            <Card key={mesa.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Mesa {mesa.numero}
                  <Badge variant={mesaCaminantes.length > 0 ? "default" : "secondary"}>
                    {mesaCaminantes.length} / 7
                  </Badge>
                </CardTitle>
                <CardDescription>{mesa.nombre}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <UserCog className="h-4 w-4" />
                    <span className="text-sm font-medium">Servidores</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-muted-foreground">Líder: </span>
                        {lider ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="text-left text-sm underline underline-offset-2 text-primary/90">{lider.nombre_completo}</button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{lider.nombre_completo}</DialogTitle>
                              </DialogHeader>
                              <ServidorCard servidor={lider} onUpdate={loadData} />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          "Sin asignar"
                        )}
                      </div>
                      {lider && (
                        <Button size="sm" variant="ghost" onClick={() => unassignFromMesa(lider.id, "servidor")} disabled={isAssigning}>
                          Desasignar
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-muted-foreground">Colíder: </span>
                        {colider ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="text-left text-sm underline underline-offset-2 text-primary/90">{colider.nombre_completo}</button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{colider.nombre_completo}</DialogTitle>
                              </DialogHeader>
                              <ServidorCard servidor={colider} onUpdate={loadData} />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          "Sin asignar"
                        )}
                      </div>
                      {colider && (
                        <Button size="sm" variant="ghost" onClick={() => unassignFromMesa(colider.id, "servidor")} disabled={isAssigning}>
                          Desasignar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Caminantes</span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                        {mesaCaminantes.length > 0 ? (
                      mesaCaminantes.map((c) => (
                        <div key={c.id} className="flex items-center justify-between">
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="text-left text-sm underline underline-offset-2 text-primary/90">{c.nombre_completo}</button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{c.nombre_completo}</DialogTitle>
                              </DialogHeader>
                              <CaminanteCard caminante={c} onUpdate={loadData} />
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="ghost" onClick={() => unassignFromMesa(c.id, "caminante")} disabled={isAssigning}>
                            Desasignar
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div>Sin caminantes asignados</div>
                    )}
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent" onClick={() => setSelectedMesa(mesa)}>
                      Asignar Personas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Asignar a Mesa {mesa.numero}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-3">Asignar Caminantes</h3>
                        <div className="space-y-2">
                          {caminantes
                            .filter((c) => !c.mesa_id)
                            .map((caminante) => (
                              <div key={caminante.id} className="flex items-center justify-between p-2 border rounded">
                                <span className="text-sm">{caminante.nombre_completo}</span>
                                <Button
                                  size="sm"
                                  onClick={() => assignToMesa(caminante.id, mesa.id, "caminante")}
                                  disabled={isAssigning || mesaCaminantes.length >= 7}
                                >
                                  Asignar
                                </Button>
                              </div>
                            ))}
                          {caminantes.filter((c) => !c.mesa_id).length === 0 && (
                            <p className="text-sm text-muted-foreground">No hay caminantes sin asignar</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Asignar Servidores</h3>
                        <div className="space-y-2">
                          {servidores
                            .filter((s) => !s.mesa_id)
                            .map((servidor) => (
                              <div key={servidor.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex-1">
                                  <span className="text-sm">{servidor.nombre_completo}</span>
                                  <div className="mt-1">
                                    <Label htmlFor={`tipo-${servidor.id}`} className="text-xs">
                                      Tipo:
                                    </Label>
                                    <Select
                                      onValueChange={async (value) => {
                                        await fetch(`/api/servidores/${servidor.id}`, {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ tipo_servidor: value }),
                                        })
                                        await loadData()
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {/* Disable option if that role already exists in the mesa */}
                                        <SelectItem value="lider" disabled={!!lider}>
                                          Líder {lider ? "(ya asignado)" : ""}
                                        </SelectItem>
                                        <SelectItem value="colider" disabled={!!colider}>
                                          Colíder {colider ? "(ya asignado)" : ""}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => assignToMesa(servidor.id, mesa.id, "servidor")}
                                  disabled={
                                    isAssigning ||
                                    mesaServidores.length >= 2 ||
                                    !servidor.tipo_servidor ||
                                    (servidor.tipo_servidor === "lider" && !!lider) ||
                                    (servidor.tipo_servidor === "colider" && !!colider)
                                  }
                                >
                                  Asignar
                                </Button>
                              </div>
                            ))}
                          {servidores.filter((s) => !s.mesa_id).length === 0 && (
                            <p className="text-sm text-muted-foreground">No hay servidores sin asignar</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
