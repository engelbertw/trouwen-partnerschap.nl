import { z } from 'zod';

/**
 * Schema for a single witness (getuige)
 */
export const getuigeSchema = z.object({
  voornamen: z.string().min(1, 'Voornamen zijn verplicht').max(255),
  voorvoegsel: z.string().max(50).optional(),
  achternaam: z.string().min(1, 'Achternaam is verplicht').max(255),
  geboortedatum: z.string().date('Ongeldige geboortedatum'),
  isGemeentelijkeGetuige: z.boolean().default(false),
  documentUploadId: z.string().uuid('Ongeldig document ID').optional().nullable(),
});

export type GetuigeInput = z.infer<typeof getuigeSchema>;

/**
 * Schema for creating witnesses for a dossier
 * Must have between 2 and 4 witnesses total
 */
export const createGetuigenSchema = z.object({
  dossierId: z.string().uuid('Ongeldig dossier ID'),
  getuigen: z
    .array(getuigeSchema)
    .min(2, 'Minimaal 2 getuigen zijn verplicht')
    .max(4, 'Maximaal 4 getuigen zijn toegestaan'),
});

export type CreateGetuigenInput = z.infer<typeof createGetuigenSchema>;

/**
 * Schema for adding a single witness
 */
export const addGetuigeSchema = z.object({
  dossierId: z.string().uuid('Ongeldig dossier ID'),
  getuige: getuigeSchema,
});

export type AddGetuigeInput = z.infer<typeof addGetuigeSchema>;

/**
 * Schema for updating a witness
 */
export const updateGetuigeSchema = z.object({
  id: z.string().uuid('Ongeldig getuige ID'),
  voornamen: z.string().min(1, 'Voornamen zijn verplicht').max(255).optional(),
  voorvoegsel: z.string().max(50).optional().nullable(),
  achternaam: z.string().min(1, 'Achternaam is verplicht').max(255).optional(),
  geboortedatum: z.string().date('Ongeldige geboortedatum').optional(),
  isGemeentelijkeGetuige: z.boolean().optional(),
  documentUploadId: z.string().uuid('Ongeldig document ID').optional().nullable(),
});

export type UpdateGetuigeInput = z.infer<typeof updateGetuigeSchema>;

/**
 * Schema for deleting a witness
 * Validates that at least 2 witnesses remain
 */
export const deleteGetuigeSchema = z.object({
  id: z.string().uuid('Ongeldig getuige ID'),
  dossierId: z.string().uuid('Ongeldig dossier ID'),
});

export type DeleteGetuigeInput = z.infer<typeof deleteGetuigeSchema>;

