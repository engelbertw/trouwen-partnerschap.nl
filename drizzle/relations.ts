import { relations } from "drizzle-orm/relations";
import { dossierInIhw, kindInIhw, gemeenteInIhw, partnerInIhw, validatieRegelInIhw, validatieLogInIhw, babsInIhw, babsRecurringRuleInIhw, documentOptieInIhw, babsBlockedDateInIhw, typeCeremonieInIhw, locatieInIhw, ceremonieInIhw, aankondigingInIhw, dossierBlockInIhw, papierInIhw, uploadInIhw, getuigeInIhw, paymentInIhw, refundInIhw, brpExportInIhw, communicationInIhw, auditLogInIhw, tijdslotInIhw } from "./schema";

export const kindInIhwRelations = relations(kindInIhw, ({one}) => ({
	dossierInIhw: one(dossierInIhw, {
		fields: [kindInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [kindInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
	partnerInIhw: one(partnerInIhw, {
		fields: [kindInIhw.partnerId],
		references: [partnerInIhw.id]
	}),
}));

export const dossierInIhwRelations = relations(dossierInIhw, ({one, many}) => ({
	kindInIhws: many(kindInIhw),
	typeCeremonieInIhw: one(typeCeremonieInIhw, {
		fields: [dossierInIhw.typeCeremonieId],
		references: [typeCeremonieInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [dossierInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
	partnerInIhws: many(partnerInIhw),
	ceremonieInIhws: many(ceremonieInIhw),
	aankondigingInIhws: many(aankondigingInIhw),
	dossierBlockInIhws: many(dossierBlockInIhw),
	papierInIhws: many(papierInIhw),
	uploadInIhws: many(uploadInIhw),
	paymentInIhws: many(paymentInIhw),
	brpExportInIhws: many(brpExportInIhw),
	communicationInIhws: many(communicationInIhw),
	auditLogInIhws: many(auditLogInIhw),
	tijdslotInIhws: many(tijdslotInIhw),
	getuigeInIhws: many(getuigeInIhw),
}));

export const gemeenteInIhwRelations = relations(gemeenteInIhw, ({many}) => ({
	kindInIhws: many(kindInIhw),
	documentOptieInIhws: many(documentOptieInIhw),
	dossierInIhws: many(dossierInIhw),
	partnerInIhws: many(partnerInIhw),
	ceremonieInIhws: many(ceremonieInIhw),
	aankondigingInIhws: many(aankondigingInIhw),
	dossierBlockInIhws: many(dossierBlockInIhw),
	papierInIhws: many(papierInIhw),
	uploadInIhws: many(uploadInIhw),
	paymentInIhws: many(paymentInIhw),
	refundInIhws: many(refundInIhw),
	brpExportInIhws: many(brpExportInIhw),
	communicationInIhws: many(communicationInIhw),
	auditLogInIhws: many(auditLogInIhw),
	tijdslotInIhws: many(tijdslotInIhw),
	getuigeInIhws: many(getuigeInIhw),
}));

export const partnerInIhwRelations = relations(partnerInIhw, ({one, many}) => ({
	kindInIhws: many(kindInIhw),
	dossierInIhw: one(dossierInIhw, {
		fields: [partnerInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [partnerInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
	papierInIhws: many(papierInIhw),
}));

export const validatieLogInIhwRelations = relations(validatieLogInIhw, ({one}) => ({
	validatieRegelInIhw: one(validatieRegelInIhw, {
		fields: [validatieLogInIhw.validatieRegelId],
		references: [validatieRegelInIhw.id]
	}),
}));

export const validatieRegelInIhwRelations = relations(validatieRegelInIhw, ({many}) => ({
	validatieLogInIhws: many(validatieLogInIhw),
}));

export const babsRecurringRuleInIhwRelations = relations(babsRecurringRuleInIhw, ({one}) => ({
	babsInIhw: one(babsInIhw, {
		fields: [babsRecurringRuleInIhw.babsId],
		references: [babsInIhw.id]
	}),
}));

export const babsInIhwRelations = relations(babsInIhw, ({many}) => ({
	babsRecurringRuleInIhws: many(babsRecurringRuleInIhw),
	babsBlockedDateInIhws: many(babsBlockedDateInIhw),
	ceremonieInIhws: many(ceremonieInIhw),
}));

export const documentOptieInIhwRelations = relations(documentOptieInIhw, ({one}) => ({
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [documentOptieInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
}));

export const babsBlockedDateInIhwRelations = relations(babsBlockedDateInIhw, ({one}) => ({
	babsInIhw: one(babsInIhw, {
		fields: [babsBlockedDateInIhw.babsId],
		references: [babsInIhw.id]
	}),
}));

export const typeCeremonieInIhwRelations = relations(typeCeremonieInIhw, ({many}) => ({
	dossierInIhws: many(dossierInIhw),
}));

export const ceremonieInIhwRelations = relations(ceremonieInIhw, ({one}) => ({
	locatieInIhw: one(locatieInIhw, {
		fields: [ceremonieInIhw.locatieId],
		references: [locatieInIhw.id]
	}),
	babsInIhw: one(babsInIhw, {
		fields: [ceremonieInIhw.babsId],
		references: [babsInIhw.id]
	}),
	dossierInIhw: one(dossierInIhw, {
		fields: [ceremonieInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [ceremonieInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
}));

export const locatieInIhwRelations = relations(locatieInIhw, ({many}) => ({
	ceremonieInIhws: many(ceremonieInIhw),
	tijdslotInIhws: many(tijdslotInIhw),
}));

export const aankondigingInIhwRelations = relations(aankondigingInIhw, ({one}) => ({
	dossierInIhw: one(dossierInIhw, {
		fields: [aankondigingInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [aankondigingInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
}));

export const dossierBlockInIhwRelations = relations(dossierBlockInIhw, ({one}) => ({
	dossierInIhw: one(dossierInIhw, {
		fields: [dossierBlockInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [dossierBlockInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
}));

export const papierInIhwRelations = relations(papierInIhw, ({one, many}) => ({
	dossierInIhw: one(dossierInIhw, {
		fields: [papierInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	partnerInIhw: one(partnerInIhw, {
		fields: [papierInIhw.partnerId],
		references: [partnerInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [papierInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
	uploadInIhws: many(uploadInIhw),
}));

export const uploadInIhwRelations = relations(uploadInIhw, ({one}) => ({
	dossierInIhw: one(dossierInIhw, {
		fields: [uploadInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	getuigeInIhw: one(getuigeInIhw, {
		fields: [uploadInIhw.getuigeId],
		references: [getuigeInIhw.id]
	}),
	papierInIhw: one(papierInIhw, {
		fields: [uploadInIhw.papierId],
		references: [papierInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [uploadInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
}));

export const getuigeInIhwRelations = relations(getuigeInIhw, ({one, many}) => ({
	uploadInIhws: many(uploadInIhw),
	dossierInIhw: one(dossierInIhw, {
		fields: [getuigeInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [getuigeInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
}));

export const paymentInIhwRelations = relations(paymentInIhw, ({one, many}) => ({
	dossierInIhw: one(dossierInIhw, {
		fields: [paymentInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [paymentInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
	refundInIhws: many(refundInIhw),
}));

export const refundInIhwRelations = relations(refundInIhw, ({one}) => ({
	paymentInIhw: one(paymentInIhw, {
		fields: [refundInIhw.paymentId],
		references: [paymentInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [refundInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
}));

export const brpExportInIhwRelations = relations(brpExportInIhw, ({one}) => ({
	dossierInIhw: one(dossierInIhw, {
		fields: [brpExportInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [brpExportInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
}));

export const communicationInIhwRelations = relations(communicationInIhw, ({one, many}) => ({
	dossierInIhw: one(dossierInIhw, {
		fields: [communicationInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
	communicationInIhw: one(communicationInIhw, {
		fields: [communicationInIhw.replyToId],
		references: [communicationInIhw.id],
		relationName: "communicationInIhw_replyToId_communicationInIhw_id"
	}),
	communicationInIhws: many(communicationInIhw, {
		relationName: "communicationInIhw_replyToId_communicationInIhw_id"
	}),
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [communicationInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
}));

export const auditLogInIhwRelations = relations(auditLogInIhw, ({one}) => ({
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [auditLogInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
	dossierInIhw: one(dossierInIhw, {
		fields: [auditLogInIhw.dossierId],
		references: [dossierInIhw.id]
	}),
}));

export const tijdslotInIhwRelations = relations(tijdslotInIhw, ({one}) => ({
	gemeenteInIhw: one(gemeenteInIhw, {
		fields: [tijdslotInIhw.gemeenteOin],
		references: [gemeenteInIhw.oin]
	}),
	locatieInIhw: one(locatieInIhw, {
		fields: [tijdslotInIhw.locatieId],
		references: [locatieInIhw.id]
	}),
	dossierInIhw: one(dossierInIhw, {
		fields: [tijdslotInIhw.gereserveerdDoor],
		references: [dossierInIhw.id]
	}),
}));