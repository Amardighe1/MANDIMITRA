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
const BottomNav = dynamic(
  () => import('@/components/layout/BottomNav').then((mod) => mod.BottomNav),
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
  title: 'मंडीमित्र | AI-आधारित शेती बुद्धिमत्ता',
  description: 'भारतीय शेतकऱ्यांना AI-आधारित पीक जोखीम मूल्यांकन आणि बाजारभाव बुद्धिमत्तेच्या माध्यमातून सक्षम करणे.',
  keywords: ['शेती', 'पीक जोखीम', 'भाव अंदाज', 'AI', 'मशीन लर्निंग', 'भारत', 'मंडी', 'महाराष्ट्र'],
  authors: [{ name: 'मंडीमित्र टीम' }],
  openGraph: {
    title: 'मंडीमित्र | AI-आधारित शेती बुद्धिमत्ता',
    description: 'भारतीय शेतकऱ्यांना AI-आधारित पीक जोखीम मूल्यांकन आणि बाजारभाव बुद्धिमत्ता',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <CapacitorInit />
        <Providers>
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
