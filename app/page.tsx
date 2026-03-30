import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { CountdownTimer } from "@/components/countdown-timer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-4 text-center">
            <Image src="/logo.png" alt="El Camino de Emaús" width={120} height={120} className="object-contain" />
            <h1 className="text-4xl font-bold text-balance">El Camino de Emaús</h1>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl">
              Retiro Espiritual Cristo Rey Hombres
              <br />
              Abril 10, 11 y 12 de 2026
            </p>
            <CountdownTimer />
          </div>

          <div className="grid md:grid-cols-2 gap-6 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Caminantes</CardTitle>
                <CardDescription>Inscríbete como participante del retiro</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/registro/caminante">
                  <Button className="w-full" size="lg">
                    Registrarme como Caminante
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registro de Servidores</CardTitle>
                <CardDescription>Inscríbete como servidor del retiro</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/registro/servidor">
                  <Button className="w-full bg-transparent" size="lg" variant="outline">
                    Registrarme como Servidor
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Link href="/auth/login">
              <Button variant="ghost">Acceso Administrativo</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
