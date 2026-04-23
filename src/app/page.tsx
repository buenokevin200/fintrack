import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">FinTrack</h1>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Controla tus finanzas en un solo lugar
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Gestiona tus tarjetas de crédito, suscripciones y servicios.
            Recibe recordatorios de pagos y comparte gastos con tu pareja.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="rounded-xl border p-6 text-left">
              <h3 className="font-semibold mb-2">Tarjetas de crédito</h3>
              <p className="text-sm text-muted-foreground">
                Administra múltiples tarjetas, monitorea el límite compartido
              </p>
            </div>
            <div className="rounded-xl border p-6 text-left">
              <h3 className="font-semibold mb-2">Suscripciones</h3>
              <p className="text-sm text-muted-foreground">
                Controla pagos recurrentes con recordatorios inteligentes
              </p>
            </div>
            <div className="rounded-xl border p-6 text-left">
              <h3 className="font-semibold mb-2">Reportes</h3>
              <p className="text-sm text-muted-foreground">
                Visualiza gastos por categoría y toma mejores decisiones
              </p>
            </div>
          </div>
          <Link href="/register">
            <Button size="lg">Comenzar gratis</Button>
          </Link>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        FinTrack &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
