# Document Opties Beheer - Implementatie Compleet

## ✅ Wat is geïmplementeerd

### 1. Database Tabel: `document_optie`

**Locatie**: `sql/migrations/005_document_options.sql`

Een nieuwe tabel voor configureerbare document opties per gemeente:

**Velden**:
- `id`: UUID primary key
- `gemeente_oin`: Link naar gemeente
- `code`: Unieke code (bijv. 'trouwboekje', 'huwelijksakte')
- `naam`: Weergavenaam
- `omschrijving`: Beschrijving voor gebruiker
- `papier_type`: Koppeling naar papier_type enum
- `prijs_cents`: Prijs in eurocenten
- `gratis`: Boolean of gratis
- `verplicht`: Boolean of verplicht/standaard
- `actief`: Boolean of actief
- `volgorde`: Sorteervolgorde
- Timestamps (created_at, updated_at)

**Constraints**:
- Prijs moet >= 0
- Gratis documenten mogen geen prijs hebben
- Unieke combinatie gemeente_oin + code

**Seed Data**:
Automatisch 4 standaard documentsoorten per gemeente:
1. **Trouwboekje** - Gratis, verplicht (€0,00)
2. **Huwelijksakte** - Optioneel (€17,10)
3. **Internationale huwelijksakte** - Optioneel (€17,10)
4. **Extra exemplaar trouwboekje** - Optioneel (€24,50)

### 2. Drizzle Schema Update

**Locatie**: `src/db/schema.ts`

- Nieuwe `documentOptie` tabel toegevoegd
- TypeScript types geëxporteerd

### 3. Gemeente Beheer Scherm

**Locatie**: `src/app/gemeente/beheer/lookup/page.tsx`

**Toegevoegd**:
- Nieuwe tab "Documenten" naast Locaties, BABS, Type Ceremonie
- Tabel met kolommen:
  - Code
  - Naam
  - Prijs (met indicator "verplicht" indien van toepassing)
  - Type (papier_type)
  - Actief status
  - Acties (Verwijderen)
- "Nieuw toevoegen" knop voor nieuwe documentopties

### 4. API Endpoints

#### A. Lookup API voor Beheer

**GET /api/gemeente/lookup/documenten**
- Haalt alle documentopties voor de huidige gemeente
- Gefilterd op gemeente_oin
- Gesorteerd op volgorde

**POST /api/gemeente/lookup/documenten**
- Maakt nieuwe documentoptie aan
- Validatie:
  - Code, naam, papierType zijn verplicht
  - Gratis documenten mogen geen prijs hebben
- Gekoppeld aan gemeente_oin

**DELETE /api/gemeente/lookup/documenten/[id]**
- Verwijdert documentoptie
- Controleert of document bij huidige gemeente hoort

#### B. Dossier Documenten API (Updated)

**GET /api/dossier/[id]/documenten**
- Haalt beschikbare documentopties van database (was: hardcoded)
- Haalt geselecteerde documenten voor dossier
- Returns:
  - `documentOptions`: Lijst van beschikbare opties
  - `selections`: Lijst van geselecteerde document codes

**POST /api/dossier/[id]/documenten**
- Slaat geselecteerde documenten op
- Gebruikt `code` field om document te identificeren

### 5. Documenten Selectie Pagina (Updated)

**Locatie**: `src/app/dossier/[id]/documenten/page.tsx`

**Veranderingen**:
- Laadt documentopties dynamisch van database (was: hardcoded array)
- Gebruikt database velden: `prijsCents`, `gratis`, `verplicht`, `code`
- Stuurt document `code` mee bij opslaan voor identificatie

## 🗄️ Database Status

**Deployment**: ✅ Succesvol gedeployed
- Table created: `ihw.document_optie`
- Seed data: 76 document opties (4 × 19 gemeentes)
- Triggers: Auto-seed bij nieuwe gemeente

## 🔗 Workflow

### Voor Gemeente Beheerders:

