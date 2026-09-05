import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    'https://dtf-control-jero.gabriellescano2024.chatgpt.site',
  ),
  title: 'FRST Estampados — Gestión integral del taller',
  description:
    'Pedidos, producción, clientes, stock y armado de metros DTF en un solo lugar.',
  icons: {
    icon: '/logo-frst.png',
    apple: '/logo-frst.png',
  },
  openGraph: {
    title: 'FRST Estampados',
    description: 'Todo tu taller, en un solo lugar.',
    images: [
      {
        url: '/logo-frst.png',
        width: 1024,
        height: 1024,
        alt: 'Logo de FRST Estampados',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FRST Estampados',
    description: 'Todo tu taller, en un solo lugar.',
    images: ['/logo-frst.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
