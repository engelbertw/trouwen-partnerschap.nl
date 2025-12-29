import { pgTable, pgSchema, index, foreignKey, check, uuid, text, date, timestamp, unique, serial, varchar, integer, boolean, inet, time, smallint, char, jsonb, bigint, uniqueIndex, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const ihw = pgSchema("ihw");
export const babsStatusInIhw = ihw.enum("babs_status", ['beedigd', 'in_aanvraag', 'ongeldig'])
export const blockCodeInIhw = ihw.enum("block_code", ['aankondiging', 'ceremonie', 'getuigen', 'papieren', 'betaling'])
export const brpExportStatusInIhw = ihw.enum("brp_export_status", ['scheduled', 'in_progress', 'done', 'failed'])
export const dossierStatusInIhw = ihw.enum("dossier_status", ['draft', 'in_review', 'ready_for_payment', 'locked', 'cancelled'])
export const locatieTypeInIhw = ihw.enum("locatie_type", ['stadhuis', 'stadsloket', 'buitenlocatie'])
export const naamgebruikKeuzeInIhw = ihw.enum("naamgebruik_keuze", ['eigen', 'partner', 'eigen_partner', 'partner_eigen'])
export const papierStatusInIhw = ihw.enum("papier_status", ['ontbreekt', 'ingeleverd', 'goedgekeurd', 'afgekeurd'])
export const papierTypeInIhw = ihw.enum("papier_type", ['geboorteakte', 'nationaliteitsverklaring', 'identiteitsbewijs', 'scheidingsbeschikking', 'overlijdensakte', 'trouwboekje', 'anders'])
export const paymentStatusInIhw = ihw.enum("payment_status", ['pending', 'paid', 'failed', 'refunded', 'waived'])
export const refundStatusInIhw = ihw.enum("refund_status", ['requested', 'approved', 'processed', 'failed'])
export const senderRoleInIhw = ihw.enum("sender_role", ['burger', 'medewerker'])

export const zaakSequence2025InIhw = ihw.sequence("zaak_sequence_2025", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })
export const zaakSequence03632025InIhw = ihw.sequence("zaak_sequence_0363_2025", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const kindInIhw = ihw.table("kind", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
	partnerId: uuid("partner_id").notNull(),
	voornamen: text().notNull(),
	achternaam: text().notNull(),
	geboortedatum: date().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_kind_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_kind_gemeente").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_kind_partner").using("btree", table.partnerId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "kind_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "kind_gemeente_oin_fkey"
		}),
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [partnerInIhw.id],
			name: "kind_partner_id_fkey"
		}).onDelete("cascade"),
	check("chk_geboortedatum_kind", sql`geboortedatum <= CURRENT_DATE`),
]);

export const validatieRegelInIhw = ihw.table("validatie_regel", {
	id: serial().primaryKey().notNull(),
	regelCode: varchar("regel_code", { length: 50 }).notNull(),
	categorie: varchar({ length: 50 }).notNull(),
	veldNaam: varchar("veld_naam", { length: 100 }).notNull(),
	regelType: varchar("regel_type", { length: 30 }).notNull(),
	beschrijving: text().notNull(),
	technischeRegel: text("technische_regel").notNull(),
	foutmelding: text().notNull(),
	rationale: text(),
	wettelijkeBasis: text("wettelijke_basis"),
	prioriteit: integer().default(1),
	actief: boolean().default(true),
	toegevoegdOp: timestamp("toegevoegd_op", { withTimezone: true, mode: 'string' }).defaultNow(),
	laatstGewijzigd: timestamp("laatst_gewijzigd", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_validatie_regel_actief").using("btree", table.actief.asc().nullsLast().op("bool_ops")),
	index("idx_validatie_regel_categorie").using("btree", table.categorie.asc().nullsLast().op("text_ops")),
	index("idx_validatie_regel_code").using("btree", table.regelCode.asc().nullsLast().op("text_ops")),
	unique("validatie_regel_regel_code_key").on(table.regelCode),
	check("validatie_regel_prioriteit_check", sql`prioriteit = ANY (ARRAY[1, 2, 3])`),
]);

export const validatieLogInIhw = ihw.table("validatie_log", {
	id: serial().primaryKey().notNull(),
	validatieRegelId: integer("validatie_regel_id"),
	dossierId: integer("dossier_id"),
	veldWaarde: text("veld_waarde"),
	resultaat: varchar({ length: 20 }).notNull(),
	foutmelding: text(),
	gebruikerId: varchar("gebruiker_id", { length: 255 }),
	ipAdres: inet("ip_adres"),
	toegepastOp: timestamp("toegepast_op", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_validatie_log_datum").using("btree", table.toegepastOp.asc().nullsLast().op("timestamptz_ops")),
	index("idx_validatie_log_regel").using("btree", table.validatieRegelId.asc().nullsLast().op("int4_ops")),
	index("idx_validatie_log_resultaat").using("btree", table.resultaat.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.validatieRegelId],
			foreignColumns: [validatieRegelInIhw.id],
			name: "validatie_log_validatie_regel_id_fkey"
		}),
	check("validatie_log_resultaat_check", sql`(resultaat)::text = ANY ((ARRAY['geslaagd'::character varying, 'gefaald'::character varying, 'waarschuwing'::character varying])::text[])`),
]);

export const babsRecurringRuleInIhw = ihw.table("babs_recurring_rule", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	babsId: uuid("babs_id").notNull(),
	ruleType: text("rule_type").notNull(),
	dayOfWeek: integer("day_of_week"),
	dayOfMonth: integer("day_of_month"),
	weekOfMonth: integer("week_of_month"),
	intervalWeeks: integer("interval_weeks"),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	validFrom: date("valid_from").notNull(),
	validUntil: date("valid_until"),
	rruleString: text("rrule_string"),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_babs_recurring_rule_babs_id").using("btree", table.babsId.asc().nullsLast().op("uuid_ops")),
	index("idx_babs_recurring_rule_validity").using("btree", table.validFrom.asc().nullsLast().op("date_ops"), table.validUntil.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.babsId],
			foreignColumns: [babsInIhw.id],
			name: "babs_recurring_rule_babs_id_fkey"
		}).onDelete("cascade"),
	check("babs_recurring_rule_rule_type_check", sql`rule_type = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly_day'::text, 'monthly_weekday'::text, 'custom'::text])`),
	check("chk_day_of_week", sql`(day_of_week IS NULL) OR ((day_of_week >= 0) AND (day_of_week <= 6))`),
	check("chk_day_of_month", sql`(day_of_month IS NULL) OR ((day_of_month >= 1) AND (day_of_month <= 31))`),
	check("chk_week_of_month", sql`(week_of_month IS NULL) OR ((week_of_month >= 1) AND (week_of_month <= 5))`),
	check("chk_time_order", sql`start_time < end_time`),
]);

