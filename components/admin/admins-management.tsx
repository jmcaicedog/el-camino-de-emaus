"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, UserPlus, Trash, Shield, Mail } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Servidor } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uiAvatarUrl } from "@/lib/utils"

interface Admin {
  id: string
  nombre_completo: string
  email: string
  celular?: string | null
  imagen?: string | null
  role: string
  is_super: boolean
  created_at: string
}

export function AdminsManagement() {
  const { toast } = useToast()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedServidorId, setSelectedServidorId] = useState<string>("")
  const [servidorSearchTerm, setServidorSearchTerm] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [adminsRes, servidoresRes] = await Promise.all([
        fetch("/api/admins"),
        fetch("/api/servidores"),
      ])
      const [adminsData, servidoresData] = await Promise.all([
        adminsRes.json(),
        servidoresRes.json(),
      ])
      
      if (!adminsRes.ok) {
        throw new Error('No autorizado para ver administradores')
      }
      
      setAdmins(adminsData)
      setServidores(servidoresData)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addAdmin = async () => {
    if (!selectedServidorId) {
      toast({
        title: "Error",
        description: "Selecciona un servidor",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servidor_id: selectedServidorId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al promover servidor")
      }

      toast({
        title: "Administrador agregado",
        description: "El servidor ahora tiene permisos de administrador",
      })

      setAddDialogOpen(false)
      setSelectedServidorId("")
      setServidorSearchTerm("")
      await loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al agregar administrador",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteAdmin = async (id?: string) => {
    if (!id) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admins/${id}`, { method: "DELETE" })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message || "Error al eliminar")
      
      toast({ 
        title: "Eliminado", 
        description: "Acceso de administrador removido correctamente" 
      })
      await loadData()
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al eliminar", 
        variant: "destructive" 
      })
    } finally {
      setIsUpdating(false)
      setPendingDeleteId(null)
    }
  }

  const resendCredentials = async (id: string) => {
    setResendingId(id)
    try {
      const res = await fetch(`/api/admins/${id}/resend-credentials`, {
        method: "POST",
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message || "Error al reenviar credenciales")
      
      toast({ 
        title: "Credenciales enviadas", 
        description: "Se han enviado las nuevas credenciales por correo" 
      })
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al reenviar credenciales", 
        variant: "destructive" 
      })
    } finally {
      setResendingId(null)
    }
  }

  const filteredAdmins = admins.filter(
    (a) =>
      a.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get servidores that are not already admins
  const adminIds = new Set(admins.map(a => a.id))
  const availableServidores = servidores.filter(s => !adminIds.has(s.id))
  
  const filteredServidores = availableServidores.filter(s =>
    s.nombre_completo.toLowerCase().includes(servidorSearchTerm.toLowerCase()) ||
    s.correo.toLowerCase().includes(servidorSearchTerm.toLowerCase()) ||
    s.cedula.includes(servidorSearchTerm)
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Administradores</CardTitle>
                <CardDescription>Total: {admins.length} administradores</CardDescription>
              </div>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Administrador
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar Administrador</DialogTitle>
                    <DialogDescription>
                      Selecciona un servidor para otorgarle permisos de administrador
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Buscar Servidor</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre, correo o cédula..."
                          value={servidorSearchTerm}
                          onChange={(e) => setServidorSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Servidor</Label>
                      <Select value={selectedServidorId} onValueChange={setSelectedServidorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un servidor" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredServidores.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              {servidorSearchTerm ? "No se encontraron servidores" : "No hay servidores disponibles"}
                            </div>
                          ) : (
                            filteredServidores.map((servidor) => (
                              <SelectItem key={servidor.id} value={servidor.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{servidor.nombre_completo}</span>
                                  <span className="text-xs text-muted-foreground">{servidor.correo}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setAddDialogOpen(false)
                          setSelectedServidorId("")
                          setServidorSearchTerm("")
                        }} 
                        disabled={isUpdating}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={addAdmin} disabled={isUpdating || !selectedServidorId}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Agregar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Foto</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No se encontraron administradores
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                            <img
                              src={admin.imagen || uiAvatarUrl(admin.nombre_completo)}
                              alt={admin.nombre_completo}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{admin.nombre_completo}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          {admin.celular ? (
                            <a
                              href={`https://wa.me/57${admin.celular.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 font-medium"
                            >
                              {admin.celular}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">\u2014</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {admin.is_super ? (
                            <Badge variant="default" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Super Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Administrador</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(admin.created_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resendCredentials(admin.id)}
                              disabled={resendingId === admin.id || admin.is_super}
                              title="Reenviar credenciales"
                            >
                              {resendingId === admin.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4 text-blue-600" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPendingDeleteId(admin.id)
                                setConfirmOpen(true)
                              }}
                              disabled={isUpdating || admin.is_super}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open: boolean) => setConfirmOpen(open)}
        title="Confirmar eliminación"
        description="¿Estás seguro de que deseas remover el acceso de administrador? El usuario seguirá existiendo como servidor."
        confirmLabel="Remover acceso"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          await deleteAdmin(pendingDeleteId || undefined)
        }}
      />
    </>
  )
}
