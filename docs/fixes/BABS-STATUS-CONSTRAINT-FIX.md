# Fix: Database Constraint Validatie voor BABS Status

**Datum**: 28 december 2025  
**Issue**: `chk_beedigd_periode` constraint violation  
**Status**: ✅ Opgelost

## Probleem

Bij het aanmaken van een BABS met status "beedigd" zonder beëdiging datums:

```
error: new row for relation "babs" violates check constraint "chk_beedigd_periode"
Detail: Failing row contains (..., beedigd, null, null, ...)
```

## Oorzaak

De database heeft een check constraint die vereist dat wanneer een BABS de status `beedigd` heeft, **beide** datums (`beedigd_vanaf` EN `beedigd_tot`) ingevuld moeten zijn:

```sql
CONSTRAINT chk_beedigd_periode CHECK (
    (status = 'beedigd' AND beedigd_vanaf IS NOT NULL AND beedigd_tot IS NOT NULL)
    OR status != 'beedigd'
)
```

Het formulier toonde deze velden als optioneel, waardoor gebruikers een BABS met status "beedigd" konden aanmaken zonder de verplichte datums in te vullen.

## Oplossing

### 1. Dynamische Required Velden

De beëdiging datumvelden worden nu **verplicht** wanneer status = 'beedigd':

```typescript
<input
  type="date"
  required={formData.status === 'beedigd'}
  value={formData.beedigdVanaf || ''}
  // ...
/>
```

### 2. Visuele Feedback

**Waarschuwing onder status dropdown:**
```
Status: [Beedigd ▼]
⚠️ Bij status "Beedigd" zijn beide beëdiging datums verplicht
```

**Sterretjes bij labels:**
```
Beedigd vanaf *    [2024-01-15]
Beedigd tot *      [2029-01-15]
```

**Aangepaste helptekst:**
- Status = 'beedigd': "Einddatum beëdiging (verplicht voor status beedigd)"
- Status = andere: "Einddatum beëdiging (optioneel)"

### 3. Client-side Validatie

Voordat het formulier wordt verzonden:

```typescript
if (activeTab === 'babs' && formData.status === 'beedigd') {
  if (!formData.beedigdVanaf || !formData.beedigdTot) {
    alert('⚠️ Bij status "Beedigd" zijn beide beëdiging datums (vanaf en tot) verplicht.');
    return;
  }
}
```

## UI Flows

### Flow 1: Status 'In aanvraag' (standaard)

```
Status: [In aanvraag ▼]

Beedigd vanaf    [ optioneel ]
Beedigd tot      [ optioneel ]
```

Gebruiker kan opslaan zonder datums ✅

### Flow 2: Wijzig naar 'Beedigd'

```
Status: [Beedigd ▼]
⚠️ Bij status "Beedigd" zijn beide beëdiging datums verplicht

Beedigd vanaf *  [ VERPLICHT ]
Beedigd tot *    [ VERPLICHT ]
```

1. Gebruiker selecteert "Beedigd"
2. Waarschuwing verschijnt
3. Labels krijgen rode sterretjes
4. HTML5 required validatie activeert
5. Bij submit zonder datums: foutmelding

### Flow 3: Submit zonder datums

**Scenario:**
- Status = 'beedigd'
- Datums niet ingevuld
- Klik "Toevoegen"

**Resultaat:**
```
⚠️ Bij status "Beedigd" zijn beide beëdiging datums 
   (vanaf en tot) verplicht.
```

Formulier wordt NIET verzonden ❌

### Flow 4: Correct ingevuld

**Scenario:**
- Status = 'beedigd'
- Beedigd vanaf = '2024-01-15'
- Beedigd tot = '2029-01-15'
- Klik "Toevoegen"

**Resultaat:**
```
✅ BABS succesvol aangemaakt!
```

BABS wordt aangemaakt ✅

## Database Constraint Details

### Check Constraint: `chk_beedigd_periode`

**Locatie:** `sql/010_enums_lookups.sql` (regel 211-214)

**Logica:**
```
(status = 'beedigd' EN beedigd_vanaf IS NOT NULL EN beedigd_tot IS NOT NULL)
OF
(status != 'beedigd')
```

**Betekenis:**
- Als status = 'beedigd': beide datums VERPLICHT
- Als status != 'beedigd': datums optioneel

