"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CaminanteCard } from "@/components/servidor/caminante-card"
import type { AdminUser } from "@/lib/types"
import { ServidorCard } from "@/components/servidor/servidor-card"
import { uiAvatarUrl } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, DollarSign, Trash, FileDown } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Caminante, Servidor } from "@/lib/types"

interface CaminantesManagementProps {
  adminUser?: AdminUser
}

export function CaminantesManagement({ adminUser }: CaminantesManagementProps) {
  const { toast } = useToast()
  const [caminantes, setCaminantes] = useState<Caminante[]>([])
  const [mesas, setMesas] = useState<Array<{ id: string; numero: number }>>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCaminante, setSelectedCaminante] = useState<Caminante | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadCaminantes()
  }, [])

  const loadCaminantes = async () => {
    try {
      const [caminantesRes, mesasRes, servidoresRes] = await Promise.all([
        fetch("/api/caminantes"),
        fetch("/api/mesas"),
        fetch("/api/servidores"),
      ])
      const [caminantesData, mesasData, servidoresData] = await Promise.all([
        caminantesRes.json(),
        mesasRes.json(),
        servidoresRes.json(),
      ])
      setCaminantes(caminantesData)
      setMesas(mesasData)
      setServidores(servidoresData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar caminantes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const canEditCaminante = (caminante: Caminante) => {
    // Superadmin siempre puede editar
    if (adminUser?.is_super) return true
    
    if (!adminUser) return false

    // Miembros del equipo Cartas pueden editar cartas/fotos de cualquier caminante
    const myServidor = servidores.find(s => s.auth_user_id === adminUser.id)
    if (myServidor?.equipos?.includes('Cartas')) return true

    // Si no tiene mesa asignada, no puede editar (excepto superadmin)
    if (!caminante.mesa_id) return false
    
    // Verificar si el admin es líder o colíder de la mesa del caminante
    const mesaServidores = servidores.filter(s => s.mesa_id === caminante.mesa_id)
    const isLiderOrColider = mesaServidores.some(s => 
      s.auth_user_id === adminUser.id && 
      (s.tipo_servidor === 'lider' || s.tipo_servidor === 'colider')
    )
    
    return isLiderOrColider
  }

  const updatePayment = async () => {
    if (!selectedCaminante) return

    setIsUpdating(true)
    try {
      const amount = Number.parseFloat(paymentAmount)
      if (isNaN(amount) || amount < 0) {
        throw new Error("Monto inválido")
      }

      const newTotal = selectedCaminante.monto_pagado + amount

      const response = await fetch(`/api/caminantes/${selectedCaminante.id}`, {
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
      setSelectedCaminante(null)
      await loadCaminantes()
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

  const deleteCaminante = async (id?: string) => {
    if (!id) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/caminantes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast({ title: "Eliminado", description: "Caminante eliminado correctamente" })
      await loadCaminantes()
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Error al eliminar", variant: "destructive" })
    } finally {
      setIsUpdating(false)
      setPendingDeleteId(null)
    }
  }

  const filteredCaminantes = caminantes.filter(
    (c) =>
      c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cedula.includes(searchTerm) ||
      c.correo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Caminantes Registrados", 14, 20)
    doc.setFontSize(10)
    doc.text(`Total: ${filteredCaminantes.length} caminantes`, 14, 28)
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-CO")}`, 14, 34)

    const headers = ["#", "Nombre", "Cédula", "Celular", "Mesa"]
    const data = filteredCaminantes.map((c, i) => [
      i + 1,
      c.nombre_completo,
      c.cedula,
      c.celular,
      c.mesa_id ? mesas.find(m => m.id === c.mesa_id)?.numero?.toString() || "\u2014" : "Sin asignar",
    ])

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })

    doc.save("caminantes.pdf")
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
            <CardTitle>Caminantes Registrados</CardTitle>
            <CardDescription>Total: {caminantes.length} caminantes</CardDescription>
          </div>
          {adminUser?.is_super && (
            <Button variant="outline" size="sm" onClick={exportarPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          )}
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
                  <TableHead className="w-12">Foto</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCaminantes.map((caminante) => (
                  <TableRow key={caminante.id}>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 p-0">
                            <img
                              src={caminante.imagen || uiAvatarUrl(caminante.nombre_completo)}
                              alt={caminante.nombre_completo}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{caminante.nombre_completo}</DialogTitle>
                          </DialogHeader>
                          <CaminanteCard caminante={caminante} onUpdate={loadCaminantes} canEdit={canEditCaminante(caminante)} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="flex items-center gap-2 cursor-pointer">
                            <button className="text-left text-sm underline underline-offset-2 text-primary/90">{caminante.nombre_completo}</button>
                            {caminante.es_sorpresa && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                                Sorpresa
                              </Badge>
                            )}
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{caminante.nombre_completo}</DialogTitle>
                          </DialogHeader>
                          <CaminanteCard caminante={caminante} onUpdate={loadCaminantes} canEdit={canEditCaminante(caminante)} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>{caminante.cedula}</TableCell>
                    <TableCell>{caminante.celular}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {caminante.mesa_id ? (
                        <Dialog onOpenChange={(open: boolean) => {
                          if (open) loadCaminantes()
                        }}>
                          <DialogTrigger asChild>
                            <Badge variant="secondary" className="cursor-pointer">
                              {mesas.find((m) => m.id === caminante.mesa_id)?.numero}
                            </Badge>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Mesa {mesas.find((m) => m.id === caminante.mesa_id)?.numero}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium">Servidores asignados</h4>
                                <ul className="mt-2 space-y-2">
                                  {(() => {
                                    const asignados = servidores.filter((s) => s.mesa_id === caminante.mesa_id)
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
                                                      <ServidorCard servidor={s} onUpdate={loadCaminantes} />
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
                                                      <ServidorCard servidor={s} onUpdate={loadCaminantes} />
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
                                                      <ServidorCard servidor={s} onUpdate={loadCaminantes} />
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
                                  {caminantes
                                    .filter((c) => c.mesa_id === caminante.mesa_id)
                                    .map((c) => (
                                      <li key={c.id}>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <button className="text-sm underline underline-offset-2 text-primary/90">{c.nombre_completo}</button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <CaminanteCard caminante={c} onUpdate={loadCaminantes} canEdit={canEditCaminante(c)} />
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
                    <TableCell>
                      <Badge variant={caminante.monto_pagado >= caminante.monto_total ? "default" : "secondary"}>
                        {`$${caminante.monto_pagado.toLocaleString()} / $${caminante.monto_total.toLocaleString()}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {adminUser?.is_super && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCaminante(caminante)
                                  setPaymentAmount("")
                                }}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                          <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Registrar Pago - {caminante.nombre_completo}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Monto total:</span>
                                <span className="font-medium">{`$${caminante.monto_total.toLocaleString()}`}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Pagado:</span>
                                <span className="font-medium">{`$${caminante.monto_pagado.toLocaleString()}`}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Saldo:</span>
                                <span className="font-medium text-destructive">
                                  {`$${(caminante.monto_total - caminante.monto_pagado).toLocaleString()}`}
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
                              <Button
                                variant="outline"
                                onClick={() => setSelectedCaminante(null)}
                                disabled={isUpdating}
                              >
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

                        <Button size="sm" variant="ghost" onClick={() => { setPendingDeleteId(caminante.id); setConfirmOpen(true) }} disabled={isUpdating || !adminUser?.is_super}>
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
      description="¿Estás seguro de que deseas eliminar este caminante? Esta acción no se puede deshacer."
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      onConfirm={async () => {
        await deleteCaminante(pendingDeleteId || undefined)
      }}
    />
    </>
  )
}
