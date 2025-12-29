# BABS Beschikbaarheid - Quick Setup Guide

## 🚀 Snelle Start

### Stap 1: Database Migration Uitvoeren

Voer de migration uit om de nieuwe velden toe te voegen:

```bash
# Windows PowerShell
cd sql/migrations
$env:DATABASE_URL="your-connection-string"
psql $env:DATABASE_URL -f 090_babs_beschikbaarheid.sql

# Of via Node.js script
node scripts/run-migration.js 090_babs_beschikbaarheid
```

### Stap 2: Clerk Gebruiker Configureren

Voor elke BABS die toegang moet krijgen:

1. Ga naar [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigeer naar Users
3. Selecteer de BABS gebruiker
4. Ga naar "Metadata" tab
5. Voeg toe aan `publicMetadata`:

```json
{
  "rol": "babs_admin",
  "gemeente_oin": "00000001002564440000",
  "gemeente_naam": "Amsterdam",
  "babs_id": "HAAL-UUID-UIT-DATABASE"
}
```

**BELANGRIJK:** Het `babs_id` moet het `id` veld zijn uit de `ihw.babs` tabel!

### Stap 3: BABS ID Ophalen

Gebruik deze query om het juiste `babs_id` te vinden:

```sql
SELECT id, naam, voornaam, achternaam, status 
FROM ihw.babs 
WHERE achternaam = 'DeVries' 
  AND voornaam = 'Jan';
```

Kopieer het `id` veld en plak het in Clerk als `babs_id`.

### Stap 4: Test de Implementatie

1. **Test als BABS:**
   - Login met BABS account
   - Ga naar: `http://localhost:3000/babs/beschikbaarheid`
   - Je zou je eigen naam moeten zien
   - Stel beschikbaarheid in en sla op

2. **Test als Gemeente:**
   - Login met gemeente account
   - Ga naar: "Beheer" → "Standaard tabellen" → "BABS"
   - Je zou de beschikbaarheid moeten zien in de tabel
   - Bewerk een BABS en voeg beschikbaarheid toe

## 🔑 Nieuwe Role: `babs_admin`

De nieuwe role heeft beperkte toegang:
- ✅ Kan eigen beschikbaarheid bekijken
- ✅ Kan eigen beschikbaarheid wijzigen
- ❌ Kan geen andere BABS zien
- ❌ Kan geen dossiers bekijken
- ❌ Heeft geen toegang tot gemeente beheer

## 📋 Voorbeelden

### Voorbeeld 1: BABS Beschikbaar Ma-Vr

```json
{
  "beschikbaarheid": {
    "maandag": ["08:00-17:00"],
    "dinsdag": ["08:00-17:00"],
    "woensdag": ["08:00-17:00"],
    "donderdag": ["08:00-17:00"],
    "vrijdag": ["08:00-16:00"]
  },
  "beschikbaarVanaf": "2024-01-01",
  "beschikbaarTot": null,
  "opmerkingBeschikbaarheid": "Vrijdag tot 16:00"
}
```

### Voorbeeld 2: BABS Tijdelijk Beschikbaar

```json
{
  "beschikbaarheid": {
    "zaterdag": ["10:00-14:00"]
  },
  "beschikbaarVanaf": "2024-06-01",
  "beschikbaarTot": "2024-08-31",
  "opmerkingBeschikbaarheid": "Alleen in zomermaanden op zaterdag beschikbaar"
}
```

## 🔍 Verificatie

Check of alles werkt:

```sql
-- Check nieuwe kolommen
SELECT id, naam, beschikbaar_vanaf, beschikbaar_tot, 
       beschikbaarheid, opmerking_beschikbaarheid
FROM ihw.babs;

-- Check index
SELECT indexname FROM pg_indexes 
WHERE tablename = 'babs' 
  AND indexname = 'idx_babs_beschikbaar';
```

## ⚠️ Troubleshooting

### "Geen toegang" error
- Check `rol` in Clerk metadata = `"babs_admin"`
- Check `babs_id` exists in database
- Check `babs_id` format is valid UUID

### Beschikbaarheid niet zichtbaar
- Run database migration
- Refresh browser
- Check Network tab in DevTools

### Kan niet opslaan
- Check API response in Network tab
- Verify `babs_id` matches database
- Check database permissions

## 📞 Support

Voor hulp, zie:
- `BABS-BESCHIKBAARHEID-IMPLEMENTATION.md` (volledige documentatie)
- `src/app/api/babs/beschikbaarheid/route.ts` (API code)
- `src/app/babs/beschikbaarheid/page.tsx` (Frontend code)

