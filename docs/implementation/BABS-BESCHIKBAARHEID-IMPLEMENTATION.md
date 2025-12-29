# BABS Beschikbaarheid Functionaliteit

## Overzicht

**BABS** = **B**uitengewoon **A**mbtenaar **B**urgerlijke **S**tand (trouwambtenaren)

Deze implementatie voegt beschikbaarheidsbeheer toe voor BABS op twee niveaus:

1. **Gemeente medewerkers** (`hb_admin`, `loket_medewerker`) kunnen:
   - BABS toevoegen/bewerken in de database
   - BABS beschikbaarheid bekijken en configureren
   - BABS toewijzen aan ceremonies
   - Via: `/gemeente/beheer/lookup?tab=babs`

2. **BABS zelf** (de trouwambtenaar met `babs_admin` rol) kan:
   - Eigen beschikbaarheid beheren via kalender
   - Eigen toegewezen ceremonies bekijken
   - Contactgegevens bijwerken
   - Via: `/babs/beschikbaarheid`

## Database Wijzigingen

### Nieuwe Velden in `ihw.babs` Tabel

```sql
-- sql/migrations/090_babs_beschikbaarheid.sql
ALTER TABLE ihw.babs ADD COLUMN:
- beschikbaarheid (jsonb) - Wekelijkse beschikbaarheid als JSON
- beschikbaar_vanaf (date) - Startdatum beschikbaarheid
- beschikbaar_tot (date) - Einddatum beschikbaarheid (optioneel)
- opmerking_beschikbaarheid (text) - Vrije tekst opmerkingen
```

**Format `beschikbaarheid` JSON:**
```json
{
  "maandag": ["09:00-12:00", "14:00-17:00"],
  "dinsdag": ["09:00-17:00"],
  "woensdag": [],
  "donderdag": ["09:00-12:00"],
  "vrijdag": ["09:00-16:00"],
  "zaterdag": [],
  "zondag": []
}
```

### Database Deployment

```bash
# Run migration
psql -h your-database-host -U your-user -d your-database -f sql/migrations/090_babs_beschikbaarheid.sql
```

## Nieuwe Clerk Role: `babs_admin`

### Belangrijk: Wie krijgt welke rol?

| Wie | Rol | Doel | Toegang |
|-----|-----|------|---------|
| **Gemeente medewerker** | `hb_admin` of `loket_medewerker` | Beheert BABS-lijst | Kan alle BABS toevoegen/bewerken/beheren |
| **Trouwambtenaar (BABS persoon)** | `babs_admin` | Eigen beschikbaarheid beheren | Kan alleen eigen beschikbaarheid en ceremonies zien |

### Role Configuratie voor BABS Persoon

In Clerk moet je voor een **BABS persoon** (de trouwambtenaar zelf) het volgende instellen in `publicMetadata`:

```json
{
  "rol": "babs_admin",
  "gemeente_oin": "00000001002564440000",
  "gemeente_naam": "Amsterdam",
  "babs_id": "uuid-van-babs-record"
}
```

**Belangrijk:** Het `babs_id` veld moet matchen met het `id` van het BABS record in de database.

### Rollen Overzicht

| Role | Toegang | Beschrijving |
|------|---------|--------------|
| `system_admin` | Alles | Systeembeheerder |
| `hb_admin` | Gemeente data | Hoofd Burgerlijke Stand - beheert BABS-lijst |
| `loket_medewerker` | Gemeente data | Loketmedewerker (lezen/schrijven) - kan BABS beheren |
| `loket_readonly` | Gemeente data | Alleen lezen |
| `babs_admin` | **Eigen beschikbaarheid** | De BABS persoon zelf (trouwambtenaar) kan alleen eigen beschikbaarheid beheren |

## API Endpoints

### 1. BABS Beschikbaarheid (Voor BABS Admin)

#### GET `/api/babs/beschikbaarheid`
Haalt beschikbaarheid op van ingelogde BABS.

