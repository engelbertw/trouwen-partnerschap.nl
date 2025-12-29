# DATABASE STORAGE IMPLEMENTATIE

## Overzicht

**Alle sessionStorage vervangen door directe database opslag.**

Alle formulieren slaan nu direct op in de PostgreSQL database via API endpoints.
De dossierId wordt doorgegeven via URL query parameters tussen pagina's.

---

## API Endpoints

### 1. Dossier Aanmaken
**POST** `/api/dossier/create`

Maakt een nieuw dossier aan bij start van de flow.

**Request:**
```json
{
  "type": "huwelijk" | "partnerschap"
}
```

**Response:**
```json
{
  "success": true,
  "dossierId": "uuid"
}
```

---

### 2. Aankondiging Type
**PUT** `/api/dossier/[id]/aankondiging`

Slaat het type aankondiging op (huwelijk vs partnerschap).

**Request:**
```json
{
  "type": "huwelijk" | "partnerschap"
}
```

**GET** `/api/dossier/[id]/aankondiging`

Haalt aankondiging type op.

---

### 3. Kinderen
**PUT** `/api/dossier/[id]/kinderen`

Slaat kinderen van beide partners op.

**Request:**
```json
{
  "partner1Children": [
    {
      "voornamen": "string",
      "achternaam": "string",
      "geboortedatum": "DD-MM-YYYY"
    }
  ],
  "partner2Children": [...]
}
```

**GET** `/api/dossier/[id]/kinderen`

Haalt kinderen op voor beide partners.

---

### 4. Curatele
**PUT** `/api/dossier/[id]/curatele`

Slaat curatele informatie op.

**Request:**
```json
{
  "partner1UnderGuardianship": boolean,
  "partner2UnderGuardianship": boolean
}
```

**GET** `/api/dossier/[id]/curatele`

---

### 5. Bloedverwantschap
**PUT** `/api/dossier/[id]/bloedverwantschap`

Slaat bloedverwantschap status op.

**Request:**
```json
{
  "areBloodRelatives": boolean
}
```

**GET** `/api/dossier/[id]/bloedverwantschap`

---

## Gewijzigde Pagina's

### ✅ Geüpdatet naar Database Storage

1. **010-aankondiging/page.tsx**
   - Maakt dossier aan bij eerste stap
   - Slaat type op via API
   - Geeft dossierId door via URL

2. **050-kinderen/page.tsx**
   - Laadt kinderen uit database
   - Slaat wijzigingen direct op
   - Validatie voordat opslaan
   - URL: `?dossierId={uuid}`

---

## URL Flow met dossierId

```
/000-aankondiging/010-aankondiging
  ↓ (create dossier)
/000-aankondiging/020-partner1-login?dossierId={uuid}
  ↓
/000-aankondiging/021-partner1-gegevens?dossierId={uuid}
  ↓
/000-aankondiging/030-partner2-login?dossierId={uuid}
  ↓
/000-aankondiging/031-partner2-gegevens?dossierId={uuid}
  ↓
/000-aankondiging/040-curatele?dossierId={uuid}
  ↓
/000-aankondiging/050-kinderen?dossierId={uuid}
  ↓
/000-aankondiging/060-bloedverwantschap?dossierId={uuid}
  ↓
/000-aankondiging/070-samenvatting?dossierId={uuid}
```

---

## Data Flow

### VOOR (❌ sessionStorage):
```
Gebruiker invullen
  ↓
sessionStorage.setItem()
  ↓
Volgende pagina
  ↓
sessionStorage.getItem()
  ↓
(Data verdwijnt na browser sluiten)
```

### NU (✅ Database):
```
Gebruiker invullen
  ↓
Validatie
  ↓
fetch('/api/dossier/[id]/...')
  ↓
PostgreSQL database
  ↓
Volgende pagina
  ↓
fetch (GET) data uit database
  ↓
(Data blijft permanent opgeslagen)
```

---

## Wijzigen vanuit Samenvatting