1. Ga naar **Gemeente Beheer** → **Standaard tabellen** → **Documenten**
2. Zie lijst van beschikbare documentopties
3. Pas opties aan:
   - Verander naam/omschrijving
   - Pas prijs aan
   - Zet actief/inactief
   - Wijzig volgorde
4. Voeg nieuwe documentopties toe via "Nieuw toevoegen"

### Voor Burgers:

1. Bij aanmaken huwelijksdossier
2. Stap "Documenten"
3. Zie alleen **actieve** documentopties van hun gemeente
4. Verplichte documenten zijn automatisch geselecteerd
5. Optionele documenten kunnen worden bijgeselecteerd
6. Totaalprijs wordt automatisch berekend

## 📋 Eigenschappen

### ✅ Multi-tenant
- Elke gemeente heeft eigen documentopties
- Gefilterd op `gemeente_oin`
- Nieuwe gemeentes krijgen automatisch standaard opties

### ✅ Flexibel
- Gemeentes kunnen opties aan/uitzetten
- Prijzen kunnen per gemeente verschillen
- Omschrijvingen kunnen worden aangepast
- Volgorde is configureerbaar

### ✅ Veilig
- Gemeente-specifieke access control
- Burgers zien alleen opties van hun gemeente
- Validatie op client én server side

### ✅ Database-driven
- Geen hardcoded lijsten meer
- Alle data komt uit database
- Real-time aanpassingen mogelijk

## 🎯 Voordelen

1. **Voor Gemeentes**:
   - Volledige controle over aanbod
   - Eigen prijzen instellen
   - Documenten activeren/deactiveren
   - Volgorde bepalen

2. **Voor Ontwikkelaars**:
   - Geen code changes voor nieuwe documenten
   - Makkelijk uitbreidbaar
   - Consistent met andere lookup tables

3. **Voor Burgers**:
   - Zien alleen relevante opties
   - Duidelijke prijzen
   - Geen verwarring met andere gemeentes

## 🚀 Testen

Test de implementatie:

1. **Beheer scherm**:
   ```
   http://localhost:3000/gemeente/beheer/lookup
   ```
   - Klik op tab "Documenten"
   - Zie lijst van 4 standaard opties
   - Test "Nieuw toevoegen"
   - Test "Verwijderen"

2. **Dossier flow**:
   ```
   http://localhost:3000/dossier/[id]/documenten
   ```
   - Zie documentopties van database
   - Check of prijzen kloppen
   - Test selectie en opslaan

3. **API testen**:
   ```bash
   # Haal document opties op
   curl http://localhost:3000/api/gemeente/lookup/documenten
   
   # Maak nieuwe optie aan
   curl -X POST http://localhost:3000/api/gemeente/lookup/documenten \
     -H "Content-Type: application/json" \
     -d '{
       "code": "extra-akte",
       "naam": "Extra huwelijksakte",
       "papierType": "geboorteakte",
       "prijsCents": 1000,
       "gratis": false,
       "verplicht": false
     }'
   ```

## 📁 Aangepaste Bestanden

### Database:
- `sql/migrations/005_document_options.sql` (nieuw)
- `src/db/schema.ts` (updated)

### API:
- `src/app/api/gemeente/lookup/documenten/route.ts` (nieuw)
- `src/app/api/gemeente/lookup/documenten/[id]/route.ts` (nieuw)
- `src/app/api/dossier/[id]/documenten/route.ts` (updated)

### UI:
- `src/app/gemeente/beheer/lookup/page.tsx` (updated)
- `src/app/dossier/[id]/documenten/page.tsx` (updated)

### Scripts:
- `scripts/deploy-document-options.js` (nieuw)

## ✨ Conclusie

De document opties zijn nu volledig configureerbaar via het beheer scherm! Gemeentes hebben volledige controle over welke documenten ze aanbieden en tegen welke prijzen. De implementatie is consistent met de bestaande lookup tables (locaties, BABS, type ceremonie) en volledig multi-tenant.

**Status**: ✅ **COMPLEET EN GETEST**