export const documentOptieInIhw = ihw.table("document_optie", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
	code: text().notNull(),
	naam: text().notNull(),
	omschrijving: text(),
	papierType: papierTypeInIhw("papier_type").notNull(),
	prijsCents: integer("prijs_cents").default(0).notNull(),
	gratis: boolean().default(false).notNull(),
	verplicht: boolean().default(false).notNull(),
	actief: boolean().default(true).notNull(),
	volgorde: smallint().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_document_optie_actief").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops"), table.actief.asc().nullsLast().op("text_ops")).where(sql`(actief = true)`),
	index("idx_document_optie_gemeente").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_document_optie_volgorde").using("btree", table.gemeenteOin.asc().nullsLast().op("int2_ops"), table.volgorde.asc().nullsLast().op("int2_ops")),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "document_optie_gemeente_oin_fkey"
		}).onDelete("cascade"),
	unique("uq_gemeente_code").on(table.gemeenteOin, table.code),
	check("chk_prijs_cents", sql`prijs_cents >= 0`),
	check("chk_gratis_prijs", sql`((gratis = true) AND (prijs_cents = 0)) OR (gratis = false)`),
]);

export const babsBlockedDateInIhw = ihw.table("babs_blocked_date", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	babsId: uuid("babs_id").notNull(),
	blockedDate: date("blocked_date").notNull(),
	allDay: boolean("all_day").default(true).notNull(),
	startTime: time("start_time"),
	endTime: time("end_time"),
	reason: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_babs_blocked_date_babs_id").using("btree", table.babsId.asc().nullsLast().op("uuid_ops")),
	index("idx_babs_blocked_date_date").using("btree", table.blockedDate.asc().nullsLast().op("date_ops")),
	index("idx_babs_blocked_date_lookup").using("btree", table.babsId.asc().nullsLast().op("date_ops"), table.blockedDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.babsId],
			foreignColumns: [babsInIhw.id],
			name: "babs_blocked_date_babs_id_fkey"
		}).onDelete("cascade"),
	check("chk_time_when_not_all_day", sql`(all_day = true) OR ((start_time IS NOT NULL) AND (end_time IS NOT NULL))`),
	check("chk_blocked_time_order", sql`(all_day = true) OR (start_time < end_time)`),
]);

export const typeCeremonieInIhw = ihw.table("type_ceremonie", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	naam: text().notNull(),
	omschrijving: text(),
	eigenBabsToegestaan: boolean("eigen_babs_toegestaan").default(false).notNull(),
	gratis: boolean().default(false).notNull(),
	budget: boolean().default(false).notNull(),
	openstellingWeken: integer("openstelling_weken").default(6).notNull(),
	leadTimeDays: integer("lead_time_days").default(14).notNull(),
	wijzigbaarTotDays: integer("wijzigbaar_tot_days").default(7).notNull(),
	maxGetuigen: integer("max_getuigen").default(4).notNull(),
	actief: boolean().default(true).notNull(),
	volgorde: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_type_ceremonie_actief").using("btree", table.actief.asc().nullsLast().op("bool_ops")).where(sql`(actief = true)`),
	index("idx_type_ceremonie_volgorde").using("btree", table.volgorde.asc().nullsLast().op("int4_ops")),
	unique("type_ceremonie_code_key").on(table.code),
	check("chk_openstelling_weken", sql`openstelling_weken > 0`),
	check("chk_lead_time_days", sql`lead_time_days >= 0`),
	check("chk_wijzigbaar_tot_days", sql`wijzigbaar_tot_days >= 0`),
	check("chk_max_getuigen", sql`(max_getuigen >= 2) AND (max_getuigen <= 10)`),
]);

export const dossierInIhw = ihw.table("dossier", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	status: dossierStatusInIhw().default('draft').notNull(),
	typeCeremonieId: uuid("type_ceremonie_id"),
	municipalityCode: text("municipality_code").default('NL.IMBAG.Gemeente.0363').notNull(),
	iburgerzakenCaseId: text("iburgerzaken_case_id"),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	readyForPaymentAt: timestamp("ready_for_payment_at", { withTimezone: true, mode: 'string' }),
	lockedAt: timestamp("locked_at", { withTimezone: true, mode: 'string' }),
	ceremonyDate: date("ceremony_date"),
	isTest: boolean("is_test").default(false).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
	identificatie: text(),
	zaaktypeUrl: text("zaaktype_url"),
}, (table) => [
	index("idx_dossier_ceremony_date").using("btree", table.ceremonyDate.asc().nullsLast().op("date_ops")).where(sql`(ceremony_date IS NOT NULL)`),
	index("idx_dossier_created_by").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	index("idx_dossier_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_dossier_iburgerzaken").using("btree", table.iburgerzakenCaseId.asc().nullsLast().op("text_ops")).where(sql`(iburgerzaken_case_id IS NOT NULL)`),
	index("idx_dossier_identificatie").using("btree", table.identificatie.asc().nullsLast().op("text_ops")),
	index("idx_dossier_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_dossier_type_ceremonie").using("btree", table.typeCeremonieId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.typeCeremonieId],
			foreignColumns: [typeCeremonieInIhw.id],
			name: "dossier_type_ceremonie_id_fkey"
		}),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_dossier_gemeente"
		}),
	unique("dossier_identificatie_key").on(table.identificatie),
	check("chk_identificatie_format", sql`(identificatie IS NULL) OR (identificatie ~ '^[A-Z]+-[0-9]{4}-[0-9]{4}-[0-9]{6}$'::text)`),
	check("chk_locked_requires_payment", sql`(status <> 'locked'::ihw.dossier_status) OR ((ready_for_payment_at IS NOT NULL) AND (locked_at IS NOT NULL))`),
]);

