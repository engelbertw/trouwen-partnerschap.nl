# Gebruikersbeheer Implementatie

**Datum**: 28 december 2025  
**Status**: ✅ Compleet

## Overzicht

Deze implementatie voegt functionaliteit toe om nieuwe gebruikers aan te maken via de admin interface en koppelt automatisch Clerk accounts aan BABS wanneer deze worden aangemaakt.

## Features

### 1. Nieuwe Gebruikers Aanmaken via Admin Panel

**Locatie**: `/admin/gebruikers`

**Functionaliteit**:
- ➕ **"Nieuwe gebruiker" knop** in gebruikerslijst
- 📝 **Formulier** met velden:
  - Email (verplicht)
  - Voornaam (verplicht)
  - Achternaam (verplicht)
  - Gemeente OIN (20 cijfers, verplicht)
  - Gemeente naam (verplicht)
  - Rol (dropdown met alle beschikbare rollen)
- ✅ **Validatie**:
  - Email format check
  - OIN moet exact 20 cijfers zijn
  - Alle verplichte velden moeten ingevuld zijn
- 🔒 **Security**: Alleen `system_admin` kan gebruikers aanmaken
- 📧 **Clerk integratie**: Gebruiker ontvangt automatisch een email om wachtwoord in te stellen

**Beschikbare Rollen**:
- `system_admin` - Systeembeheerder (volledige toegang)
- `hb_admin` - Hoofd Burgerlijke Stand (beheert BABS-lijst en gemeente data)
- `loket_medewerker` - Loketmedewerker (lezen/schrijven, kan BABS beheren)
- `loket_readonly` - Loketmedewerker (alleen lezen)
- `babs_admin` - Voor de BABS persoon zelf (trouwambtenaar kan eigen beschikbaarheid beheren)

### 2. Automatische Clerk Account bij BABS Aanmaken

**Belangrijk**: Wanneer je een BABS aanmaakt (een trouwambtenaar), wordt er automatisch een Clerk account aangemaakt **voor die persoon**.

**Locatie**: `/api/gemeente/lookup/babs` (POST)

**Functionaliteit**:
- Wanneer een BABS wordt aangemaakt met een email adres, wordt automatisch een Clerk account aangemaakt voor de trouwambtenaar zelf
- Het Clerk account krijgt:
  - Rol: `babs_admin` (zodat de trouwambtenaar kan inloggen)
  - Metadata: `babs_id` (link naar BABS record)
  - Gemeente OIN en naam (van de gemeente die de BABS toevoegt)
- **Optioneel**: Flag `createClerkAccount: false` om alleen BABS aan te maken zonder Clerk account
- **Error handling**: Als email al bestaat, wordt BABS toch aangemaakt maar zonder Clerk account (met waarschuwing)

**Voorbeeld Gebruik**:
Een gemeente medewerker (met `hb_admin` rol) voegt een nieuwe trouwambtenaar toe:
1. Naam: "Jan Jansen"
2. Email: "jan.jansen@example.com"
3. Status: "beedigd"

→ Jan Jansen ontvangt een email om zijn wachtwoord in te stellen
→ Jan kan inloggen op `/babs/beschikbaarheid` om zijn beschikbaarheid te beheren
→ De gemeente kan Jan toewijzen aan ceremonies

## API Routes

### POST `/api/admin/users/create`

Maakt een nieuwe gebruiker aan in Clerk met gemeente metadata.

**Request Body**:
```json
{
  "email": "gebruiker@gemeente.nl",
  "firstName": "Jan",
  "lastName": "Jansen",
  "gemeenteOin": "00000001002564440000",
  "gemeenteNaam": "Amsterdam",
  "rol": "loket_medewerker"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "id": "user_xxxxx",
    "email": "gebruiker@gemeente.nl",
    "firstName": "Jan",
    "lastName": "Jansen",
    "gemeenteOin": "00000001002564440000",
    "gemeenteNaam": "Amsterdam",
    "rol": "loket_medewerker"
  },
  "message": "Gebruiker succesvol aangemaakt. De gebruiker ontvangt een email om een wachtwoord in te stellen."
}
```

**Response (Error - Email bestaat al)**:
```json
{
  "success": false,
  "error": "Een gebruiker met dit email adres bestaat al"
}
```

**Security**:
- Vereist authenticatie via `getGemeenteContext()`
- Alleen toegankelijk voor `system_admin` rol
- Valideert OIN format (exact 20 cijfers)
- Valideert email format

