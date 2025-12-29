# 🗺️ GEMMA Implementatie Roadmap

**Status:** ⏳ In Progress  
**Laatst bijgewerkt:** 27 december 2025  
**Versie:** 1.0

---

## ✅ Fase 1: Database Migratie (VOLTOOID)

### 1.1 Zaaknummer Generatie - GEMMA Compliant
- [x] **Migratie script**: `sql/migrations/003_add_gemma_identificatie.sql`
- [x] **Database schema**: Toegevoegd `identificatie` en `zaaktype_url` kolommen
- [x] **Sequence generatie**: Automatische numbering per jaar (HUW-YYYY-NNNNNN)
- [x] **Trigger**: Auto-generate identificatie bij insert
- [x] **Backfill**: Bestaande dossiers voorzien van identificatie
- [x] **Helper functies**: 
  - `find_dossier_by_identificatie()`
  - `find_dossier_by_short_id()` (backwards compatibility)
- [x] **View**: `dossier_overzicht` met zaaknummers
- [x] **Deployment**: Migratie succesvol uitgevoerd
- [x] **Verificatie**: 20 dossiers voorzien van zaaknummer

**Resultaat:**
```
HUW-2025-000001 (Dossier 75ec5b04)
HUW-2025-000002 (Dossier 7cfb8700)
... etc
```

---

## 🔄 Fase 2: TypeScript Schema Update (IN PROGRESS)

### 2.1 Database Schema TypeScript
- [x] **File**: `src/db/schema.ts`
- [x] **Changes**: Toegevoegd `identificatie` en `zaaktypeUrl` fields
- [ ] **Drizzle Sync**: Run `npx drizzle-kit push` (indien nodig)

---

## 📋 Fase 3: API & Backend Updates (TODO)

### 3.1 API Routes Update
**Prioriteit:** 🔴 Hoog

#### a) Dossier API
- [ ] **File**: `src/app/api/dossier/[id]/route.ts`
  - [x] Identificatie toevoegen aan response
  - [ ] Support voor zoeken op identificatie (niet alleen UUID)
  
#### b) Aankondiging Submit API  
- [ ] **File**: `src/app/api/aankondiging/submit/route.ts`
  - [ ] Identificatie in response body
  - [ ] Logging met identificatie

#### c) Samenvatting API
- [ ] **File**: `src/app/api/dossier/[id]/samenvatting/route.ts`
  - [ ] Identificatie in summary data

### 3.2 Nieuwe API Endpoints (Optioneel)
- [ ] `/api/dossier/by-identificatie/[identificatie]` - Zoek op zaaknummer
- [ ] `/api/dossier/search` - Zoek op naam + identificatie

---

## 🎨 Fase 4: Frontend UI Updates (TODO)

### 4.1 Bevestigingspagina
**Prioriteit:** 🔴 Hoog

- [ ] **File**: `src/app/000-aankondiging/090-bevestiging/page.tsx`
  - **Lijn 263**: Vervang `dossierId.substring(0, 8).toUpperCase()`
  - **Change to**: Toon `identificatie` (HUW-2025-000001)
  - **Fallback**: Als `identificatie` niet beschikbaar, toon dan kort UUID

**Code wijziging:**
```typescript
// WAS:
{dossierId.substring(0, 8).toUpperCase()}

// WORDT:
{dossier?.identificatie || dossierId.substring(0, 8).toUpperCase()}
```

### 4.2 PDF Generator
**Prioriteit:** 🔴 Hoog

- [ ] **File**: `src/lib/pdf-generator.ts`
  - **Lijn 146**: Vervang `dossierId.substring(0, 8).toUpperCase()`
  - **Change to**: Accept `identificatie` parameter
  - **Update function signature**: Add `identificatie?: string`

**Code wijziging:**
```typescript
// Function signature update:
export async function generateAankondigingPDF(
  data: AankondigingData,
  dossierId: string,
  identificatie?: string  // NEW PARAMETER
): Promise<void>

// PDF render update:
doc.text(
  `Zaaknummer: ${identificatie || dossierId.substring(0, 8).toUpperCase()}`, 
  margin, 
  yPosition
);
```

### 4.3 Dossier Detail Pagina
**Prioriteit:** 🟡 Gemiddeld

- [ ] **File**: `src/app/dossier/[id]/page.tsx`
  - [ ] Toon identificatie bovenaan pagina
  - [ ] Pas PDF download aan (geef identificatie mee)
  - [ ] Update interface `DossierData` (already done ✓)