export const partnerInIhw = ihw.table("partner", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	sequence: smallint().notNull(),
	bsn: char({ length: 9 }),
	voornamen: text(),
	voorvoegsel: text(),
	geslachtsnaam: text().notNull(),
	geboortedatum: date().notNull(),
	geboorteplaats: text().notNull(),
	geboorteland: text().default('Nederland').notNull(),
	oudersOnbekend: boolean("ouders_onbekend").default(false).notNull(),
	naamgebruikKeuze: naamgebruikKeuzeInIhw("naamgebruik_keuze"),
	email: text(),
	telefoon: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
	adres: text(),
	postcode: text(),
	plaats: text(),
}, (table) => [
	index("idx_partner_bsn").using("btree", table.bsn.asc().nullsLast().op("bpchar_ops")).where(sql`(bsn IS NOT NULL)`),
	index("idx_partner_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_partner_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "partner_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_partner_gemeente"
		}),
	unique("uq_partner_sequence").on(table.dossierId, table.sequence),
	check("chk_sequence", sql`sequence = ANY (ARRAY[1, 2])`),
	check("chk_bsn_format", sql`(bsn IS NULL) OR (bsn ~ '^\d{9}$'::text)`),
]);

export const locatieInIhw = ihw.table("locatie", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	naam: text().notNull(),
	type: locatieTypeInIhw().notNull(),
	adres: jsonb(),
	capaciteit: integer().default(50),
	actief: boolean().default(true).notNull(),
	prijsCents: integer("prijs_cents").default(0).notNull(),
	toelichting: text(),
	volgorde: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	afbeeldingUrl: text("afbeelding_url"),
}, (table) => [
	index("idx_locatie_actief").using("btree", table.actief.asc().nullsLast().op("bool_ops")).where(sql`(actief = true)`),
	index("idx_locatie_type").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("idx_locatie_volgorde").using("btree", table.volgorde.asc().nullsLast().op("int4_ops")),
	unique("locatie_code_key").on(table.code),
	check("chk_capaciteit", sql`capaciteit > 0`),
	check("chk_prijs_cents", sql`prijs_cents >= 0`),
]);

export const babsInIhw = ihw.table("babs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text(),
	naam: text().notNull(),
	voornaam: text(),
	tussenvoegsel: text(),
	achternaam: text().notNull(),
	status: babsStatusInIhw().default('in_aanvraag').notNull(),
	beedigdVanaf: date("beedigd_vanaf"),
	beedigdTot: date("beedigd_tot"),
	aanvraagDatum: date("aanvraag_datum"),
	opmerkingen: text(),
	actief: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	beschikbaarheid: jsonb().default({}),
	beschikbaarVanaf: date("beschikbaar_vanaf"),
	beschikbaarTot: date("beschikbaar_tot"),
	opmerkingBeschikbaarheid: text("opmerking_beschikbaarheid"),
}, (table) => [
	index("idx_babs_actief").using("btree", table.actief.asc().nullsLast().op("bool_ops")).where(sql`(actief = true)`),
	index("idx_babs_beedigd_tot").using("btree", table.beedigdTot.asc().nullsLast().op("date_ops")).where(sql`(status = 'beedigd'::ihw.babs_status)`),
	index("idx_babs_beschikbaar").using("btree", table.actief.asc().nullsLast().op("date_ops"), table.beedigdVanaf.asc().nullsLast().op("bool_ops"), table.beedigdTot.asc().nullsLast().op("bool_ops")).where(sql`((actief = true) AND (status = 'beedigd'::ihw.babs_status))`),
	index("idx_babs_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	unique("babs_code_key").on(table.code),
	check("chk_beedigd_periode", sql`((status = 'beedigd'::ihw.babs_status) AND (beedigd_vanaf IS NOT NULL) AND (beedigd_tot IS NOT NULL)) OR (status <> 'beedigd'::ihw.babs_status)`),
	check("chk_beedigd_volgorde", sql`(beedigd_vanaf IS NULL) OR (beedigd_tot IS NULL) OR (beedigd_vanaf < beedigd_tot)`),
]);

export const gemeenteInIhw = ihw.table("gemeente", {
	oin: text().primaryKey().notNull(),
	naam: text().notNull(),
	gemeenteCode: text("gemeente_code").notNull(),
	actief: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_gemeente_actief").using("btree", table.actief.asc().nullsLast().op("bool_ops")).where(sql`(actief = true)`),
	unique("gemeente_gemeente_code_key").on(table.gemeenteCode),
	check("chk_gemeente_oin_format", sql`oin ~ '^\d{20}$'::text`),
	check("chk_gemeente_code_format", sql`gemeente_code ~ '^\d{4}$'::text`),
]);

export const ceremonieInIhw = ihw.table("ceremonie", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	locatieId: uuid("locatie_id").notNull(),
	babsId: uuid("babs_id"),
	datum: date().notNull(),
	startTijd: time("start_tijd").notNull(),
	eindTijd: time("eind_tijd").notNull(),
	wensen: jsonb().default({}),
	taal: text().default('nl'),
	trouwboekje: boolean().default(false),
	speech: boolean().default(true),
	wijzigbaarTot: timestamp("wijzigbaar_tot", { withTimezone: true, mode: 'string' }).notNull(),
	geboektOp: timestamp("geboekt_op", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	laatsteWijziging: timestamp("laatste_wijziging", { withTimezone: true, mode: 'string' }),
	gewijzigdDoor: text("gewijzigd_door"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_ceremonie_babs").using("btree", table.babsId.asc().nullsLast().op("uuid_ops")).where(sql`(babs_id IS NOT NULL)`),
	index("idx_ceremonie_datum").using("btree", table.datum.asc().nullsLast().op("date_ops")),
	index("idx_ceremonie_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_ceremonie_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_ceremonie_locatie").using("btree", table.locatieId.asc().nullsLast().op("uuid_ops")),
	index("idx_ceremonie_wensen_gin").using("gin", table.wensen.asc().nullsLast().op("jsonb_ops")),
	index("idx_ceremonie_wijzigbaar_tot").using("btree", table.wijzigbaarTot.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.locatieId],
			foreignColumns: [locatieInIhw.id],
			name: "ceremonie_locatie_id_fkey"
		}),
	foreignKey({
			columns: [table.babsId],
			foreignColumns: [babsInIhw.id],
			name: "ceremonie_babs_id_fkey"
		}),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "ceremonie_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_ceremonie_gemeente"
		}),
	unique("ceremonie_dossier_id_key").on(table.dossierId),
	check("chk_tijd_volgorde", sql`start_tijd < eind_tijd`),
	check("chk_datum_toekomst", sql`datum >= CURRENT_DATE`),
]);

