"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ServidorCard } from "@/components/servidor/servidor-card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, DollarSign } from "lucide-react"
import type { Servidor } from "@/lib/types"

export function ServidoresManagement() {
  const { toast } = useToast()
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedServidor, setSelectedServidor] = useState<Servidor | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadServidores()
  }, [])

  const loadServidores = async () => {
    try {
      const response = await fetch("/api/servidores")
      const data = await response.json()
      setServidores(data)
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

  const filteredServidores = servidores.filter(
    (s) =>
      s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cedula.includes(searchTerm) ||
      s.correo.toLowerCase().includes(searchTerm.toLowerCase()),
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
          <CardTitle>Servidores Registrados</CardTitle>
          <CardDescription>Total: {servidores.length} servidores</CardDescription>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServidores.map((servidor) => (
                  <TableRow key={servidor.id}>
                    <TableCell className="font-medium">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-left text-sm underline underline-offset-2 text-primary/90">{servidor.nombre_completo}</button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{servidor.nombre_completo}</DialogTitle>
                          </DialogHeader>
                          <ServidorCard servidor={servidor} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>{servidor.cedula}</TableCell>
                    <TableCell>{servidor.celular}</TableCell>
                    <TableCell>
                      {servidor.tipo_servidor ? (
                        <Badge variant="default">{servidor.tipo_servidor === "lider" ? "Líder" : "Colíder"}</Badge>
                      ) : (
                        <Badge variant="outline">Sin definir</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {servidor.mesa_id ? (
                        <Badge variant="secondary">Asignado</Badge>
                      ) : (
                        <Badge variant="outline">Sin asignar</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={servidor.monto_pagado >= servidor.monto_total ? "default" : "secondary"}>
                        ${servidor.monto_pagado.toLocaleString()} / ${servidor.monto_total.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
