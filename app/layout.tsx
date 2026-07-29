import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trazabilidad | Leadmind',
  description: 'Consulta y trazabilidad de activos y piezas — Leadmind (CAF).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
