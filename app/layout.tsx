import type { Metadata, Viewport } from 'next';
import { Poppins, Montserrat, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';

const poppins = Poppins({ subsets: ['latin'], weight: ['300','400','600','700','800','900'], variable: '--font-poppins' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400','600','700','800','900'], variable: '--font-montserrat' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400','600','700','800'], variable: '--font-plus-jakarta' });

export const metadata: Metadata = {
  title: 'Agronity25',
  description: 'Portal resmi mahasiswa Teknologi Industri Pertanian ULM 2025.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Agronity25', statusBarStyle: 'black-translucent' },
  icons: {
    icon: 'https://image2url.com/r2/default/images/1775039804162-457ef4f8-5b5d-46af-b13f-5da942fe6314.png',
    apple: 'https://image2url.com/r2/default/images/1775039804162-457ef4f8-5b5d-46af-b13f-5da942fe6314.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#eab308',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${poppins.variable} ${montserrat.variable} ${plusJakarta.variable}`}>
      <body className="font-sans">
        <Providers>
          {children}
          <Toaster richColors position="top-center" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
