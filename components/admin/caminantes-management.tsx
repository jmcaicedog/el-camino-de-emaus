"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CaminanteCard } from "@/components/servidor/caminante-card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, DollarSign } from "lucide-react"
import type { Caminante } from "@/lib/types"

export function CaminantesManagement() {
  const { toast } = useToast()
  const [caminantes, setCaminantes] = useState<Caminante[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCaminante, setSelectedCaminante] = useState<Caminante | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadCaminantes()
  }, [])

  const loadCaminantes = async () => {
    try {
      const response = await fetch("/api/caminantes")
      const data = await response.json()
      setCaminantes(data)
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

  const filteredCaminantes = caminantes.filter(
    (c) =>
      c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cedula.includes(searchTerm) ||
      c.correo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Caminantes Registrados</CardTitle>
          <CardDescription>Total: {caminantes.length} caminantes</CardDescription>
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
                    <TableCell className="font-medium">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-left text-sm underline underline-offset-2 text-primary/90">{caminante.nombre_completo}</button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{caminante.nombre_completo}</DialogTitle>
                          </DialogHeader>
                          <CaminanteCard caminante={caminante} onUpdate={loadCaminantes} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>{caminante.cedula}</TableCell>
                    <TableCell>{caminante.celular}</TableCell>
                    <TableCell>
                      {caminante.mesa_id ? (
                        <Badge variant="secondary">Asignado</Badge>
                      ) : (
                        <Badge variant="outline">Sin asignar</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={caminante.monto_pagado >= caminante.monto_total ? "default" : "secondary"}>
                        ${caminante.monto_pagado.toLocaleString()} / ${caminante.monto_total.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                                <span className="font-medium">${caminante.monto_total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Pagado:</span>
                                <span className="font-medium">${caminante.monto_pagado.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Saldo:</span>
                                <span className="font-medium text-destructive">
                                  ${(caminante.monto_total - caminante.monto_pagado).toLocaleString()}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