### POST `/api/gemeente/lookup/babs` (Updated)

Maakt een nieuwe BABS aan in de database en optioneel een Clerk account.

**Request Body**:
```json
{
  "code": "BABS001",
  "naam": "Jan Jansen",
  "voornaam": "Jan",
  "tussenvoegsel": null,
  "achternaam": "Jansen",
  "status": "in_aanvraag",
  "email": "jan.jansen@example.com",
  "createClerkAccount": true,
  "actief": true
}
```

**Response (Success met Clerk account)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-xxx",
    "naam": "Jan Jansen",
    "voornaam": "Jan",
    "achternaam": "Jansen",
    "email": "jan.jansen@example.com",
    "status": "in_aanvraag"
  },
  "clerkUserId": "user_xxxxx",
  "message": "BABS en Clerk account succesvol aangemaakt. De gebruiker ontvangt een email om een wachtwoord in te stellen."
}
```

**Response (Success zonder Clerk account)**:
```json
{
  "success": true,
  "data": { ... },
  "clerkUserId": null,
  "warning": "Email adres is al in gebruik. BABS is aangemaakt maar zonder Clerk account.",
  "message": "BABS succesvol aangemaakt."
}
```

## UI Updates

### Admin Gebruikers Pagina (`src/app/admin/gebruikers/page.tsx`)

**Nieuwe State**:
```typescript
const [showCreateForm, setShowCreateForm] = useState(false);
const [createFormData, setCreateFormData] = useState({
  email: '',
  firstName: '',
  lastName: '',
  gemeenteOin: '',
  gemeenteNaam: '',
  rol: 'loket_medewerker',
});
```

**Nieuwe Functie**:
```typescript
const handleCreate = async () => {
  // Validatie
  // API call naar /api/admin/users/create
  // Refresh gebruikerslijst
  // Toon succes/fout melding
}
```

**UI Componenten**:
- ➕ Knop "Nieuwe gebruiker" in header van gebruikerslijst
- 📝 Modal formulier voor nieuwe gebruiker
- ✅ Validatie feedback
- 🔄 Loading state tijdens aanmaken

## Database Schema

Het `email` veld is al aanwezig in de `ihw.babs` tabel:

```sql
CREATE TABLE ihw.babs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  naam text NOT NULL,
  voornaam text,
  tussenvoegsel text,
  achternaam text NOT NULL,
  status ihw.babs_status NOT NULL DEFAULT 'in_aanvraag',
  email text,  -- ✅ Al aanwezig
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- ... andere velden
);
```

## Clerk Metadata Structuur

### Gemeente Medewerker (beheert BABS)
```json
{
  "gemeente_oin": "00000001002564440000",
  "gemeente_naam": "Amsterdam",
  "rol": "hb_admin"  // of "loket_medewerker"
}
```

### BABS Persoon (de trouwambtenaar zelf)
```json
{
  "gemeente_oin": "00000001002564440000",
  "gemeente_naam": "Amsterdam",
  "rol": "babs_admin",
  "babs_id": "uuid-of-babs-record"  // Koppeling naar BABS tabel
}
```

**Belangrijk verschil**:
- `hb_admin` / `loket_medewerker` = Gemeente medewerker die BABS **beheert**
- `babs_admin` = De BABS persoon die ceremonies **uitvoert**

## Testing

### Test Scenario's

1. **Nieuwe gebruiker aanmaken via admin panel**
   - Login als `system_admin`
   - Ga naar `/admin/gebruikers`
   - Klik op "Nieuwe gebruiker"
   - Vul formulier in met uniek email
   - Klik "Aanmaken"
   - ✅ Gebruiker verschijnt in lijst
   - ✅ Email ontvangen met wachtwoord setup link

2. **BABS aanmaken met Clerk account**
   - Login als `hb_admin` of `system_admin`
   - Ga naar BABS beheer pagina
   - Maak nieuwe BABS aan met email
   - ✅ BABS verschijnt in database
   - ✅ Clerk account aangemaakt met `babs_admin` rol
   - ✅ Email ontvangen met wachtwoord setup link

3. **BABS aanmaken zonder Clerk account**
   - Gebruik API met `createClerkAccount: false`
   - ✅ Alleen BABS record in database
   - ✅ Geen Clerk account aangemaakt

4. **Validatie errors**
   - Probeer gebruiker aan te maken zonder email
   - ✅ Error: "Email, voornaam en achternaam zijn verplicht"
   - Probeer met ongeldige OIN (bijv. 12345)
   - ✅ Error: "OIN moet exact 20 cijfers zijn"
   - Probeer met bestaand email adres
   - ✅ Error: "Een gebruiker met dit email adres bestaat al"

## Security Overwegingen

1. **Authorization**: Alleen `system_admin` kan gebruikers aanmaken
2. **Validation**: Server-side validatie van alle input
3. **Email uniqueness**: Clerk voorkomt duplicate emails
4. **Password security**: Clerk handelt wachtwoord setup af via email
5. **Metadata**: Gemeente context wordt automatisch toegevoegd

## Gebruik

### Als System Admin - Gebruiker Toevoegen

1. Ga naar `/admin/gebruikers`
2. Klik op "➕ Nieuwe gebruiker"
3. Vul het formulier in:
   - Email: werkelijk email adres van de gebruiker
   - Voornaam en achternaam
   - Selecteer gemeente uit dropdown (of vul OIN en naam in)
   - Kies de juiste rol
4. Klik "Aanmaken"
5. Gebruiker ontvangt email van Clerk om wachtwoord in te stellen

### Als Gemeente - BABS Toevoegen

**Wie doet dit**: Gemeente medewerker met `hb_admin` of `loket_medewerker` rol

1. Ga naar BABS beheer pagina (`/gemeente/beheer/lookup?tab=babs`)
2. Klik op "Nieuwe BABS"
3. Vul gegevens in van de **trouwambtenaar**:
   - Naam: Jan Jansen
   - Email: jan.jansen@example.com (email van de trouwambtenaar)
   - Status: beedigd
4. Klik "Opslaan"
5. **Jan Jansen** (de trouwambtenaar) ontvangt een email om zijn account te activeren
6. Jan kan inloggen op `/babs/beschikbaarheid` om zijn eigen beschikbaarheid te beheren
7. De gemeente kan Jan nu toewijzen aan trouwceremonies

## Troubleshooting

### Probleem: "Een gebruiker met dit email adres bestaat al"
**Oplossing**: Check in Clerk dashboard of gebruiker al bestaat. Eventueel gebruiker verwijderen of ander email gebruiken.

### Probleem: BABS aangemaakt maar geen Clerk account
**Oorzaak**: Email adres bestaat al in Clerk, of email is ongeldig
**Oplossing**: Check BABS record in database (heeft email), en maak handmatig Clerk account aan via admin panel

### Probleem: Email niet ontvangen
**Oorzaak**: Clerk email configuratie of spam filter
**Oplossing**: 
1. Check Clerk dashboard voor email status
2. Check spam folder
3. Vraag gebruiker om via "Wachtwoord vergeten" flow te gaan

## Related Documentation

- [BABS Beschikbaarheid Implementatie](./BABS-BESCHIKBAARHEID-IMPLEMENTATION.md)
- [Clerk + Next.js Integration](./../.cursor/rules/clerk-nextjs-integration.mdc)
- [Multi-tenancy Gemeente](./MULTI-TENANCY-IMPLEMENTATION.md)
- [Authorization & Security](./../.cursor/rules/authorization-clerk-security.mdc)

## Files Changed

1. ✅ `src/app/api/admin/users/create/route.ts` - Nieuw
2. ✅ `src/app/api/gemeente/lookup/babs/route.ts` - Updated
3. ✅ `src/app/admin/gebruikers/page.tsx` - Updated
4. ✅ `docs/features/GEBRUIKERSBEHEER-IMPLEMENTATIE.md` - Nieuw (deze file)

## Deployment Checklist

- [x] API routes geïmplementeerd
- [x] UI componenten toegevoegd
- [x] Validatie toegevoegd (client + server)
- [x] Error handling geïmplementeerd
- [x] Security checks (authorization)
- [x] Linter errors opgelost
- [x] Documentatie geschreven
- [ ] Manueel getest in development
- [ ] Getest met echte Clerk account
- [ ] Deployment naar staging/productie

## Next Steps

1. **Testing**: Test de functionaliteit met echte Clerk accounts
2. **Email templates**: Customize Clerk email templates (in Clerk dashboard)
3. **Bulk import**: Overweeg functionaliteit om meerdere gebruikers tegelijk te importeren via CSV
4. **User deactivation**: Voeg functionaliteit toe om gebruikers te deactiveren (niet verwijderen)
5. **Audit logging**: Log alle gebruiker creatie acties voor compliance

