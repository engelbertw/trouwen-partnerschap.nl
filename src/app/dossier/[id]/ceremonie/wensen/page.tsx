import type { JSX } from 'react';
import { db } from '@/db';
import { ceremonieWens } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { WensenClient } from './WensenClient';

export default async function CeremonieWensenPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<JSX.Element> {
  const { id: dossierId } = await params;

  // Fetch active ceremony wishes from database
  const wensen = await db
    .select({
      id: ceremonieWens.id,
      code: ceremonieWens.code,
      naam: ceremonieWens.naam,
      omschrijving: ceremonieWens.omschrijving,
      prijsEuro: ceremonieWens.prijsEuro,
      gratis: ceremonieWens.gratis,
      actief: ceremonieWens.actief,
    })
    .from(ceremonieWens)
    .where(eq(ceremonieWens.actief, true))
    .orderBy(asc(ceremonieWens.volgorde), asc(ceremonieWens.naam));

  return <WensenClient wensen={wensen} dossierId={dossierId} />;
}

