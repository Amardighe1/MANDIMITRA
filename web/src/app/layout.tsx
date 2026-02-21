import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';
import { Providers } from './providers';

// Dynamically import Capacitor-only components to prevent SSR issues
const CapacitorInit = dynamic(
  () => import('@/components/CapacitorInit').then((mod) => mod.CapacitorInit),
  { ssr: false }
);
const ConnectionSetup = dynamic(
  () => import('@/components/ConnectionSetup').then((mod) => mod.ConnectionSetup),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'MANDIMITRA | AI-Powered Agricultural Intelligence',
  description: 'Empowering Indian Farmers with AI-driven crop risk assessment and price intelligence for smarter farming decisions.',
  keywords: ['agriculture', 'farming', 'crop risk', 'price prediction', 'AI', 'machine learning', 'India', 'mandi'],
  authors: [{ name: 'MANDIMITRA Team' }],
  openGraph: {
    title: 'MANDIMITRA | AI-Powered Agricultural Intelligence',
    description: 'Empowering Indian Farmers with AI-driven crop risk assessment and price intelligence',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <CapacitorInit />
        <ConnectionSetup />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
