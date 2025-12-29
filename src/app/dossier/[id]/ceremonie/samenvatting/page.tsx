import type { JSX } from 'react';
import { db } from '@/db';
import { dossier, ceremonie, locatie, babs, typeCeremonie, ceremonieWensSelectie, ceremonieWens } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { SamenvattingClient } from './SamenvattingClient';

interface CeremonieData {
  id: string | null;
  datum: string | null;
  startTijd: string | null;
  eindTijd: string | null;
  typeCeremonieId: string | null;
  locatieId: string | null;
  babsId: string | null;
  taal: string | null;
  eigenBabs: boolean | null;
  locatieNaam: string | null;
  locatieAdres: string | null;
  babsNaam: string | null;
  babsVoornaam: string | null;
  babsTussenvoegsel: string | null;
  babsAchternaam: string | null;
  typeCeremonieCode: string | null;
  typeCeremonieNaam: string | null;
  typeCeremonieDuur: number | null;
  typeCeremonieOmschrijving: string | null;
  typeCeremonieTalen: string[] | null;
  typeCeremonieEigenBabs: boolean | null;
}

interface SelectedWish {
  id: string;
  naam: string;
  prijsEuro: string;
  gratis: boolean;
}

// Helper to ensure value is not undefined
function toNullable<T>(value: T | undefined | null): T | null {
  return value === undefined ? null : value;
}

