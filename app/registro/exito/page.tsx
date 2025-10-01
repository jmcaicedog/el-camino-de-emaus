import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Image from "next/image"

export default function RegistroExitoPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center gap-6 mb-6">
          <Image src="/logo.png" alt="El Camino de Emaús" width={80} height={80} className="object-contain" />
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registro Exitoso</CardTitle>
            <CardDescription>Tu inscripción ha sido registrada correctamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Gracias por inscribirte al retiro El Camino de Emaús. Pronto recibirás más información sobre los
              siguientes pasos.
            </p>
            <div className="flex justify-center">
              <Link href="/">
                <Button>Volver al inicio</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
