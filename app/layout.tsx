import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrestamosPro - Gestión de Préstamos',
  description: 'Gestiona clientes, préstamos y pagos desde cualquier lugar.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  )
}