**UI Locatie:**
```
┌─────────────────────────────────────┐
│  Huwelijksdossier                    │
│  Zaaknummer: HUW-2025-000001        │  ← HIER TOEVOEGEN
│  Status: Goedgekeurd                │
└─────────────────────────────────────┘
```

### 4.4 Samenvatting Pagina's
**Prioriteit:** 🟡 Gemiddeld

- [ ] **File**: `src/app/000-aankondiging/070-samenvatting/page.tsx`
  - [ ] Toon identificatie indien beschikbaar
  - [ ] Update PDF download call

- [ ] **File**: `src/app/dossier/[id]/samenvatting/page.tsx`
  - [ ] Toon identificatie bovenaan
  - [ ] Update PDF download call

### 4.5 Ondertekenen Pagina
**Prioriteit:** 🟢 Laag

- [ ] **File**: `src/app/000-aankondiging/080-ondertekenen/page.tsx`
  - [ ] Toon identificatie indien beschikbaar

---

## 🔍 Fase 5: Zoekfunctionaliteit (TODO - TOEKOMST)

### 5.1 Dossier Zoeken
**Prioriteit:** 🟢 Laag (Toekomstige feature)

- [ ] Zoekbalk toevoegen op homepage
- [ ] Zoeken op:
  - Zaaknummer (HUW-2025-000001)
  - Kort UUID (75EC5B04)  
  - Naam partners
- [ ] Autocomplete suggesties

### 5.2 Admin Dashboard
**Prioriteit:** 🟢 Laag (Toekomstige feature)

- [ ] Lijst met alle dossiers
- [ ] Filter op zaaknummer
- [ ] Export functionaliteit

---

## 📧 Fase 6: E-mail Templates (TODO - TOEKOMST)

### 6.1 Bevestigingsmail
- [ ] Voeg zaaknummer toe aan bevestigingsmail
- [ ] Link naar dossier met zaaknummer

### 6.2 Status Update Mails
- [ ] Zaaknummer in onderwerp
- [ ] Zaaknummer prominent in body

---

## 📊 Fase 7: Analytics & Logging (TODO - TOEKOMST)

### 7.1 Logging Updates
- [ ] Log met identificatie i.p.v. UUID
- [ ] Audit trail met zaaknummers

### 7.2 Metrics
- [ ] Dashboard: dossiers per jaar
- [ ] Sequence monitoring (vervangen van sequences per jaar)

---

## 🧪 Fase 8: Testing (TODO)

### 8.1 Unit Tests
- [ ] Test identificatie generatie
- [ ] Test sequence rollover (nieuw jaar)
- [ ] Test zoekfuncties

### 8.2 Integration Tests
- [ ] Test complete flow met identificatie
- [ ] Test backwards compatibility (oude dossiers zonder identificatie)
- [ ] Test PDF generatie met identificatie

### 8.3 E2E Tests
- [ ] Test aankondiging flow (start tot eind)
- [ ] Verifieer identificatie op alle pagina's
- [ ] Test zoeken op identificatie

---

## 🔐 Fase 9: Security & Privacy (TODO - TOEKOMST)

### 9.1 Privacy Check
- [ ] AVG compliance review
- [ ] Bepaal of identificatie persoonsgegevens bevat
- [ ] Logging policy voor identificatie

### 9.2 Access Control
- [ ] Verificatie: alleen eigenaar kan dossier zien
- [ ] Rate limiting op zoek-endpoints

---

## 📖 Fase 10: Documentatie (TODO)

### 10.1 Technische Documentatie
- [ ] **File**: `docs/GEMMA-ZAAKNUMMER.md`
  - [ ] Uitleg identificatie formaat
  - [ ] Sequence management
  - [ ] Database schema
  - [ ] API endpoints

### 10.2 Gebruikersdocumentatie
- [ ] FAQ: Wat is een zaaknummer?
- [ ] Help pagina: Waar vind ik mijn zaaknummer?

### 10.3 Ontwikkelaarsdocumentatie
- [ ] README update
- [ ] API documentatie update
- [ ] Code comments

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [x] Database migratie getest op lokaal
- [ ] Database migratie getest op staging
- [ ] Backwards compatibility getest
- [ ] Rollback plan gemaakt

### Deployment
- [ ] Run migratie op productie database
- [ ] Deploy nieuwe code versie
- [ ] Verifieer identificatie generatie
- [ ] Monitor logs voor errors

### Post-Deployment
- [ ] Smoke tests uitvoeren
- [ ] Controleer sample dossiers
- [ ] Verifieer PDF downloads
- [ ] User Acceptance Testing

---

## 🎯 Prioriteiten Samenvatting

