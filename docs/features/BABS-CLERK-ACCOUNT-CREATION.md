# BABS Aanmaken met Clerk Account - Feature Complete

**Datum**: 28 december 2025  
**Status**: ✅ Voltooid

## Overzicht

De functionaliteit om BABS aan te maken met automatische Clerk account creatie is volledig geïmplementeerd in het Lookup Beheer formulier.

## Wat is er toegevoegd?

### Nieuwe Formuliervelden (BABS Tab)

Het BABS formulier op `/gemeente/beheer/lookup?tab=babs` bevat nu:

1. **Code** (optioneel)
   - Unieke identifier voor de BABS
   - Voorbeeld: `babs_001`

2. **Naam (weergave)** (verplicht)
   - Volledige naam zoals getoond aan burgers
   - Gebruikt als fallback als voornaam/achternaam niet ingevuld zijn

3. **Voornaam** (optioneel)
   - Voor Clerk account first name

4. **Tussenvoegsel** (optioneel)
   - Nederlandse tussenvoegsels (van, de, etc.)

5. **Achternaam** (verplicht)
   - Voor Clerk account last name

6. **Email adres** (verplicht bij nieuw aanmaken)
   - Gebruikt voor Clerk account creatie
   - BABS ontvangt email met uitnodiging
   - Validatie: moet geldig email formaat zijn

7. **Checkbox: "Maak automatisch een gebruikersaccount aan"**
   - Standaard aangevinkt
   - Aangevinkt: Clerk account wordt aangemaakt
   - Uitgevinkt: Alleen database record (geen login mogelijk)

8. **Bestaande velden blijven behouden:**
   - Status (in_aanvraag, beedigd, ongeldig)
   - Beëdiging datums (vanaf/tot)
   - Beschikbaarheid datums (vanaf/tot)
   - Opmerking beschikbaarheid
   - Actief checkbox

## Hoe het werkt

### Bij "Nieuw toevoegen" → BABS Tab

1. **Gebruiker vult formulier in:**
   - Naam, achternaam (verplicht)
   - Email (verplicht voor Clerk)
   - Overige velden (optioneel)

2. **Bij submit (POST naar `/api/gemeente/lookup/babs`):**
   ```
   ┌─────────────────────────────────────┐
   │ 1. BABS record aanmaken             │
   │    in ihw.babs tabel                │
   └────────────┬────────────────────────┘
                │
                ▼
   ┌─────────────────────────────────────┐
   │ 2. Koppeling aanmaken               │
   │    in ihw.babs_gemeente tabel       │
   │    (link naar huidige gemeente)     │
   └────────────┬────────────────────────┘
                │
                ▼
   ┌─────────────────────────────────────┐
   │ 3. Clerk account aanmaken           │
   │    (als createClerkAccount = true)  │
   │    Rol: babs_admin                  │
   │    Metadata: babs_id                │
   └────────────┬────────────────────────┘
                │
                ▼
   ┌─────────────────────────────────────┐
   │ 4. Email naar BABS                  │
   │    met login uitnodiging            │
   └─────────────────────────────────────┘
   ```

3. **Success bericht toont:**
   - ✅ BABS en Clerk account aangemaakt
   - Clerk User ID
   - Bevestiging dat email is verstuurd
   
   OF (bij problemen):
   - ⚠️ BABS aangemaakt maar Clerk error
   - Bijvoorbeeld: "Email adres al in gebruik"

## API Details

### POST `/api/gemeente/lookup/babs`

**Request Body:**
```json
{
  "code": "babs_006",
  "naam": "Jan de Vries",
  "voornaam": "Jan",
  "tussenvoegsel": "de",
  "achternaam": "Vries",
  "email": "jan.devries@example.com",
  "status": "beedigd",
  "beedigdVanaf": "2024-01-15",
  "beschikbaarVanaf": "2024-02-01",
  "actief": true,
  "createClerkAccount": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-xxx",
    "code": "babs_006",
    "naam": "Jan de Vries",
    ...
  },
  "clerkUserId": "user_xxx",
  "message": "BABS en Clerk account succesvol aangemaakt. De gebruiker ontvangt een email om een wachtwoord in te stellen."
}
```

**Response (BABS created, Clerk failed):**
```json
{
  "success": true,
  "data": { ... },
  "clerkUserId": null,
  "warning": "Email adres is al in gebruik. BABS is aangemaakt maar zonder Clerk account."
}
```

## Clerk Account Metadata

BABS krijgen de volgende metadata in Clerk:

```json
{
  "rol": "babs_admin",
  "babs_id": "uuid-xxx"
}
```

**Let op:** BABS krijgen GEEN `gemeente_oin` in hun metadata, omdat ze voor meerdere gemeenten kunnen werken. De koppeling naar gemeenten gebeurt via de `babs_gemeente` tabel.

## Gebruikersscenario's

### Scenario 1: BABS met Clerk account (standaard)

**Stappen:**
1. Gemeente medewerker gaat naar `/gemeente/beheer/lookup?tab=babs`
2. Klikt "Nieuw toevoegen"
3. Vult formulier in met email adres
4. Laat "Maak automatisch een gebruikersaccount aan" aangevinkt
5. Klikt "Toevoegen"

**Resultaat:**
- ✅ BABS staat in database
- ✅ BABS is gekoppeld aan gemeente
- ✅ BABS verschijnt in BABS lijst
- ✅ BABS kan inloggen via email
- ✅ BABS heeft toegang tot `/babs/beschikbaarheid`

