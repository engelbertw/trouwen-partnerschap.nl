# ✅ Screenshot Generator - Setup Voltooid

## 📦 Wat is er geïnstalleerd

1. ✅ **Playwright** - Browser automation tool
2. ✅ **Screenshot Script** - `scripts/generate-screenshots.ts`
3. ✅ **Test Data Script** - `scripts/setup-test-data.ts`
4. ✅ **Documentatie** - Volledige handleidingen

## 🚀 Hoe te gebruiken

### Stap 1: Development Server Starten

**Open een terminal en start de server:**

```bash
npm run dev
```

Wacht tot je ziet: `✓ Ready in X seconds`

### Stap 2: Screenshots Maken

**Open een NIEUWE terminal** (laat dev server draaien) en run:

#### Optie A: Alleen Publieke Pagina's (Aanbevolen voor eerste test)

```bash
npm run screenshots:public
```

Dit maakt screenshots van pagina's die **geen authenticatie** vereisen.

#### Optie B: Alle Pagina's

```bash
npm run screenshots
```

**Belangrijk**: Voor pagina's met authenticatie moet je eerst **handmatig inloggen** in je browser voordat je het script runt.

### Stap 3: Test Data Aanmaken (Optioneel)

Voor pagina's met ingevulde formulieren:

```bash
npm run setup:test-data
```

Dit maakt test data aan in de database (dossier, partners, kinderen, getuigen).

## 📁 Output Locatie

Alle screenshots worden opgeslagen in:
```
screenshots/
├── landing-page.png
├── aankondiging-inleiding.png
├── aankondiging-formulier.png
├── dossier-overzicht.png
└── ... (40+ pagina's)
```

## 📋 Beschikbare Commando's

| Commando | Beschrijving |
|----------|-------------|
| `npm run screenshots` | Maakt screenshots van alle pagina's |
| `npm run screenshots:public` | Alleen publieke pagina's (geen auth) |
| `npm run setup:test-data` | Maakt test data aan in database |

## 🎯 Features

- ✅ **40+ pagina's** geconfigureerd
- ✅ **Automatisch formulier invullen** waar mogelijk
- ✅ **Full-page screenshots** (hele pagina)
- ✅ **Dynamische routes** ondersteuning (`/dossier/[id]`)
- ✅ **Automatisch dossier ID's** ophalen uit database
- ✅ **1920x1080 viewport** voor consistente screenshots

## 📚 Documentatie

- **Volledige handleiding**: `scripts/README-SCREENSHOTS.md`
- **Quick start**: `scripts/QUICK-START-SCREENSHOTS.md`

## ⚠️ Belangrijke Notities

1. **Server moet draaien**: Start altijd eerst `npm run dev` in een aparte terminal
2. **Authenticatie**: Voor pagina's met auth, log eerst handmatig in
3. **Test data**: Run `setup:test-data` voor ingevulde formulieren
4. **Windows**: Script werkt op Windows, macOS en Linux

## 🔧 Troubleshooting

### Server start niet automatisch
- Start handmatig: `npm run dev`
- Wacht tot server volledig is opgestart
- Check of poort 3000 beschikbaar is

### Authenticatie errors
- Log eerst handmatig in via browser
- Gebruik `screenshots:public` voor alleen publieke pagina's
- Check Clerk configuratie

### Geen data in formulieren
- Run `npm run setup:test-data` eerst
- Check database connectie
- Verify dossier ID's bestaan

## ✨ Volgende Stappen

1. Start de development server: `npm run dev`
2. Test met publieke pagina's: `npm run screenshots:public`
3. Bekijk screenshots in `screenshots/` folder
4. Voor volledige set: log in en run `npm run screenshots`

---

**Klaar om te gebruiken!** 🎉

