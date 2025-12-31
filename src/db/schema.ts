import { pgSchema, uuid, text, timestamp, boolean, integer, date, time, jsonb, pgEnum, unique, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the ihw schema
export const ihw = pgSchema('ihw');

// ============================================================================
// GEMEENTE (Multi-Tenancy Master Table)
// ============================================================================

/**
 * Gemeente table - Master table for multi-tenancy
 * Each gemeente (municipality) has a unique OIN (Organisatie Identificatie Nummer)
 * All other tables reference this table via gemeente_oin
 */
export const gemeente = ihw.table('gemeente', {
  oin: text('oin').primaryKey(),  // 20-digit OIN
  naam: text('naam').notNull(),
  gemeenteCode: text('gemeente_code').notNull().unique(),
  actief: boolean('actief').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// ENUMS
// ============================================================================

export const dossierStatusEnum = pgEnum('dossier_status', [
  'draft',
  'in_review',
  'ready_for_payment',
  'locked',
  'cancelled',
]);

export const blockCodeEnum = pgEnum('block_code', [
  'aankondiging',
  'ceremonie',
  'getuigen',
  'papieren',
  'betaling',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
  'waived',
]);

export const babsStatusEnum = pgEnum('babs_status', [
  'beedigd',
  'in_aanvraag',
  'ongeldig',
]);

export const locatieTypeEnum = pgEnum('locatie_type', [
  'stadhuis',
  'stadsloket',
  'buitenlocatie',
]);

export const papierTypeEnum = pgEnum('papier_type', [
  'geboorteakte',
  'nationaliteitsverklaring',
  'identiteitsbewijs',
  'scheidingsbeschikking',
  'overlijdensakte',
  'trouwboekje',
  'anders',
]);

export const papierStatusEnum = pgEnum('papier_status', [
  'ontbreekt',
  'ingeleverd',
  'goedgekeurd',
  'afgekeurd',
]);

export const naamgebruikKeuzeEnum = pgEnum('naamgebruik_keuze', [
  'eigen',
  'partner',
  'eigen_partner',
  'partner_eigen',
]);

// ============================================================================
// TABLES
// ============================================================================

// Type Ceremonie (lookup)
export const typeCeremonie = ihw.table('type_ceremonie', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  naam: text('naam').notNull(),
  omschrijving: text('omschrijving'),
  uitgebreideOmschrijving: text('uitgebreide_omschrijving'),
  eigenBabsToegestaan: boolean('eigen_babs_toegestaan').notNull().default(false),
  gratis: boolean('gratis').notNull().default(false),
  budget: boolean('budget').notNull().default(false),
  prijsCents: integer('prijs_cents').notNull().default(0),
  openstellingWeken: integer('openstelling_weken').notNull().default(6),
  leadTimeDays: integer('lead_time_days').notNull().default(14),
  wijzigbaarTotDays: integer('wijzigbaar_tot_days').notNull().default(7),
  maxGetuigen: integer('max_getuigen').notNull().default(4),
  duurMinuten: integer('duur_minuten').default(60),
  talen: jsonb('talen').default(['nl']),
  actief: boolean('actief').notNull().default(true),
  volgorde: integer('volgorde').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Locatie (lookup)
export const locatie = ihw.table('locatie', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  naam: text('naam').notNull(),
  type: locatieTypeEnum('type').notNull(),
  adres: jsonb('adres'),
  afbeeldingUrl: text('afbeelding_url'),
  capaciteit: integer('capaciteit').default(50),
  actief: boolean('actief').notNull().default(true),
  prijsCents: integer('prijs_cents').notNull().default(0),
  toelichting: text('toelichting'),
  volgorde: integer('volgorde').notNull().default(0),
  beschikbaarheid: jsonb('beschikbaarheid').default({}),
  beschikbaarVanaf: date('beschikbaar_vanaf'),
  beschikbaarTot: date('beschikbaar_tot'),
  opmerkingBeschikbaarheid: text('opmerking_beschikbaarheid'),
  email: text('email'),
  calendarFeedToken: text('calendar_feed_token').unique(),
  calendarFeedEnabled: boolean('calendar_feed_enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// BABS (lookup)
export const babs = ihw.table('babs', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique(),
  naam: text('naam').notNull(),
  voornaam: text('voornaam'),
  tussenvoegsel: text('tussenvoegsel'),
  achternaam: text('achternaam').notNull(),
  status: babsStatusEnum('status').notNull().default('in_aanvraag'),
  beeddigdVanaf: date('beedigd_vanaf'),
  beeddigdTot: date('beedigd_tot'),
  aanvraagDatum: date('aanvraag_datum'),
  opmerkingen: text('opmerkingen'),
  beschikbaarheid: jsonb('beschikbaarheid').default({}),
  beschikbaarVanaf: date('beschikbaar_vanaf'),
  beschikbaarTot: date('beschikbaar_tot'),
  opmerkingBeschikbaarheid: text('opmerking_beschikbaarheid'),
  calendarFeedToken: text('calendar_feed_token').unique(),
  calendarFeedEnabled: boolean('calendar_feed_enabled').default(true),
  email: text('email'),
  talen: jsonb('talen').default(['nl']),
  actief: boolean('actief').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// BABS-Gemeente junction table (BABS can work for multiple gemeenten)
export const babsGemeente = ihw.table('babs_gemeente', {
  id: uuid('id').primaryKey().defaultRandom(),
  babsId: uuid('babs_id').notNull().references(() => babs.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin, { onDelete: 'cascade' }),
  actief: boolean('actief').notNull().default(true),
  actiefVanaf: date('actief_vanaf').notNull().defaultNow(),
  actiefTot: date('actief_tot'),
  opmerkingen: text('opmerkingen'),
  toegevoegdDoor: text('toegevoegd_door').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// BABS Ceremony Targets (yearly goals per gemeente)
export const babsGemeenteTarget = ihw.table('babs_gemeente_target', {
  id: uuid('id').primaryKey().defaultRandom(),
  babsId: uuid('babs_id').notNull().references(() => babs.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin, { onDelete: 'cascade' }),
  jaar: integer('jaar').notNull(),
  targetCeremonies: integer('target_ceremonies').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  unqBabsGemeenteJaar: unique('uq_babs_gemeente_jaar').on(table.babsId, table.gemeenteOin, table.jaar),
}));

// Dossier (main table)
export const dossier = ihw.table('dossier', {
  id: uuid('id').primaryKey().defaultRandom(),
  identificatie: text('identificatie').unique(),  // GEMMA-compliant zaak number (HUW-2025-000001)
  zaaktypeUrl: text('zaaktype_url'),  // URL to zaaktype in ZTC (GEMMA standard)
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  status: dossierStatusEnum('status').notNull().default('draft'),
  typeCeremonieId: uuid('type_ceremonie_id').references(() => typeCeremonie.id),
  municipalityCode: text('municipality_code').notNull().default('NL.IMBAG.Gemeente.0363'),
  iBurgerZakenCaseId: text('iburgerzaken_case_id'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  readyForPaymentAt: timestamp('ready_for_payment_at', { withTimezone: true }),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  ceremonyDate: date('ceremony_date'),
  isTest: boolean('is_test').notNull().default(false),
});

// Dossier Block
export const dossierBlock = ihw.table('dossier_block', {
  id: uuid('id').primaryKey().defaultRandom(),
  dossierId: uuid('dossier_id').notNull().references(() => dossier.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  code: blockCodeEnum('code').notNull(),
  complete: boolean('complete').notNull().default(false),
  required: boolean('required').notNull().default(true),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: text('completed_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Partner
export const partner = ihw.table('partner', {
  id: uuid('id').primaryKey().defaultRandom(),
  dossierId: uuid('dossier_id').notNull().references(() => dossier.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  sequence: integer('sequence').notNull(), // 1 or 2
  bsn: text('bsn'), // 9 digits, nullable
  voornamen: text('voornamen'),
  voorvoegsel: text('voorvoegsel'),
  geslachtsnaam: text('geslachtsnaam').notNull(),
  geboortedatum: date('geboortedatum').notNull(),
  geboorteplaats: text('geboorteplaats').notNull(),
  geboorteland: text('geboorteland').notNull().default('Nederland'),
  oudersOnbekend: boolean('ouders_onbekend').notNull().default(false),
  onderCuratele: boolean('onder_curatele').notNull().default(false),
  naamgebruikKeuze: naamgebruikKeuzeEnum('naamgebruik_keuze'),
  email: text('email'),
  telefoon: text('telefoon'),
  adres: text('adres'),
  postcode: text('postcode'),
  plaats: text('plaats'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Aankondiging
export const aankondiging = ihw.table('aankondiging', {
  id: uuid('id').primaryKey().defaultRandom(),
  dossierId: uuid('dossier_id').notNull().unique().references(() => dossier.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  reedsGehuwd: boolean('reeds_gehuwd').notNull().default(false),
  partnerschap: boolean('partnerschap').notNull().default(false),
  omzetting: boolean('omzetting').notNull().default(false),
  beidenNietWoonachtig: boolean('beiden_niet_woonachtig').notNull().default(false),
  bloedverwantschap: boolean('bloedverwantschap').notNull().default(false),
  valid: boolean('valid').notNull().default(false),
  invalidReason: text('invalid_reason'),
  aangemaaktOp: timestamp('aangemaakt_op', { withTimezone: true }).notNull().defaultNow(),
  gevalideerdOp: timestamp('gevalideerd_op', { withTimezone: true }),
  gevalideerdDoor: text('gevalideerd_door'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Ceremonie
export const ceremonie = ihw.table('ceremonie', {
  id: uuid('id').primaryKey().defaultRandom(),
  dossierId: uuid('dossier_id').notNull().unique().references(() => dossier.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  locatieId: uuid('locatie_id').notNull().references(() => locatie.id),
  babsId: uuid('babs_id').references(() => babs.id),
  eigenBabs: boolean('eigen_babs'),
  datum: date('datum').notNull(),
  startTijd: time('start_tijd').notNull(),
  eindTijd: time('eind_tijd').notNull(),
  wensen: jsonb('wensen').default({}),
  taal: text('taal').default('nl'),
  trouwboekje: boolean('trouwboekje').default(false),
  speech: boolean('speech').default(true),
  wijzigbaarTot: timestamp('wijzigbaar_tot', { withTimezone: true }).notNull(),
  geboektOp: timestamp('geboekt_op', { withTimezone: true }).notNull().defaultNow(),
  laatsteWijziging: timestamp('laatste_wijziging', { withTimezone: true }),
  gewijzigdDoor: text('gewijzigd_door'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Getuige
export const getuige = ihw.table('getuige', {
  id: uuid('id').primaryKey().defaultRandom(),
  dossierId: uuid('dossier_id').notNull().references(() => dossier.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  isGemeentelijkeGetuige: boolean('is_gemeentelijke_getuige').notNull().default(false),
  voornamen: text('voornamen').notNull(),
  voorvoegsel: text('voorvoegsel'),
  achternaam: text('achternaam').notNull(),
  geboortedatum: date('geboortedatum').notNull(),
  geboorteplaats: text('geboorteplaats'),
  documentUploadId: uuid('document_upload_id'),
  documentStatus: papierStatusEnum('document_status').default('ontbreekt'),
  volgorde: integer('volgorde').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Kind (children from previous marriages)
export const kind = ihw.table('kind', {
  id: uuid('id').primaryKey().defaultRandom(),
  dossierId: uuid('dossier_id').notNull().references(() => dossier.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  partnerId: uuid('partner_id').notNull().references(() => partner.id, { onDelete: 'cascade' }),
  voornamen: text('voornamen').notNull(),
  achternaam: text('achternaam').notNull(),
  geboortedatum: date('geboortedatum').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Papier (documents to be received)
export const papier = ihw.table('papier', {
  id: uuid('id').primaryKey().defaultRandom(),
  dossierId: uuid('dossier_id').notNull().references(() => dossier.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  partnerId: uuid('partner_id').references(() => partner.id),
  type: papierTypeEnum('type').notNull(),
  status: papierStatusEnum('status').notNull().default('ontbreekt'),
  omschrijving: text('omschrijving'),
  beoordeeldDoor: text('beoordeeld_door'),
  beoordeeldOp: timestamp('beoordeeld_op', { withTimezone: true }),
  opmerking: text('opmerking'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Document Optie (configurable document options per gemeente)
export const documentOptie = ihw.table('document_optie', {
  id: uuid('id').primaryKey().defaultRandom(),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  naam: text('naam').notNull(),
  omschrijving: text('omschrijving'),
  papierType: papierTypeEnum('papier_type').notNull(),
  prijsCents: integer('prijs_cents').notNull().default(0),
  gratis: boolean('gratis').notNull().default(false),
  verplicht: boolean('verplicht').notNull().default(false),
  actief: boolean('actief').notNull().default(true),
  volgorde: integer('volgorde').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Payment
export const payment = ihw.table('payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  dossierId: uuid('dossier_id').notNull().references(() => dossier.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  provider: text('provider').notNull().default('worldonline'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('EUR'),
  externalReference: text('external_reference'),
  externalTransactionId: text('external_transaction_id'),
  redirectUrl: text('redirect_url'),
  initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  paymentMethod: text('payment_method'),
  failureReason: text('failure_reason'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const gemeenteRelations = relations(gemeente, ({ many }) => ({
  dossiers: many(dossier),
  partners: many(partner),
  aankondigingen: many(aankondiging),
  ceremonies: many(ceremonie),
  getuigen: many(getuige),
  payments: many(payment),
  dossierBlocks: many(dossierBlock),
  kinderen: many(kind),
  papieren: many(papier),
}));

export const dossierRelations = relations(dossier, ({ one, many }) => ({
  gemeente: one(gemeente, {
    fields: [dossier.gemeenteOin],
    references: [gemeente.oin],
  }),
  typeCeremonie: one(typeCeremonie, {
    fields: [dossier.typeCeremonieId],
    references: [typeCeremonie.id],
  }),
  blocks: many(dossierBlock),
  partners: many(partner),
  aankondiging: one(aankondiging),
  ceremonie: one(ceremonie),
  getuigen: many(getuige),
  payments: many(payment),
  kinderen: many(kind),
}));

export const dossierBlockRelations = relations(dossierBlock, ({ one }) => ({
  dossier: one(dossier, {
    fields: [dossierBlock.dossierId],
    references: [dossier.id],
  }),
  gemeente: one(gemeente, {
    fields: [dossierBlock.gemeenteOin],
    references: [gemeente.oin],
  }),
}));

export const partnerRelations = relations(partner, ({ one, many }) => ({
  dossier: one(dossier, {
    fields: [partner.dossierId],
    references: [dossier.id],
  }),
  gemeente: one(gemeente, {
    fields: [partner.gemeenteOin],
    references: [gemeente.oin],
  }),
  kinderen: many(kind),
}));

export const aankondigingRelations = relations(aankondiging, ({ one }) => ({
  dossier: one(dossier, {
    fields: [aankondiging.dossierId],
    references: [dossier.id],
  }),
  gemeente: one(gemeente, {
    fields: [aankondiging.gemeenteOin],
    references: [gemeente.oin],
  }),
}));

export const ceremonieRelations = relations(ceremonie, ({ one }) => ({
  dossier: one(dossier, {
    fields: [ceremonie.dossierId],
    references: [dossier.id],
  }),
  gemeente: one(gemeente, {
    fields: [ceremonie.gemeenteOin],
    references: [gemeente.oin],
  }),
  locatie: one(locatie, {
    fields: [ceremonie.locatieId],
    references: [locatie.id],
  }),
  babs: one(babs, {
    fields: [ceremonie.babsId],
    references: [babs.id],
  }),
}));

export const getuigeRelations = relations(getuige, ({ one }) => ({
  dossier: one(dossier, {
    fields: [getuige.dossierId],
    references: [dossier.id],
  }),
  gemeente: one(gemeente, {
    fields: [getuige.gemeenteOin],
    references: [gemeente.oin],
  }),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  dossier: one(dossier, {
    fields: [payment.dossierId],
    references: [dossier.id],
  }),
  gemeente: one(gemeente, {
    fields: [payment.gemeenteOin],
    references: [gemeente.oin],
  }),
}));

export const kindRelations = relations(kind, ({ one }) => ({
  dossier: one(dossier, {
    fields: [kind.dossierId],
    references: [dossier.id],
  }),
  gemeente: one(gemeente, {
    fields: [kind.gemeenteOin],
    references: [gemeente.oin],
  }),
  partner: one(partner, {
    fields: [kind.partnerId],
    references: [partner.id],
  }),
}));

// ============================================================================
// TYPES
// ============================================================================

export type Gemeente = typeof gemeente.$inferSelect;
export type NewGemeente = typeof gemeente.$inferInsert;

export type Dossier = typeof dossier.$inferSelect;
export type NewDossier = typeof dossier.$inferInsert;

export type DossierBlock = typeof dossierBlock.$inferSelect;
export type NewDossierBlock = typeof dossierBlock.$inferInsert;

export type Partner = typeof partner.$inferSelect;
export type NewPartner = typeof partner.$inferInsert;

export type Aankondiging = typeof aankondiging.$inferSelect;
export type NewAankondiging = typeof aankondiging.$inferInsert;

export type Ceremonie = typeof ceremonie.$inferSelect;
export type NewCeremonie = typeof ceremonie.$inferInsert;

export type Getuige = typeof getuige.$inferSelect;
export type NewGetuige = typeof getuige.$inferInsert;

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;

export type Kind = typeof kind.$inferSelect;
export type NewKind = typeof kind.$inferInsert;

export const Papier = typeof papier.$inferSelect;
export type NewPapier = typeof papier.$inferInsert;

export type DocumentOptie = typeof documentOptie.$inferSelect;
export type NewDocumentOptie = typeof documentOptie.$inferInsert;

export type TypeCeremonie = typeof typeCeremonie.$inferSelect;
export type Locatie = typeof locatie.$inferSelect;
export type BABS = typeof babs.$inferSelect;

// Ceremonie Wens (lookup table for ceremony wishes)
export const ceremonieWens = ihw.table('ceremonie_wens', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  naam: text('naam').notNull(),
  omschrijving: text('omschrijving').notNull(),
  prijsEuro: numeric('prijs_euro', { precision: 10, scale: 2 }).notNull().default('0.00'),
  gratis: boolean('gratis').notNull().default(false),
  actief: boolean('actief').notNull().default(true),
  beschikbaarVoorTypes: jsonb('beschikbaar_voor_types').default([]),
  volgorde: integer('volgorde').notNull().default(0),
  icoon: text('icoon'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CeremonieWens = typeof ceremonieWens.$inferSelect;

// Ceremonie Wens Selectie (many-to-many)
export const ceremonieWensSelectie = ihw.table('ceremonie_wens_selectie', {
  id: uuid('id').primaryKey().defaultRandom(),
  ceremonieId: uuid('ceremonie_id').notNull().references(() => ceremonie.id, { onDelete: 'cascade' }),
  wensId: uuid('wens_id').notNull().references(() => ceremonieWens.id, { onDelete: 'cascade' }),
  notities: text('notities'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Ceremonie Custom Wens
export const ceremonieCustomWens = ihw.table('ceremonie_custom_wens', {
  id: uuid('id').primaryKey().defaultRandom(),
  ceremonieId: uuid('ceremonie_id').notNull().references(() => ceremonie.id, { onDelete: 'cascade' }),
  wensTekst: text('wens_tekst').notNull(),
  status: text('status').notNull().default('pending'),
  gemeenteNotities: text('gemeente_notities'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// BABS Recurring Rule (lookup for availability patterns)
export const babsRecurringRule = ihw.table('babs_recurring_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  babsId: uuid('babs_id').notNull().references(() => babs.id, { onDelete: 'cascade' }),
  ruleType: text('rule_type').notNull(),
  dayOfWeek: integer('day_of_week'),
  dayOfMonth: integer('day_of_month'),
  weekOfMonth: integer('week_of_month'),
  intervalWeeks: integer('interval_weeks'),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  validFrom: date('valid_from').notNull(),
  validUntil: date('valid_until'),
  rruleString: text('rrule_string'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// BABS Blocked Date (dates when BABS is not available)
export const babsBlockedDate = ihw.table('babs_blocked_date', {
  id: uuid('id').primaryKey().defaultRandom(),
  babsId: uuid('babs_id').notNull().references(() => babs.id, { onDelete: 'cascade' }),
  blockedDate: date('blocked_date').notNull(),
  allDay: boolean('all_day').notNull().default(true),
  startTime: time('start_time'),
  endTime: time('end_time'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by'),
});

export type BabsRecurringRule = typeof babsRecurringRule.$inferSelect;
export type NewBabsRecurringRule = typeof babsRecurringRule.$inferInsert;

export type BabsBlockedDate = typeof babsBlockedDate.$inferSelect;
export type NewBabsBlockedDate = typeof babsBlockedDate.$inferInsert;

// BABS Audit Log (tracking status changes)
export const babsAuditLog = ihw.table('babs_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  babsId: uuid('babs_id').notNull().references(() => babs.id, { onDelete: 'cascade' }),
  fieldName: text('field_name').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changedBy: text('changed_by').notNull(),
  changedByName: text('changed_by_name'),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
  changeReason: text('change_reason'),
  ipAddress: text('ip_address'),
});

export type BabsAuditLog = typeof babsAuditLog.$inferSelect;
export type NewBabsAuditLog = typeof babsAuditLog.$inferInsert;

// Locatie Recurring Rule (lookup for availability patterns)
export const locatieRecurringRule = ihw.table('locatie_recurring_rule', {
  id: uuid('id').primaryKey().defaultRandom(),
  locatieId: uuid('locatie_id').notNull().references(() => locatie.id, { onDelete: 'cascade' }),
  ruleType: text('rule_type').notNull(),
  dayOfWeek: integer('day_of_week'),
  dayOfMonth: integer('day_of_month'),
  weekOfMonth: integer('week_of_month'),
  intervalWeeks: integer('interval_weeks'),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  validFrom: date('valid_from').notNull(),
  validUntil: date('valid_until'),
  rruleString: text('rrule_string'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Locatie Blocked Date (dates when locatie is not available)
export const locatieBlockedDate = ihw.table('locatie_blocked_date', {
  id: uuid('id').primaryKey().defaultRandom(),
  locatieId: uuid('locatie_id').notNull().references(() => locatie.id, { onDelete: 'cascade' }),
  blockedDate: date('blocked_date').notNull(),
  allDay: boolean('all_day').notNull().default(true),
  startTime: time('start_time'),
  endTime: time('end_time'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by'),
});

export type LocatieRecurringRule = typeof locatieRecurringRule.$inferSelect;
export type NewLocatieRecurringRule = typeof locatieRecurringRule.$inferInsert;

export type LocatieBlockedDate = typeof locatieBlockedDate.$inferSelect;
export type NewLocatieBlockedDate = typeof locatieBlockedDate.$inferInsert;