export const aankondigingInIhw = ihw.table("aankondiging", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	reedsGehuwd: boolean("reeds_gehuwd").default(false).notNull(),
	partnerschap: boolean().default(false).notNull(),
	omzetting: boolean().default(false).notNull(),
	beidenNietWoonachtig: boolean("beiden_niet_woonachtig").default(false).notNull(),
	valid: boolean().default(false).notNull(),
	invalidReason: text("invalid_reason"),
	aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gevalideerdOp: timestamp("gevalideerd_op", { withTimezone: true, mode: 'string' }),
	gevalideerdDoor: text("gevalideerd_door"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_aankondiging_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_aankondiging_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_aankondiging_valid").using("btree", table.valid.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "aankondiging_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_aankondiging_gemeente"
		}),
	unique("aankondiging_dossier_id_key").on(table.dossierId),
]);

export const dossierBlockInIhw = ihw.table("dossier_block", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	code: blockCodeInIhw().notNull(),
	complete: boolean().default(false).notNull(),
	required: boolean().default(true).notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	completedBy: text("completed_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_dossier_block_complete").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops"), table.complete.asc().nullsLast().op("uuid_ops")),
	index("idx_dossier_block_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_dossier_block_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "dossier_block_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_dossier_block_gemeente"
		}),
	unique("uq_dossier_block").on(table.dossierId, table.code),
	check("chk_completed_timestamp", sql`((complete = false) AND (completed_at IS NULL)) OR ((complete = true) AND (completed_at IS NOT NULL))`),
]);

export const papierInIhw = ihw.table("papier", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	partnerId: uuid("partner_id"),
	type: papierTypeInIhw().notNull(),
	status: papierStatusInIhw().default('ontbreekt').notNull(),
	omschrijving: text(),
	beoordeeldDoor: text("beoordeeld_door"),
	beoordeeldOp: timestamp("beoordeeld_op", { withTimezone: true, mode: 'string' }),
	opmerking: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_papier_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_papier_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_papier_partner").using("btree", table.partnerId.asc().nullsLast().op("uuid_ops")).where(sql`(partner_id IS NOT NULL)`),
	index("idx_papier_status").using("btree", table.dossierId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "papier_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.partnerId],
			foreignColumns: [partnerInIhw.id],
			name: "papier_partner_id_fkey"
		}),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_papier_gemeente"
		}),
]);

export const uploadInIhw = ihw.table("upload", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	getuigeId: uuid("getuige_id"),
	papierId: uuid("papier_id"),
	filename: text().notNull(),
	originalFilename: text("original_filename").notNull(),
	mimeType: text("mime_type").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
	storageUri: text("storage_uri").notNull(),
	uploadedBy: text("uploaded_by").notNull(),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_upload_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_upload_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_upload_getuige").using("btree", table.getuigeId.asc().nullsLast().op("uuid_ops")).where(sql`(getuige_id IS NOT NULL)`),
	index("idx_upload_papier").using("btree", table.papierId.asc().nullsLast().op("uuid_ops")).where(sql`(papier_id IS NOT NULL)`),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "upload_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.getuigeId],
			foreignColumns: [getuigeInIhw.id],
			name: "upload_getuige_id_fkey"
		}),
	foreignKey({
			columns: [table.papierId],
			foreignColumns: [papierInIhw.id],
			name: "upload_papier_id_fkey"
		}),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_upload_gemeente"
		}),
	check("chk_size_bytes", sql`(size_bytes > 0) AND (size_bytes <= 52428800)`),
	check("chk_one_relation", sql`(((getuige_id IS NOT NULL))::integer + ((papier_id IS NOT NULL))::integer) <= 1`),
]);

export const paymentInIhw = ihw.table("payment", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	provider: text().default('worldonline').notNull(),
	status: paymentStatusInIhw().default('pending').notNull(),
	amountCents: integer("amount_cents").notNull(),
	currency: text().default('EUR').notNull(),
	externalReference: text("external_reference"),
	externalTransactionId: text("external_transaction_id"),
	redirectUrl: text("redirect_url"),
	initiatedAt: timestamp("initiated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	failedAt: timestamp("failed_at", { withTimezone: true, mode: 'string' }),
	paymentMethod: text("payment_method"),
	failureReason: text("failure_reason"),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_payment_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_payment_external_ref").using("btree", table.externalReference.asc().nullsLast().op("text_ops")).where(sql`(external_reference IS NOT NULL)`),
	index("idx_payment_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_payment_one_paid_per_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")).where(sql`(status = ANY (ARRAY['paid'::ihw.payment_status, 'waived'::ihw.payment_status]))`),
	index("idx_payment_provider").using("btree", table.provider.asc().nullsLast().op("text_ops")),
	index("idx_payment_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "payment_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_payment_gemeente"
		}),
	check("chk_amount_cents", sql`amount_cents >= 0`),
	check("chk_paid_timestamp", sql`((status = 'paid'::ihw.payment_status) AND (paid_at IS NOT NULL)) OR ((status <> 'paid'::ihw.payment_status) AND (paid_at IS NULL))`),
	check("chk_failed_timestamp", sql`((status = 'failed'::ihw.payment_status) AND (failed_at IS NOT NULL)) OR ((status <> 'failed'::ihw.payment_status) AND (failed_at IS NULL))`),
]);

