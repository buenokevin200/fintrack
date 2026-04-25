import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Providers from "@/components/Providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FinTrack - Control Financiero",
  description: "Gestiona tus tarjetas de crédito, suscripciones y finanzas personales",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
