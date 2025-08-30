import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/lib/providers';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FitForge - Your Fitness Companion',
  description: 'Transform your fitness journey with comprehensive tracking, workout plans, and progress monitoring.',
  keywords: ['fitness', 'workout', 'exercise', 'health', 'tracking'],
  authors: [{ name: 'FitForge Team' }],
  creator: 'FitForge',
  publisher: 'FitForge',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'FitForge - Your Fitness Companion',
    description: 'Transform your fitness journey with comprehensive tracking, workout plans, and progress monitoring.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitForge - Your Fitness Companion',
    description: 'Transform your fitness journey with comprehensive tracking, workout plans, and progress monitoring.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