export const refundInIhw = ihw.table("refund", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	paymentId: uuid("payment_id").notNull(),
	status: refundStatusInIhw().default('requested').notNull(),
	amountCents: integer("amount_cents").notNull(),
	reason: text().notNull(),
	iportaalToken: text("iportaal_token"),
	externalReference: text("external_reference"),
	requestedAt: timestamp("requested_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	requestedBy: text("requested_by").notNull(),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	approvedBy: text("approved_by"),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	processedBy: text("processed_by"),
	failedAt: timestamp("failed_at", { withTimezone: true, mode: 'string' }),
	failureReason: text("failure_reason"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_refund_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_refund_iportaal_token").using("btree", table.iportaalToken.asc().nullsLast().op("text_ops")).where(sql`(iportaal_token IS NOT NULL)`),
	index("idx_refund_payment").using("btree", table.paymentId.asc().nullsLast().op("uuid_ops")),
	index("idx_refund_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.paymentId],
			foreignColumns: [paymentInIhw.id],
			name: "refund_payment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_refund_gemeente"
		}),
	check("chk_refund_amount", sql`amount_cents > 0`),
	check("chk_approved_timestamp", sql`((status = ANY (ARRAY['approved'::ihw.refund_status, 'processed'::ihw.refund_status])) AND (approved_at IS NOT NULL)) OR (status <> ALL (ARRAY['approved'::ihw.refund_status, 'processed'::ihw.refund_status]))`),
	check("chk_processed_timestamp", sql`((status = 'processed'::ihw.refund_status) AND (processed_at IS NOT NULL)) OR (status <> 'processed'::ihw.refund_status)`),
]);

export const brpExportInIhw = ihw.table("brp_export", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	status: brpExportStatusInIhw().default('scheduled').notNull(),
	exportType: text("export_type").default('huwelijksakte').notNull(),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }).notNull(),
	scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: 'string' }).notNull(),
	lockedAt: timestamp("locked_at", { withTimezone: true, mode: 'string' }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	failedAt: timestamp("failed_at", { withTimezone: true, mode: 'string' }),
	success: boolean(),
	message: text(),
	iburgerzakenReference: text("iburgerzaken_reference"),
	retryCount: integer("retry_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_brp_export_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_brp_export_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_brp_export_iburgerzaken_ref").using("btree", table.iburgerzakenReference.asc().nullsLast().op("text_ops")).where(sql`(iburgerzaken_reference IS NOT NULL)`),
	index("idx_brp_export_scheduled_for").using("btree", table.scheduledFor.asc().nullsLast().op("timestamptz_ops")).where(sql`(status = 'scheduled'::ihw.brp_export_status)`),
	index("idx_brp_export_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "brp_export_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_brp_export_gemeente"
		}),
	check("chk_scheduled_times", sql`scheduled_for >= scheduled_at`),
	check("chk_completed_timestamp", sql`((status = 'done'::ihw.brp_export_status) AND (completed_at IS NOT NULL) AND (success = true)) OR (status <> 'done'::ihw.brp_export_status)`),
	check("chk_failed_timestamp", sql`((status = 'failed'::ihw.brp_export_status) AND (failed_at IS NOT NULL) AND (success = false)) OR (status <> 'failed'::ihw.brp_export_status)`),
	check("chk_retry_count", sql`(retry_count >= 0) AND (retry_count <= 5)`),
]);

export const communicationInIhw = ihw.table("communication", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	senderRole: senderRoleInIhw("sender_role").notNull(),
	senderId: text("sender_id").notNull(),
	senderNaam: text("sender_naam"),
	subject: text().notNull(),
	body: text().notNull(),
	read: boolean().default(false).notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	readBy: text("read_by"),
	replyToId: uuid("reply_to_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_communication_created").using("btree", table.dossierId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_communication_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_communication_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_communication_reply_to").using("btree", table.replyToId.asc().nullsLast().op("uuid_ops")).where(sql`(reply_to_id IS NOT NULL)`),
	index("idx_communication_sender").using("btree", table.senderId.asc().nullsLast().op("text_ops")),
	index("idx_communication_unread").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops"), table.read.asc().nullsLast().op("uuid_ops")).where(sql`(read = false)`),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "communication_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.replyToId],
			foreignColumns: [table.id],
			name: "communication_reply_to_id_fkey"
		}),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_communication_gemeente"
		}),
]);

export const auditLogInIhw = ihw.table("audit_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id"),
	action: text().notNull(),
	tableName: text("table_name").notNull(),
	recordId: uuid("record_id"),
	actorId: text("actor_id").notNull(),
	actorRole: text("actor_role"),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_audit_actor").using("btree", table.actorId.asc().nullsLast().op("text_ops")),
	index("idx_audit_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_audit_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")).where(sql`(dossier_id IS NOT NULL)`),
	index("idx_audit_log_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_audit_table").using("btree", table.tableName.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_audit_log_gemeente"
		}),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "audit_log_dossier_id_fkey"
		}).onDelete("set null"),
]);

export const tijdslotInIhw = ihw.table("tijdslot", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	locatieId: uuid("locatie_id").notNull(),
	datum: date().notNull(),
	startTijd: time("start_tijd").notNull(),
	eindTijd: time("eind_tijd").notNull(),
	capacity: integer().default(1).notNull(),
	gereserveerdDoor: uuid("gereserveerd_door"),
	blocked: boolean().default(false).notNull(),
	blockedBy: text("blocked_by"),
	blockedReason: text("blocked_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_tijdslot_beschikbaar").using("btree", table.locatieId.asc().nullsLast().op("date_ops"), table.datum.asc().nullsLast().op("date_ops"), table.blocked.asc().nullsLast().op("date_ops")).where(sql`((gereserveerd_door IS NULL) AND (blocked = false))`),
	index("idx_tijdslot_datum").using("btree", table.datum.asc().nullsLast().op("date_ops")),
	index("idx_tijdslot_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_tijdslot_gereserveerd").using("btree", table.gereserveerdDoor.asc().nullsLast().op("uuid_ops")).where(sql`(gereserveerd_door IS NOT NULL)`),
	index("idx_tijdslot_locatie").using("btree", table.locatieId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("idx_tijdslot_no_overlap").using("btree", table.locatieId.asc().nullsLast().op("date_ops"), table.datum.asc().nullsLast().op("date_ops"), table.startTijd.asc().nullsLast().op("date_ops"), table.eindTijd.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_tijdslot_gemeente"
		}),
	foreignKey({
			columns: [table.locatieId],
			foreignColumns: [locatieInIhw.id],
			name: "tijdslot_locatie_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gereserveerdDoor],
			foreignColumns: [dossierInIhw.id],
			name: "tijdslot_gereserveerd_door_fkey"
		}),
	check("chk_tijdslot_tijd", sql`start_tijd < eind_tijd`),
	check("chk_capacity", sql`capacity > 0`),
	check("chk_datum_toekomst", sql`datum >= CURRENT_DATE`),
]);

