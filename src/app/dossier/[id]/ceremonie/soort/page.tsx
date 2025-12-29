import type { JSX } from 'react';
import { db } from '@/db';
import { typeCeremonie } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { SoortCeremonieClient } from './SoortCeremonieClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SoortCeremoniePage({ params }: PageProps): Promise<JSX.Element> {
  const { id: dossierId } = await params;

  // Fetch active ceremony types from database
  const types = await db
    .select()
    .from(typeCeremonie)
    .where(eq(typeCeremonie.actief, true))
    .orderBy(asc(typeCeremonie.volgorde), asc(typeCeremonie.naam));

  return <SoortCeremonieClient dossierId={dossierId} types={types} />;
}
