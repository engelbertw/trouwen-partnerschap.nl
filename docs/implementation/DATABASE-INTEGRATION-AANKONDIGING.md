# Database Integratie - Aankondiging Flow

## ✅ Implementatie Complete

De aankondiging formulier data wordt nu opgeslagen in de PostgreSQL database wanneer de gebruiker de aankondiging verzendt.

## 📋 Wat is Geïmplementeerd

### 1. API Route: `/api/aankondiging/submit`
**Bestand:** `src/app/api/aankondiging/submit/route.ts`

**Functionaliteit:**
- Ontvangt formulier data via POST request
- Valideert gebruiker authenticatie (via Clerk)
- Valideert verplichte velden
- Slaat alles op in database via transaction:
  - `dossier` - hoofd record met status 'draft'
  - `aankondiging` - type (huwelijk/partnerschap)
  - `partner` (2x) - beide partners met hun gegevens
  - `dossier_block` (5x) - aankondiging, ceremonie, getuigen, papieren, betaling
- Returnt dossierId bij succes
- Error handling met duidelijke foutmeldingen

**Request Format:**
```json
{
  "data": {
    "type": "huwelijk",
    "partner1": { ... },
    "partner2": { ... },
    "curatele": { ... },
    "kinderen": { ... },
    "bloedverwantschap": { ... }
  }
}
```

**Response Format (Success):**
```json
{
  "success": true,
  "dossierId": "uuid",
  "message": "Aankondiging succesvol opgeslagen in database"
}
```

**Response Format (Error):**
```json
{
  "success": false,
  "error": "Foutmelding",
  "details": "Debug info (alleen in development)"
}
```

### 2. Bevestiging Pagina Update
**Bestand:** `src/app/000-aankondiging/090-bevestiging/page.tsx`

**Nieuwe Functionaliteit:**
- **Loading State**: Toont spinner tijdens opslaan
- **Database Save**: Roept API aan via `useEffect` bij laden
- **Error Handling**: Toont foutmelding bij problemen met retry optie
- **Success State**: Toont dossiernummer en bevestiging
- **Storage Cleanup**: Wist sessionStorage/localStorage na succes
- **Navigation**: Link naar dossier detail pagina (TODO)

**Flow:**
```
1. Pagina laadt
2. useEffect triggert
3. Get data from storage (getAankondigingData)
4. Validate data exists
5. POST naar /api/aankondiging/submit
6. Show loading spinner
7. Success: Show confirmation + dossierId
8. Error: Show error + retry button
9. Clear storage on success
```

### 3. Test API Route
**Bestand:** `src/app/api/aankondiging/test/route.ts`

Test de database verbinding:
```bash
curl http://localhost:3000/api/aankondiging/test
```

## 🗄️ Database Schema

### Tabellen die worden aangemaakt:

**1. `ihw.dossier`**
```sql
- id (uuid, primary key)
- gemeente_oin (text, foreign key)
- status (enum: 'draft', 'in_review', 'ready_for_payment', 'locked', 'cancelled')
- created_by (text) - Clerk userId
- municipality_code (text)
- is_test (boolean)
- created_at, updated_at (timestamps)
```

**2. `ihw.aankondiging`**
```sql
- id (uuid, primary key)
- dossier_id (uuid, foreign key to dossier)
- gemeente_oin (text, foreign key)
- partnerschap (boolean) - true voor partnerschap, false voor huwelijk
- reeds_gehuwd (boolean)
- omzetting (boolean)
- beiden_niet_woonachtig (boolean)
- valid (boolean)
- created_at, updated_at (timestamps)
```

**3. `ihw.partner` (2 records per dossier)**
```sql
- id (uuid, primary key)
- dossier_id (uuid, foreign key to dossier)
- gemeente_oin (text, foreign key)
- sequence (integer) - 1 of 2
- voornamen (text)
- geslachtsnaam (text)
- geboortedatum (date)
- geboorteplaats (text)
- geboorteland (text)
- email (text)
- ouders_onbekend (boolean)
- created_at, updated_at (timestamps)
```

**4. `ihw.dossier_block` (5 records per dossier)**
```sql
- id (uuid, primary key)
- dossier_id (uuid, foreign key to dossier)
- gemeente_oin (text, foreign key)
- code (enum: 'aankondiging', 'ceremonie', 'getuigen', 'papieren', 'betaling')
- complete (boolean)
- required (boolean)
- completed_at (timestamp)
- completed_by (text)
- created_at, updated_at (timestamps)
```

## 🔄 Data Flow

### Huidige Flow (Browser Storage → Database):
```
1. User vult formulier in
   ↓
2. Data in sessionStorage (per stap)
   ↓
3. Ondertekenen door beide partners
   ↓
4. Klik "Aankondiging versturen"
   ↓
5. Redirect naar /090-bevestiging
   ↓
6. useEffect → API call → Database save
   ↓
7. Success → Show dossierId
   ↓
8. Clear browser storage
```