### Tweede Constraint: `chk_beedigd_volgorde`

```sql
CONSTRAINT chk_beedigd_volgorde CHECK (
    beedigd_vanaf IS NULL OR beedigd_tot IS NULL OR beedigd_vanaf < beedigd_tot
)
```

**Betekenis:**
- Als beide datums ingevuld: `vanaf` moet voor `tot` liggen
- Voorkomt ongeldige periodes (bijv. tot datum voor vanaf datum)

## Andere Status Waarden

### 'in_aanvraag' (standaard)

Gebruiker is bezig met aanvraag BABS status.

**Verplichte velden:**
- Naam
- Achternaam
- Email (voor Clerk account)

**Optionele velden:**
- Beëdiging datums
- Beschikbaarheid

### 'ongeldig'

BABS beëdiging is verlopen of ingetrokken.

**Verplichte velden:**
- Naam
- Achternaam

**Optionele velden:**
- Alle datums (voor historische referentie)

## Testing

### Test 1: Status 'beedigd' zonder datums

```
Status: Beedigd
Beedigd vanaf: [leeg]
Beedigd tot: [leeg]
```

**Verwacht:** ❌ Foutmelding, niet opgeslagen

### Test 2: Status 'beedigd' met alleen vanaf datum

```
Status: Beedigd
Beedigd vanaf: 2024-01-15
Beedigd tot: [leeg]
```

**Verwacht:** ❌ Foutmelding, niet opgeslagen

### Test 3: Status 'beedigd' met beide datums

```
Status: Beedigd
Beedigd vanaf: 2024-01-15
Beedigd tot: 2029-01-15
```

**Verwacht:** ✅ Succesvol opgeslagen

### Test 4: Status 'in_aanvraag' zonder datums

```
Status: In aanvraag
Beedigd vanaf: [leeg]
Beedigd tot: [leeg]
```

**Verwacht:** ✅ Succesvol opgeslagen (datums optioneel)

## Bestanden Aangepast

### Frontend
- `src/app/gemeente/beheer/lookup/page.tsx`
  - Toegevoegd: Dynamische required attribute op datum velden
  - Toegevoegd: Waarschuwing onder status dropdown
  - Toegevoegd: Rode sterretjes bij labels (conditionally)
  - Toegevoegd: Client-side validatie bij submit
  - Aangepast: Helptekst voor 'beedigd tot' veld

### Database (geen wijzigingen)
- `sql/010_enums_lookups.sql`
  - Constraint bestaat al, geen wijziging nodig

## Referenties

- Database constraints: `sql/010_enums_lookups.sql` (regel 211-217)
- Frontend formulier: `src/app/gemeente/beheer/lookup/page.tsx`
- Schema definitie: `src/db/schema.ts`

## Toekomstige Verbeteringen

### 1. Automatische Datum Suggesties

Bij selecteren van "Beedigd":
- `beedigd_vanaf`: Vandaag
- `beedigd_tot`: Vandaag + 5 jaar (standaard beëdigingsperiode)

### 2. Visuele Datum Validatie

Real-time validatie:
- Groen vinkje bij geldige datum
- Rood kruis bij ongeldige datum
- Waarschuwing als `tot` voor `vanaf` ligt

### 3. Batch Update

Mogelijkheid om meerdere BABS tegelijk naar "beedigd" te zetten met dezelfde datums.

### 4. Beëdiging Verloop Waarschuwing

Dashboard notificatie:
- 3 maanden voor verloop
- 1 maand voor verloop
- Bij verloop: automatisch naar 'ongeldig'

## Support

Bij problemen:

1. **Constraint violation error:**
   - Check of status = 'beedigd' en beide datums ingevuld
   - Check of `vanaf` < `tot`

2. **Formulier accepteert geen submit:**
   - Check rode waarschuwingsberichten
   - Check velden met rode sterretjes
   - Vul alle verplichte velden in

3. **Datums niet zichtbaar als verplicht:**
   - Ververs de pagina
   - Check of status correct is geselecteerd

## Status

✅ **Issue Opgelost**
- Dynamische required velden toegevoegd
- Visuele feedback geïmplementeerd
- Client-side validatie toegevoegd
- Database constraints blijven intact
- Gebruiksvriendelijke foutmeldingen