### 🔴 **Kritisch (Deze Sprint)**
1. ✅ Database migratie (VOLTOOID)
2. 🔄 Frontend updates: Dossiernummer tonen
3. 🔄 PDF generator updates
4. API responses met identificatie

### 🟡 **Belangrijk (Volgende Sprint)**
1. Alle pagina's: consistent zaaknummer tonen
2. E-mail templates updaten
3. Testing (unit + integration)

### 🟢 **Nice to Have (Toekomst)**
1. Zoekfunctionaliteit op zaaknummer
2. Admin dashboard
3. Analytics & metrics
4. Volledige documentatie

---

## 📝 Action Items - DEZE WEEK

### Vandaag (27 dec 2025)
- [x] Database migratie uitvoeren
- [x] TypeScript schema updaten
- [ ] **FOCUS**: Frontend UI updates (bevestigingspagina + PDF)

### Deze Week
- [ ] Alle API routes met identificatie
- [ ] Alle frontend pagina's met identificatie
- [ ] Basis testing
- [ ] Code review

### Volgende Week
- [ ] E-mail templates
- [ ] Volledige test suite
- [ ] Documentatie
- [ ] Staging deployment

---

## 🐛 Known Issues & Tech Debt

- [ ] **Backwards Compatibility**: Oude dossiers hebben mogelijk geen identificatie
  - **Oplossing**: Backfill uitgevoerd (20 dossiers hebben identificatie)
  - **Action**: Verifieer dat alle nieuwe dossiers identificatie krijgen

- [ ] **Sequence Rollover**: Nieuwe sequence aanmaken elk jaar
  - **Oplossing**: Trigger functie `ensure_zaak_sequence()` handelt dit af
  - **Action**: Monitor tijdens jaarovergang 2025→2026

- [ ] **PDF Generator**: Ontvangt nu `dossierId`, moet `identificatie` ontvangen
  - **Impact**: Medium - PDF toont UUID i.p.v. zaaknummer
  - **Action**: Update function signature + alle call sites

---

## 📞 Contactpersonen

- **Database**: [Naam DBA]
- **Backend**: [Naam Developer]
- **Frontend**: [Naam Developer]
- **Testing**: [Naam QA]

---

## 🔗 Gerelateerde Documenten

- `DOSSIERNUMMER-GENERATIE.md` - Uitleg UUID vs Identificatie
- `sql/migrations/003_add_gemma_identificatie.sql` - Database migratie
- `docs/VALIDATION-SYSTEM.md` - Validatie systeem
- `DATABASE-OVERVIEW.md` - Database schema

---

## 📅 Tijdlijn

| Fase | Geschatte Tijd | Start Datum | Eind Datum | Status |
|------|----------------|-------------|------------|--------|
| Fase 1: Database | 2 uur | 27-12-2025 | 27-12-2025 | ✅ Voltooid |
| Fase 2: TypeScript | 30 min | 27-12-2025 | 27-12-2025 | 🔄 In Progress |
| Fase 3: API | 3 uur | TBD | TBD | ⏳ TODO |
| Fase 4: Frontend UI | 4 uur | TBD | TBD | ⏳ TODO |
| Fase 5: Zoeken | 6 uur | TBD | TBD | 📅 Toekomst |
| Fase 6: E-mail | 2 uur | TBD | TBD | 📅 Toekomst |
| Fase 7: Analytics | 3 uur | TBD | TBD | 📅 Toekomst |
| Fase 8: Testing | 4 uur | TBD | TBD | ⏳ TODO |
| Fase 9: Security | 2 uur | TBD | TBD | 📅 Toekomst |
| Fase 10: Docs | 2 uur | TBD | TBD | ⏳ TODO |

**Totaal geschat**: ~28 uur

---

## 💡 Learnings & Best Practices

### Database Migraties
✅ **DO:**
- Altijd backfill scripts maken voor bestaande data
- Constraints toevoegen met format validatie
- Helper functies maken voor lookups
- Views maken voor easy access

❌ **DON'T:**
- Bestaande data zonder identificatie laten
- Sequences handmatig beheren
- Identificatie nullable laten (tenzij backwards compatibility nodig)

### Frontend Updates
✅ **DO:**
- Fallback tonen als identificatie niet beschikbaar
- Consistent formatting (altijd HUW-YYYY-NNNNNN)
- Loading states tonen tijdens fetch

❌ **DON'T:**
- Hardcoded UUID substring gebruiken als identificatie beschikbaar is
- Identificatie en UUID door elkaar halen in UI

---

**Einde Roadmap**

*Dit document wordt automatisch bijgewerkt na elke fase.*