### Toekomstige Flow (Progressive Save):
Voor nog betere UX kan je data al tijdens invullen opslaan:

```typescript
// Elke stap automatisch opslaan in database
const handleContinue = async () => {
  // Valideer
  
  // Save to database (draft status)
  await saveDraftToDatabase();
  
  // Navigate
  router.push('/next-step');
};
```

## 🧪 Testen

### 1. Database Verbinding Testen
```bash
# Start dev server
npm run dev

# Test database verbinding
curl http://localhost:3000/api/aankondiging/test
```

**Verwacht resultaat:**
```json
{
  "success": true,
  "message": "Database verbinding werkt!",
  "gemeenteCount": 1,
  "hasGemeente": true
}
```

### 2. Complete Flow Testen

**Stappen:**
1. Login met Clerk
2. Ga naar `/000-aankondiging/000-inleiding`
3. Doorloop het formulier
4. Vul alle velden in
5. Onderteken met beide partners
6. Klik "Aankondiging versturen"
7. **Zie loading spinner**
8. **Zie success met dossierId**

**Controleer in database:**
```sql
-- Check dossier
SELECT * FROM ihw.dossier ORDER BY created_at DESC LIMIT 1;

-- Check aankondiging
SELECT * FROM ihw.aankondiging ORDER BY created_at DESC LIMIT 1;

-- Check partners
SELECT * FROM ihw.partner ORDER BY created_at DESC LIMIT 2;

-- Check blocks
SELECT * FROM ihw.dossier_block ORDER BY created_at DESC LIMIT 5;
```

### 3. Error Handling Testen

**Test zonder gemeente:**
Als de `gemeente_oin` uit Clerk niet bestaat in `ihw.gemeente`, krijg je een 400 response: "Gemeente niet gevonden".

**Oplossing:**
```sql
-- Insert test gemeente
INSERT INTO ihw.gemeente (oin, naam, gemeente_code, actief)
VALUES ('00000001002564440000', 'Amsterdam', '0363', true);
```

## 🚀 Deployment Checklist

- [ ] Database migrations draaien (SQL files in `sql/` folder)
- [ ] Gemeente record(en) toevoegen
- [ ] `DATABASE_URL` environment variable instellen
- [ ] Clerk webhooks configureren (voor user sync)
- [ ] Test volledige flow in productie
- [ ] Monitor error logs
- [ ] Backup strategie instellen

## 📝 Todo: Volgende Features

### High Priority
- [ ] Dossier detail pagina maken (`/dossier/[id]`)
- [ ] Curatele document upload naar database/blob storage
- [ ] Kinderen data opslaan (aparte tabel?)
- [ ] Email notificatie na succesvol opslaan
- [ ] PDF generatie voor bevestiging

### Medium Priority
- [ ] Progressive save (opslaan tijdens invullen)
- [ ] Resume draft functionaliteit (hervatten onvoltooide aankondiging)
- [ ] Validation rules toevoegen (bijv. minimale leeftijd)
- [ ] Audit log (wie heeft wat gewijzigd)

### Low Priority
- [ ] Multi-gemeente support (gemeente selectie)
- [ ] Admin dashboard
- [ ] Rapportage en statistieken

## ⚠️ Belangrijke Notes

### Gemeente OIN
De API haalt `gemeente_oin` op via `getGemeenteContext()` (Clerk publicMetadata) en koppelt het aan `ihw.gemeente`.
```typescript
const context = await getGemeenteContext();
if (!context.success) {
  return NextResponse.json({ success: false, error: context.error }, { status: 401 });
}
const { gemeenteOin } = context.data;
```

**Voor productie:**
- Zorg dat elke gebruiker `gemeente_oin` in Clerk publicMetadata heeft
- Zorg dat `ihw.gemeente` een record bevat met dezelfde OIN + `gemeente_code`

### Authenticatie
De API route vereist Clerk authenticatie + gemeente context:
```typescript
const context = await getGemeenteContext();
if (!context.success) {
  return NextResponse.json({ success: false, error: context.error }, { status: 401 });
}
```

Dit betekent dat gebruikers ingelogd moeten zijn.

### Transactions
Alle database writes gebeuren in een transaction:
```typescript
await db.transaction(async (tx) => {
  // Als ÉÉN query faalt, wordt ALLES teruggedraaid
  await tx.insert(dossier)...
  await tx.insert(aankondiging)...
  await tx.insert(partner)...
  // etc
});
```

Dit zorgt voor data integriteit.

## 🎉 Success!

De database integratie is compleet! Data wordt nu echt opgeslagen in PostgreSQL in plaats van alleen in de browser.

