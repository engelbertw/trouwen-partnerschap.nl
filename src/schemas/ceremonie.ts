import { z } from 'zod';

/**
 * Schema for ceremony wishes
 */
export const ceremonieWensenSchema = z.object({
  taal: z.enum(['nl', 'en', 'fr', 'de', 'es'], {
    message: 'Ongeldige taal',
  }).default('nl'),
  trouwboekje: z.boolean().default(false),
  speech: z.boolean().default(true),
  speechTekst: z.string().max(2000).optional(),
  muziek: z.boolean().default(false),
  muziekKeuze: z.string().max(500).optional(),
  bloemen: z.boolean().default(false),
  fotograaf: z.boolean().default(false),
  extraWensen: z.string().max(1000).optional(),
});

export type CeremonieWensen = z.infer<typeof ceremonieWensenSchema>;

/**
 * Schema for creating/updating a ceremony
 */
export const createCeremonieSchema = z.object({
  dossierId: z.string().uuid('Ongeldig dossier ID'),
  typeCeremonieId: z.string().uuid('Ongeldig ceremonie type'),
  locatieId: z.string().uuid('Ongeldige locatie'),
  babsId: z.string().uuid('Ongeldige BABS').optional().nullable(),
  datum: z.string().date('Ongeldige datum'),
  tijdslotId: z.string().uuid('Ongeldig tijdslot').optional().nullable(),
  wensen: ceremonieWensenSchema.optional(),
}).refine(
  (data) => {
    // Validate that ceremony date is in the future
    const ceremonyDate = new Date(data.datum);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ceremonyDate >= today;
  },
  {
    message: 'Ceremonie datum moet in de toekomst liggen',
    path: ['datum'],
  }
);

export type CreateCeremonieInput = z.infer<typeof createCeremonieSchema>;

/**
 * Schema for updating a ceremony
 */
export const updateCeremonieSchema = z.object({
  id: z.string().uuid('Ongeldig ceremonie ID'),
  locatieId: z.string().uuid('Ongeldige locatie').optional(),
  babsId: z.string().uuid('Ongeldige BABS').optional().nullable(),
  datum: z.string().date('Ongeldige datum').optional(),
  tijdslotId: z.string().uuid('Ongeldig tijdslot').optional().nullable(),
  wensen: ceremonieWensenSchema.optional(),
}).refine(
  (data) => {
    // Validate that ceremony date is in the future if provided
    if (data.datum) {
      const ceremonyDate = new Date(data.datum);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return ceremonyDate >= today;
    }
    return true;
  },
  {
    message: 'Ceremonie datum moet in de toekomst liggen',
    path: ['datum'],
  }
);

export type UpdateCeremonieInput = z.infer<typeof updateCeremonieSchema>;

/**
 * Schema for own BABS validation
 */
export const eigenBabsSchema = z.object({
  naam: z.string().min(1, 'Naam is verplicht').max(255),
  voornaam: z.string().min(1, 'Voornaam is verplicht').max(100),
  achternaam: z.string().min(1, 'Achternaam is verplicht').max(100),
  beedigd_vanaf: z.string().date('Ongeldige beëdigingsdatum'),
  beedigd_tot: z.string().date('Ongeldige vervaldatum'),
  ceremonieDatum: z.string().date('Ongeldige ceremonie datum'),
}).refine(
  (data) => {
    // BABS must be sworn in at least 4 months before ceremony
    const ceremonyDate = new Date(data.ceremonieDatum);
    const swornInDate = new Date(data.beedigd_vanaf);
    const fourMonthsBeforeCeremony = new Date(ceremonyDate);
    fourMonthsBeforeCeremony.setMonth(fourMonthsBeforeCeremony.getMonth() - 4);
    return swornInDate <= fourMonthsBeforeCeremony;
  },
  {
    message: 'BABS moet minimaal 4 maanden voor de ceremonie beëdigd zijn',
    path: ['beedigd_vanaf'],
  }
).refine(
  (data) => {
    // BABS must still be valid on ceremony date
    const ceremonyDate = new Date(data.ceremonieDatum);
    const expiryDate = new Date(data.beedigd_tot);
    return expiryDate >= ceremonyDate;
  },
  {
    message: 'BABS moet nog geldig zijn op de ceremonie datum',
    path: ['beedigd_tot'],
  }
);

export type EigenBabsInput = z.infer<typeof eigenBabsSchema>;

