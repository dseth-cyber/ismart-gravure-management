import type { Metadata } from 'next';
import { IBM_Plex_Sans_Thai, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai'],
  variable: '--font-ibm-plex-sans-thai',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Gravure Management System',
  description: 'iSmart Gravure Management System',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${ibmPlexSansThai.variable} ${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

