"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Plus, X, Users } from "lucide-react"
import { uiAvatarUrl } from "@/lib/utils"
import type { Equipo, Servidor, AdminUser } from "@/lib/types"

interface EquipoConServidores extends Equipo {
  servidores: Servidor[]
}

interface EquiposManagementProps {
  adminUser: AdminUser
}

export function EquiposManagement({ adminUser }: EquiposManagementProps) {
  const { toast } = useToast()
  const [equipos, setEquipos] = useState<EquipoConServidores[]>([])
  const [servidoresDisponibles, setServidoresDisponibles] = useState<Servidor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEquipo, setSelectedEquipo] = useState<EquipoConServidores | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddingServidor, setIsAddingServidor] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [equiposRes, servidoresRes] = await Promise.all([
        fetch("/api/equipos"),
        fetch("/api/servidores"),
      ])

      const [equiposData, servidoresData] = await Promise.all([
        equiposRes.json(),
        servidoresRes.json(),
      ])

      setEquipos(equiposData)
      setServidoresDisponibles(servidoresData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addServidorToEquipo = async (equipoId: string, servidorId: string) => {
    setIsAddingServidor(true)
    try {
      const response = await fetch(`/api/equipos/${equipoId}/servidores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servidor_id: servidorId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      toast({
        title: "Servidor agregado",
        description: "El servidor fue agregado al equipo exitosamente",
      })

      await loadData()
      setSearchTerm("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al agregar servidor",
        variant: "destructive",
      })
    } finally {
      setIsAddingServidor(false)
    }
  }

  const removeServidorFromEquipo = async (equipoId: string, servidorId: string) => {
    try {
      const response = await fetch(`/api/equipos/${equipoId}/servidores?servidor_id=${servidorId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al remover servidor")

      toast({
        title: "Servidor removido",
        description: "El servidor fue removido del equipo exitosamente",
      })

      await loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al remover servidor del equipo",
        variant: "destructive",
      })
    }
  }

  const getServidoresNoEnEquipo = (equipoId: string) => {
    const equipo = equipos.find((e) => e.id === equipoId)
    if (!equipo) return []

    const servidorIdsEnEquipo = equipo.servidores.map((s) => s.id)
    return servidoresDisponibles.filter((s) => !servidorIdsEnEquipo.includes(s.id))
  }

  const filteredServidores = (equipoId: string) => {
    const disponibles = getServidoresNoEnEquipo(equipoId)
    if (!searchTerm) return disponibles

    return disponibles.filter((s) =>
      s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cedula.includes(searchTerm)
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestión de Equipos</h2>
        <p className="text-muted-foreground">
          Administra los equipos y asigna servidores a cada uno
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {equipos.map((equipo) => (
          <Card key={equipo.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {equipo.nombre}
                  </CardTitle>
                  {equipo.descripcion && (
                    <CardDescription className="mt-1">{equipo.descripcion}</CardDescription>
                  )}
                </div>
                <Badge variant="secondary">{equipo.servidores.length} servidores</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {equipo.servidores.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay servidores asignados a este equipo
                  </p>
                ) : (
                  <div className="space-y-2">
                    {equipo.servidores.map((servidor) => (
                      <div
                        key={servidor.id}
                        className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={servidor.imagen || uiAvatarUrl(servidor.nombre_completo)}
                            alt={servidor.nombre_completo}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium">{servidor.nombre_completo}</p>
                            {servidor.tipo_servidor && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {servidor.tipo_servidor}
                              </p>
                            )}
                          </div>
                        </div>
                        {adminUser.is_super && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeServidorFromEquipo(equipo.id, servidor.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {adminUser.is_super && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedEquipo(equipo)
                          setSearchTerm("")
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Servidor
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Agregar Servidor a {equipo.nombre}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre o cédula..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <div className="space-y-2">
                        {filteredServidores(equipo.id).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            {searchTerm
                              ? "No se encontraron servidores"
                              : "Todos los servidores ya están en este equipo"}
                          </p>
                        ) : (
                          filteredServidores(equipo.id).map((servidor) => (
                            <div
                              key={servidor.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={servidor.imagen || uiAvatarUrl(servidor.nombre_completo)}
                                  alt={servidor.nombre_completo}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <p className="font-medium">{servidor.nombre_completo}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {servidor.cedula} • {servidor.celular}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addServidorToEquipo(equipo.id, servidor.id)}
                                disabled={isAddingServidor}
                              >
                                {isAddingServidor ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
