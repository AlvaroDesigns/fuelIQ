import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { HeroUIProvider } from '@/components/HeroUIProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FuelIQ — Tu combustible al mejor tipo de cambio (MITECO + Descuentos Revolut Style)',
  description:
    'Encuentra el precio real efectivo del combustible calculando descuentos de fidelización (Waylet, Cepsa Gow, BPme, Carrefour 8%), distancia y coste real de llenar el depósito en España.',
  keywords: [
    'gasolina barata',
    'gasolineras espana',
    'precios miteco',
    'waylet repsol descuento',
    'cepsa gow',
    'ahorro combustible',
    'comparador carburantes',
  ],
  authors: [{ name: 'FuelIQ Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark bg-black text-foreground">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} bg-[#04060a] text-white min-h-screen antialiased selection:bg-[#00D97E] selection:text-black`}>
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </body>
    </html>
  );
}
