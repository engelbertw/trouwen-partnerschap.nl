import { z } from 'zod';

/**
 * Schema for creating a new dossier
 */
export const createDossierSchema = z.object({
  typeCeremonieId: z.string().uuid('Ongeldig ceremonie type'),
  ceremonyDate: z
    .string()
    .date('Ongeldige datum')
    .optional(),
});

export type CreateDossierInput = z.infer<typeof createDossierSchema>;

/**
 * Schema for updating a dossier
 */
export const updateDossierSchema = z.object({
  id: z.string().uuid('Ongeldig dossier ID'),
  status: z.enum(['draft', 'in_review', 'ready_for_payment', 'locked'], {
    message: 'Ongeldige status',
  }).optional(),
  typeCeremonieId: z.string().uuid('Ongeldig ceremonie type').optional(),
  lockAt: z.string().datetime('Ongeldige datum/tijd').optional(),
});

export type UpdateDossierInput = z.infer<typeof updateDossierSchema>;

/**
 * Schema for dossier block completion
 */
export const updateDossierBlockSchema = z.object({
  dossierId: z.string().uuid('Ongeldig dossier ID'),
  blockCode: z.enum(['aankondiging', 'ceremonie', 'getuigen', 'papieren', 'betaling'], {
    message: 'Ongeldig blok type',
  }),
  complete: z.boolean(),
});

export type UpdateDossierBlockInput = z.infer<typeof updateDossierBlockSchema>;