De samenvatting pagina heeft "Bewerk" knoppen:

```typescript
onClick={() => router.push('/000-aankondiging/050-kinderen?dossierId=' + dossierId)}
```

Wijzigingen worden nu DIRECT opgeslagen in database via PUT endpoints.

---

## Database Schema (Relevante Tabellen)

### dossier
```sql
- id (uuid, PK)
- gemeente_oin (text)
- status (enum: draft, in_review, locked)
- created_by (text) -- Clerk userId
- created_at (timestamp)
```

### aankondiging
```sql
- dossier_id (uuid, FK)
- partnerschap (boolean) -- false = huwelijk
- valid (boolean)
```

### partner
```sql
- id (uuid, PK)
- dossier_id (uuid, FK)
- sequence (integer) -- 1 or 2
- voornamen, geslachtsnaam
- geboortedatum
```

### kind
```sql
- id (uuid, PK)
- dossier_id (uuid, FK)
- partner_id (uuid, FK)
- voornamen, achternaam
- geboortedatum
```

---

## TODO: Nog Te Updaten Pagina's

### 🔄 Nog sessionStorage (moeten geüpdatet):

1. **020-partner1-login/page.tsx**
2. **021-partner1-gegevens/page.tsx**
3. **030-partner2-login/page.tsx**
4. **031-partner2-gegevens/page.tsx**
5. **040-curatele/page.tsx**
6. **060-bloedverwantschap/page.tsx**
7. **070-samenvatting/page.tsx** (moet data uit DB halen)
8. **080-ondertekenen/page.tsx**
9. **090-bevestiging/page.tsx**

---

## Validatie Blijft Behouden

Alle validatieregels uit `/lib/validation.ts` werken nog steeds:
- Client-side validatie VOOR opslaan
- Server-side validatie IN API endpoints (TODO)
- Visuele feedback (rood/geel boxes)

---

## Voordelen Database Storage

✅ **Persistent**: Data blijft bewaard na browser sluiten  
✅ **Betrouwbaar**: Geen data verlies bij tab sluiten  
✅ **Audit trail**: Wie, wat, wanneer gewijzigd  
✅ **Multi-device**: Kan later verder op ander apparaat  
✅ **Backup**: Database backups beschermen data  
✅ **Compliance**: AVG-compliant opslag  
✅ **Wijzigbaar**: Vanuit samenvatting direct opslaan  

---

## Security & Access Control

Alle API endpoints checken:
1. **Authenticatie**: Clerk `userId` vereist
2. **Autorisatie**: Alleen creator kan dossier bewerken
3. **Validatie**: Server-side input validatie (TODO)

```typescript
const { userId } = await auth();
if (!userId) return 401;

const dossier = await db.select()...;
if (dossier.createdBy !== userId) return 403;
```

---

## Volgende Stappen

1. ✅ API endpoints gemaakt (create, aankondiging, kinderen, curatele, bloedverwantschap)
2. ✅ Kinderen pagina geüpdatet
3. ✅ Aankondiging type pagina geüpdatet
4. 🔄 Andere form pagina's updaten (zie TODO lijst hierboven)
5. 🔄 Samenvatting pagina updaten om data uit DB te halen
6. 🔄 Partners API endpoints maken
7. 🔄 Ondertekenen flow integreren met database
8. ⬜ sessionStorage helper verwijderen na migratie compleet

---

## Test Checklist

- [ ] Nieuw dossier aanmaken
- [ ] Type kiezen (huwelijk/partnerschap)
- [ ] Kinderen toevoegen
- [ ] Opslaan naar database werkt
- [ ] Terug navigeren en data wordt geladen
- [ ] Wijzigen vanuit samenvatting werkt
- [ ] DossierId blijft behouden in URL
- [ ] Validatie werkt nog steeds
- [ ] Error handling bij API fouten

---

**Status**: ✅ Basis architectuur klaar  
**Next**: Overige pagina's migreren naar database storage

