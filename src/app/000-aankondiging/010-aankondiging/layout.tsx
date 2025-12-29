import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aankondiging type - Gemeente',
  description: 'Kies tussen huwelijk of partnerschap',
  openGraph: {
    locale: 'nl_NL',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

