# Huwelijk Applicatie - Masterplan

> **Laatste update**: 28 december 2024  
> **Status**: Actieve ontwikkeling

## 📋 Inhoudsopgave

1. [Project Visie](#project-visie)
2. [Licensing & Legal Framework](#licensing--legal-framework)
3. [Huidige Status](#huidige-status)
4. [Toekomstige Verbeteringen](#toekomstige-verbeteringen)
5. [Archief - Voltooid](#archief---voltooid)

---

## 🎯 Project Visie

**Doel**: Een moderne, toegankelijke Nederlandse applicatie voor het beheren van huwelijksaankondigingen en huwelijksdossiers, volledig conform AVG en WCAG 2.2 Level AA standaarden.

**Doelgroep**: 
- Nederlandse gemeenten en hun medewerkers
- Burgers die willen trouwen
- Burgerlijke stand medewerkers

**Kernwaarden**:
- ✅ **Toegankelijkheid**: WCAG 2.2 Level AA compliant via NL Design System
- ✅ **Privacy**: AVG compliant met volledige audit trails
- ✅ **Gebruiksvriendelijk**: Intuïtieve Nederlandse interface
- ✅ **Betrouwbaar**: Robuuste validatie en data integriteit
- ✅ **Schaalbaar**: Multi-tenancy ondersteuning voor meerdere gemeentes

---

## 📜 Licensing & Legal Framework

### Dual Licensing Model

**EUPL-1.2 (European Union Public License)**:
- Voor Nederlandse gemeenten en overheidsorganisaties
- Gratis gebruik, aanpassing en distributie
- Align met NL Design System licentie (ook EUPL-1.2)
- Stimuleert samenwerking tussen gemeentes
- Open source filosofie voor publieke sector

**Commercial License**:
- Voor private organisaties, buitenlandse overheden, of commercieel gebruik
- Generates revenue voor verdere ontwikkeling
- Custom support en implementatie mogelijk
- Proprietary gebruik toegestaan

**Implementatie**:
- License files: `LICENSE-EUPL.txt` en `LICENSE-COMMERCIAL.txt`
- Contributors moeten CLA (Contributor License Agreement) ondertekenen
- Duidelijke licentie selector in repository
- Legal review voorafgaand aan public release

### Wembv Compliance Requirements

**Wet modernisering elektronisch bestuurlijk verkeer** (in werking sinds 2024):
- **Elektronische communicatie is verplicht**: Standaard optie, fysieke post alleen op expliciete aanvraag
- **Toegankelijkheid verplicht**: Alle elektronische communicatie moet WCAG 2.2 Level AA compliant zijn
- **Veilige identificatie**: DigiD/eIDAS vereist voor officiële communicatie
- **Audit trail**: Volledige logging van alle elektronische communicatie
- **MijnServices integratie**: Verplicht voor officiële berichten aan burgers

**Implementatie Impact**:
- Email notificaties zijn verplicht (niet optioneel)
- MijnServices integratie vereist voor officiële communicatie
- SMS/fysieke post alleen als fallback
- Alle PDFs moeten toegankelijk zijn (tagged PDF/PDF-UA compliant)
- Audit logging van alle berichten naar burgers

**Compliance Checklist**:
- ⏳ MijnServices service provider registratie
- ⏳ Toegankelijke PDF generatie (PDF-UA)
- ⏳ Email template systeem met WCAG AA compliance
- ⏳ Audit logging van alle communicatie
- ⏳ DigiD/eIDAS authenticatie voor officiële berichten

### Open Source Strategy

**Public Repository**:
- GitHub repository (na initial launch)
- Contribution guidelines en code of conduct
- Community governance model
- Documentatie in Nederlands en Engels

**Community Participation**:
- Open voor contributions van gemeentes
- Bug reports en feature requests via GitHub Issues
- Regular releases en changelog
- Transparante roadmap en planning

---

## 📊 Huidige Status

**Versie**: 0.1.0 (Development)  
**Framework**: Next.js 15 (App Router) + React 19  
**Database**: Neon PostgreSQL (Serverless)  
**Auth**: Clerk (Multi-tenancy support)  
**Styling**: Tailwind CSS + NL Design System

### Geïmplementeerde Features

#### ✅ Core Infrastructuur
- Next.js 15 App Router applicatie
- React 19 met Server Components
- TypeScript 5.7+ voor type safety
- Tailwind CSS + NL Design System styling
- PostgreSQL database met Drizzle ORM
- Multi-tenancy architectuur met gemeente isolation
- Neon serverless database met connection pooling

#### ✅ Aankondiging Flow (000-aankondiging) - COMPLEET
**9-stappen wizard voor huwelijksaankondiging**:
1. **Inleiding** (000-inleiding) - DigiD/eIDAS informatie
2. **Start** (001-start) - Auth redirect handler
3. **Partner 1 Gegevens** (021-partner1-gegevens) - BRP data, BSN validatie
4. **Partner 2 Gegevens** (031-partner2-gegevens) - Tweede partner
5. **Curatele Check** (040-curatele) - Voogdij controle
6. **Kinderen Registratie** (050-kinderen) - Kinderen uit eerdere relaties
7. **Bloedverwantschap** (060-bloedverwantschap) - Familie relatie check
8. **Samenvatting** (070-samenvatting) - Overzicht + PDF download
9. **Ondertekenen** (080-ondertekenen) - Digitale handtekening
10. **Bevestiging** (090-bevestiging) - Definitieve bevestiging + dossiernummer

**API Endpoints**:
- `POST /api/aankondiging/submit` - Submit complete aankondiging
- `GET /api/dossier/[id]/aankondiging` - Fetch aankondiging data
- `PUT /api/dossier/[id]/partners` - Update partner info
- `POST /api/dossier/[id]/kinderen` - Add/update kinderen
- `PUT /api/dossier/[id]/bloedverwantschap` - Update bloedverwantschap
- `PUT /api/dossier/[id]/curatele` - Update curatele

#### ✅ Dossier Management - COMPLEET
**Features**:
- Dossier overview met status tracking
- Clickable dossiernummer in admin screens
- Dynamic cost calculation (ceremony + documents)
- Block System met 5 verplichte blokken:
  - Aankondiging status
  - Ceremonie details
  - Naamgebruik (per partner)
  - Getuigen lijst (2-4 getuigen)
  - Documenten lijst met prijzen
  - Kostenoverzicht
- Status Tracking: Draft → In Review → Ready for Payment → Locked → Cancelled
- Acties overzicht per dossier

#### ✅ Ceremonie Planning - COMPLEET
**7-stappen workflow**:
1. **Keuze** - Wel/geen ceremonie
2. **Soort** - Gratis/Flash/Budget/Premium (✅ Dynamisch uit database sinds 29-12-2024)
3. **Datum** - Datum selectie
4. **Locatie** - Locatie selectie met afbeeldingen
5. **Ambtenaar** - BABS selectie (✅ Met beschikbaarheidscontrole sinds 29-12-2024)
6. **Wensen** - Extra wensen
7. **Samenvatting** - Ceremonie overzicht

**Database Tables**:
- `ceremonie` - Ceremonie details
- `locatie` - Trouwlocaties met afbeeldingen en capaciteit
- `babs` - BABS medewerkers
- `type_ceremonie` - Ceremonie types (configurabel, ✅ Dynamisch geladen sinds 29-12-2024)

**Nieuwe Features (29-12-2024)**:
- ✅ **Soort Ceremonie**: Dynamisch uit database, geen hardcoded data meer
- ✅ **BABS Beschikbaarheidscontrole**: Alleen beschikbare BABS worden getoond
- ✅ **API Endpoint**: `/api/ceremonie/beschikbare-babs` voor beschikbaarheidscheck

#### ✅ Getuigen Beheer - COMPLEET
- Getuigen page voor toevoegen/bewerken (2-4 getuigen)
- Validatie: Getuige jonger dan ouders, BSN 11-proef
- Database storage in `getuige` table
- API routes: GET/POST voor getuigen
- UI block met getuigen lijst op dossier overview

#### ✅ Documenten Management - COMPLEET
- Documenten page met document selectie
- Database: `papier` + `document_optie` tables
- Dynamic loading van document opties uit database
- Pricing in eurocenten
- Admin CRUD voor document options
- UI block met documenten lijst en prijzen

#### ✅ Naamgebruik - COMPLEET
- Intro page met uitleg naamgebruik
- Partner 1 keuze (eigen/partner naam)
- Partner 2 keuze (eigen/partner naam)
- Database storage: `partner.naamgebruik_keuze` enum
- API route: `PUT /api/dossier/[id]/naamgebruik`
- UI block met naamgebruik status

#### ✅ Authentication & Authorization - COMPLEET
**Clerk Integration**:
- Multi-tenancy support met gemeente OIN in user metadata
- User roles: system_admin, hb_admin, loket_medewerker, loket_readonly, babs_admin
- Custom sign in/up pages
- User avatar met header component
- Auth middleware voor route protection

**Helper Functions** (`src/lib/gemeente.ts`):
- `getGemeenteContext()` - Returns gemeente + user context
- `requireGemeenteContext()` - For Server Components
- `isAdmin()`, `isSystemAdmin()`, `canWrite()`, `isBabsAdmin()` - Permission checks

**Multi-Tenancy**:
- Database schema met `gemeente_oin` op ALLE tables
- Immutability triggers voorkomen cross-gemeente data migration
- Query filtering: Alle queries filteren op gemeente_oin
- 20 Gemeenten geseeded (G4 + G40)

#### ✅ BABS Calendar Feed & Agenda Integratie - COMPLEET (28-12-2024)
**Functionaliteit**:
- Persoonlijke iCal feed URL voor elke BABS (token-based authenticatie)
- Automatische synchronisatie met Gmail, Outlook, Apple Calendar
- Email notificaties bij nieuwe ceremony toewijzingen
- Overzichtspagina van geboekte ceremonies
- Instellingen pagina voor email en calendar feed beheer

**Database**:
- `calendar_feed_token` (256-bit secure token) in `babs` table
- `calendar_feed_enabled` boolean flag
- `email` veld voor notificaties
- Database trigger: `notify_babs_on_ceremony_insert` voor automatische notificaties
- Token generatie functie: `ihw.generate_calendar_token()`

**API Endpoints**:
- `GET /api/babs/calendar-token` - Haal/geneer calendar token
- `POST /api/babs/calendar-token` - Regenereer token
- `DELETE /api/babs/calendar-token` - Disable calendar feed
- `GET /api/babs/ical/[token]` - Publieke iCal feed (RFC 5545 compliant)
- `GET /api/babs/ceremonies` - Lijst geboekte ceremonies (met filters)
- `GET /api/babs/ceremonies/[id]/ics` - Download individuele ceremony
- `POST /api/babs/notify` - Email notificatie webhook

**Frontend Pagina's**:
- `/babs/beschikbaarheid` - Uitgebreid met calendar feed URL sectie
- `/babs/ceremonies` - Nieuw: overzicht geboekte ceremonies met filters
- `/babs/instellingen` - Nieuw: email en calendar instellingen

**Libraries**:
- `ics` package voor iCalendar generatie (RFC 5545 compliant)
- `resend` package voor email notificaties
- Privacy-first: alleen datum/tijd/locatie in calendar events (geen persoonlijke gegevens)

**Features**:
- Rate limiting (60 requests/uur per token)
- Token regeneratie functionaliteit
- Feed enable/disable
- Email notificaties met Nederlandse templates
- Download individuele ceremonies als .ics bestand
- Datum range filters voor ceremonies overzicht

**Impact**:
- ✅ BABS kunnen ceremonies automatisch synchroniseren met persoonlijke agenda
- ✅ Email notificaties bij nieuwe toewijzingen
- ✅ Privacy-bewust (AVG compliant: minimale data in calendar)
- ✅ Eenvoudige integratie met populaire agenda apps

#### ✅ Validatie Systeem - COMPLEET
**Database Layer**:
- Validation Rules Table (`validatie_regel`) met 30+ gedocumenteerde regels
- Validation Log (`validatie_log`) voor audit trail
- Rule Categories: kind, partner, datum, document, algemeen
- Priority Levels: Kritisch (1), Belangrijk (2), Informatief (3)
- Wettelijke basis per regel (AVG compliance)

**Application Layer** (`src/lib/validation.ts`):
- `validateKind()` - Kind vs ouder validatie
- `validatePartner()` - Partner gegevens
- `validateHuwelijksdatum()` - Huwelijksdatum checks
- `validateBSN()` - BSN 11-proef
- `validateDocument()` - File validatie
- API endpoint: `/api/validate` voor real-time validatie
- UI integration met visual error/warning feedback (rood/geel)

**Features**:
- Type-safe TypeScript interfaces
- Nederlandse foutmeldingen
- XSS & SQL injection preventie
- Date utilities (DD-MM-YYYY ↔ YYYY-MM-DD)

#### ✅ Admin Features - COMPLEET
**Gemeente Beheer**:
- Aankondiging beheer (`/gemeente/beheer`)
- Goedkeuren/Afkeuren aankondigingen
- Force approve functionaliteit (override showstoppers)
- Rejection reason modal met validatie details
- Clickable dossiers naar dossier overview

**API Endpoints**:
- `GET /api/gemeente/aankondigingen?status=pending`
- `PUT /api/gemeente/aankondigingen/[id]/goedkeuren`
- `PUT /api/gemeente/aankondigingen/[id]/afkeuren`

**Lookup Tables Beheer** (`/gemeente/beheer/lookup`):
- 4 Tabs: Locaties, BABS, Type Ceremonie, Documenten
- Add/Edit/Delete (Soft delete) operaties
- Volledige CRUD interface
- Server-side validatie
- Image preview voor locaties

#### ✅ PDF Generation - COMPLEET
**PDF Generator** (`src/lib/pdf-generator.ts`):
- Using jsPDF library
- Beschikbaar op alle relevante pages
- Content: Gemeente logo, dossiernummer, partner gegevens, kinderen, bloedverwantschap, ceremonie, getuigen
- Integration points: Samenvatting, dossier overview, bevestiging

#### ✅ Database Architectuur - COMPLEET
**Schema**:
- 17 Tables met complete data model
- 9 Enums voor status types en categories
- 6 Views voor reporting
- 15+ Triggers voor business rules
- 50+ Indexes voor performance
- GEMMA compliance met `identificatie` en `zaaktype_url` velden

**Key Tables**:
- `dossier` - Main dossier (met GEMMA identificatie)
- `partner` - 2 partners per dossier
- `aankondiging` - Aankondiging + validation flags
- `ceremonie` - Ceremony details
- `getuige` - Witnesses (2-4)
- `papier` - Documents
- `payment` - Payments
- `dossier_block` - Progress tracking
- `audit_log` - Full audit trail
- `gemeente` - Multi-tenant gemeente table

**Drizzle ORM**:
- Schema definitie in `src/db/schema.ts`
- Type safety met auto-generated TypeScript types
- Foreign key relationships
- Migrations via Drizzle-kit

#### ✅ UI/UX - COMPLEET
**NL Design System**:
- Fonts: Noto Sans (body), Noto Serif (headings)
- Typography: 16px base, 1.5 line-height, max 75ch
- Colors: Blue theme (blue-600, blue-700)
- WCAG 2.2 Level AA compliant

**Components**:
- GemeenteLogo (compact + full versions)
- LoadingSpinner
- Header met navigation en Clerk user button
- Forms (input fields, selects, textareas)
- Buttons (primary, secondary, danger)
- Modals (rejection reason, confirmation)

**Responsive Design**:
- Mobile first approach
- Tablet: 640px+ breakpoints
- Desktop: 1024px+ max-width containers

---

## 🚀 Toekomstige Verbeteringen

### Sprint 1 - Kritisch (Onmiddellijk) 🔴

#### GEMMA Zaaknummer in UI
**Status**: Database gereed, UI updates nodig

- [ ] Bevestigingspagina: Toon `identificatie` i.p.v. UUID
- [ ] PDF Generator: Accept `identificatie` parameter
- [ ] Dossier Overview: Toon zaaknummer prominent
- [ ] Samenvatting Pages: Toon identificatie indien beschikbaar
- [ ] API Responses: Include `identificatie` in alle responses
- [ ] Add search by identificatie endpoint: `/api/dossier/by-identificatie/[id]`

**Files to Update**:
- `src/app/000-aankondiging/090-bevestiging/page.tsx` (lijn 263)
- `src/lib/pdf-generator.ts` (lijn 146)
- `src/app/dossier/[id]/page.tsx`
- `src/app/000-aankondiging/070-samenvatting/page.tsx`

**Database**: ✅ Gereed - `identificatie` auto-generated als HUW-YYYY-NNNNNN  
**Zie**: `GEMMA-IMPLEMENTATIE-ROADMAP.md` voor details  
**Prioriteit**: Kritisch voor GEMMA compliance

#### File Upload Implementation
**Status**: Placeholder only

- [ ] Implementeer file upload (S3, Cloudinary, of Neon Blob Storage)
- [ ] Update `upload` table met real file URLs
- [ ] File size validatie (max 10MB)
- [ ] File type validatie (PDF, JPG, PNG)
- [ ] Virus scanning integratie
- [ ] Thumbnail generation voor images
- [ ] Progress indicator tijdens upload
- [ ] Drag-and-drop interface

**Files**: `src/app/dossier/[id]/documenten/page.tsx`  
**Database**: ✅ `upload` table exists  
**Prioriteit**: Kritisch voor productie (burgers moeten documenten uploaden)

#### Payment Integration
**Status**: Not implemented

- [ ] Integreer payment provider (Worldonline of Stripe)
- [ ] Payment flow na `ready_for_payment` status
- [ ] Update `payment` table met transaction data
- [ ] Webhook handling voor payment status updates
- [ ] Refund processing
- [ ] Payment receipt generation (PDF)
- [ ] Failed payment retry flow
- [ ] Payment status notifications

**Database**: ✅ `payment` + `refund` tables exist  
**Prioriteit**: Kritisch voor go-live (geen betaling = geen ceremonie)

#### Testing Setup
**Status**: No tests

- [ ] Unit tests setup (Jest)
- [ ] Validation functions tests
- [ ] Utility functions tests
- [ ] Integration tests (API routes, database triggers)
- [ ] E2E tests (Playwright)
  - Complete aankondiging flow
  - Ceremonie planning flow
  - Admin approval flow
  - PDF generation
- [ ] Test database (Neon branch)
- [ ] CI/CD integration (GitHub Actions)

**Prioriteit**: Kritisch voor kwaliteit en maintainability  
**Target Coverage**: >80%

### Sprint 2 - Hoge Prioriteit 🔴

#### MijnServices Integration
**Status**: Not implemented - Critical for Wembv compliance

**Functionaliteit**:
- Volledige service provider registratie in MijnServices portaal
- SSO via DigiD/eIDAS door MijnServices (kan Clerk vervangen voor burgers)
- Status notificaties in MijnServices berichtenbox
- Document beschikbaarheid (huwelijksakte, bevestiging) in MijnServices
- Deep linking: MijnServices → Huwelijk applicatie → specifiek dossier
- API integratie via MijnServices API v3
- Webhook handling voor user events
- Branding en logo in MijnServices portaal

**Technical Requirements**:
- Register als MijnServices service provider (6-12 weken proces)
- OAuth 2.0/OIDC integratie voor SSO
- MijnServices API v3 implementatie
- Webhook endpoints voor:
  - User login events
  - Document retrieval requests
  - Status update notifications
- Message template approval (vooraf goedkeuring gemeenten vereist)

**Dependencies**:
- DigiD integratie (kan MijnServices DigiD integratie gebruiken)
- Document storage (files moeten via API opvraagbaar zijn)
- Audit logging voor alle MijnServices interacties
- PDF-UA compliant documenten voor toegankelijkheid

**Files to Create/Update**:
- New: `src/lib/mijnservices.ts` - MijnServices client library
- New: `src/app/api/mijnservices/webhook` - Webhook handlers
- New: `src/app/api/mijnservices/documents` - Document retrieval endpoint
- Update: `src/middleware.ts` - SSO redirect logic
- New: `sql/095_mijnservices_integration.sql` - Tracking tables voor MijnServices interacties

**Database Schema**:
```sql
-- Track MijnServices interactions
CREATE TABLE mijnservices_log (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossier(id),
  user_bsn TEXT, -- encrypted
  action_type TEXT, -- 'login', 'document_view', 'notification_sent'
  message_id TEXT, -- MijnServices message ID
  created_at TIMESTAMP DEFAULT NOW(),
  gemeente_oin TEXT
);

-- Track sent notifications
CREATE TABLE mijnservices_notifications (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossier(id),
  notification_type TEXT, -- 'status_update', 'document_ready', 'reminder'
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  gemeente_oin TEXT
);
```

**Priority**: 🔴 Kritisch (Wembv compliance vereiste)
**Timeline**: Q2 2026 (2-3 maanden)
**Complexity**: Hoog
**Zie**: `docs/MIJNSERVICES-INTEGRATION.md` voor implementatie details

#### ✅ Ceremonie Soort Dynamic Loading - VOLTOOID (29-12-2024)
**Status**: ✅ Geïmplementeerd - Data wordt nu dynamisch uit database gehaald

**Geïmplementeerd**:
- ✅ Server Component voor data fetching (`page.tsx`)
- ✅ Client Component voor interactiviteit (`SoortCeremonieClient.tsx`)
- ✅ Dynamische loading van `type_ceremonie` uit database
- ✅ Alleen actieve ceremonie types worden getoond
- ✅ Automatische groepering: Gratis, Budget, Premium
- ✅ Dynamische weergave van duur, talen, en uitgebreide omschrijving
- ✅ Helper functies voor talen formatteren (nl → Nederlands, etc.)
- ✅ Helper functies voor duur formatteren (60 → "1 uur", etc.)

**API Wijzigingen**:
- ✅ `GET /api/gemeente/lookup/type-ceremonie` - Filter toegevoegd voor alleen actieve types

**Files**: 
- `src/app/dossier/[id]/ceremonie/soort/page.tsx` (Server Component)
- `src/app/dossier/[id]/ceremonie/soort/SoortCeremonieClient.tsx` (Client Component)
- `src/app/api/gemeente/lookup/type-ceremonie/route.ts` (API)

**Database**: ✅ `type_ceremonie` table exists  
**Prioriteit**: ✅ Voltooid

#### BRP/iBurgerzaken Export
**Status**: Table exists, no integration

- [ ] API integration met iBurgerzaken
- [ ] Export dossier data na ceremonie
- [ ] Update `brp_export` table met status
- [ ] Handle export errors met retry logic
- [ ] Export confirmation naar users
- [ ] Manual retry voor failed exports
- [ ] Export scheduling (batch processing)

**Database**: ✅ `brp_export` table exists  
**Prioriteit**: Hoog (vereist voor officiële registratie huwelijk)

#### Email Templates & Notifications
**Status**: Not implemented

- [ ] Welcome email na aanmelding
- [ ] Bevestiging email na aankondiging submit
- [ ] Status update emails (goedgekeurd/afgekeurd)
- [ ] Reminder emails (ceremony date approaching)
- [ ] Payment confirmation email met receipt
- [ ] Document approval/rejection notifications
- [ ] Message notifications (burger-medewerker communicatie)
- [ ] Template management interface voor admins

**Integration**: SendGrid, Mailgun, of Resend  
**Prioriteit**: Hoog (gebruikers verwachten email confirmaties)

#### Documentation Updates
**Status**: Basis README exists

- [ ] Update README.md met getting started guide
- [ ] Environment variables documentatie
- [ ] Deployment instructions
- [ ] Architecture diagram (Mermaid)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide (NL) voor gemeenten
- [ ] Developer onboarding guide
- [ ] Troubleshooting guide

**Prioriteit**: Hoog (nodig voor nieuwe developers en gemeentes)

#### Search Functionality
**Status**: Not implemented

- [ ] Search dossiers by zaaknummer (HUW-YYYY-NNNNNN)
- [ ] Search by kort UUID
- [ ] Search by partner namen
- [ ] Search by BSN (admins only, geencrypteerd)
- [ ] Autocomplete suggestions
- [ ] Advanced filters (status, datum range, gemeente)
- [ ] Search results pagination
- [ ] Export search results

**Prioriteit**: Hoog (medewerkers moeten snel dossiers kunnen vinden)

### Sprint 3-4 - Normale Prioriteit 🟡

#### Communication Module
**Status**: Table exists, no UI

- [ ] Build messaging UI (burger ↔ medewerker)
- [ ] Real-time notifications (WebSocket of polling)
- [ ] Email notifications voor nieuwe messages
- [ ] Attachment support in messages
- [ ] Message read receipts
- [ ] Search/filter messages per dossier
- [ ] Unread message counter
- [ ] Archive messages

**Database**: ✅ `communication` table exists  
**Prioriteit**: Normaal (verbetert communicatie maar niet kritisch)

#### Digital Identity Wallet Preparation
**Status**: Not implemented - Future-proofing for EU standards

**Ondersteunde Standaarden**:
- **EUDI Wallet** (EU Digital Identity Wallet) - ARF 1.4 specificatie
- **EDI Wallet** (Europese Digitale Identiteit) - Nederlandse implementatie
- **Verifiable Credentials** (W3C standaard)
- **ISO/IEC 18013-5** (mobile driving license standaard, toepasbaar op identiteitsdocumenten)

**Use Cases**:
1. **Getuige Identiteitsverificatie**
   - Getuigen kunnen ID-documenten delen via wallet
   - Geen handmatige upload nodig
   - Cryptografische verificatie van authenticiteit
   - Leeftijdsverificatie zonder geboortedatum te onthullen
   - Automatische extractie van naam, BSN (indien geautoriseerd)

2. **Huwelijksakte in Wallet**
   - Huwelijksakte beschikbaar als Verifiable Credential na ceremonie
   - QR code voor directe verificatie door derden
   - Deelbaar met banken, verzekeringen, overheidsinstanties
   - Herroepbare credentials (bij ontbinding huwelijk)

**Technical Architecture**:
```
Burger Wallet (EUDI/EDI)
     ↓ (QR/NFC/Bluetooth)
Wallet Verifier (onze app)
     ↓ (valideer signature)
Trusted Issuer Registry (EU/NL)
     ↓ (issue credentials)
Credential Issuer (Gemeente)
```

**Standards & Specificaties**:
- EUDI ARF 1.4 (Architecture Reference Framework)
- ISO/IEC 18013-5 (mDL - mobile driver license)
- W3C Verifiable Credentials Data Model 2.0
- OpenID4VCI (OpenID for Verifiable Credential Issuance)
- OpenID4VP (OpenID for Verifiable Presentations)
- SD-JWT (Selective Disclosure JWT) voor privacy

**Implementation Phases**:
1. **Phase 1 - Preparation (Q3 2026)**:
   - Research EUDI/EDI wallet pilots
   - Design credential schemas (huwelijksakte schema)
   - Setup test environment met wallet simulators
   - Train developers op verifiable credentials

2. **Phase 2 - Verifier (Q4 2026)**:
   - Implement wallet verifier voor getuige ID documenten
   - Support QR code scanning (mobile) en NFC (desktop met reader)
   - Cryptografische validatie van gepresenteerde credentials
   - Privacy-preserving verificatie (alleen benodigde attributen opvragen)

3. **Phase 3 - Issuer (Q1 2027)**:
   - Implement credential issuer voor huwelijksaktes
   - Integratie met gemeente PKI infrastructuur
   - Revocation registry voor ontbonden huwelijken
   - Credential delivery via wallet holder binding

**Database Schema**:
```sql
-- Track wallet interacties
CREATE TABLE wallet_verifications (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossier(id),
  credential_type TEXT, -- 'id_document', 'marriage_certificate'
  wallet_type TEXT, -- 'eudi', 'edi', 'other'
  verification_status TEXT,
  presented_attributes JSONB, -- selective disclosure
  verified_at TIMESTAMP,
  gemeente_oin TEXT
);

-- Track uitgegeven credentials
CREATE TABLE issued_credentials (
  id UUID PRIMARY KEY,
  dossier_id UUID REFERENCES dossier(id),
  credential_id TEXT UNIQUE,
  credential_type TEXT,
  issued_to_bsn TEXT, -- encrypted
  issued_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revocation_reason TEXT,
  gemeente_oin TEXT
);
```

**Files to Create**:
- `src/lib/wallet/verifier.ts` - Wallet credential verificatie
- `src/lib/wallet/issuer.ts` - Credential issuance
- `src/app/api/wallet/verify` - Verificatie endpoint
- `src/app/api/wallet/issue` - Issuance endpoint
- `sql/100_wallet_integration.sql` - Wallet tables
- `docs/WALLET-INTEGRATION.md` - Implementatie guide

**Dependencies**:
- PKI infrastructuur (gemeente certificate)
- Trusted issuer registry toegang
- EUDI/EDI wallet test environment
- Legal framework voor credential issuance

**Risks**:
- Standaarden evolueren nog (EUDI ARF 1.4 uit 2024, kan veranderen)
- Beperkte wallet adoptie door burgers (2025-2027 rollout)
- Technische complexiteit hoog
- Gemeente PKI integratie kan complex zijn

**Mitigations**:
- Build abstraction layer om meerdere standaarden te ondersteunen
- Houd traditionele upload als fallback
- Partner met Ministerie van Binnenlandse Zaken voor begeleiding
- Start met verificatie (makkelijker dan issuance)

**Priority**: 🟡 Normaal (future-proofing, niet kritisch voor launch)
**Timeline**: Q3-Q4 2026 (6-9 maanden, gefaseerd)
**Complexity**: Zeer Hoog
**Zie**: `docs/WALLET-INTEGRATION.md` voor implementatie details

#### Agenda Management
**Status**: Basic structure exists

- [ ] Agenda overview voor gemeente medewerkers
- [ ] Tijdslot management (beschikbaar/geblokkeerd)
- [ ] BABS planning en beschikbaarheid
- [ ] Calendar view (dag/week/maand)
- [ ] Conflict detection bij dubbele bookings
- [ ] Auto-assign BABS based op availability
- [ ] Bulk tijdslot operations
- [ ] Export naar iCal/Google Calendar

**Database**: ✅ `tijdslot` table + views exist  
**Prioriteit**: Normaal (verbetert planning efficiency)

#### BAG API Integration
**Status**: Not implemented

- [ ] Auto-fill address van postcode (BAG API)
- [ ] Validate addresses tegen BAG
- [ ] Geocoding voor maps
- [ ] Distance calculation (voor buitenlocaties)

**Zie**: `docs/BAG-API-INTEGRATION.md`  
**Prioriteit**: Normaal (verbetert UX maar niet essentieel)

#### BRP Integratie
**Status**: Not implemented

- [ ] Koppeling met Basis Registratie Personen (BRP)
- [ ] Automatische data verificatie tegen BRP
- [ ] Real-time adres lookup
- [ ] Nationaliteit verificatie
- [ ] BSN verification
- [ ] BRP data pre-fill na DigiD login

**Notities**: Vereist API toegang tot BRP per gemeente  
**Complexiteit**: Hoog (3-6 maanden)  
**Prioriteit**: Normaal (verbetert data kwaliteit significant)

#### DigiD/eHerkenning Integration
**Status**: Not implemented

- [ ] Replace Clerk met DigiD voor burgers
- [ ] eHerkenning voor gemeente medewerkers
- [ ] BSN extraction van DigiD
- [ ] BRP data pre-fill na authenticatie
- [ ] Test met DigiD test accounts
- [ ] Productie DigiD koppeling aanvragen

**Zie**: `README-KEYCLOAK-DIGID-CLERK.md`  
**Notities**: Vereist DigiD koppeling (6+ maanden aanvraagproces)  
**Complexiteit**: Zeer hoog  
**Prioriteit**: Normaal (vereist voor echte productie gebruik)

#### Performance Optimalisatie
**Status**: Basic setup, veel ruimte voor verbetering

- [ ] Database query optimalisatie
  - Analyze slow queries
  - Add missing indexes
  - Optimize N+1 queries
  - Materialized views voor heavy queries
- [ ] Caching strategie
  - Redis voor session caching
  - API response caching (React Query)
  - Static page generation waar mogelijk
  - CDN voor static assets
- [ ] Database
  - Read replicas (Neon supports)
  - Connection pooling optimization
  - Query performance monitoring
- [ ] Frontend
  - Code splitting
  - Lazy loading components
  - Image optimization (Next.js Image)
  - Bundle size reduction

**Prioriteit**: Normaal maar wordt kritisch bij schaling naar meerdere gemeentes

#### 🔍 Applicatiebreed Audit Systeem
**Status**: ✅ Deels geïmplementeerd / ⏳ In ontwikkeling

**✅ Geïmplementeerd (28-12-2024):**

**BABS Audit Trail** - Volledig werkend:
- Database: `babs_audit_log` table met complete tracking
- Tracked fields: status, actief, beëdigingsdatums, beschikbaarheidsdatums
- User tracking: Clerk User ID + naam + IP adres
- UI: Wijzigingshistorie sectie in BABS kalender
- API: `GET /api/gemeente/babs/[babsId]/audit-log`
- Automatische logging bij elke PUT operation

```sql
CREATE TABLE ihw.babs_audit_log (
  id uuid PRIMARY KEY,
  babs_id uuid REFERENCES ihw.babs(id),
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by text NOT NULL,
  changed_by_name text,
  changed_at timestamptz NOT NULL,
  change_reason text,
  ip_address text
);
```

**🔮 Toekomstige Uitbreiding: Configureerbaar Applicatiebreed Audit Systeem**

**Vision**: Een centraal audit systeem dat **configureerbaar** is per entiteit en actie.

**Configuratie Levels**:
```typescript
enum AuditLevel {
  NONE = 'none',           // Geen logging
  CHANGES_ONLY = 'changes', // Alleen wijzigingen
  ALL_ACTIONS = 'all',     // Alle acties (view, create, update, delete)
  DETAILED = 'detailed'    // Inclusief request body/params
}

interface AuditConfig {
  entity: string;           // 'dossier', 'partner', 'ceremonie', etc.
  level: AuditLevel;
  trackFields?: string[];   // Specifieke velden om te tracken
  excludeFields?: string[]; // Velden om te excluden (gevoelige data)
  retention?: number;       // Days to keep logs (GDPR compliant)
  alertOnChange?: boolean;  // Real-time alerts bij kritische wijzigingen
}
```

**⏳ Roadmap - Applicatiebreed Audit Systeem:**

**Phase 1: Core Entities (Q1 2025)**
- [ ] Dossier audit trail (status wijzigingen, belangrijke velden)
- [ ] Partner audit trail (persoonsgegevens wijzigingen)
- [ ] Ceremonie audit trail (datum/tijd/locatie wijzigingen)
- [ ] Getuige audit trail (toevoegen/verwijderen/wijzigen)
- [ ] Unified audit log table: `audit_log` (generic voor alle entities)

**Phase 2: Configuratie Systeem (Q2 2025)**
- [ ] Admin UI voor audit configuratie per gemeente
- [ ] Audit level selectie per entiteit
- [ ] Field-level audit configuratie
- [ ] Retention policy management
- [ ] Export templates configureren

**Phase 3: Advanced Features (Q2-Q3 2025)**
- [ ] Audit log viewer interface (dedicated admin page)
- [ ] Advanced filtering (entity, user, date range, action type)
- [ ] Export functionaliteit (CSV, Excel, PDF)
- [ ] Anomaly detection (unusual patterns)
- [ ] Real-time alerts bij kritische wijzigingen
- [ ] Compliance reports (automatisch genereren)

**Phase 4: Intelligence & Analytics (Q3 2025)**
- [ ] Audit analytics dashboard
- [ ] User behavior patterns
- [ ] Frequently changed fields identification
- [ ] Change velocity metrics
- [ ] Compliance score per gemeente
- [ ] Automated anomaly detection met ML

**Technical Architecture**:

```typescript
// Generic audit log table
interface AuditLog {
  id: string;
  entity_type: string;      // 'dossier', 'partner', 'babs', etc.
  entity_id: string;        // UUID van entity
  action: 'create' | 'update' | 'delete' | 'view';
  field_changes?: {         // Voor updates
    field: string;
    old_value: any;
    new_value: any;
  }[];
  user_id: string;
  user_name: string;
  ip_address?: string;
  user_agent?: string;
  gemeente_oin: string;     // Multi-tenancy
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Configuration table
interface AuditConfiguration {
  id: string;
  gemeente_oin: string;
  entity_type: string;
  audit_level: AuditLevel;
  tracked_fields?: string[];
  excluded_fields?: string[];
  retention_days: number;
  alert_enabled: boolean;
  alert_recipients?: string[];
}
```

**Database Design**:
```sql
-- Generic audit log (replaces entity-specific logs)
CREATE TABLE ihw.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view')),
  field_changes jsonb,
  user_id text NOT NULL,
  user_name text,
  ip_address text,
  user_agent text,
  gemeente_oin text NOT NULL REFERENCES ihw.gemeente(oin),
  timestamp timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata jsonb
);

-- Configuration per gemeente per entity
CREATE TABLE ihw.audit_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gemeente_oin text NOT NULL REFERENCES ihw.gemeente(oin),
  entity_type text NOT NULL,
  audit_level text NOT NULL DEFAULT 'changes',
  tracked_fields text[],
  excluded_fields text[],
  retention_days integer DEFAULT 365,
  alert_enabled boolean DEFAULT false,
  alert_recipients text[],
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(gemeente_oin, entity_type)
);

-- Indexes for performance
CREATE INDEX idx_audit_log_entity ON ihw.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON ihw.audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON ihw.audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_gemeente ON ihw.audit_log(gemeente_oin);
CREATE INDEX idx_audit_log_action ON ihw.audit_log(action);
```

**Implementation Strategy**:
1. Middleware voor automatische audit logging
2. Decorator pattern voor API routes (@AuditLog)
3. React hook voor UI-side audit events
4. Background job voor retention policy enforcement
5. Real-time webhook voor alerts

**Compliance & Privacy**:
- ✅ AVG compliant (data minimalisatie, retention policies)
- ✅ Recht op vergetelheid implementeren
- ✅ Geen gevoelige data in plain text (masked values)
- ✅ IP anonymization na X dagen
- ✅ Export functionaliteit voor data subject requests

**Benefits**:
- **Transparantie**: Complete traceerbaarheid van alle acties
- **Accountability**: Wie heeft wat wanneer gedaan?
- **Compliance**: Voldoet aan AVG en Wembv eisen
- **Security**: Detectie van ongebruikelijke activiteiten
- **Troubleshooting**: Terugkijken bij problemen
- **Analytics**: Inzicht in gebruikersgedrag

**Prioriteit**: Hoog (compliance vereiste + klantvraag)

### Gebruikerservaring - Normale Prioriteit 🟡

#### Verbeterde Navigation
- [ ] Breadcrumb navigation op alle pages
- [ ] Progress indicator voor multi-step forms met percentages
- [ ] Keyboard shortcuts voor power users (Ctrl+S = save, etc.)
- [ ] "Save and continue later" functionaliteit
- [ ] Auto-save drafts elke 30 seconden
- [ ] Recent dossiers sidebar
- [ ] Quick actions menu

**Prioriteit**: Normaal (verbetert UX significant)

#### Formulier Verbeteringen
- [ ] Auto-complete voor gemeentenamen uit database
- [ ] Smart defaults based op eerdere invoer
- [ ] Inline help tooltips met voorbeelden
- [ ] Field-level validation tijdens typen (debounced)
- [ ] Copy-paste detection voor partner gegevens
- [ ] Undo/redo functionaliteit
- [ ] Form validation summary bovenaan page

**Prioriteit**: Normaal (maakt invoer sneller en makkelijker)

#### Toegankelijkheid Verbeteringen
- [ ] Screen reader optimalisatie testen met echte users
- [ ] Keyboard navigation audit (alle functies bereikbaar)
- [ ] High contrast mode
- [ ] Font size controls (A- A A+)
- [ ] Focus management improvements
- [ ] ARIA labels audit
- [ ] Voice control support exploratie

**Notities**: Plan sessie met toegankelijkheid expert  
**Prioriteit**: Normaal (compliance is al voldoende, dit is extra)

#### Notificatie Systeem
- [ ] E-mail notificaties bij status wijzigingen
- [ ] SMS herinneringen voor deadlines
- [ ] In-app notifications center
- [ ] Configureerbare notificatie preferences per user
- [ ] WhatsApp notifications (via Twilio) exploratie
- [ ] Push notifications (PWA)
- [ ] Notification batching (niet te veel emails)

**Notities**: Vereist e-mail service (SendGrid/Mailgun)  
**Prioriteit**: Normaal (email is kritisch, rest is nice-to-have)

### Data & Validatie - Normale Prioriteit 🟡

#### Geavanceerde Validatie
- [ ] Machine learning voor anomaly detection
- [ ] Voorspellende validatie (suggest corrections)
- [ ] Batch validatie voor imports
- [ ] Custom validatie regels per gemeente (configurable in UI)
- [ ] Validatie regel versioning (track changes)
- [ ] Validatie analytics (welke regels triggeren vaak?)
- [ ] Real-time BRP lookup tijdens invoer

**Prioriteit**: Normaal (huidige validatie is al robuust)

#### Data Import/Export
- [ ] CSV import voor bulk registraties
- [ ] Excel export voor rapportages
- [ ] PDF generatie improvements (styling, branding)
- [ ] API endpoints voor externe systemen
- [ ] Data migration tools tussen gemeentes
- [ ] Bulk operations (approve/reject meerdere dossiers)
- [ ] Template downloads (CSV format voorbeelden)

**Prioriteit**: Normaal (handmatig werkt, maar bulk operations scheelt tijd)

### Future Backlog - Lage Prioriteit 🟢

#### Rapportage & Analytics
**Dashboard voor Gemeenten**:
- [ ] KPI dashboard met key metrics
- [ ] Real-time statistieken (aantal dossiers vandaag, deze week, deze maand)
- [ ] Trend analyses (huwelijken per maand over jaren)
- [ ] Performance metrics (average throughput time)
- [ ] User activity monitoring
- [ ] Top rejection reasons
- [ ] Conversion rates (started → completed)

**Rapporten**:
- [ ] Maandelijkse statistieken rapporten (auto-generated)
- [ ] Jaarlijkse overzichten
- [ ] Custom rapport builder (drag & drop)
- [ ] Scheduled report generation
- [ ] Export naar Business Intelligence tools (Tableau, Power BI)
- [ ] Benchmarking tussen gemeentes (geanonimiseerd)

**Prioriteit**: Laag (data is beschikbaar, maar analytics is niet kritisch)

#### Multi-language Support
**Talen**:
- [ ] Engels als tweede taal (internationals)
- [ ] Turks (veel voorkomend in NL)
- [ ] Arabisch (veel voorkomend in grote steden)
- [ ] Pools
- [ ] Spaans

**Features**:
- [ ] Language switcher in header
- [ ] RTL (Right-to-Left) support voor Arabisch
- [ ] Locale-aware datum formatting
- [ ] Translated email templates
- [ ] Admin interface om vertalingen te beheren

**Prioriteit**: Laag (Nederlands is primair, andere talen zijn bonus)

#### Internationale Huwelijken
- [ ] Buitenlandse document upload met apostille
- [ ] Vertaling service integratie (extern)
- [ ] International validation rules (verschillende BSN formats)
- [ ] Multi-country support
- [ ] Legalisation requirements per land
- [ ] International BRP equivalents

**Prioriteit**: Laag (focus is op Nederlandse huwelijken)

#### Mobile Progressive Web App (PWA)
- [ ] Offline support (basic read-only functionality)
- [ ] Push notifications
- [ ] Add to home screen prompt
- [ ] Camera integration voor document scanning
- [ ] Optimized mobile layouts
- [ ] Touch gestures
- [ ] Install prompts

**Prioriteit**: Laag (responsive web werkt al, PWA is bonus)

#### AI/ML Features
**Document Processing**:
- [ ] OCR voor document extraction (ID kaarten)
- [ ] Automatic document classification
- [ ] Data extraction van ID cards (automatisch invullen)
- [ ] Signature verification
- [ ] Document fraud detection

**Chatbot**:
- [ ] AI chatbot voor common questions
- [ ] Multi-language support
- [ ] Integration met knowledge base
- [ ] Handoff naar human medewerker

**Prioriteit**: Laag (futuristische features, niet nodig voor MVP)

### Technische Schuld 🔧

#### Code Quality
- [ ] Increase test coverage naar 80%+ (nu 0%)
- [ ] E2E tests met Playwright
- [ ] Visual regression tests (screenshot comparison)
- [ ] Performance benchmarking (load tests)
- [ ] Code splitting optimalisatie
- [ ] Reduce component size (sommige >300 lines)
- [ ] Extract reusable form components
- [ ] Centralize date formatting utilities
- [ ] Create custom hooks voor common patterns

**Prioriteit**: Hoog (technische schuld groeit snel)

#### Architecture
- [ ] Extract validatie engine naar separate npm package
- [ ] Microservices voor heavy operations (PDF generation, file processing)
- [ ] Event-driven architecture voor notificaties
- [ ] GraphQL API laag (optioneel, naast REST)
- [ ] Service worker voor offline capabilities
- [ ] WebSocket server voor real-time updates

**Prioriteit**: Laag (huidige architectuur werkt, refactor later)

#### Type Safety
- [ ] Stricter TypeScript config (enable strict mode)
- [ ] Remove `any` types (replace met proper types)
- [ ] Add Zod schemas voor alle API inputs
- [ ] Generate types from database schema (automation)
- [ ] Type-safe environment variables

**Prioriteit**: Normaal (verbetert developer experience)

#### Error Handling
- [ ] Standardize error response format across APIs
- [ ] Global error boundary voor uncaught errors
- [ ] Better error messages voor users (niet alleen tech errors)
- [ ] Retry logic voor failed requests
- [ ] Exponential backoff voor API calls
- [ ] Circuit breaker pattern voor externe APIs

**Prioriteit**: Normaal (huidige error handling is basic maar werkt)

#### Developer Experience
- [ ] Storybook voor component library
- [ ] Better TypeScript types (stricter mode)
- [ ] Git hooks voor code quality (pre-commit linting)
- [ ] Automated dependency updates (Dependabot)
- [ ] Better error tracking (Sentry integration)
- [ ] Development environment automation (Docker)
- [ ] Hot reload improvements

**Prioriteit**: Laag (nice-to-have voor developers)

#### Documentation
- [ ] API documentation (OpenAPI/Swagger spec)
- [ ] Component documentation (JSDoc)
- [ ] Architecture decision records (ADRs)
- [ ] Deployment playbooks (step-by-step)
- [ ] User manuals per role (burger, medewerker, admin)
- [ ] Video tutorials
- [ ] FAQ page

**Prioriteit**: Normaal (goede docs verhogen adoption)

#### Security Enhancements
**Row Level Security**:
- [ ] Implement RLS policies in PostgreSQL
- [ ] Restrict data access per gemeente (extra laag)
- [ ] User-level data isolation

**Penetration Testing**:
- [ ] Third-party security audit
- [ ] Vulnerability scanning (OWASP)
- [ ] Code security review
- [ ] Dependency vulnerability checks

**Compliance**:
- [ ] Enhanced audit logging (alle user actions)
- [ ] GDPR data export functionality (automated)
- [ ] Right to be forgotten (data deletion flows)
- [ ] Data retention policies (auto-archive)

**Prioriteit**: Hoog voor security, normaal voor compliance extras

#### Monitoring & Observability
- [ ] Sentry voor error tracking
- [ ] Vercel Analytics voor performance
- [ ] Database query monitoring (slow query log)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] Log aggregation (Logtail, Datadog)
- [ ] Custom metrics dashboards
- [ ] Alerting rules (PagerDuty)

**Prioriteit**: Hoog voor productie (moet weten wanneer dingen kapot gaan)

---

## 📦 Archief - Voltooid

### December 2024

#### ✅ Ceremonie Soort Dynamic Loading & BABS Beschikbaarheidscontrole (29-12-2024)
**Geïmplementeerd**:

**1. Ceremonie Soort Dynamic Loading**:
- ✅ Server Component voor data fetching (`page.tsx`)
- ✅ Client Component voor interactiviteit (`SoortCeremonieClient.tsx`)
- ✅ Dynamische loading van `type_ceremonie` uit database
- ✅ Alleen actieve ceremonie types worden getoond
- ✅ Automatische groepering: Gratis, Budget, Premium
- ✅ Dynamische weergave van duur, talen, en uitgebreide omschrijving
- ✅ Helper functies voor talen formatteren (nl → Nederlands, etc.)
- ✅ Helper functies voor duur formatteren (60 → "1 uur", etc.)
- ✅ API endpoint aangepast: `GET /api/gemeente/lookup/type-ceremonie` filtert nu op `actief = true`

**2. BABS Beschikbaarheidscontrole**:
- ✅ Nieuwe API endpoint: `GET /api/ceremonie/beschikbare-babs`
- ✅ Beschikbaarheidscontrole voor specifieke datum/tijd
- ✅ Controleert: BABS status, gemeente koppeling, datum range, wekelijkse beschikbaarheid, overlappende ceremonies, taal matching
- ✅ Ambtenaar kiezen pagina haalt nu BABS uit database (geen mock data meer)
- ✅ Alleen beschikbare BABS worden getoond
- ✅ Dynamische datum/tijd ophalen uit dossier/ceremonie data
- ✅ Foutafhandeling en loading states

**Technical Details**:
- **API**: `src/app/api/ceremonie/beschikbare-babs/route.ts`
- **Pages**: 
  - `src/app/dossier/[id]/ceremonie/soort/page.tsx` (Server Component)
  - `src/app/dossier/[id]/ceremonie/soort/SoortCeremonieClient.tsx` (Client Component)
  - `src/app/dossier/[id]/ceremonie/ambtenaar/kiezen/page.tsx` (Client Component met beschikbaarheidscheck)
- **Database**: Gebruikt bestaande `type_ceremonie` en `babs` tables

**Beschikbaarheidscontroles**:
1. BABS status: alleen `status = 'beedigd'` en `actief = true`
2. Gemeente koppeling: via `babs_gemeente` junction table
3. Datum range: `beschikbaar_vanaf` en `beschikbaar_tot`
4. Wekelijkse beschikbaarheid: JSON met dagelijkse tijdslots
5. Overlappende ceremonies: controleert of BABS al een ceremonie heeft op dat moment
6. Taal matching: controleert of BABS de vereiste talen spreekt

**Impact**:
- ✅ Geen hardcoded data meer - alles komt uit database
- ✅ Gemeentes kunnen eigen ceremonie types configureren
- ✅ Burgers zien alleen beschikbare ambtenaren
- ✅ Real-time beschikbaarheidsinformatie
- ✅ Betere gebruikerservaring (geen onnodige keuzes)

**Related Documentation**:
- `docs/features/MULTI-GEMEENTE-BABS.md` - Multi-gemeente BABS support
- `docs/implementation/BABS-BESCHIKBAARHEID-IMPLEMENTATION.md` - BABS beschikbaarheid

---

### December 2025

#### ✅ UI Cleanup: Dubbele Logo's Verwijderd (28-12-2024)
**Geïmplementeerd**:
- Header met logo verwijderd van lookup beheer pagina
- Header met logo verwijderd van BABS kalender pagina
- "Terug" navigatie link geïntegreerd in blauwe header bar
- Consistente header structuur: alleen blauwe bar met titel + navigatie
- Geen dubbele gemeente logo's meer zichtbaar

**Reden**:
- Logo werd dubbel getoond (in main layout + pagina header)
- Verspilde verticale ruimte
- Betere focus op content

**Beslissing**: Logo in pagina headers is **niet nodig** - main layout handelt dit af

---

#### ✅ BABS Beschikbaarheid Geïntegreerd met Kalender (28-12-2024)
**Geïmplementeerd**:
- `/babs/beschikbaarheid` pagina volledig herzien
- Van formulier met checkboxes → welkomstpagina met link naar kalender
- BABS gebruikers gebruiken nu dezelfde kalender interface als admins
- Duidelijke uitleg wat de kalender biedt (terugkerende patronen, blokkades, etc.)
- Geen dubbel onderhoud meer van formulieren

**Voordelen**:
- ✅ Eén interface voor zowel BABS als admins
- ✅ Meer mogelijkheden (terugkerende patronen, audit trail)
- ✅ Visueel beter (kalender vs checkboxes)
- ✅ Minder code onderhoud

**User Flow**:
1. BABS logt in met `rol: 'babs_admin'` + `babs_id`
2. Gaat naar `/babs/beschikbaarheid`
3. Ziet welkomstpagina met naam + uitleg
4. Klikt "Open Beschikbaarheidskalender"
5. Wordt doorverwezen naar `/gemeente/beheer/babs/[babsId]/calendar`
6. Beheert beschikbaarheid via visuele kalender

---

#### ✅ Tab Navigatie met URL Parameters (28-12-2024)
**Geïmplementeerd**:
- Lookup beheer pagina ondersteunt URL query parameters voor tab selectie
- "Terug naar BABS overzicht" link bevat `?tab=babs` parameter
- Browser history werkt correct (back/forward buttons)
- Deep linking mogelijk (directe URLs naar specifieke tabs)
- Tab state wordt bijgehouden in URL

**URLs**:
- `/gemeente/beheer/lookup` → Locaties tab (default)
- `/gemeente/beheer/lookup?tab=babs` → BABS tab
- `/gemeente/beheer/lookup?tab=type-ceremonie` → Type Ceremonie tab
- `/gemeente/beheer/lookup?tab=documenten` → Documenten tab

**Voordelen**:
- ✅ Bookmarkable tabs
- ✅ Consistente navigatie flow
- ✅ Browser history support

---

#### ✅ BABS Calendar Feed & Agenda Integratie (28-12-2024)
**Geïmplementeerd**:
- Persoonlijke iCal feed URL voor elke BABS (token-based authenticatie)
- Automatische synchronisatie met Gmail, Outlook, Apple Calendar
- Email notificaties bij nieuwe ceremony toewijzingen via Resend
- Overzichtspagina van geboekte ceremonies (`/babs/ceremonies`)
- Instellingen pagina voor email en calendar feed beheer (`/babs/instellingen`)
- Calendar feed URL sectie op beschikbaarheidspagina met instructies

**Database Migrations**:
- `093_babs_calendar_feed.sql` - Calendar token en email kolommen
- `094_ceremony_notification_trigger.sql` - Database trigger voor notificaties
- Nieuwe kolommen: `calendar_feed_token`, `calendar_feed_enabled`, `email`
- Token generatie functie: `ihw.generate_calendar_token()`

**Technical Stack**:
- iCal generator: `src/lib/ical-generator.ts` (RFC 5545 compliant)
- Email notificaties: `src/lib/email-notifications.ts` (Resend integratie)
- API endpoints: 7 nieuwe endpoints voor calendar en ceremonies management
- Rate limiting: 60 requests/uur per token (in-memory, production: Redis)
- Privacy-first: alleen datum/tijd/locatie in calendar events (geen BSN, geen namen)

**API Endpoints**:
- `GET /api/babs/calendar-token` - Haal/geneer token
- `POST /api/babs/calendar-token` - Regenereer token
- `DELETE /api/babs/calendar-token` - Disable feed
- `GET /api/babs/ical/[token]` - Publieke iCal feed
- `GET /api/babs/ceremonies` - Lijst ceremonies (met date filters)
- `GET /api/babs/ceremonies/[id]/ics` - Download individuele ceremony
- `POST /api/babs/notify` - Email notificatie webhook

**User Flow**:
1. BABS logt in op `/babs/beschikbaarheid`
2. Ziet persoonlijke calendar feed URL
3. Kopieert URL en voegt toe aan Gmail/Outlook/Apple Calendar
4. Ceremonies worden automatisch gesynchroniseerd
5. Ontvangt email notificatie bij nieuwe toewijzing
6. Bekijkt overzicht op `/babs/ceremonies`
7. Beheert instellingen op `/babs/instellingen`

**Impact**:
- ✅ BABS kunnen ceremonies automatisch synchroniseren met persoonlijke agenda
- ✅ Email notificaties bij nieuwe toewijzingen (Wembv compliance)
- ✅ Privacy-bewust (AVG compliant: minimale data in calendar)
- ✅ Eenvoudige integratie met populaire agenda apps
- ✅ Vermindert handmatige agenda updates

**Future Enhancements**: 🔮
- [ ] Background worker voor pg_notify events (nu alleen API call)
- [ ] Two-way sync (blokkeer tijd in BABS agenda → blokkeer in systeem)
- [ ] SMS notificaties via Twilio
- [ ] Push notificaties via Progressive Web App
- [ ] Kalender widget op dashboard
- [ ] Audit logging van feed access
- [ ] Token expiry (auto-refresh elke 6 maanden)
- [ ] Redis rate limiting (nu in-memory)

**Related Documentation**:
- `docs/implementation/BABS-CALENDAR-FEED-IMPLEMENTATION.md` - Volledige implementatie guide

---

#### ✅ BABS Audit Trail & Configureerbaar Beschikbaarheidsbeheer (28-12-2024)
**Geïmplementeerd**:
- Volledige audit trail voor BABS wijzigingen
- Database: `babs_audit_log` table met user + IP tracking
- Beëdigingsdatums gescheiden van beschikbaarheidsdatums
- UI: Wijzigingshistorie sectie in BABS kalender (timeline view)
- Automatische logging bij statuswijzigingen via PUT endpoint
- Validatie tegen beschikbaarheidsperiode bij regel toevoegen
- Status info box met alle periodes (beëdiging + beschikbaarheid)

**Technical Stack**:
- Database: `babs_audit_log` + indexes voor performance
- API: 
  - `GET /api/gemeente/babs/[babsId]/audit-log` - Ophalen wijzigingshistorie
  - `PUT /api/gemeente/lookup/babs/[id]` - Update met audit logging
- UI: Wijzigingshistorie sectie met color-coded changes (rood→groen)
- Tracked fields: status, actief, beedigdVanaf, beedigdTot, beschikbaarVanaf, beschikbaarTot
- User context: Clerk User ID + naam + IP adres

**Impact**: 
- ✅ Volledige traceerbaarheid en accountability
- ✅ AVG/Wembv compliance door audit trail
- ✅ Transparantie: wie heeft wat wanneer gewijzigd
- ✅ Troubleshooting: historische wijzigingen terugzien
- ✅ Security: IP logging voor anomaly detection

**Future Enhancements**: 🔮
- [ ] Uitbreiden naar applicatiebreed audit systeem (alle entities)
- [ ] Configureerbare audit levels per entiteit (none/changes/all/detailed)
- [ ] Dedicated audit log viewer admin interface
- [ ] Export functionaliteit (CSV/Excel/PDF)
- [ ] Anomaly detection met ML
- [ ] Real-time alerts bij kritische wijzigingen
- [ ] Retention policy automation (GDPR compliant)

**Related Rules**: 
- `.cursor/rules/masterplan-updates.mdc` - MASTERPLAN automatisch updaten
- `.cursor/rules/validation-compliance.mdc` - Validatie systeem compliance

#### ✅ Aankondiging Flow - Complete 9-Step Wizard (15-12-2025)
**Geïmplementeerd**:
- Inleiding met DigiD/eIDAS info
- Auth redirect handler
- Partner 1 & 2 gegevens met BRP validatie
- Curatele check (voogdij controle)
- Kinderen registratie uit eerdere relaties
- Bloedverwantschap check
- Samenvatting met PDF download
- Digitale handtekening
- Bevestigingspagina met dossiernummer

**API Endpoints**: 6 REST endpoints voor data persistence  
**Impact**: Complete user journey voor burgers om huwelijk aan te kondigen

#### ✅ Ceremonie Planning Flow (18-12-2025)
**Geïmplementeerd**:
- 7-stappen wizard (keuze, soort, datum, locatie, ambtenaar, wensen, samenvatting)
- Database tables: ceremonie, locatie, babs, type_ceremonie
- Dynamic locatie selectie met afbeeldingen
- BABS medewerker selectie
- Ceremonie cost calculation

**Updates (29-12-2024)**:
- ✅ **Soort Ceremonie**: Dynamisch uit database (geen hardcoded data meer)
- ✅ **BABS Beschikbaarheidscontrole**: Alleen beschikbare BABS worden getoond

**Impact**: Burgers kunnen volledig zelf ceremonie plannen met real-time beschikbaarheidsinformatie

#### ✅ Dossier Management Systeem (18-12-2025)
**Geïmplementeerd**:
- Dossier overview met 5 blocks (aankondiging, ceremonie, naamgebruik, getuigen, documenten)
- Status tracking (Draft → In Review → Ready for Payment → Locked → Cancelled)
- Clickable dossiernummer in admin screens
- Dynamic cost calculation
- Acties overzicht per dossier

**Impact**: Centraal overzicht voor burgers en medewerkers

#### ✅ Getuigen Beheer (19-12-2025)
**Geïmplementeerd**:
- Getuigen page voor 2-4 getuigen
- Validatie (BSN 11-proef, leeftijd checks)
- Database storage in `getuige` table
- API routes voor CRUD operaties
- UI block op dossier overview

**Impact**: Gestructureerde getuige registratie

#### ✅ Documenten Management (19-12-2025)
**Geïmplementeerd**:
- Document selectie interface
- Database: `papier` + `document_optie` tables
- Dynamic loading van opties
- Pricing in eurocenten
- Admin CRUD interface voor document options
- UI block met prijzen

**Impact**: Gemeentes kunnen eigen document types configureren

#### ✅ Naamgebruik Workflow (19-12-2025)
**Geïmplementeerd**:
- Intro page met uitleg
- Partner 1 & 2 keuze pages (eigen/partner naam)
- Database: `partner.naamgebruik_keuze` enum
- API: `PUT /api/dossier/[id]/naamgebruik`
- UI block met status

**Impact**: Gestructureerde naamgebruik registratie

#### ✅ Centraal Validatie Systeem (20-12-2025)
**Geïmplementeerd**:
- Database schema met 30+ validatieregels
- TypeScript validatie library (`src/lib/validation.ts`)
- Rule categories: kind, partner, datum, document, algemeen
- Priority levels: Kritisch, Belangrijk, Informatief
- Wettelijke basis per regel (AVG compliance)
- Logging van validatie resultaten
- UI components voor visual feedback (rood/geel)
- API endpoint voor real-time validatie
- Nederlandse foutmeldingen

**Files**:
- `sql/070_validation_rules.sql` - Schema
- `sql/080_validation_seeds.sql` - 30+ rules
- `src/lib/validation.ts` - Application logic
- `.cursor/rules/validation-compliance.mdc` - Development rules

**Impact**: Verhoogde data kwaliteit en consistentie door gehele applicatie, gedocumenteerde business rules

#### ✅ Multi-Tenancy Architectuur (18-12-2025)
**Geïmplementeerd**:
- Gemeente schema in database (`gemeente` table)
- `gemeente_oin` op ALLE 14 tables
- Immutability triggers voorkomen cross-gemeente data migration
- Query filtering: Alle queries filteren op gemeente_oin
- 20 Gemeenten geseeded (G4: Amsterdam, Rotterdam, Den Haag, Utrecht + G40)
- Dossiernummer generatie per gemeente (HUW-YYYY-NNNNNN)
- Gemeente-specifieke configuratie

**Migrations**:
- `015_gemeente_table.sql` - Gemeente master table
- `016_add_gemeente_oin_to_tables.sql` - Add gemeente_oin
- `017_gemeente_immutability.sql` - Immutability triggers

**Impact**: Applicatie kan veilig gebruikt worden door meerdere gemeentes tegelijk met data isolation

#### ✅ Clerk Authentication & Authorization (17-12-2025)
**Geïmplementeerd**:
- Multi-tenancy support met gemeente OIN in user metadata
- User roles: system_admin, hb_admin, loket_medewerker, loket_readonly
- Custom sign in/up pages
- User avatar component in header
- Auth middleware voor route protection (`/api/*`, `/dossier/*`, `/gemeente/*`)
- Helper functions in `src/lib/gemeente.ts`:
  - `getGemeenteContext()` - Returns gemeente + user context
  - `requireGemeenteContext()` - For Server Components
  - Permission checks: `isAdmin()`, `isSystemAdmin()`, `canWrite()`

**Impact**: Veilige authenticatie met role-based access control en multi-tenancy support

#### ✅ Admin Beheer Interface (20-12-2025)
**Geïmplementeerd**:
- Aankondiging beheer (`/gemeente/beheer`)
- Goedkeuren/Afkeuren aankondigingen
- Force approve functionaliteit (override showstoppers)
- Rejection reason modal met volledige validatie details
- Clickable dossiers naar detail view
- Lookup Tables Beheer (`/gemeente/beheer/lookup`):
  - 4 Tabs: Locaties, BABS, Type Ceremonie, Documenten
  - Add/Edit/Delete (Soft delete) operaties
  - Server-side validatie
  - Image preview voor locaties
  - Pricing management

**API Endpoints**: 12 REST endpoints voor lookup table management  
**Impact**: Gemeentes kunnen eigen configuratie beheren zonder developer

#### ✅ PDF Generation (21-12-2025)
**Geïmplementeerd**:
- PDF Generator library (`src/lib/pdf-generator.ts`) met jsPDF
- Content: Gemeente logo, dossiernummer, partner gegevens, kinderen, bloedverwantschap, ceremonie, getuigen
- Beschikbaar op: Samenvatting, dossier overview, bevestiging
- Auto-generate bij dossier completion

**Impact**: Burgers kunnen dossier als PDF downloaden

#### ✅ Database Architecture (10-12-2025 t/m 21-12-2025)
**Geïmplementeerd**:
- 17 Tables met complete data model
- 9 Enums voor status types en categories
- 6 Views voor reporting (v_dossier_summary, v_agenda_overzicht, etc.)
- 15+ Triggers voor business rules enforcement
- 50+ Indexes voor performance optimization
- GEMMA compliance: `identificatie` en `zaaktype_url` velden
- Auto-generation van zaak identificatie (HUW-YYYY-NNNNNN)

**Key Tables**:
- `dossier` - Main dossier
- `partner` - 2 partners per dossier
- `aankondiging` - Aankondiging + validation flags
- `ceremonie` - Ceremony details
- `getuige` - Witnesses (2-4)
- `papier` - Documents
- `payment` - Payments (ready for integration)
- `dossier_block` - Progress tracking
- `audit_log` - Full audit trail
- `gemeente` - Multi-tenant gemeente table
- `validatie_regel` + `validatie_log` - Validation system

**Drizzle ORM**:
- Schema definitie in `src/db/schema.ts`
- Type safety met auto-generated types
- Foreign key relationships
- Migration management

**Impact**: Robuuste, schaalbare data architectuur met volledige audit trail

#### ✅ NL Design System Integration (12-12-2025)
**Geïmplementeerd**:
- Fonts: Noto Sans (body), Noto Serif (headings)
- Typography: 16px base, 1.5 line-height, max 75ch line length
- Colors: Blue theme (blue-600, blue-700)
- WCAG 2.2 Level AA compliant
- Consistent spacing en padding
- Accessible form components

**Components**:
- GemeenteLogo (compact + full versions)
- LoadingSpinner
- Header met navigation en Clerk user button
- Forms (input fields, selects, textareas)
- Buttons (primary, secondary, danger)
- Modals (rejection reason, confirmation)

**Responsive Design**:
- Mobile first approach
- Tablet: 640px+ breakpoints
- Desktop: 1024px+ max-width containers

**Impact**: Consistent, accessible UI volgens Nederlandse overheidsstandaarden

#### ✅ Known Issues Fixed (21-12-2025)
**Opgelost**:
- Next.js 15 params enumeration warnings (React.use() pattern)
- Locatie type enum mismatch (stadhuis, stadsloket, buitenlocatie)
- PUT route timestamp bugs (strip createdAt/updatedAt)
- Foreign key constraint errors in getuige table
- Type mismatches tussen database en TypeScript

**Impact**: Stabiele, warning-free applicatie

---

## 📝 Notities & Overwegingen

### Technische Afhankelijkheden

**GEMMA Zaaknummer in UI**:
- Blokkeert: Volledige GEMMA compliance
- Vereist: UI updates (4 files)
- Complexiteit: Laag (2-4 uur werk)
- Database: ✅ Gereed (auto-generation werkt)

**File Upload**:
- Blokkeert: Productie gebruik (burgers moeten documenten uploaden)
- Vereist: Storage provider keuze (S3/Cloudinary/Neon Blob)
- Complexiteit: Middel (1-2 weken inclusief virus scanning)

**Payment Integration**:
- Blokkeert: Go-live (geen betaling = geen ceremonie)
- Vereist: Provider contract (Worldonline of Stripe)
- Complexiteit: Hoog (2-4 weken inclusief testing)
- Database: ✅ Gereed (payment + refund tables)

**BRP Integratie**:
- Blokkeert: Automatische data verificatie
- Vereist: API toegang per gemeente (aanvraagproces)
- Complexiteit: Hoog (3-6 maanden)
- Afhankelijk van: Gemeente API toegang

**DigiD Authenticatie**:
- Blokkeert: Productie deployment voor burgers (overheidsniveau)
- Vereist: DigiD koppeling aanvragen (lang proces)
- Complexiteit: Zeer hoog (6+ maanden aanvraagproces + 2-3 maanden implementatie)
- Alternatief: Clerk werkt voor MVP/pilot

**BRP/iBurgerzaken Export**:
- Blokkeert: Officiële registratie van huwelijk
- Vereist: iBurgerzaken API toegang
- Complexiteit: Hoog (2-3 maanden)
- Database: ✅ Gereed (brp_export table)

### Business Prioriteiten & Roadmap

#### **Q1 2026** - Production Ready
**Focus**: Kritische features voor go-live
1. GEMMA zaaknummer in UI ✅
2. File upload implementation 🔴
3. Payment integration 🔴
4. Testing setup (80%+ coverage) 🔴
5. Email notification system 🔴
6. Documentation updates 🔴

**Deliverable**: MVP klaar voor pilot met 2-3 gemeentes

#### **Q2 2026** - Stability & Integration
**Focus**: Performance en externe integraties
1. BRP/iBurgerzaken export 🔴
2. Performance optimalisatie 🟡
3. Search functionality 🔴
4. Communication module 🟡
5. Enhanced audit logging 🟡
6. Security hardening 🔴

**Deliverable**: Stabiele applicatie met externe systeem integraties

#### **Q3 2026** - Scale & Features
**Focus**: Schalen naar meer gemeentes en geavanceerde features
1. BRP integratie (data verificatie) 🟡
2. Agenda management 🟡
3. Advanced validation 🟡
4. Analytics dashboard 🟢
5. BAG API integration 🟡

**Deliverable**: Schaalbaar naar 10+ gemeentes

#### **Q4 2026** - Enhancement
**Focus**: User experience en internationale ondersteuning
1. DigiD/eHerkenning integration 🟡
2. Multi-language support 🟢
3. Mobile PWA 🟢
4. Advanced reporting 🟢

**Deliverable**: Enterprise-ready met internationale ondersteuning

### Sprint Planning

#### **Sprint 1 (Week 1-2)** - GEMMA & Testing
- [ ] GEMMA zaaknummer in UI (2 dagen)
- [ ] Jest setup + unit tests (3 dagen)
- [ ] Playwright setup + E2E tests (3 dagen)
- [ ] API documentation (2 dagen)

**Doel**: 40%+ test coverage, GEMMA compliant UI

#### **Sprint 2 (Week 3-4)** - File Upload & Payment
- [ ] File upload implementation (5 dagen)
- [ ] Payment integration (5 dagen)

**Doel**: Kritische functionaliteit voor productie

#### **Sprint 3 (Week 5-6)** - Email & Search
- [ ] Email template system (4 dagen)
- [ ] Search functionality (3 dagen)
- [ ] Documentation updates (3 dagen)

**Doel**: Complete user communication en findability

#### **Sprint 4 (Week 7-8)** - Polish & Deploy
- [ ] Bug fixes (3 dagen)
- [ ] Performance testing (2 dagen)
- [ ] Security audit (2 dagen)
- [ ] Deployment naar staging (1 dag)
- [ ] UAT met pilot gemeente (2 dagen)

**Doel**: Production deployment pilot

### Risico's & Mitigatie

#### ⚠️ **Hoog Risico**

**DigiD Integratie Complexiteit**
- **Risico**: Aanvraagproces duurt 6+ maanden, technische integratie is complex
- **Impact**: Kan productie deployment blokkeren
- **Mitigatie**: 
  - Gebruik Clerk voor MVP/pilot
  - Start DigiD aanvraag parallel
  - Plan Q4 2026 voor DigiD go-live
- **Status**: Geaccepteerd voor MVP

**BRP API Beschikbaarheid**
- **Risico**: API niet beschikbaar, rate limits, downtime
- **Impact**: Data verificatie faalt, manual fallback nodig
- **Mitigatie**:
  - Implementeer retry logic met exponential backoff
  - Cache BRP responses
  - Manual override voor medewerkers
  - Fallback naar handmatige invoer
- **Status**: Monitoring vereist na implementatie

**AVG Compliance bij Data Delen**
- **Risico**: Data delen tussen gemeentes kan AVG schenden
- **Impact**: Legale consequenties, boetes
- **Mitigatie**:
  - Strikte tenant isolation (immutability triggers)
  - Audit logging van alle data access
  - Data Processing Agreements (DPA) met gemeentes
  - Regular security audits
- **Status**: Immutability triggers geïmplementeerd ✅

**Payment Provider Downtime**
- **Risico**: Payment provider onbereikbaar tijdens ceremonie booking
- **Impact**: Burgers kunnen niet betalen, ceremonie wordt niet geboekt
- **Mitigatie**:
  - Implement retry logic
  - Queue failed payments
  - Manual payment option voor medewerkers
  - Multiple payment providers (failover)
- **Status**: Plan voor Q1 2026

**Wembv Non-Compliance Risk**
- **Risico**: Niet voldoen aan Wembv vereisten = legale non-compliance
- **Impact**: Gemeentes kunnen applicatie niet gebruiken, boetes mogelijk
- **Mitigatie**:
  - MijnServices integratie in Q2 2026 (kritisch)
  - Alle PDFs moeten toegankelijk zijn (PDF-UA)
  - Email notificaties verplicht (niet optioneel)
  - Audit alle elektronische communicatie
  - Compliance check voor elke deployment
- **Status**: Gepland voor Q2 2026

#### ⚠️ **Middel Risico**

**Performance bij Grote Aantallen Gebruikers**
- **Risico**: Slow queries, timeout, bad UX bij schaling
- **Impact**: Gebruikers frustratie, lagere adoption
- **Mitigatie**:
  - Database indexing (✅ 50+ indexes geïmplementeerd)
  - Connection pooling (✅ Neon pooler)
  - Query optimization (ongoing)
  - Caching strategie (Q2 2026)
  - Load testing voor go-live
- **Status**: Monitoring na pilot

**Multi-Tenancy Data Isolation**
- **Risico**: Lek tussen gemeentes door query bug
- **Impact**: AVG schending, data breach
- **Mitigatie**:
  - Immutability triggers (✅ geïmplementeerd)
  - Comprehensive testing van queries
  - Code review voor alle database queries
  - Regular security audits
- **Status**: Triggers actief, testing vereist

**Browser Compatibility**
- **Risico**: Oude browsers bij gemeentes (IE11, oude Chrome)
- **Impact**: Applicatie werkt niet
- **Mitigatie**:
  - Browser support policy (Chrome/Firefox/Safari laatste 2 versies)
  - Polyfills voor oudere browsers
  - Browser detection met waarschuwing
  - Training voor medewerkers
- **Status**: Plan browser policy in Q1 2026

**File Storage Costs**
- **Risico**: Hoge storage kosten bij veel documenten
- **Impact**: Budget overschrijding
- **Mitigatie**:
  - Compress images
  - File size limits (10MB)
  - Archive old documents naar cold storage
  - Cost monitoring dashboard
- **Status**: Monitor na file upload implementatie

**Wallet Standards Evolution Risk**
- **Risico**: EUDI/EDI standaarden kunnen veranderen voor/na implementatie
- **Impact**: Refactoring wallet integratie nodig
- **Mitigatie**:
  - Abstract wallet interface (adapter pattern)
  - Monitor EU Digital Identity Board updates
  - Deelname aan wallet pilot programma's
  - Gefaseerde implementatie aanpak
  - Houd traditionele upload als fallback
- **Status**: Monitoring

#### ⚠️ **Laag Risico**

**UI/UX Verbeteringen**
- **Risico**: Users vinden interface moeilijk
- **Impact**: Lagere adoption, meer support vragen
- **Mitigatie**:
  - User testing met echte burgers
  - Iterative improvements based on feedback
  - Help documentation en tooltips
- **Status**: Ongoing

**Rapportage Features**
- **Risico**: Gemeentes missen data insights
- **Impact**: Geen big impact, handmatig is mogelijk
- **Mitigatie**:
  - Database views beschikbaar (✅)
  - Export functionaliteit
  - Future: Analytics dashboard (Q3 2026)
- **Status**: Low priority

**Multi-Language Support**
- **Risico**: Internationale burgers kunnen applicatie niet gebruiken
- **Impact**: Beperkte doelgroep
- **Mitigatie**:
  - Nederlands is primair (NL wet)
  - Engels als tweede taal (Q4 2026)
  - Menselijke assistentie bij taalbarrière
- **Status**: Low priority

**License Dual-Track Management Risk**
- **Risico**: Verwarring over welke licentie van toepassing is
- **Impact**: Legale geschillen, verminderde adoptie
- **Mitigatie**:
  - Duidelijke LICENSE.md met beslissingsboom
  - License selector op website/repository
  - Legal review voorafgaand aan public release
  - CLA voor alle contributors
  - Documentatie over licentie gebruik
- **Status**: Plan voor Q1 2026

### Success Metrics (KPIs)

#### **Throughput Metrics**
- **Throughput Time**: Draft → Locked
  - Target: <30 dagen
  - Huidige status: TBD (nog geen productie data)
  - Meting: Automatic via database timestamps

- **Conversion Rate**: Started → Completed
  - Target: >70%
  - Huidige status: TBD
  - Meting: Track dossier status changes

- **Approval Rate**: Submitted → Approved (first try)
  - Target: >85%
  - Huidige status: TBD
  - Meting: Track aankondiging approval rate

#### **User Satisfaction**
- **NPS Score**: Net Promoter Score
  - Target: >8 (Excellent)
  - Meting: Quarterly survey (burgers en medewerkers)

- **Support Tickets**: Per 100 dossiers
  - Target: <5 tickets per 100 dossiers
  - Meting: Track support system

#### **System Performance**
- **System Uptime**
  - Target: 99.9% (max 43 minutes downtime/maand)
  - Meting: Uptime monitoring (UptimeRobot)

- **API Response Time**
  - Target: <200ms (p95), <500ms (p99)
  - Meting: Vercel Analytics / Custom monitoring

- **Page Load Time**
  - Target: <2 seconds (p95)
  - Meting: Lighthouse, Vercel Analytics

#### **Payment Metrics**
- **Payment Success Rate**
  - Target: >95%
  - Meting: Track payment transactions

- **Payment Failures**: By reason
  - Track: Technical failure vs User cancellation
  - Action: Improve UX voor top failure reasons

#### **Quality Metrics**
- **Test Coverage**
  - Target: >80%
  - Current: 0% (no tests yet)
  - Meting: Jest coverage reports

- **TypeScript Coverage**
  - Target: 100% strict mode
  - Current: ~95%
  - Meting: TypeScript compiler

- **Accessibility Score**
  - Target: 100 on Lighthouse
  - Meting: Regular Lighthouse audits

- **Performance Score**
  - Target: >90 on Lighthouse
  - Meting: Lighthouse CI

- **Security Audit**
  - Target: Pass penetration testing (no high/critical issues)
  - Meting: Annual third-party audit

#### **Adoption Metrics**
- **Active Gemeentes**: Number of gemeentes using system
  - Target: 5+ by end Q2 2026, 20+ by end 2026

- **Monthly Dossiers**: Per gemeente
  - Baseline: TBD na pilot
  - Target: 10% growth per quarter

- **User Retention**: Medewerkers logging in weekly
  - Target: >90%

### Deployment Strategy

#### **Environment Setup**

**Staging Environment**:
- URL: `https://staging-huwelijk.vercel.app`
- Database: Neon staging branch
- Clerk: Test keys
- Payment: Test mode
- Purpose: UAT, demo's, training

**Production Environment**:
- URL: `https://huwelijk.gemeente.nl` (of per gemeente subdomain)
- Database: Neon main branch met backups
- Clerk: Production keys (future: DigiD)
- Payment: Live mode
- Purpose: Live gebruik

#### **CI/CD Pipeline** (Q1 2026)

**GitHub Actions Workflow**:
```yaml
on: [push, pull_request]

jobs:
  test:
    - Lint (ESLint, TypeScript)
    - Unit tests (Jest)
    - Build check
  
  e2e:
    - Playwright tests
    - Visual regression
  
  deploy-staging:
    if: branch == develop
    - Deploy to staging
    - Run smoke tests
  
  deploy-production:
    if: branch == main
    - Manual approval required
    - Deploy to production
    - Run smoke tests
    - Notify team
```

#### **Database Migration Strategy**

**Development**:
1. Create migration in `sql/` folder
2. Test locally
3. Commit to git

**Staging**:
1. Auto-deploy migrations
2. Verify schema
3. Run tests

**Production**:
1. Manual approval
2. Backup database (automatic via Neon)
3. Run migration
4. Verify schema
5. Rollback plan ready

#### **Rollback Procedure**

**If deployment fails**:
1. Revert to previous Vercel deployment (1 click)
2. Database: Restore from Neon backup (point-in-time)
3. Notify users van downtime
4. Root cause analysis
5. Fix and redeploy

**Rollback SLA**: <15 minutes

#### **Compliance Verification**

**License Compliance Check**:
- Verify alle dependencies zijn EUPL-compatibel
- Review third-party licenses voor commercial use
- Document license compatibility matrix
- Legal review voorafgaand aan public release

**Wembv Compliance Verification**:
- Electronic communication is default (geen fysieke post tenzij expliciet gevraagd)
- Alle emails/notificaties zijn toegankelijk (WCAG 2.2 Level AA)
- MijnServices integratie actief en getest
- Audit trail compleet voor alle elektronische communicatie
- PDFs zijn PDF-UA compliant (tagged PDF)
- DigiD/eIDAS authenticatie beschikbaar

**Wallet Standards Compatibility**:
- Test met laatste EUDI/EDI specificaties
- Verify credential schemas voldoen aan standaarden
- Test wallet verifier met verschillende wallet implementaties
- Document compatibility matrix

### Technology Stack Details

#### **Frontend**
- **Framework**: Next.js 15 (App Router, Server Components)
- **React**: 19 (Latest features)
- **TypeScript**: 5.7+
- **Styling**: Tailwind CSS 3.4+ 
- **Fonts**: Noto Sans, Noto Serif (via next/font)
- **Icons**: Heroicons (optional)
- **PDF**: jsPDF

#### **Backend**
- **Runtime**: Node.js 20+ (Vercel)
- **API**: Next.js API Routes (REST)
- **ORM**: Drizzle ORM
- **Database**: Neon PostgreSQL (Serverless)
- **Auth**: Clerk (Multi-tenancy)
- **Validation**: Custom validation library

#### **Database**
- **Provider**: Neon (Serverless PostgreSQL)
- **Version**: PostgreSQL 16
- **Features**: 
  - Connection pooling
  - Point-in-time restore
  - Branching (staging/prod)
  - Auto-scaling
- **Backup**: Automatic continuous backups (Neon)

#### **Infrastructure**
- **Hosting**: Vercel (Serverless)
- **DNS**: Vercel DNS (or gemeente DNS)
- **CDN**: Vercel Edge Network
- **SSL**: Automatic (Vercel)

#### **External Services** (Future)
- **Email**: SendGrid / Mailgun / Resend
- **File Storage**: S3 / Cloudinary / Neon Blob
- **Payment**: Worldonline / Stripe
- **Monitoring**: Sentry (errors), Vercel Analytics
- **BRP**: Government API
- **DigiD**: Government auth
- **iBurgerzaken**: Government export
- **MijnServices**: Government service integration (Wembv requirement)
- **EUDI/EDI Wallet**: Digital identity wallet infrastructure
- **Credential Registry**: EU Trusted Issuer Registry
- **PKI Services**: Gemeente certificate management

### Resources & Documentation

#### **Project Documentation**
- `README.md` - Getting started guide
- `DATABASE-OVERVIEW.md` - Database architecture
- `MULTI-TENANCY-IMPLEMENTATION.md` - Multi-tenancy guide
- `GEMMA-IMPLEMENTATIE-ROADMAP.md` - GEMMA compliance
- `DOSSIERNUMMER-GENERATIE.md` - Dossiernummer logic
- `VALIDATION-SYSTEM.md` - Validation documentation
- `DEPLOYMENT-SUCCESS.md` - Deployment notes
- `PDF-DOWNLOAD-IMPLEMENTATION.md` - PDF implementation
- `VALIDATION-CURSOR-RULE-COMPLETE.md` - Validation rules
- `MASTERPLAN.md` - This document

#### **Code Organization**
```
src/
├── app/                    # Next.js App Router pages
│   ├── 000-aankondiging/  # Aankondiging wizard (9 steps)
│   ├── dossier/[id]/      # Dossier management
│   ├── gemeente/          # Admin interfaces
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities
│   ├── validation.ts     # Validation library
│   ├── gemeente.ts       # Gemeente context
│   ├── pdf-generator.ts  # PDF generation
│   └── utils.ts          # Helper functions
├── db/                    # Database
│   ├── schema.ts         # Drizzle schema
│   └── index.ts          # DB connection
└── types/                 # TypeScript types

sql/                       # Database migrations
├── 000_schema.sql        # Base schema
├── 010_enums_lookups.sql # Enums & lookups
├── 020_core_tables.sql   # Core tables
├── 030_payment_communication.sql
├── 040_triggers_functions.sql
├── 050_views.sql         # Reporting views
├── 060_seeds.sql         # Configuration data
├── 070_validation_rules.sql
├── 080_validation_seeds.sql
└── 015-017_gemeente*.sql # Multi-tenancy
```

#### **External Links**
- **Next.js 15**: https://nextjs.org/docs
- **React 19**: https://react.dev
- **Clerk Auth**: https://clerk.com/docs
- **Drizzle ORM**: https://orm.drizzle.team
- **Neon Database**: https://neon.tech/docs
- **NL Design System**: https://nldesignsystem.nl
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://typescriptlang.org

#### **Government Resources**
- **GEMMA**: https://www.gemmaonline.nl
- **DigiD**: https://www.digid.nl/ontwikkelaars
- **BRP**: https://www.rvig.nl/brp
- **AVG**: https://autoriteitpersoonsgegevens.nl
- **APIDESIGN**: https://gitdocumentatie.logius.nl/publicatie/api/adr/2.1.0/

#### **Community & Support**
- **GitHub Issues**: Track bugs en features
- **Team Chat**: Internal communication
- **Email**: Support voor gemeentes
- **Documentation**: Inline code comments + external docs

---

## 🤝 Bijdragen & Masterplan Maintenance

### Workflow bij Nieuwe Features

Dit masterplan wordt continu bijgewerkt volgens de **Masterplan Updates** regel.

Bij elke nieuwe feature of pagina **MOET** je:

1. ✅ **Reflecteer** op toekomstige verbeteringen (zie `.cursor/rules/masterplan-updates.mdc`)
2. ✅ **Update dit document** met nieuwe geïmplementeerde features
3. ✅ **Documenteer verbeteringen** met prioriteit (🔴 🟡 🟢 🔧)
4. ✅ **Noteer afhankelijkheden** en risico's
5. ✅ **Update archief** met voltooide items

Zie **`.cursor/rules/masterplan-updates.mdc`** voor gedetailleerde richtlijnen.

### Review Checklist bij Updates

- [ ] Feature toegevoegd aan "Huidige Status" (indien voltooid)
- [ ] Toekomstige verbeteringen gedocumenteerd met prioriteit
- [ ] Afhankelijkheden en risico's genoteerd
- [ ] Sprint planning bijgewerkt indien relevant
- [ ] Archief bijgewerkt met voltooide items
- [ ] Datum "Laatste update" aangepast

### Masterplan Review Schedule

- **Wekelijks** (Sprint Planning): Review openstaande items, update prioriteiten
- **Maandelijks**: Consolideer gerelateerde items, archiveer voltooide features
- **Per Quarter**: Grote review van roadmap en business prioriteiten

### Template voor Nieuwe Feature

Gebruik dit template bij het toevoegen van nieuwe features:

```markdown
## [Feature Naam] - [DD-MM-YYYY]

### Geïmplementeerd
- ✅ [Wat is er gebouwd]
- ✅ [Key features]

### Toekomstige Verbeteringen

#### Hoge Prioriteit 🔴
- [ ] [Kritische verbeteringen]

#### Normale Prioriteit 🟡
- [ ] [Waardevolle verbeteringen]

#### Lage Prioriteit 🟢
- [ ] [Nice-to-have features]

#### Technische Schuld 🔧
- [ ] [Refactoring mogelijkheden]

### Notities
- [Belangrijke overwegingen]
- [Afhankelijkheden]
- [Potentiële uitdagingen]
```

---

## 📈 Samenvatting & Volgende Stappen

### Huidige Status: **Solide Basis** ✅

**Wat werkt goed**:
- ✅ Complete aankondiging flow (9 stappen)
- ✅ Ceremonie planning (7 stappen)
- ✅ Dossier management met blocks
- ✅ Multi-tenancy met data isolation
- ✅ Robuust validatiesysteem (30+ regels)
- ✅ Admin interfaces voor gemeentes
- ✅ PDF generation
- ✅ NL Design System compliant
- ✅ Database architectuur (17 tables, triggers, views)
- ✅ Authentication & authorization (Clerk)

**Wat nog moet**:
- 🔴 GEMMA zaaknummer in UI (kritisch, 2-4 uur)
- 🔴 File upload (kritisch, 1-2 weken)
- 🔴 Payment integration (kritisch, 2-4 weken)
- 🔴 Testing setup (kritisch, 1-2 weken)
- 🔴 Email notifications (hoog, 1 week)
- 🟡 BRP/iBurgerzaken export (hoog, 2-3 maanden)

### Roadmap naar Productie

#### **Fase 1: MVP Ready** (Week 1-8, Q1 2026)
**Doel**: Klaar voor pilot met 2-3 gemeentes

**Kritische Items**:
1. GEMMA zaaknummer in UI ✅ (Week 1)
2. Testing setup (Week 1-2)
3. File upload (Week 3-4)
4. Payment integration (Week 3-4)
5. Email notifications (Week 5-6)
6. Documentation (Week 5-6)
7. Search functionality (Week 7)
8. Polish & deployment (Week 8)

**Deliverable**: MVP met complete user flow, testing, en documentatie

#### **Fase 2: Production Stable** (Week 9-20, Q2 2026)
**Doel**: Stabiele productie applicatie met integraties

**Belangrijke Items**:
1. BRP/iBurgerzaken export (Week 9-16)
2. Performance optimalisatie (Week 13-16)
3. Communication module (Week 17-18)
4. Enhanced audit logging (Week 19)
5. Security hardening (Week 20)

**Deliverable**: Productie-klaar met externe integraties

#### **Fase 3: Scale** (Week 21-40, Q3 2026)
**Doel**: Schalen naar 10+ gemeentes

**Items**:
1. BRP integratie (data verificatie)
2. Agenda management
3. Advanced validation
4. Analytics dashboard
5. BAG API integration

**Deliverable**: Schaalbaar platform

#### **Fase 4: Enhancement** (Week 41-52, Q4 2026)
**Doel**: Enterprise features

**Items**:
1. DigiD/eHerkenning
2. Multi-language support
3. Mobile PWA
4. Advanced reporting

**Deliverable**: Enterprise-ready platform

### Prioriteiten Matrix

| Priority | Items | Timeline | Impact |
|----------|-------|----------|--------|
| 🔴 **Kritisch** | GEMMA UI, File upload, Payment, Testing | Q1 2026 | Blokkeert go-live |
| 🔴 **Hoog** | Email, BRP export, Search, Docs | Q1-Q2 2026 | Essentieel voor adoptie |
| 🟡 **Normaal** | Communication, Agenda, Performance, BRP integratie | Q2-Q3 2026 | Verbetert UX significant |
| 🟢 **Laag** | Multi-language, PWA, Analytics, AI features | Q3-Q4 2026 | Nice-to-have |
| 🔧 **Tech Debt** | Tests, types, refactoring, monitoring | Continuous | Maintainability |

### Estimated Time to Key Milestones

- **MVP** (met file upload, payment, testing): **8 weken** (Q1 2026)
- **Pilot Ready** (met email, search, docs): **10 weken** (Q1 2026)
- **Production** (met BRP export, performance): **20 weken** (Q2 2026)
- **Scale** (10+ gemeentes): **40 weken** (Q3 2026)
- **Enterprise** (DigiD, multi-lang): **52 weken** (Q4 2026)

### Resource Requirements

**Development Team** (Recommended):
- 2-3 Full-stack developers (Next.js, PostgreSQL, TypeScript)
- 1 DevOps engineer (part-time, deployment & monitoring)
- 1 QA engineer (testing, accessibility)
- 1 Product Owner (requirements, gemeente liaison)
- 1 UX Designer (part-time, accessibility expert)

**External Services Budget** (Yearly):
- Vercel hosting: €500-1000/jaar
- Neon database: €100-300/maand
- Clerk auth: €200-500/maand (or DigiD: onetime setup cost)
- File storage (S3): €50-200/maand
- Email service: €50-100/maand
- Monitoring (Sentry): €100/maand
- **Total**: ~€15,000-25,000/jaar

**Third-party Integrations** (One-time + Ongoing):
- DigiD koppeling: ~€10,000-20,000 (one-time)
- BRP API access: Per gemeente agreement
- iBurgerzaken: Per gemeente agreement
- Payment provider: Transaction fees (1-3%)

### Success Criteria voor Go-Live

**Technical Requirements** ✅ = Done, 🔄 = In Progress, ⏳ = Todo:
- ✅ All core flows completed (aankondiging, ceremonie, dossier)
- ✅ Multi-tenancy with data isolation
- ✅ Validation system (30+ rules)
- ✅ Database architecture (17 tables, triggers, views)
- ✅ Admin interfaces
- ✅ PDF generation
- 🔄 GEMMA zaaknummer in UI
- ⏳ File upload (S3/Cloudinary)
- ⏳ Payment integration (Worldonline/Stripe)
- ⏳ Testing (>80% coverage)
- ⏳ Email notifications
- ⏳ Documentation (README, API docs, user guide)
- ⏳ License files (EUPL + Commercial) in repository
- ⏳ Wembv compliance documented and verified
- ⏳ MijnServices registration completed
- ⏳ Accessible PDF generation (PDF-UA compliance)
- ⏳ Wallet integration roadmap documented

**Non-functional Requirements**:
- ⏳ Performance: <2s page load, <200ms API
- ⏳ Uptime: 99.9% SLA
- ⏳ Accessibility: WCAG 2.2 Level AA (verified by expert)
- ⏳ Security: Penetration test passed
- ⏳ AVG: Data Processing Agreements met gemeentes
- ⏳ Backup: Automatic daily backups met restore testing

**Business Requirements**:
- ⏳ 2-3 pilot gemeentes akkoord
- ⏳ Training materials voor medewerkers
- ⏳ Support plan (helpdesk, SLA)
- ⏳ User acceptance testing (UAT) passed
- ⏳ Go-live communication plan

---

**Laatste update**: 28 december 2025  
**Volgende review**: 4 januari 2026 (Sprint Planning Week 1)  
**Document versie**: 2.0  
**Eigenaar**: Development Team  
**Status**: **Actieve ontwikkeling - MVP fase**

---

## 📞 Contact & Ondersteuning

**Voor vragen over dit masterplan**:
- GitHub Issues: Track specifieke bugs/features
- Team Chat: Dagelijkse communicatie
- Documentation: Inline comments + externe docs

**Voor gemeentes** (na go-live):
- Support Email: support@huwelijk.nl (tbd)
- Helpdesk: [Nummer] (tbd)
- User Guide: [Link naar documentatie]

---

*Dit masterplan is een levend document en wordt continu bijgewerkt volgens de Masterplan Updates regel (`.cursor/rules/masterplan-updates.mdc`). Bij elke significante wijziging wordt de "Laatste update" datum aangepast en relevante sectie bijgewerkt.*

