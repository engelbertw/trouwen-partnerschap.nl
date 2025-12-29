import type { Metadata } from 'next';
import { Noto_Sans, Noto_Serif } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { nlNL } from '@clerk/localizations';
import { dark } from '@clerk/themes';
import { Header } from '@/components/Header';
import './globals.css';

// NL Design System recommended fonts
const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  weight: ['400', '700'],
  display: 'swap',
});

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-noto-serif',
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Huwelijk',
  description: 'Trouwuitnodiging en informatie',
  openGraph: {
    locale: 'nl_NL',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={nlNL}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#154273', // NL Design System primary color
          fontFamily: notoSans.style.fontFamily,
          fontSize: '1rem',
        },
      }}
    >
      <html lang="nl" className={`${notoSans.variable} ${notoSerif.variable}`}>
        <body className={notoSans.className}>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

