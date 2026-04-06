import { CaminanteRegistrationForm } from "@/components/forms/caminante-registration-form"
import { WhatsAppButton } from "@/components/whatsapp-button"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getRetiroSettings } from "@/lib/retiro-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CaminanteRegistrationPage() {
  const settings = await getRetiroSettings()
  const logoSrc = settings.logo_url || "/logo.png"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-6 mb-8">
            <Image src={logoSrc} alt="El Camino de Emaús" width={80} height={80} className="object-contain" />
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Registro de Caminantes</h1>
              <p className="text-muted-foreground">Completa el formulario para inscribirte al retiro</p>
            </div>
          </div>

          <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-lg font-semibold mb-3">Inversión: ${Number(settings.costo_caminante).toLocaleString("es-CO")}</p>
            <div className="space-y-2 text-sm">
              <p>
                Realiza la consignación en la cuenta <strong>FUNDACIÓN EMAÚS PARA EL DESARROLLO PROFESIONAL, SOCIAL Y COMUNITARIO</strong>, NIT 901 637364-9, Cuenta de ahorros #042863332, Banco de Occidente.
              </p>
              <p>
                La consignación puede hacerse en efectivo, cheque o transferencia bancaria. También puedes pagar con tarjeta de crédito en este link:{" "}
                <a href="http://www.opd.com.co/pagos" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  www.opd.com.co/pagos
                </a>
              </p>
              <p>
                También puedes transferir a través de la llave de Bre-b <strong>0037939865</strong>.
              </p>
            </div>
          </div>

          {settings.caminante_form_enabled ? (
            <CaminanteRegistrationForm />
          ) : (
            <div className="mb-6 p-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-base font-semibold mb-2">Registro temporalmente deshabilitado</p>
              <p className="text-sm text-muted-foreground">
                En este momento el formulario de registro y lista de espera de caminantes está cerrado por administración.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <WhatsAppButton />
    </div>
  )
}