// Helper to format address object to string
function formatAddress(adres: any): string | null {
  // Handle null, undefined, or non-object values
  if (adres === null || adres === undefined) return null;
  if (typeof adres === 'string') {
    // Handle cases where JSONB might be returned as a string
    try {
      adres = JSON.parse(adres);
    } catch {
      return null;
    }
  }
  if (typeof adres !== 'object' || Array.isArray(adres)) return null;
  
  try {
    const parts = [
      adres.straat,
      adres.huisnummer,
      adres.postcode,
      adres.plaats,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  } catch (error) {
    console.error('Error formatting address:', error);
    return null;
  }
}

export default async function CeremonieSamenvattingPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<JSX.Element> {
  const { id: dossierId } = await params;

  let ceremonieData: CeremonieData | null = null;
  let selectedWishes: SelectedWish[] = [];

  try {
    // First get dossier info (where typeCeremonieId is stored)
    let dossierData = null;
    try {
      // First, get just the dossier to get typeCeremonieId
      const [dossierOnly] = await db
        .select({
          typeCeremonieId: dossier.typeCeremonieId,
        })
        .from(dossier)
        .where(eq(dossier.id, dossierId))
        .limit(1);

      if (dossierOnly?.typeCeremonieId) {
        console.log('[DEBUG] Found typeCeremonieId:', dossierOnly.typeCeremonieId);
        
        // If we have a typeCeremonieId, fetch the type details separately
        // Use raw SQL to safely handle JSONB talen field
        const typeDetailsRaw = await db.execute(sql`
          SELECT 
            id,
            naam,
            code,
            duur_minuten,
            omschrijving,
            COALESCE(talen::text, '[]') as talen_json,
            eigen_babs_toegestaan
          FROM ihw.type_ceremonie
          WHERE id = ${dossierOnly.typeCeremonieId}
          LIMIT 1
        `);

        if (typeDetailsRaw.rows && typeDetailsRaw.rows.length > 0) {
          const row = typeDetailsRaw.rows[0] as any;
          
          // Parse talen JSON safely
          let talenArray: string[] | null = null;
          try {
            const parsed = JSON.parse(row.talen_json);
            talenArray = Array.isArray(parsed) ? parsed : null;
          } catch {
            talenArray = null;
          }
          
          dossierData = {
            typeCeremonieId: dossierOnly.typeCeremonieId,
            typeCeremonieNaam: row.naam,
            typeCeremonieCode: row.code,
            typeCeremonieDuur: row.duur_minuten,
            typeCeremonieOmschrijving: row.omschrijving,
            typeCeremonieTalen: talenArray,
            typeCeremonieEigenBabs: row.eigen_babs_toegestaan,
          };
          
          console.log('[DEBUG] Dossier data fetched:', {
            hasData: true,
            typeCeremonieId: dossierData.typeCeremonieId,
            typeCeremonieNaam: dossierData.typeCeremonieNaam,
            typeCeremonieCode: dossierData.typeCeremonieCode,
            typeCeremonieDuur: dossierData.typeCeremonieDuur,
            hasArray: Array.isArray(dossierData.typeCeremonieTalen),
            talen: dossierData.typeCeremonieTalen,
          });
        } else {
          console.log('[DEBUG] No type ceremonie found for ID:', dossierOnly.typeCeremonieId);
        }
      } else {
        console.log('[DEBUG] No typeCeremonieId found in dossier:', dossierId);
      }
    } catch (dossierError) {
      console.error('[ERROR] Error fetching dossier data:', dossierError);
      dossierData = null;
    }

    // Then get ceremony data
    let results: any[] = [];
    try {
      results = await db
        .select({
          // Ceremony details
          id: ceremonie.id,
          datum: ceremonie.datum,
          startTijd: ceremonie.startTijd,
          eindTijd: ceremonie.eindTijd,
          locatieId: ceremonie.locatieId,
          babsId: ceremonie.babsId,
          taal: ceremonie.taal,
          // Location
          locatieNaam: locatie.naam,
          locatieAdres: locatie.adres,
          // BABS
          babsNaam: babs.naam,
          babsVoornaam: babs.voornaam,
          babsTussenvoegsel: babs.tussenvoegsel,
          babsAchternaam: babs.achternaam,
        })
        .from(ceremonie)
        .leftJoin(locatie, eq(ceremonie.locatieId, locatie.id))
        .leftJoin(babs, eq(ceremonie.babsId, babs.id))
        .where(eq(ceremonie.dossierId, dossierId))
        .limit(1);
    } catch (ceremonieError) {
      console.error('Error fetching ceremony data:', ceremonieError);
      results = [];
    }

    // Always create ceremonieData if we have dossier data (for ceremony type info)
    // or ceremony record data (for date/location/BABS info)
    if (dossierData || (results && results.length > 0 && results[0])) {
      const rawData = results && results.length > 0 ? results[0] : null;
      
      // Determine eigenBabs from babsId
      const eigenBabs = rawData?.babsId ? false : null; // If BABS selected, it's gemeente BABS
      
      // Convert all fields explicitly to avoid undefined
      ceremonieData = {
        id: toNullable(rawData?.id),
        datum: toNullable(rawData?.datum),
        startTijd: toNullable(rawData?.startTijd),
        eindTijd: toNullable(rawData?.eindTijd),
        typeCeremonieId: toNullable(dossierData?.typeCeremonieId),
        locatieId: toNullable(rawData?.locatieId),
        babsId: toNullable(rawData?.babsId),
        taal: toNullable(rawData?.taal),
        eigenBabs,
        locatieNaam: toNullable(rawData?.locatieNaam),
        locatieAdres: formatAddress(rawData?.locatieAdres), // Convert JSONB object to string
        babsNaam: toNullable(rawData?.babsNaam),
        babsVoornaam: toNullable(rawData?.babsVoornaam),
        babsTussenvoegsel: toNullable(rawData?.babsTussenvoegsel),
        babsAchternaam: toNullable(rawData?.babsAchternaam),
        typeCeremonieCode: toNullable(dossierData?.typeCeremonieCode),
        typeCeremonieNaam: toNullable(dossierData?.typeCeremonieNaam),
        typeCeremonieDuur: toNullable(dossierData?.typeCeremonieDuur),
        typeCeremonieOmschrijving: toNullable(dossierData?.typeCeremonieOmschrijving),
        typeCeremonieTalen: (dossierData && Array.isArray(dossierData.typeCeremonieTalen)) ? dossierData.typeCeremonieTalen : null,
        typeCeremonieEigenBabs: toNullable(dossierData?.typeCeremonieEigenBabs),
      };

      console.log('[DEBUG] Ceremony data created:', {
        typeCeremonieId: ceremonieData.typeCeremonieId,
        typeCeremonieNaam: ceremonieData.typeCeremonieNaam,
        typeCeremonieCode: ceremonieData.typeCeremonieCode,
        typeCeremonieDuur: ceremonieData.typeCeremonieDuur,
        typeCeremonieTalen: ceremonieData.typeCeremonieTalen,
      });

      // Fetch selected wishes if we have a ceremony ID
      if (rawData?.id) {
        try {
          const wishes = await db
            .select({
              id: ceremonieWens.id,
              naam: ceremonieWens.naam,
              prijsEuro: ceremonieWens.prijsEuro,
              gratis: ceremonieWens.gratis,
            })
            .from(ceremonieWensSelectie)
            .innerJoin(ceremonieWens, eq(ceremonieWensSelectie.wensId, ceremonieWens.id))
            .where(eq(ceremonieWensSelectie.ceremonieId, rawData.id));
          
          // Convert wishes with explicit typing, ensuring no undefined values
          if (Array.isArray(wishes) && wishes.length > 0) {
            selectedWishes = wishes.map(wish => ({
              id: wish?.id ? String(wish.id) : '',
              naam: wish?.naam ? String(wish.naam) : '',
              prijsEuro: wish?.prijsEuro ? String(wish.prijsEuro) : '0.00',
              gratis: wish?.gratis === true,
            }));
          }
        } catch (wishError) {
          console.error('Error fetching wishes:', wishError);
          selectedWishes = [];
        }
      }
    }
  } catch (error) {
    console.error('[ERROR] Error fetching ceremony data:', error);
    // Continue with null data - will show "Nog niet gekozen" for everything
  }

  console.log('[DEBUG] Final data being passed to client:', {
    hasCeremonieData: !!ceremonieData,
    typeCeremonieNaam: ceremonieData?.typeCeremonieNaam,
    typeCeremonieId: ceremonieData?.typeCeremonieId,
    wishesCount: selectedWishes.length,
  });

  return (
    <SamenvattingClient 
      dossierId={dossierId} 
      ceremonieData={ceremonieData} 
      selectedWishes={selectedWishes}
    />
  );
}