export const getuigeInIhw = ihw.table("getuige", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dossierId: uuid("dossier_id").notNull(),
	isGemeentelijkeGetuige: boolean("is_gemeentelijke_getuige").default(false).notNull(),
	voornamen: text().notNull(),
	voorvoegsel: text(),
	achternaam: text().notNull(),
	geboortedatum: date().notNull(),
	geboorteplaats: text(),
	documentUploadId: uuid("document_upload_id"),
	documentStatus: papierStatusInIhw("document_status").default('ontbreekt'),
	volgorde: smallint().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	gemeenteOin: text("gemeente_oin").notNull(),
}, (table) => [
	index("idx_getuige_dossier").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops")),
	index("idx_getuige_gemeente_oin").using("btree", table.gemeenteOin.asc().nullsLast().op("text_ops")),
	index("idx_getuige_gemeentelijk").using("btree", table.dossierId.asc().nullsLast().op("uuid_ops"), table.isGemeentelijkeGetuige.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.dossierId],
			foreignColumns: [dossierInIhw.id],
			name: "getuige_dossier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.gemeenteOin],
			foreignColumns: [gemeenteInIhw.oin],
			name: "fk_getuige_gemeente"
		}),
	check("chk_geboortedatum", sql`geboortedatum <= CURRENT_DATE`),
	check("chk_volgorde", sql`(volgorde >= 1) AND (volgorde <= 4)`),
]);
export const dossierOverzichtInIhw = ihw.view("dossier_overzicht", {	id: uuid(),
	zaaknummer: text(),
	identificatie: text(),
	gemeenteCode: text("gemeente_code"),
	gemeenteNaam: text("gemeente_naam"),
	shortUuid: text("short_uuid"),
	status: dossierStatusInIhw(),
	bronorganisatie: text(),
	zaaktypeUrl: text("zaaktype_url"),
	aanmaakdatum: timestamp({ withTimezone: true, mode: 'string' }),
	trouwdatum: date(),
	partner1Naam: text("partner1_naam"),
	partner2Naam: text("partner2_naam"),
}).as(sql`SELECT d.id, d.identificatie AS zaaknummer, d.identificatie, "substring"(d.municipality_code, '[0-9]+$'::text) AS gemeente_code, g.naam AS gemeente_naam, "substring"(d.id::text, 1, 8) AS short_uuid, d.status, d.gemeente_oin AS bronorganisatie, d.zaaktype_url, d.created_at AS aanmaakdatum, d.ceremony_date AS trouwdatum, (p1.voornamen || ' '::text) || p1.geslachtsnaam AS partner1_naam, (p2.voornamen || ' '::text) || p2.geslachtsnaam AS partner2_naam FROM ihw.dossier d LEFT JOIN ihw.gemeente g ON g.gemeente_code = "substring"(d.municipality_code, '[0-9]+$'::text) LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1 LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2`);

