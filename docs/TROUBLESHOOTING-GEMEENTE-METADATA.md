# Troubleshooting: "Geen gemeente toegewezen aan gebruiker"

## Probleem

Je krijgt de foutmelding: **"Geen gemeente toegewezen aan gebruiker. Neem contact op met een beheerder."**

Dit betekent dat de `gemeente_oin` niet gevonden kan worden in de `publicMetadata` van de gebruiker in Clerk.

## Oplossing Stap 1: Debug de Metadata

Gebruik het debug script om te zien wat er precies in de metadata staat:

```bash
# Vervang USER_ID met je Clerk user ID
npm run debug:user USER_ID
```

Dit toont:
- Alle `publicMetadata`
- Alle `privateMetadata`
- Specifieke velden (`gemeente_oin`, `gemeente_naam`, `rol`)

## Oplossing Stap 2: Controleer Clerk Dashboard

1. Ga naar [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecteer je applicatie
3. Ga naar **"Users"**
4. Selecteer de gebruiker
5. Scroll naar **"Public metadata"** sectie
6. **Alleen `gemeente_oin` is verplicht:**

```json
{
  "gemeente_oin": "00000001002564440000"
}
```

**Optioneel (wordt automatisch opgehaald of gebruikt default):**
- `gemeente_naam`: Wordt automatisch uit database opgehaald als niet ingesteld
- `rol`: Default is `loket_medewerker` als niet ingesteld

## Veelvoorkomende Problemen

### Probleem 1: Metadata staat in Private Metadata

**Symptoom:** Debug script toont metadata in `privateMetadata` maar niet in `publicMetadata`

**Oplossing:** Verplaats de metadata naar `publicMetadata`:
1. Kopieer de JSON uit `privateMetadata`
2. Verwijder het uit `privateMetadata`
3. Voeg het toe aan `publicMetadata`

### Probleem 2: Metadata is niet ingesteld

**Symptoom:** Debug script toont lege metadata

**Oplossing:** Voeg alleen `gemeente_oin` toe via Clerk Dashboard:
1. Klik op **"Edit"** bij Public metadata
2. Voeg toe (alleen OIN is verplicht):
```json
{
  "gemeente_oin": "00000001002564440000"
}
```
3. Klik **"Save"**

**Let op:** `gemeente_naam` wordt automatisch uit de database opgehaald, en `rol` heeft default `loket_medewerker`.

### Probleem 3: Verkeerde OIN Formaat

**Symptoom:** Debug script toont OIN maar met verkeerd formaat

**Oplossing:** OIN moet exact 20 cijfers zijn:
- ✅ Correct: `00000001002564440000`
- ❌ Fout: `0000000100256444000` (19 cijfers)
- ❌ Fout: `00000001002564440000A` (met letter)
- ❌ Fout: `00000001002564440000 ` (met spatie)

### Probleem 4: Metadata is String in plaats van Object

**Symptoom:** Debug script toont metadata als string: `"{\"gemeente_oin\":\"...\"}"`

**Oplossing:** Dit gebeurt als je JSON als string hebt ingevoerd. Verwijder de quotes:
- ❌ Fout: `"{\"gemeente_oin\":\"00000001002564440000\"}"`
- ✅ Correct: `{"gemeente_oin":"00000001002564440000"}`

## Oplossing Stap 3: Gebruik Admin Pagina (Als Beschikbaar)

Als je al een `system_admin` gebruiker hebt:

1. Log in als system admin
2. Ga naar `/admin/gebruikers`
3. Klik op **"Bewerken"** bij de gebruiker
4. Selecteer gemeente en rol
5. Klik **"Opslaan"**

## Oplossing Stap 4: Verifieer Database

Controleer of de gemeente in de database bestaat:

```bash
node scripts/check-gemeente-database.js
```

Als de gemeente niet bestaat, voeg deze toe:

```sql
INSERT INTO ihw.gemeente (oin, naam, gemeente_code) 
VALUES ('00000001002564440000', 'Amsterdam', '0363')
ON CONFLICT (oin) DO NOTHING;
```

## Verificatie

Na het instellen van de metadata:

1. **Wacht 1-2 seconden** (Clerk cache kan kort duren)
2. **Log uit en log weer in** (om sessie te vernieuwen)
3. **Test opnieuw:**
   ```bash
   npm run debug:user USER_ID
   ```
4. **Ga naar `/gemeente/beheer`** - zou nu moeten werken

## Nog Steeds Problemen?

1. **Check browser console** voor errors
2. **Check server logs** voor errors
3. **Verifieer Clerk keys** in `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. **Clear cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

## Belangrijk

- ✅ Metadata moet in **Public metadata** staan (niet Private)
- ✅ OIN moet exact **20 cijfers** zijn
- ✅ Gebruik **geen quotes** rond de hele JSON (alleen rond strings binnen JSON)
- ✅ Wacht even na het instellen (cache kan kort duren)