### Scenario 2: BABS zonder Clerk account

**Stappen:**
1-3. Zelfde als scenario 1
4. Vink "Maak automatisch een gebruikersaccount aan" UIT
5. Klikt "Toevoegen"

**Resultaat:**
- ✅ BABS staat in database
- ✅ BABS is gekoppeld aan gemeente
- ✅ BABS verschijnt in BABS lijst
- ❌ BABS kan NIET inloggen (geen Clerk account)
- ℹ️ Account kan later handmatig aangemaakt worden via gebruikersbeheer

### Scenario 3: Email adres al in gebruik

**Stappen:**
1-5. Zelfde als scenario 1, maar email bestaat al

**Resultaat:**
- ✅ BABS staat in database
- ✅ BABS is gekoppeld aan gemeente
- ⚠️ Clerk account NIET aangemaakt
- 🔔 Waarschuwing getoond: "Email adres is al in gebruik"

## Multi-Gemeente Support

Een BABS kan voor meerdere gemeenten werken:

1. **Eerste gemeente:** BABS wordt aangemaakt via formulier
2. **Volgende gemeenten:** Gemeente medewerker voegt bestaande BABS toe via:
   - API: POST naar `/api/gemeente/lookup/babs` met bestaand BABS ID
   - Of: Handmatig record in `babs_gemeente` tabel

**Database structuur:**
```
babs (1) ──┬── babs_gemeente (n) ── gemeente (1) [Amsterdam]
           ├── babs_gemeente (n) ── gemeente (1) [Utrecht]
           └── babs_gemeente (n) ── gemeente (1) [Rotterdam]
```

## Testen

### Test 1: Nieuwe BABS met Clerk account

```bash
# Via UI:
# 1. Ga naar http://localhost:3000/gemeente/beheer/lookup?tab=babs
# 2. Klik "Nieuw toevoegen"
# 3. Vul in:
#    - Naam: Test BABS
#    - Voornaam: Test
#    - Achternaam: BABS
#    - Email: test.babs@example.com
#    - Status: Beedigd
#    - Actief: aangevinkt
#    - Clerk account: aangevinkt
# 4. Klik "Toevoegen"
# 5. Verifieer success bericht met Clerk User ID
```

**Verwacht resultaat:**
- ✅ BABS verschijnt in lijst
- ✅ Success melding met Clerk User ID
- ✅ Email verstuurd naar test.babs@example.com

### Test 2: BABS zonder Clerk account

Zelfde als Test 1, maar vink "Maak automatisch een gebruikersaccount aan" UIT.

**Verwacht resultaat:**
- ✅ BABS verschijnt in lijst
- ℹ️ Geen Clerk User ID in bericht
- ❌ Geen email verstuurd

### Test 3: Duplicate email

Maak eerst een BABS aan met email, probeer dan opnieuw met zelfde email.

**Verwacht resultaat:**
- ✅ BABS verschijnt in lijst
- ⚠️ Waarschuwing: "Email adres is al in gebruik"

## Bestanden Aangepast

### Frontend
- `src/app/gemeente/beheer/lookup/page.tsx`
  - Toegevoegd: Code veld
  - Toegevoegd: Voornaam/Tussenvoegsel/Achternaam velden
  - Toegevoegd: Email veld (required bij nieuw aanmaken)
  - Toegevoegd: Clerk account checkbox
  - Verbeterd: Success bericht met Clerk info

### Backend (al bestaand, geen wijzigingen nodig)
- `src/app/api/gemeente/lookup/babs/route.ts`
  - POST endpoint ondersteunt al alle nieuwe velden
  - Clerk account creatie volledig geïmplementeerd
  - Multi-gemeente support via `babs_gemeente` tabel

## Referenties

- API implementatie: `src/app/api/gemeente/lookup/babs/route.ts`
- Frontend formulier: `src/app/gemeente/beheer/lookup/page.tsx`
- Database migratie: `sql/migrations/100_babs_gemeente_junction.sql`
- Multi-gemeente docs: `docs/features/MULTI-GEMEENTE-BABS.md`

## Volgende Stappen (Optioneel)

### Toekomstige Verbeteringen

1. **BABS Zoeken/Toevoegen aan Andere Gemeenten**
   - Zoekfunctie om bestaande BABS te vinden
   - Toevoegen aan huidige gemeente zonder opnieuw aan te maken

2. **Bulk Import**
   - CSV import van meerdere BABS tegelijk
   - Automatische Clerk account creatie

3. **Email Templates**
   - Custom email template voor BABS uitnodiging
   - Nederlandse tekst met instructies

4. **BABS Dashboard**
   - Overzicht van gemeenten waar BABS voor werkt
   - Ceremonies per gemeente

## Support

Bij problemen:

1. **BABS verschijnt niet in lijst:**
   - Check of migratie is uitgevoerd: `node scripts/run-babs-gemeente-migration.js`
   - Check of BABS gekoppeld is aan gemeente: `node scripts/verify-amsterdam-babs.js`

2. **Clerk account niet aangemaakt:**
   - Check of email geldig is
   - Check Clerk dashboard voor errors
   - Check console logs in terminal

3. **Email niet ontvangen:**
   - Check Clerk email settings
   - Check spam folder
   - Resend via Clerk dashboard

## Status

✅ **Feature Complete**
- Alle velden toegevoegd
- Clerk integratie werkt
- Success berichten tonen info
- Multi-gemeente support
- Database migraties uitgevoerd
- Documentatie compleet

