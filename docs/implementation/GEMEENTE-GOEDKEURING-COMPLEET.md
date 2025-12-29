# Gemeente Beheer - Aankondigingen Goedkeuren - Compleet

## ✅ Status: VOLLEDIG GEÏMPLEMENTEERD

Het goedkeuringssysteem voor aankondigingen is al volledig operationeel in het gemeente beheer scherm!

## 🎯 Functionaliteit

### 1. **Gemeente Beheer Dashboard**

**Locatie**: `src/app/gemeente/beheer/page.tsx`

#### A. Overzicht Aankondigingen

**Kolommen**:
- Dossiernummer (GEMMA identificatie)
- Partners (beide namen)
- Type (Huwelijk/Partnerschap)
- Aangemaakt datum
- Status badge
- Acties

#### B. Filter Opties

**4 Filters**:
1. **Te beoordelen** (pending) - Default view
2. **Goedgekeurd** (approved)
3. **Afgekeurd** (rejected)
4. **Alles** (all)

**Status Logic**:
```typescript
const isPending = !gevalideerdOp;  // Nog niet beoordeeld
const isApproved = valid && gevalideerdOp;  // Goedgekeurd
const isRejected = !valid && gevalideerdOp;  // Afgekeurd
```

#### C. Status Badges

**Visuele Feedback**:
- **Te beoordelen**: Geel badge
- **Goedgekeurd**: Groen badge
- **Afgekeurd**: Rood badge

#### D. Acties Per Aankondiging

**Voor pending aankondigingen**:
- **Bekijken** - Link naar volledig dossier
- **Goedkeuren** - Groene knop
  - Confirmation dialog
  - Updates status naar approved
- **Afkeuren** - Rode knop
  - Prompt voor reden
  - Opslaan afwijzingsreden

**Voor afgewezen aankondigingen**:
- **Reden weergave** - Tooltip met volledige reden

### 2. **API Endpoints**

#### A. Lijst Ophalen

**Endpoint**: `GET /api/gemeente/aankondigingen`

**Locatie**: `src/app/api/gemeente/aankondigingen/route.ts`

**Query Parameters**:
- `status`: pending | approved | rejected | all
- `limit`: Aantal records (default: 50)
- `offset`: Pagination offset

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "aankondiging": {
        "id": "...",
        "dossierId": "...",
        "partnerschap": false,
        "valid": true,
        "invalidReason": null,
        "aangemaaktOp": "2025-01-15T10:00:00Z",
        "gevalideerdOp": "2025-01-16T14:30:00Z",
        "gevalideerdDoor": "user_xyz"
      },
      "dossier": {
        "id": "...",
        "identificatie": "HUW-2025-000001",
        "status": "in_review"
      },
      "partner1": {
        "voornamen": "Emma Louise Maria",
        "geslachtsnaam": "Janssen"
      },
      "partner2": {
        "voornamen": "Sergio",
        "geslachtsnaam": "García Fernández"
      }
    }
  ]
}
```

**Multi-tenancy**: 
- Filtert automatisch op `gemeente_oin`
- Gebruikt Clerk `publicMetadata.oin`

#### B. Goedkeuren

**Endpoint**: `POST /api/gemeente/aankondigingen/[id]/goedkeuren`

**Locatie**: `src/app/api/gemeente/aankondigingen/[id]/goedkeuren/route.ts`

**Acties**:
1. Verificatie gemeente medewerker
2. Check aankondiging bestaat en hoort bij gemeente
3. Update aankondiging:
   - `valid = true`
   - `gevalideerd_op = NOW()`
   - `gevalideerd_door = userId`
   - `invalid_reason = null`
4. Update dossier status: `draft` → `in_review`
5. Markeer aankondiging block als compleet
6. Return success

**Request**:
```http
POST /api/gemeente/aankondigingen/abc-123/goedkeuren
Content-Type: application/json

{
  "opmerkingen": "Alles in orde" // Optioneel
}
```

**Response**:
```json
{
  "success": true,
  "message": "Aankondiging goedgekeurd"
}
```

#### C. Afkeuren

**Endpoint**: `POST /api/gemeente/aankondigingen/[id]/afkeuren`

**Locatie**: `src/app/api/gemeente/aankondigingen/[id]/afkeuren/route.ts`

**Acties**:
1. Verificatie gemeente medewerker
2. Check aankondiging bestaat en hoort bij gemeente
3. Valideer reden is opgegeven
4. Update aankondiging:
   - `valid = false`
   - `gevalideerd_op = NOW()`
   - `gevalideerd_door = userId`
   - `invalid_reason = reden`
5. Update dossier status blijft `draft`
6. Aankondiging block blijft incomplete
7. Return success

**Request**:
```http
POST /api/gemeente/aankondigingen/abc-123/afkeuren
Content-Type: application/json

