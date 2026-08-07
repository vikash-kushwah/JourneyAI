import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
  title: 'JourneyAI',
  description: 'AI-powered travel planner by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-body antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
