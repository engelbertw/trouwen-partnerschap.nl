# Clerk Infinite Redirect Loop - Oplossing

## Probleem
```
Clerk: Refreshing the session token resulted in an infinite redirect loop. 
This usually means that your Clerk instance keys do not match
```

## Oorzaak
De `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` en `CLERK_SECRET_KEY` komen niet van dezelfde Clerk applicatie.

## Oplossing

### Stap 1: Verifieer je Clerk Keys

1. Ga naar [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecteer je applicatie
3. Ga naar **"API Keys"** in het menu
4. Controleer of je de juiste keys hebt:
   - **Publishable Key**: Begint met `pk_test_...` of `pk_live_...`
   - **Secret Key**: Begint met `sk_test_...` of `sk_live_...`

### Stap 2: Kopieer Keys Opnieuw

1. In Clerk Dashboard, ga naar **"API Keys"**
2. Klik op **"Copy"** bij de Publishable Key
3. Klik op **"Copy"** bij de Secret Key
4. **Belangrijk**: Zorg dat beide keys van dezelfde applicatie zijn!

### Stap 3: Update .env of .env.local

Voeg de keys toe aan je `.env` of `.env.local` bestand:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Let op:**
- Geen spaties rondom de `=`
- Geen quotes rondom de keys
- Beide keys moeten van hetzelfde environment zijn (beide `test` of beide `live`)

### Stap 4: Wis Cache en Herstart

1. **Stop de development server** (Ctrl+C)

2. **Verwijder .next folder**:
   ```bash
   # Windows PowerShell
   Remove-Item -Recurse -Force .next
   
   # Windows CMD
   rmdir /s /q .next
   
   # Mac/Linux
   rm -rf .next
   ```

3. **Herstart de development server**:
   ```bash
   npm run dev
   ```

### Stap 5: Test

1. Open de applicatie in je browser
2. Probeer in te loggen
3. De infinite redirect loop zou nu opgelost moeten zijn

## Verificatie Script

Je kunt het verificatie script gebruiken om te controleren of je keys correct zijn:

```bash
node scripts/verify-clerk-keys.js
```

Dit script controleert:
- ✅ Of beide keys zijn ingesteld
- ✅ Of de key formaten correct zijn
- ✅ Of beide keys van hetzelfde environment zijn (test/live)
- ⚠️ Of de keys van dezelfde instance lijken te komen

## Veelvoorkomende Fouten

### Fout 1: Keys van verschillende applicaties
**Symptoom**: Infinite redirect loop
**Oplossing**: Zorg dat beide keys van dezelfde Clerk applicatie zijn

### Fout 2: Keys van verschillende environments
**Symptoom**: Authentication errors
**Oplossing**: Gebruik beide `test` keys of beide `live` keys, niet gemengd

### Fout 3: Typo in keys
**Symptoom**: "Invalid API key" errors
**Oplossing**: Kopieer de keys opnieuw uit Clerk Dashboard

### Fout 4: Cache niet gewist
**Symptoom**: Oude keys worden nog gebruikt
**Oplossing**: Verwijder `.next` folder en herstart server

## Extra Hulp

Als het probleem blijft bestaan:

1. **Check Clerk Dashboard Logs**: Ga naar je Clerk Dashboard → Logs om te zien wat er mis gaat
2. **Check Browser Console**: Open Developer Tools (F12) en kijk naar errors
3. **Check Server Logs**: Kijk naar de terminal waar `npm run dev` draait

## Contact

Als het probleem blijft bestaan na deze stappen, controleer:
- Of je de nieuwste versie van `@clerk/nextjs` gebruikt
- Of je middleware correct is geconfigureerd
- Of er geen andere authenticatie providers actief zijn die conflicteren

