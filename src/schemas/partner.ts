import { z } from 'zod';

/**
 * Schema for creating a partner
 */
export const createPartnerSchema = z.object({
  dossierId: z.string().uuid('Ongeldig dossier ID'),
  sequence: z.number().int().min(1).max(2, 'Sequence moet 1 of 2 zijn'),
  voornamen: z.string().min(1, 'Voornamen zijn verplicht').max(255),
  voorvoegsel: z.string().max(50).optional(),
  geslachtsnaam: z.string().min(1, 'Geslachtsnaam is verplicht').max(255),
  geboortedatum: z.string().date('Ongeldige geboortedatum'),
  geboorteplaats: z.string().min(1, 'Geboorteplaats is verplicht').max(255),
  geboorteland: z.string().max(255).default('Nederland'),
  nationaliteit: z.string().max(100).optional(),
  geslacht: z.enum(['m', 'v', 'x'], {
    message: 'Ongeldig geslacht',
  }).optional(),
  bsn: z
    .string()
    .regex(/^\d{9}$/, 'BSN moet 9 cijfers zijn')
    .optional(),
  email: z.string().email('Ongeldig e-mailadres').optional(),
  telefoon: z
    .string()
    .regex(/^\+?[0-9\s\-()]+$/, 'Ongeldig telefoonnummer')
    .optional(),
  oudersOnbekend: z.boolean().default(false),
  naamgebruikKeuze: z
    .enum(['eigen', 'partner', 'eigen_partner', 'partner_eigen'], {
      message: 'Ongeldige naamgebruik keuze',
    })
    .optional(),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;

/**
 * Schema for updating a partner
 */
export const updatePartnerSchema = z.object({
  id: z.string().uuid('Ongeldig partner ID'),
  voornamen: z.string().min(1, 'Voornamen zijn verplicht').max(255).optional(),
  voorvoegsel: z.string().max(50).optional(),
  geslachtsnaam: z.string().min(1, 'Geslachtsnaam is verplicht').max(255).optional(),
  geboortedatum: z.string().date('Ongeldige geboortedatum').optional(),
  geboorteplaats: z.string().min(1, 'Geboorteplaats is verplicht').max(255).optional(),
  geboorteland: z.string().max(255).optional(),
  nationaliteit: z.string().max(100).optional(),
  geslacht: z.enum(['m', 'v', 'x']).optional(),
  bsn: z
    .string()
    .regex(/^\d{9}$/, 'BSN moet 9 cijfers zijn')
    .optional()
    .nullable(),
  email: z.string().email('Ongeldig e-mailadres').optional().nullable(),
  telefoon: z
    .string()
    .regex(/^\+?[0-9\s\-()]+$/, 'Ongeldig telefoonnummer')
    .optional()
    .nullable(),
  oudersOnbekend: z.boolean().optional(),
  naamgebruikKeuze: z
    .enum(['eigen', 'partner', 'eigen_partner', 'partner_eigen'])
    .optional()
    .nullable(),
});

export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;