{
  "reden": "Ouders van partner 1 zijn onbekend (puntouders)"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Aankondiging afgekeurd"
}
```

### 3. **Database Schema**

**Tabel**: `ihw.aankondiging`

**Relevante Velden**:
```sql
valid                    BOOLEAN NOT NULL DEFAULT false,
invalid_reason           TEXT,
aangemaakt_op           TIMESTAMPTZ NOT NULL,
gevalideerd_op          TIMESTAMPTZ,  -- NULL = nog niet beoordeeld
gevalideerd_door        TEXT,         -- Clerk userId
```

**Status Bepaling**:
- **Te beoordelen**: `gevalideerd_op IS NULL`
- **Goedgekeurd**: `valid = true AND gevalideerd_op IS NOT NULL`
- **Afgekeurd**: `valid = false AND gevalideerd_op IS NOT NULL`

### 4. **Workflow**

#### Voor Burgers:

1. **Aankondiging indienen**:
   - Vul aankondigingsformulier in
   - Submit → Status: "Te beoordelen"
   - Dossier status: `draft`

2. **Wachten op goedkeuring**:
   - Kunnen dossier bekijken
   - Kunnen geen ceremonie plannen (geblokkeerd)
   - Zie status in dossier overzicht

3. **Na goedkeuring**:
   - Dossier status: `in_review`
   - Ceremonie plannen knop wordt zichtbaar
   - Kunnen verdergaan met proces

4. **Bij afkeuring**:
   - Ontvangen melding met reden
   - Kunnen aankondiging aanpassen
   - Opnieuw indienen voor beoordeling

#### Voor Gemeente Medewerkers:

1. **Login** met gemeente account (Clerk + OIN in metadata)

2. **Ga naar Beheer**:
   ```
   /gemeente/beheer
   ```

3. **Zie lijst "Te beoordelen"** (default):
   - Alle nieuwe aankondigingen van hun gemeente
   - Gefilterd op `gemeente_oin`

4. **Beoordeel Aankondiging**:

   **A. Bekijken**:
   - Klik "Bekijken" om volledig dossier te zien
   - Check partner gegevens
   - Controleer documenten
   - Verificeer geen showstoppers

   **B. Goedkeuren**:
   - Klik "Goedkeuren"
   - Bevestig in dialog
   - Aankondiging → Status: Goedgekeurd
   - Burger kan nu ceremonie plannen

   **C. Afkeuren**:
   - Klik "Afkeuren"
   - Typ reden in prompt (verplicht)
   - Aankondiging → Status: Afgekeurd
   - Burger ziet afwijzingsreden

5. **Filter Overzicht**:
   - **Goedgekeurd**: Zie historisch overzicht
   - **Afgekeurd**: Zie afgekeurde aankondigingen met redenen
   - **Alles**: Volledig overzicht

### 5. **Security & Multi-tenancy**

**Authenticatie**:
- Clerk authentication vereist
- Rol check via `publicMetadata.oin`
- Alleen gemeente medewerkers met OIN

**Multi-tenancy**:
```typescript
const { gemeenteOin } = await getGemeenteContext();

// Alle queries filteren op gemeente_oin
whereConditions.push(eq(aankondiging.gemeenteOin, gemeenteOin));
```

**Ownership Verification**:
- Aankondiging moet bij gemeente horen
- Dossier moet bij gemeente horen
- Cross-tenant access geblokkeerd

### 6. **UI/UX Features**

✅ **Real-time Updates**:
- Na goedkeuren/afkeuren: lijst refresh
- Status badges update automatisch

✅ **Loading States**:
- "Bezig..." tijdens processing
- Disabled buttons tijdens actie
- Processing indicator per item

✅ **Error Handling**:
- Alert bij fouten
- Nederlandse foutmeldingen
- Error banner boven lijst

✅ **Confirmation**:
- "Weet u zeker..." bij goedkeuren
- Prompt voor reden bij afkeuren
- Voorkom onbedoelde acties

✅ **Responsive**:
- Tabel met horizontal scroll
- Mobile-friendly layout
- Touch-friendly buttons

### 7. **Showstoppers (Automatisch)

**Database Validatie Checks**:
```sql
-- Automatisch gecontroleerd bij aankondiging:
reeds_gehuwd              BOOLEAN  -- Partner al getrouwd
beiden_niet_woonachtig    BOOLEAN  -- Geen van beiden in gemeente
omzetting                 BOOLEAN  -- Omzetting partnerschap
partnerschap              BOOLEAN  -- Is partnerschap (niet huwelijk)
```

**Bij showstopper**:
- `valid = false` (automatisch)
- Gemeente medewerker ziet reden
- Kan direct afkeuren met specifieke reden

### 8. **Integratie Met Dossier Flow**

**Blocked Status**:
```typescript
// In src/app/dossier/[id]/page.tsx
const aankondigingAfgerond = 
  aankondigingBlock?.complete === true &&
  aankondigingData[0]?.valid === true &&
  currentDossier.status !== 'draft';

