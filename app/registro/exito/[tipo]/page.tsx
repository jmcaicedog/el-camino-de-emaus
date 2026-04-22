import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { getRetiroSettings } from "@/lib/retiro-settings"

type TipoRegistro = "caminante" | "servidor"

const PAGOS_URL = "https://www.opd.com.co/pagos"

export const dynamic = "force-dynamic"
export const revalidate = 0

function getRegistroCopy(tipo: TipoRegistro, costoCaminante: number, costoServidor: number) {
  if (tipo === "servidor") {
    return {
      titulo: "Registro de Servidor Exitoso",
      descripcion: "Tu inscripción como servidor ha sido registrada correctamente.",
      inversionLabel: "Inversión",
      inversion: costoServidor,
      regresarHref: "/registro/servidor",
      regresarLabel: "Registrar otro servidor",
    }
  }

  return {
    titulo: "Registro de Caminante Exitoso",
    descripcion: "Tu inscripción como caminante ha sido registrada correctamente.",
    inversionLabel: "Inversión",
    inversion: costoCaminante,
    regresarHref: "/registro/caminante",
    regresarLabel: "Registrar otro caminante",
  }
}

export default async function RegistroExitoTipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params
  if (tipo !== "caminante" && tipo !== "servidor") notFound()

  const settings = await getRetiroSettings()
  const logoSrc = settings.logo_url || "/logo.png"
  const copy = getRegistroCopy(tipo, Number(settings.costo_caminante) || 490000, Number(settings.costo_servidor) || 400000)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex flex-col items-center gap-6 mb-6">
          <Image src={logoSrc} alt="El Camino de Emaús" width={80} height={80} className="object-contain" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{copy.titulo}</CardTitle>
            <CardDescription>{copy.descripcion}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-lg border bg-blue-50/70 p-4 dark:bg-blue-950/30">
              <p className="text-lg font-semibold mb-3">
                {copy.inversionLabel}: ${copy.inversion.toLocaleString("es-CO")}
              </p>

              <div className="space-y-2 text-sm leading-relaxed">
                <p>
                  Realiza la consignación en la cuenta <strong>FUNDACIÓN EMAÚS PARA EL DESARROLLO PROFESIONAL, SOCIAL Y COMUNITARIO</strong>, NIT 901 637364-9, Cuenta de ahorros #042863332, Banco de Occidente.
                </p>
                <p>
                  La consignación puede hacerse en efectivo, cheque o transferencia bancaria. También puedes pagar con tarjeta de crédito en este link: {" "}
                  <a href={PAGOS_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                    www.opd.com.co/pagos
                  </a>
                </p>
                <p>También puedes transferir a través de la llave de Bre-b 0037939865.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={PAGOS_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button className="w-full">Paga aquí</Button>
              </a>

              <Link href={copy.regresarHref} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  {copy.regresarLabel}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
