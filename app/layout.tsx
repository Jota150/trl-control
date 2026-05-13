import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TRL Control - Sistema de Falhas',
  description: 'Centro de Controle Operacional - Transelevadores',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