// Ceremonie plannen alleen beschikbaar als:
const acties = {
  ceremonie: aankondigingAfgerond && !formattedCeremonie,
};
```

**Visual Feedback voor Burger**:
- Openstaande actie: "Plan ceremonie" (grijs, disabled)
- Tooltip: "Beschikbaar na goedkeuring aankondiging"
- Na goedkeuring: Knop wordt actief (blauw)

## 📋 Voorbeelden

### Voorbeeld 1: Goedkeuren

**Situatie**: Emma en Sergio hebben aankondiging ingediend

**Stappen**:
1. Gemeente medewerker ziet in "Te beoordelen"
2. Klikt "Bekijken" → Checkt alle gegevens
3. Klikt "Goedkeuren" → Bevestigt
4. Status → Goedgekeurd (groen)
5. Emma en Sergio kunnen nu ceremonie plannen

**Database Changes**:
```sql
-- aankondiging tabel:
UPDATE ihw.aankondiging SET
  valid = true,
  gevalideerd_op = NOW(),
  gevalideerd_door = 'user_gemeente_medewerker'
WHERE dossier_id = '...';

-- dossier tabel:
UPDATE ihw.dossier SET
  status = 'in_review'
WHERE id = '...';

-- dossier_block tabel:
UPDATE ihw.dossier_block SET
  complete = true,
  completed_at = NOW()
WHERE dossier_id = '...' AND code = 'aankondiging';
```

### Voorbeeld 2: Afkeuren

**Situatie**: Partner 1 heeft puntouders (ouders onbekend)

**Stappen**:
1. Gemeente medewerker ziet showstopper in gegevens
2. Klikt "Afkeuren"
3. Typ reden: "Partner 1 heeft geen bekende ouders (puntouders). Dit is een showstopper voor aankondiging."
4. Status → Afgekeurd (rood)
5. Emma en Sergio zien afwijzingsreden

**Database Changes**:
```sql
UPDATE ihw.aankondiging SET
  valid = false,
  gevalideerd_op = NOW(),
  gevalideerd_door = 'user_gemeente_medewerker',
  invalid_reason = 'Partner 1 heeft geen bekende ouders (puntouders)...'
WHERE dossier_id = '...';

-- Dossier blijft 'draft', aankondiging block blijft incomplete
```

## 📁 Bestanden

**Frontend**:
- `src/app/gemeente/beheer/page.tsx` - Beheer dashboard

**Backend API**:
- `src/app/api/gemeente/aankondigingen/route.ts` - Lijst ophalen
- `src/app/api/gemeente/aankondigingen/[id]/goedkeuren/route.ts` - Goedkeuren
- `src/app/api/gemeente/aankondigingen/[id]/afkeuren/route.ts` - Afkeuren

**Database**:
- `sql/020_core_tables.sql` - Aankondiging tabel definitie
- `src/db/schema.ts` - Drizzle schema

**Utilities**:
- `src/lib/gemeente.ts` - Gemeente context helper

## ✨ Conclusie

De goedkeuringsfunctionaliteit voor aankondigingen is **volledig operationeel**:

✅ **Overzicht**: Gemeente medewerkers zien alle aankondigingen  
✅ **Filters**: Te beoordelen, Goedgekeurd, Afgekeurd, Alles  
✅ **Goedkeuren**: Met één klik + confirmatie  
✅ **Afkeuren**: Met verplichte reden opgave  
✅ **Multi-tenant**: Automatisch gefilterd per gemeente  
✅ **Security**: Alleen gemeente medewerkers met OIN  
✅ **Workflow**: Blokkeer ceremonie tot goedkeuring  
✅ **Audit Trail**: Wie, wanneer, waarom  
✅ **User Friendly**: Duidelijke status en acties  

**Status**: ✅ **VOLLEDIG GEÏMPLEMENTEERD EN KLAAR VOOR GEBRUIK**

Gemeente medewerkers kunnen direct aan de slag met het goedkeuren van aankondigingen!

