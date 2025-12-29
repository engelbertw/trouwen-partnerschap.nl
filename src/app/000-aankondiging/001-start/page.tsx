import type { Metadata, ResolvingMetadata } from 'next';
import type { JSX } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export const metadata: Metadata = {
  title: 'Start aankondiging - Gemeente',
  description: 'Start met het aankondigen van uw huwelijk of partnerschap',
  openGraph: {
    locale: 'nl_NL',
  },
};

/**
 * Start page voor aankondiging flow
 * Controleert authenticatie en redirect naar juiste stap
 */
export default async function StartAankondiging(): Promise<JSX.Element> {
  const { userId } = await auth();

  // Als niet ingelogd, redirect naar login
  if (!userId) {
    redirect('/sign-in?redirect_url=/000-aankondiging/001-start');
  }

  // TODO: Check of gebruiker al een actief dossier heeft
  // Voor nu, redirect naar eerste stap van het formulier
  redirect('/000-aankondiging/010-aankondiging');
}

