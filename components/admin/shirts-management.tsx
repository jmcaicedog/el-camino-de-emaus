"use client"

import { useEffect, useState } from "react"
import { Shirt, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { Servidor } from "@/lib/types"

interface ShirtsManagementProps {
  canManage: boolean
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-CO")}`
}

export function ShirtsManagement({ canManage }: ShirtsManagementProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [servers, setServers] = useState<Servidor[]>([])
  const [price, setPrice] = useState(0)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [serversResponse, settingsResponse] = await Promise.all([
        fetch("/api/servidores", { cache: "no-store" }),
        fetch("/api/retiro-settings", { cache: "no-store" }),
      ])
      if (!serversResponse.ok || !settingsResponse.ok) throw new Error("No fue posible cargar el panel de camisas")
      const [serversData, settings] = await Promise.all([serversResponse.json(), settingsResponse.json()])
      setServers(Array.isArray(serversData) ? serversData : [])
      setPrice(Math.max(0, Number(settings.precio_camisas) || 0))
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible cargar el panel de camisas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) void loadData()
  }, [open])

  const togglePaid = async (server: Servidor) => {
    setUpdatingId(server.id)
    try {
      const response = await fetch(`/api/servidores/${server.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camisa_pagada: !server.camisa_pagada }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || "No fue posible actualizar el pago")
      setServers((current) => current.map((item) => item.id === server.id ? { ...item, camisa_pagada: !server.camisa_pagada } : item))
      toast({ title: "Pago actualizado", description: server.camisa_pagada ? "Camisa marcada como pendiente." : "Camisa marcada como pagada." })
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "No fue posible actualizar el pago", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  if (!canManage) return null

  const shirtServers = servers.filter((server) => {
    const colors = Array.isArray(server.colores_camisa) ? server.colores_camisa : []
    return colors.length > 0 || Boolean(server.talla_camisa)
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir panel de camisas" title="Panel de camisas">
          <Shirt className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[96vw] max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Panel de camisas</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : shirtServers.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No hay servidores que hayan solicitado camisas.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Nombre del servidor</th>
                  <th className="px-4 py-3 text-left font-semibold">Talla</th>
                  <th className="px-4 py-3 text-left font-semibold">Colores solicitados</th>
                  <th className="px-4 py-3 text-right font-semibold">Total a pagar</th>
                  <th className="px-4 py-3 text-center font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {shirtServers.map((server) => {
                  const colors = Array.isArray(server.colores_camisa) ? server.colores_camisa : []
                  const quantity = Math.max(colors.length, 1)
                  const total = price * quantity
                  return (
                    <tr key={server.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{server.nombre_completo}</td>
                      <td className="px-4 py-3">{server.talla_camisa || "Sin especificar"}</td>
                      <td className="px-4 py-3">{colors.length ? colors.join(", ") : "Sin color especificado"}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(total)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant={server.camisa_pagada ? "default" : "outline"}
                          onClick={() => void togglePaid(server)}
                          disabled={updatingId === server.id}
                        >
                          {updatingId === server.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {server.camisa_pagada ? "Pagada" : "Pendiente"}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Precio por camisa: {formatMoney(price)}</p>
      </DialogContent>
    </Dialog>
  )
}
