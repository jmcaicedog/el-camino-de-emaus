import { CaminanteRegistrationForm } from "@/components/forms/caminante-registration-form"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function CaminanteRegistrationPage() {
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
            <Image src="/logo.png" alt="El Camino de Emaús" width={80} height={80} className="object-contain" />
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Registro de Caminantes</h1>
              <p className="text-muted-foreground">Completa el formulario para inscribirte al retiro</p>
            </div>
          </div>

          <CaminanteRegistrationForm />
        </div>
      </div>
    </div>
  )
}