**Authenticatie:** Vereist `babs_admin` role + `babs_id` in metadata

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "naam": "Jan de Vries",
    "voornaam": "Jan",
    "achternaam": "de Vries",
    "beschikbaarheid": {
      "maandag": ["09:00-17:00"],
      "dinsdag": ["09:00-17:00"]
    },
    "beschikbaarVanaf": "2024-01-01",
    "beschikbaarTot": "2024-12-31",
    "opmerkingBeschikbaarheid": "Alleen op woensdag in december"
  }
}
```

#### PUT `/api/babs/beschikbaarheid`
Update beschikbaarheid van ingelogde BABS.

**Request Body:**
```json
{
  "beschikbaarheid": {
    "maandag": ["09:00-17:00"],
    "dinsdag": ["09:00-17:00"]
  },
  "beschikbaarVanaf": "2024-01-01",
  "beschikbaarTot": "2024-12-31",
  "opmerkingBeschikbaarheid": "Alleen op woensdag in december"
}
```

### 2. Gemeente Lookup BABS (Voor Gemeente Beheerders)

#### GET `/api/gemeente/lookup/babs`
Haalt alle BABS op (inclusief beschikbaarheid)

**Authenticatie:** Vereist gemeente rol

**Response:** Lijst van alle BABS met beschikbaarheidsvelden

#### PUT `/api/gemeente/lookup/babs/[id]`
Update BABS gegevens (gemeente kan beschikbaarheid aanpassen)

## Frontend Pagina's

### 1. BABS Beschikbaarheid Pagina
**URL:** `/babs/beschikbaarheid`

**Toegang:** Alleen voor gebruikers met `babs_admin` role

**Functionaliteit:**
- Toon huidige beschikbaarheid
- Periode instellen (vanaf/tot datum)
- Dagen van de week selecteren
- Opmerkingen toevoegen
- Opslaan naar database

**Screenshot Flow:**
```
┌─────────────────────────────────────┐
│ BABS Portal                         │
│ Welkom, Jan de Vries                │
├─────────────────────────────────────┤
│ Mijn beschikbaarheid                │
│                                     │
│ Periode van beschikbaarheid         │
│ [Vanaf] [Tot]                       │
│                                     │
│ Beschikbare dagen                   │
│ ☑ Maandag                           │
│ ☑ Dinsdag                           │
│ ☐ Woensdag                          │
│ ...                                 │
│                                     │
│ Opmerkingen                         │
│ [text area]                         │
│                                     │
│ [Opslaan] [Annuleren]               │
└─────────────────────────────────────┘
```

### 2. Gemeente Beheer Lookup Pagina (Update)
**URL:** `/gemeente/beheer/lookup` (tab: BABS)

**Toegang:** Gemeente beheerders (`hb_admin`, `loket_medewerker`)

**Nieuwe Velden:**
- Status dropdown (in_aanvraag, beedigd, ongeldig)
- Beschikbaar vanaf (date picker)
- Beschikbaar tot (date picker)
- Opmerking beschikbaarheid (textarea)

**Tabel kolom "Beschikbaarheid":**
```
┌──────────────────────────────────┐
│ Vanaf: 2024-01-01                │
│ Tot: 2024-12-31                  │
│ Alleen op woensdag in december   │
└──────────────────────────────────┘
```

## TypeScript Types Update

### `GemeenteContext` (src/lib/gemeente.ts)

```typescript
export type GemeenteContext = {
  userId: string;
  gemeenteOin: string;
  gemeenteNaam: string;
  rol: 'system_admin' | 'hb_admin' | 'loket_medewerker' | 'loket_readonly' | 'babs_admin';
  babsId?: string; // Alleen voor BABS gebruikers
};
```

### Helper Functies

```typescript
// Check if user is BABS admin
export function isBabsAdmin(rol: GemeenteContext['rol']): boolean {
  return rol === 'babs_admin';
}
```

## Middleware Update

`src/middleware.ts` bevat nu BABS route bescherming:

```typescript
const isBabsRoute = createRouteMatcher([
  '/babs/beschikbaarheid(.*)',
  '/api/babs/beschikbaarheid(.*)',
]);
```

## Gebruiksscenario's

### Scenario 1: BABS Registreert Beschikbaarheid

1. BABS logt in met eigen account (rol: `babs_admin`)
2. Navigeert naar `/babs/beschikbaarheid`
3. Ziet eigen naam en huidige beschikbaarheid
4. Stelt periode in (bijv. 1 jan - 31 dec 2024)
5. Vinkt beschikbare dagen aan (ma, di, do, vr)
6. Voegt opmerking toe: "In december alleen op woensdag"
7. Klikt op "Beschikbaarheid opslaan"
8. Ziet bevestiging: "Beschikbaarheid succesvol bijgewerkt!"

### Scenario 2: Gemeente Beheert BABS

1. Gemeente medewerker logt in
2. Gaat naar "Beheer" → "Standaard tabellen" → "BABS"
3. Ziet overzicht van alle BABS met beschikbaarheid
4. Klikt op "Bewerken" bij een BABS
5. Kan aanvullende datums/opmerkingen toevoegen
6. Kan BABS actief/inactief zetten
7. Slaat wijzigingen op

### Scenario 3: Ceremonie Plannen (Toekomstig)

1. Burger kiest datum voor ceremonie
2. Systeem checkt welke BABS beschikbaar zijn op die datum/dag
3. Filtert op:
   - `actief = true`
   - `status = 'beedigd'`
   - Datum tussen `beschikbaar_vanaf` en `beschikbaar_tot`
   - Dag van de week in `beschikbaarheid` JSON
4. Toont beschikbare BABS aan burger/gemeente

## Security & Validatie

### API Security

✅ **Authenticatie:** Alle endpoints vereisen Clerk authenticatie
✅ **Autorisatie:** BABS kunnen alleen eigen data zien/wijzigen
✅ **Validatie:** JSON beschikbaarheid format wordt gevalideerd
✅ **Multi-tenancy:** BABS is gekoppeld aan gemeente via metadata

### Data Validatie

```typescript
// In API route
if (beschikbaarheid && typeof beschikbaarheid !== 'object') {
  return NextResponse.json(
    { success: false, error: 'Ongeldige beschikbaarheid format' },
    { status: 400 }
  );
}
```

## Testing Checklist

### Database
- [ ] Run migration `090_babs_beschikbaarheid.sql`
- [ ] Verify new columns exist
- [ ] Check default values

### Clerk Setup
- [ ] Create test BABS user
- [ ] Set `rol: "babs_admin"` in publicMetadata
- [ ] Set `babs_id` to valid UUID
- [ ] Set `gemeente_oin` and `gemeente_naam`

### BABS Portal
- [ ] Login as BABS
- [ ] Navigate to `/babs/beschikbaarheid`
- [ ] See own name displayed
- [ ] Select dagen
- [ ] Set periode
- [ ] Add opmerking
- [ ] Save successfully
- [ ] Verify data persisted (refresh page)

### Gemeente Beheer
- [ ] Login as gemeente medewerker
- [ ] Go to Beheer → Lookup → BABS
- [ ] See beschikbaarheid column
- [ ] Edit BABS
- [ ] See nieuwe velden (vanaf, tot, opmerking)
- [ ] Update and save
- [ ] Verify in database

### Security
- [ ] Try accessing `/babs/beschikbaarheid` without BABS role → 403
- [ ] Try accessing other BABS data → 403/404
- [ ] Verify middleware blocks unauthenticated access

## Deployment Stappen

1. **Database Migration**
   ```bash
   psql -f sql/migrations/090_babs_beschikbaarheid.sql
   ```

2. **Code Deploy**
   - Push changes to repository
   - Trigger deployment

3. **Clerk Configuration**
   - Voor elke BABS: Stel `publicMetadata` in
   - Verifieer `babs_id` matches database UUID

4. **Testen**
   - Test BABS login
   - Test gemeente beheer
   - Test beschikbaarheid opslaan/laden

## Toekomstige Uitbreidingen

### 1. Specifieke Tijdslots
Gemeenten kunnen specifieke tijden instellen:
```json
{
  "maandag": ["09:00-10:00", "10:30-11:30", "14:00-15:00"]
}
```

### 2. Uitzonderingen
BABS kan specifieke datums blokkeren:
```json
{
  "blocked_dates": ["2024-12-25", "2024-01-01"]
}
```

### 3. Automatische Planning
Systeem stelt automatisch BABS voor op basis van:
- Beschikbaarheid
- Werkdruk (aantal ceremonies)
- Voorkeuren

### 4. Notificaties
- Email naar BABS bij nieuwe toewijzing
- Reminder 1 week voor ceremonie
- Bevestiging na ceremonie

## Troubleshooting

### Probleem: "Geen toegang" error
**Oplossing:** Check Clerk publicMetadata:
- `rol` moet `"babs_admin"` zijn
- `babs_id` moet valid UUID zijn
- `babs_id` moet bestaan in database

### Probleem: Beschikbaarheid niet zichtbaar in gemeente beheer
**Oplossing:** 
- Check database: `SELECT beschikbaarheid FROM ihw.babs;`
- Verify migration ran successfully
- Check API response in Network tab

### Probleem: "BABS niet gevonden" bij opslaan
**Oplossing:**
- Verify `babs_id` in Clerk metadata matches database
- Check `babs.id` in database: `SELECT id FROM ihw.babs;`

## Contact & Support

Voor vragen of problemen:
- Check deze documentatie
- Review code in `src/app/api/babs/` en `src/app/babs/`
- Check database met SQL queries
- Review Clerk publicMetadata configuratie