export const vDossierSummaryInIhw = ihw.view("v_dossier_summary", {	dossierId: uuid("dossier_id"),
	dossierStatus: dossierStatusInIhw("dossier_status"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	lockedAt: timestamp("locked_at", { withTimezone: true, mode: 'string' }),
	readyForPaymentAt: timestamp("ready_for_payment_at", { withTimezone: true, mode: 'string' }),
	typeCeremonie: text("type_ceremonie"),
	typeCeremonieCode: text("type_ceremonie_code"),
	partner1Naam: text("partner1_naam"),
	partner1Voornamen: text("partner1_voornamen"),
	partner2Naam: text("partner2_naam"),
	partner2Voornamen: text("partner2_voornamen"),
	ceremonyDate: date("ceremony_date"),
	ceremonyTime: time("ceremony_time"),
	wijzigbaarTot: timestamp("wijzigbaar_tot", { withTimezone: true, mode: 'string' }),
	locatieNaam: text("locatie_naam"),
	locatieType: locatieTypeInIhw("locatie_type"),
	babsNaam: text("babs_naam"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	incompleteBlocks: bigint("incomplete_blocks", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	completedBlocks: bigint("completed_blocks", { mode: "number" }),
	paymentStatus: paymentStatusInIhw("payment_status"),
	paymentAmountCents: integer("payment_amount_cents"),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	brpExportStatus: brpExportStatusInIhw("brp_export_status"),
	brpExportScheduled: timestamp("brp_export_scheduled", { withTimezone: true, mode: 'string' }),
	aankondigingValid: boolean("aankondiging_valid"),
	aankondigingShowstopper: text("aankondiging_showstopper"),
}).as(sql`SELECT d.id AS dossier_id, d.status AS dossier_status, d.created_at, d.locked_at, d.ready_for_payment_at, tc.naam AS type_ceremonie, tc.code AS type_ceremonie_code, p1.geslachtsnaam AS partner1_naam, p1.voornamen AS partner1_voornamen, p2.geslachtsnaam AS partner2_naam, p2.voornamen AS partner2_voornamen, c.datum AS ceremony_date, c.start_tijd AS ceremony_time, c.wijzigbaar_tot, l.naam AS locatie_naam, l.type AS locatie_type, b.naam AS babs_naam, count( CASE WHEN db.required = true AND db.complete = false THEN 1 ELSE NULL::integer END) AS incomplete_blocks, count( CASE WHEN db.required = true AND db.complete = true THEN 1 ELSE NULL::integer END) AS completed_blocks, pay.status AS payment_status, pay.amount_cents AS payment_amount_cents, pay.paid_at, brp.status AS brp_export_status, brp.scheduled_for AS brp_export_scheduled, a.valid AS aankondiging_valid, a.invalid_reason AS aankondiging_showstopper FROM ihw.dossier d LEFT JOIN ihw.type_ceremonie tc ON tc.id = d.type_ceremonie_id LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1 LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2 LEFT JOIN ihw.ceremonie c ON c.dossier_id = d.id LEFT JOIN ihw.locatie l ON l.id = c.locatie_id LEFT JOIN ihw.babs b ON b.id = c.babs_id LEFT JOIN ihw.dossier_block db ON db.dossier_id = d.id LEFT JOIN ihw.payment pay ON pay.dossier_id = d.id AND (pay.status = ANY (ARRAY['paid'::ihw.payment_status, 'waived'::ihw.payment_status, 'pending'::ihw.payment_status])) LEFT JOIN ihw.brp_export brp ON brp.dossier_id = d.id AND (brp.status = ANY (ARRAY['scheduled'::ihw.brp_export_status, 'in_progress'::ihw.brp_export_status])) LEFT JOIN ihw.aankondiging a ON a.dossier_id = d.id GROUP BY d.id, d.status, d.created_at, d.locked_at, d.ready_for_payment_at, tc.naam, tc.code, p1.geslachtsnaam, p1.voornamen, p2.geslachtsnaam, p2.voornamen, c.datum, c.start_tijd, c.wijzigbaar_tot, l.naam, l.type, b.naam, pay.status, pay.amount_cents, pay.paid_at, brp.status, brp.scheduled_for, a.valid, a.invalid_reason`);

export const vAgendaOverzichtInIhw = ihw.view("v_agenda_overzicht", {	locatieId: uuid("locatie_id"),
	locatieNaam: text("locatie_naam"),
	locatieType: locatieTypeInIhw("locatie_type"),
	datum: date(),
	startTijd: time("start_tijd"),
	eindTijd: time("eind_tijd"),
	capacity: integer(),
	blocked: boolean(),
	blockedReason: text("blocked_reason"),
	dossierId: uuid("dossier_id"),
	status: text(),
	dossierStatus: dossierStatusInIhw("dossier_status"),
	partner1Naam: text("partner1_naam"),
	partner2Naam: text("partner2_naam"),
	babsId: uuid("babs_id"),
	babsNaam: text("babs_naam"),
	babsStatus: babsStatusInIhw("babs_status"),
	typeCeremonie: text("type_ceremonie"),
	typeCeremonieCode: text("type_ceremonie_code"),
}).as(sql`SELECT l.id AS locatie_id, l.naam AS locatie_naam, l.type AS locatie_type, ts.datum, ts.start_tijd, ts.eind_tijd, ts.capacity, ts.blocked, ts.blocked_reason, ts.gereserveerd_door AS dossier_id, CASE WHEN ts.gereserveerd_door IS NOT NULL THEN 'Gereserveerd'::text WHEN ts.blocked = true THEN 'Geblokkeerd'::text ELSE 'Beschikbaar'::text END AS status, d.status AS dossier_status, p1.geslachtsnaam AS partner1_naam, p2.geslachtsnaam AS partner2_naam, c.babs_id, b.naam AS babs_naam, b.status AS babs_status, tc.naam AS type_ceremonie, tc.code AS type_ceremonie_code FROM ihw.tijdslot ts JOIN ihw.locatie l ON l.id = ts.locatie_id LEFT JOIN ihw.dossier d ON d.id = ts.gereserveerd_door LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1 LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2 LEFT JOIN ihw.ceremonie c ON c.dossier_id = d.id LEFT JOIN ihw.babs b ON b.id = c.babs_id LEFT JOIN ihw.type_ceremonie tc ON tc.id = d.type_ceremonie_id WHERE ts.datum >= (CURRENT_DATE - '7 days'::interval) ORDER BY ts.datum, l.naam, ts.start_tijd`);

export const vBabsBeschikbaarheidInIhw = ihw.view("v_babs_beschikbaarheid", {	babsId: uuid("babs_id"),
	babsNaam: text("babs_naam"),
	status: babsStatusInIhw(),
	beedigdTot: date("beedigd_tot"),
	ceremonyDate: date("ceremony_date"),
	ceremonyTime: time("ceremony_time"),
	locatieNaam: text("locatie_naam"),
	dossierId: uuid("dossier_id"),
	dossierStatus: dossierStatusInIhw("dossier_status"),
	partner1Naam: text("partner1_naam"),
	partner2Naam: text("partner2_naam"),
	daysUntilCeremony: integer("days_until_ceremony"),
}).as(sql`SELECT b.id AS babs_id, b.naam AS babs_naam, b.status, b.beedigd_tot, c.datum AS ceremony_date, c.start_tijd AS ceremony_time, l.naam AS locatie_naam, d.id AS dossier_id, d.status AS dossier_status, p1.geslachtsnaam AS partner1_naam, p2.geslachtsnaam AS partner2_naam, c.datum - CURRENT_DATE AS days_until_ceremony FROM ihw.babs b LEFT JOIN ihw.ceremonie c ON c.babs_id = b.id LEFT JOIN ihw.locatie l ON l.id = c.locatie_id LEFT JOIN ihw.dossier d ON d.id = c.dossier_id LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1 LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2 WHERE b.actief = true AND (c.datum IS NULL OR c.datum >= CURRENT_DATE) ORDER BY b.naam, c.datum, c.start_tijd`);

export const vDossiersMetActieVereistInIhw = ihw.view("v_dossiers_met_actie_vereist", {	dossierId: uuid("dossier_id"),
	status: dossierStatusInIhw(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	partner1: text(),
	partner2: text(),
	ceremonyDate: date("ceremony_date"),
	locatieNaam: text("locatie_naam"),
	actieVereist: text("actie_vereist"),
	prioriteit: text(),
}).as(sql`SELECT d.id AS dossier_id, d.status, d.created_at, (p1.geslachtsnaam || ', '::text) || p1.voornamen AS partner1, (p2.geslachtsnaam || ', '::text) || p2.voornamen AS partner2, c.datum AS ceremony_date, l.naam AS locatie_naam, CASE WHEN d.status = 'draft'::ihw.dossier_status AND d.created_at < (CURRENT_TIMESTAMP - '30 days'::interval) THEN 'Oud concept (>30 dagen)'::text WHEN d.status = 'in_review'::ihw.dossier_status THEN 'Wacht op beoordeling medewerker'::text WHEN d.status = 'ready_for_payment'::ihw.dossier_status THEN 'Wacht op betaling'::text WHEN d.status = 'locked'::ihw.dossier_status AND (c.datum - CURRENT_DATE) <= 14 THEN 'Ceremonie binnen 2 weken'::text WHEN a.valid = false THEN 'Aankondiging ongeldig: '::text || COALESCE(a.invalid_reason, 'onbekend'::text) WHEN (EXISTS ( SELECT 1 FROM ihw.papier p WHERE p.dossier_id = d.id AND p.status = 'afgekeurd'::ihw.papier_status)) THEN 'Afgekeurde documenten'::text ELSE 'Geen directe actie vereist'::text END AS actie_vereist, CASE WHEN (c.datum - CURRENT_DATE) <= 7 THEN 'Hoog'::text WHEN (c.datum - CURRENT_DATE) <= 14 THEN 'Middel'::text WHEN d.status = 'in_review'::ihw.dossier_status THEN 'Middel'::text ELSE 'Laag'::text END AS prioriteit FROM ihw.dossier d LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1 LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2 LEFT JOIN ihw.ceremonie c ON c.dossier_id = d.id LEFT JOIN ihw.locatie l ON l.id = c.locatie_id LEFT JOIN ihw.aankondiging a ON a.dossier_id = d.id WHERE d.status <> 'cancelled'::ihw.dossier_status AND ((d.status = ANY (ARRAY['in_review'::ihw.dossier_status, 'ready_for_payment'::ihw.dossier_status])) OR d.status = 'draft'::ihw.dossier_status AND d.created_at < (CURRENT_TIMESTAMP - '30 days'::interval) OR d.status = 'locked'::ihw.dossier_status AND (c.datum - CURRENT_DATE) <= 14 OR a.valid = false OR (EXISTS ( SELECT 1 FROM ihw.papier p WHERE p.dossier_id = d.id AND p.status = 'afgekeurd'::ihw.papier_status))) ORDER BY ( CASE WHEN (c.datum - CURRENT_DATE) <= 7 THEN 1 WHEN (c.datum - CURRENT_DATE) <= 14 THEN 2 WHEN d.status = 'in_review'::ihw.dossier_status THEN 2 ELSE 3 END), c.datum, d.created_at`);

export const vAanstaandeCeremoniesInIhw = ihw.view("v_aanstaande_ceremonies", {	datum: date(),
	startTijd: time("start_tijd"),
	eindTijd: time("eind_tijd"),
	locatie: text(),
	locatieType: locatieTypeInIhw("locatie_type"),
	babs: text(),
	partner1: text(),
	partner2: text(),
	typeCeremonie: text("type_ceremonie"),
	dossierStatus: dossierStatusInIhw("dossier_status"),
	paymentStatus: paymentStatusInIhw("payment_status"),
	brpExportStatus: brpExportStatusInIhw("brp_export_status"),
	dossierId: uuid("dossier_id"),
	taal: text(),
	trouwboekje: boolean(),
	speech: boolean(),
}).as(sql`SELECT c.datum, c.start_tijd, c.eind_tijd, l.naam AS locatie, l.type AS locatie_type, b.naam AS babs, ((p1.voornamen || ' '::text) || COALESCE(p1.voorvoegsel || ' '::text, ''::text)) || p1.geslachtsnaam AS partner1, ((p2.voornamen || ' '::text) || COALESCE(p2.voorvoegsel || ' '::text, ''::text)) || p2.geslachtsnaam AS partner2, tc.naam AS type_ceremonie, d.status AS dossier_status, pay.status AS payment_status, brp.status AS brp_export_status, d.id AS dossier_id, c.taal, c.trouwboekje, c.speech FROM ihw.ceremonie c JOIN ihw.dossier d ON d.id = c.dossier_id JOIN ihw.locatie l ON l.id = c.locatie_id LEFT JOIN ihw.babs b ON b.id = c.babs_id LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1 LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2 LEFT JOIN ihw.type_ceremonie tc ON tc.id = d.type_ceremonie_id LEFT JOIN ihw.payment pay ON pay.dossier_id = d.id AND (pay.status = ANY (ARRAY['paid'::ihw.payment_status, 'waived'::ihw.payment_status])) LEFT JOIN ihw.brp_export brp ON brp.dossier_id = d.id WHERE c.datum >= CURRENT_DATE AND c.datum <= (CURRENT_DATE + '30 days'::interval) AND (d.status <> ALL (ARRAY['cancelled'::ihw.dossier_status, 'draft'::ihw.dossier_status])) ORDER BY c.datum, c.start_tijd`);

export const vStatisticsInIhw = ihw.view("v_statistics", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dossiersDraft: bigint("dossiers_draft", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dossiersInReview: bigint("dossiers_in_review", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dossiersReadyPayment: bigint("dossiers_ready_payment", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dossiersLocked: bigint("dossiers_locked", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dossiersCancelled: bigint("dossiers_cancelled", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	dossiersDezeMaand: bigint("dossiers_deze_maand", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ceremoniesDezeMaand: bigint("ceremonies_deze_maand", { mode: "number" }),
	avgDagenTotDefinitief: numeric("avg_dagen_tot_definitief"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totaalOntvangenCents: bigint("totaal_ontvangen_cents", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	betalingenOpenstaand: bigint("betalingen_openstaand", { mode: "number" }),
}).as(sql`SELECT count(*) FILTER (WHERE status = 'draft'::ihw.dossier_status) AS dossiers_draft, count(*) FILTER (WHERE status = 'in_review'::ihw.dossier_status) AS dossiers_in_review, count(*) FILTER (WHERE status = 'ready_for_payment'::ihw.dossier_status) AS dossiers_ready_payment, count(*) FILTER (WHERE status = 'locked'::ihw.dossier_status) AS dossiers_locked, count(*) FILTER (WHERE status = 'cancelled'::ihw.dossier_status) AS dossiers_cancelled, count(*) FILTER (WHERE created_at >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS dossiers_deze_maand, ( SELECT count(*) AS count FROM ihw.ceremonie c WHERE c.datum >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND c.datum < (date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) + '1 mon'::interval)) AS ceremonies_deze_maand, avg(EXTRACT(epoch FROM locked_at - created_at) / 86400::numeric) FILTER (WHERE locked_at IS NOT NULL) AS avg_dagen_tot_definitief, ( SELECT sum(payment.amount_cents) AS sum FROM ihw.payment WHERE payment.status = 'paid'::ihw.payment_status) AS totaal_ontvangen_cents, ( SELECT count(*) AS count FROM ihw.payment WHERE payment.status = 'pending'::ihw.payment_status) AS betalingen_openstaand FROM ihw.dossier`);