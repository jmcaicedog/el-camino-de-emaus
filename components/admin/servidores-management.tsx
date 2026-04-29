"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ServidorCard } from "@/components/servidor/servidor-card"
import type { AdminUser } from "@/lib/types"
import { CaminanteCard } from "@/components/servidor/caminante-card"
import { Label } from "@/components/ui/label"
import { uiAvatarUrl } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, DollarSign, Trash, ShieldPlus, ShieldCheck, FileDown } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Servidor } from "@/lib/types"

interface ServidoresManagementProps {
  adminUser?: AdminUser
  readOnly?: boolean
  canManagePayments?: boolean
}

export function ServidoresManagement({ adminUser, readOnly = false, canManagePayments = false }: ServidoresManagementProps) {
  const { toast } = useToast()
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [admins, setAdmins] = useState<Set<string>>(new Set())
  const [mesas, setMesas] = useState<Array<{ id: string; numero: number }>>([])
  const [caminantes, setCaminantes] = useState<Array<any>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedServidor, setSelectedServidor] = useState<Servidor | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [promoteLoadingId, setPromoteLoadingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const parseMoney = (value: unknown) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0
    if (typeof value === "string") {
      const digitsOnly = value.replace(/[^\d-]/g, "")
      const parsed = Number.parseInt(digitsOnly, 10)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  const getPaymentStatus = (montoPagado: unknown, montoTotal: unknown) => {
    const pagado = parseMoney(montoPagado)
    const total = parseMoney(montoTotal)
    if (pagado <= 0) return "zero"
    if (pagado >= total) return "complete"
    return "partial"
  }

  const getPaymentBadgeClass = (status: "zero" | "partial" | "complete") => {
    if (status === "zero") return "bg-red-100 text-red-800 border-red-300"
    if (status === "complete") return "bg-emerald-100 text-emerald-800 border-emerald-300"
    return "bg-amber-100 text-amber-800 border-amber-300"
  }

  useEffect(() => {
    loadServidores()
  }, [])

  const loadServidores = async () => {
    try {
      const [servidoresRes, mesasRes, caminantesRes, adminsRes] = await Promise.all([
        fetch("/api/servidores"),
        fetch("/api/mesas"),
        fetch("/api/caminantes"),
        fetch("/api/admins").catch(() => ({ ok: false, json: () => [] })),
      ])
      const [servidoresData, mesasData, caminantesData, adminsData] = await Promise.all([
        servidoresRes.json(),
        mesasRes.json(),
        caminantesRes.json(),
        adminsRes.ok ? adminsRes.json() : [],
      ])
      setServidores(servidoresData)
      setMesas(mesasData)
      setCaminantes(caminantesData)
      // Crear set de IDs de administradores para verificación rápida
      setAdmins(new Set(adminsData.map((admin: any) => admin.id)))
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar servidores",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const canEditServidor = (servidor: Servidor) => {
    if (readOnly) return false

    // Superadmin siempre puede editar
    if (adminUser?.is_super) return true
    
    // Si no tiene mesa asignada, no puede editar (excepto superadmin)
    if (!servidor.mesa_id || !adminUser) return false
    
    // Verificar si el admin es líder o colíder de la mesa del servidor
    const mesaServidores = servidores.filter(s => s.mesa_id === servidor.mesa_id)
    const isLiderOrColider = mesaServidores.some(s => 
      s.auth_user_id === adminUser.id && 
      (s.tipo_servidor === 'lider' || s.tipo_servidor === 'colider')
    )
    
    return isLiderOrColider
  }

  const updatePayment = async () => {
    if (!selectedServidor) return

    setIsUpdating(true)
    try {
      const amount = Number.parseFloat(paymentAmount)
      if (isNaN(amount) || amount < 0) {
        throw new Error("Monto inválido")
      }

      const newTotal = selectedServidor.monto_pagado + amount

      const response = await fetch(`/api/servidores/${selectedServidor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto_pagado: newTotal }),
      })

      if (!response.ok) throw new Error("Error al actualizar pago")

      toast({
        title: "Pago registrado",
        description: `Se registró un abono de $${amount.toLocaleString()}`,
      })

      setPaymentAmount("")
      setSelectedServidor(null)
      await loadServidores()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar pago",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteServidor = async (id?: string) => {
    if (!id) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/servidores/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast({ title: "Eliminado", description: "Servidor eliminado correctamente" })
      await loadServidores()
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Error al eliminar", variant: "destructive" })
    } finally {
      setIsUpdating(false)
      setPendingDeleteId(null)
    }
  }

  const promoteToAdmin = async (servidor: Servidor) => {
    if (!servidor) return
    setPromoteLoadingId(servidor.id)
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servidor_id: servidor.id }),
      })
      const data = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        throw new Error(data.message || 'Error al promover servidor')
      }

      toast({ 
        title: 'Administrador agregado', 
        description: `${servidor.nombre_completo} ahora tiene permisos de administrador. Las credenciales serán enviadas por correo.` 
      })
      
      await loadServidores()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Error al promover a administrador', 
        variant: 'destructive' 
      })
    } finally {
      setPromoteLoadingId(null)
    }
  }

  const filteredServidores = servidores.filter(
    (s) =>
      s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cedula.includes(searchTerm) ||
      s.correo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Servidores Registrados", 14, 20)
    doc.setFontSize(10)
    doc.text(`Total: ${filteredServidores.length} servidores`, 14, 28)
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-CO")}`, 14, 34)

    const headers = ["#", "Nombre", "Cédula", "Celular", "Equipos", "Mesa"]
    const data = filteredServidores.map((s, i) => [
      i + 1,
      s.nombre_completo,
      s.cedula,
      s.celular,
      (() => {
        const roles = s.tipo_servidor === "lider" ? "Líder" : s.tipo_servidor === "colider" ? "Colíder" : ""
        const equipos = s.equipos?.filter(e => e !== "Líderes y colíderes").join(", ") || ""
        return [roles, equipos].filter(Boolean).join(" - ") || "Sin equipos"
      })(),
      s.mesa_id ? mesas.find(m => m.id === s.mesa_id)?.numero?.toString() || "—" : "Sin asignar",
    ])

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })

    doc.save("servidores.pdf")
  }

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Servidores Registrados</CardTitle>
            <CardDescription>Total: {servidores.length} servidores</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportarPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula o correo..."
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
                  <TableHead>Foto</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Equipos</TableHead>
                  <TableHead>Mesa</TableHead>
                  {(adminUser?.is_super || canManagePayments) && <TableHead>Pago</TableHead>}
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServidores.map((servidor) => (
                  <TableRow key={servidor.id}>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 p-0">
                            <img
                              src={servidor.imagen || uiAvatarUrl(servidor.nombre_completo)}
                              alt={servidor.nombre_completo}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="!max-w-md max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{servidor.nombre_completo}</DialogTitle>
                          </DialogHeader>
                          <ServidorCard servidor={servidor} onUpdate={loadServidores} canEdit={canEditServidor(servidor)} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-left text-sm underline underline-offset-2 text-primary/90">{servidor.nombre_completo}</button>
                        </DialogTrigger>
                        <DialogContent className="!max-w-md max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{servidor.nombre_completo}</DialogTitle>
                          </DialogHeader>
                          <ServidorCard servidor={servidor} onUpdate={loadServidores} canEdit={canEditServidor(servidor)} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>{servidor.cedula}</TableCell>
                    <TableCell>{servidor.celular}</TableCell>
                    <TableCell>
                      {/* Mostrar badge si es líder o colíder, y luego los equipos separados por comas */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {(servidor.tipo_servidor === "lider" || servidor.tipo_servidor === "colider") && (
                          <Badge variant="default">{servidor.tipo_servidor === "lider" ? "Líder" : "Colíder"}</Badge>
                        )}
                        {(() => {
                          const equiposFiltrados = servidor.equipos?.filter(equipo => equipo !== "Líderes y colíderes") || []
                          
                          if (equiposFiltrados.length > 0) {
                            return <span className="text-sm">{equiposFiltrados.join(", ")}</span>
                          } else if (!servidor.tipo_servidor) {
                            return <span className="text-sm text-muted-foreground">Sin equipos</span>
                          }
                          return null
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {servidor.mesa_id ? (
                        <Dialog onOpenChange={(open: boolean) => {
                          if (open) loadServidores()
                        }}>
                          <DialogTrigger asChild>
                            <Badge variant="secondary" className="cursor-pointer">{mesas.find((m) => m.id === servidor.mesa_id)?.numero}</Badge>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Mesa {mesas.find((m) => m.id === servidor.mesa_id)?.numero}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium">Servidores asignados</h4>
                                <ul className="mt-2 space-y-2">
                                  {(() => {
                                    const asignados = servidores.filter((s) => s.mesa_id === servidor.mesa_id)
                                    // dedupe by id just in case
                                    const seen = new Set<string>()
                                    const unique = asignados.filter((s) => {
                                      if (seen.has(s.id)) return false
                                      seen.add(s.id)
                                      return true
                                    })
                                    const lideres = unique.filter((s) => s.tipo_servidor === "lider")
                                    const colideres = unique.filter((s) => s.tipo_servidor === "colider")
                                    const otros = unique.filter((s) => !s.tipo_servidor)

                                    return (
                                      <>
                                        {lideres.length > 0 && (
                                          <li>
                                            <div className="text-xs text-muted-foreground">Líder</div>
                                            <ul className="mt-1 space-y-1">
                                              {lideres.map((s) => (
                                                <li key={s.id}>
                                                  <Dialog>
                                                    <DialogTrigger asChild>
                                                      <button className="text-sm underline underline-offset-2 text-primary/90">{s.nombre_completo}</button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                      <ServidorCard servidor={s} onUpdate={loadServidores} canEdit={canEditServidor(s)} />
                                                    </DialogContent>
                                                  </Dialog>
                                                </li>
                                              ))}
                                            </ul>
                                          </li>
                                        )}

                                        {colideres.length > 0 && (
                                          <li>
                                            <div className="text-xs text-muted-foreground">Colíder</div>
                                            <ul className="mt-1 space-y-1">
                                              {colideres.map((s) => (
                                                <li key={s.id}>
                                                  <Dialog>
                                                    <DialogTrigger asChild>
                                                      <button className="text-sm underline underline-offset-2 text-primary/90">{s.nombre_completo}</button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                      <ServidorCard servidor={s} onUpdate={loadServidores} canEdit={canEditServidor(s)} />
                                                    </DialogContent>
                                                  </Dialog>
                                                </li>
                                              ))}
                                            </ul>
                                          </li>
                                        )}

                                        {otros.length > 0 && (
                                          <li>
                                            <div className="text-xs text-muted-foreground">Otros</div>
                                            <ul className="mt-1 space-y-1">
                                              {otros.map((s) => (
                                                <li key={s.id}>
                                                  <Dialog>
                                                    <DialogTrigger asChild>
                                                      <button className="text-sm underline underline-offset-2 text-primary/90">{s.nombre_completo}</button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                      <ServidorCard servidor={s} onUpdate={loadServidores} canEdit={canEditServidor(s)} />
                                                    </DialogContent>
                                                  </Dialog>
                                                </li>
                                              ))}
                                            </ul>
                                          </li>
                                        )}
                                      </>
                                    )
                                  })()}
                                </ul>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium">Caminantes asignados</h4>
                                <ul className="mt-2 space-y-1">
                                  {caminantes.filter((c) => c.mesa_id === servidor.mesa_id).map((c) => (
                                    <li key={c.id}>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <button className="text-sm underline underline-offset-2 text-primary/90">{c.nombre_completo}</button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <CaminanteCard caminante={c} onUpdate={loadServidores} />
                                        </DialogContent>
                                      </Dialog>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Badge variant="outline">Sin asignar</Badge>
                      )}
                    </TableCell>
                    {(adminUser?.is_super || canManagePayments) && (
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getPaymentBadgeClass(getPaymentStatus(servidor.monto_pagado, servidor.monto_total))}
                        >
                          ${servidor.monto_pagado.toLocaleString()} / ${servidor.monto_total.toLocaleString()}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {servidor.auth_user_id && admins.has(servidor.auth_user_id) ? (
                          <div className="h-8 w-8 flex items-center justify-center" title="Administrador">
                            <ShieldCheck className="h-4 w-4 text-black dark:text-white" />
                          </div>
                        ) : adminUser?.is_super ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => promoteToAdmin(servidor)}
                            disabled={isUpdating || promoteLoadingId === servidor.id}
                            title="Promover a administrador"
                          >
                            {promoteLoadingId === servidor.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldPlus className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        ) : null}
                        {(adminUser?.is_super || canManagePayments) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedServidor(servidor)
                                  setPaymentAmount("")
                                }}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                          <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Registrar Pago - {servidor.nombre_completo}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Monto total:</span>
                                <span className="font-medium">${servidor.monto_total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Pagado:</span>
                                <span className="font-medium">${servidor.monto_pagado.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Saldo:</span>
                                <span className="font-medium text-destructive">
                                  ${(servidor.monto_total - servidor.monto_pagado).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="payment-amount">Monto del Abono</Label>
                              <Input
                                id="payment-amount"
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="0"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setSelectedServidor(null)} disabled={isUpdating}>
                                Cancelar
                              </Button>
                              <Button onClick={updatePayment} disabled={isUpdating || !paymentAmount}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Registrar Abono
                              </Button>
                            </div>
                          </div>
                          </DialogContent>
                        </Dialog>
                        )}

                        <Button size="sm" variant="ghost" onClick={() => { setPendingDeleteId(servidor.id); setConfirmOpen(true) }} disabled={isUpdating || !adminUser?.is_super}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
      description="¿Estás seguro de que deseas eliminar este servidor? Esta acción no se puede deshacer."
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      onConfirm={async () => {
        await deleteServidor(pendingDeleteId || undefined)
      }}
    />
    </>
  )
}
