# BABS Functionaliteit Documentatie

**Categorie:** Features > BABS  
**Laatst bijgewerkt:** 28 december 2025

## Inhoudsopgave

1. [Calendar Complete Guide](./calendar-complete.md) - Deployment & overzicht
2. [Calendar Implementation](./calendar-implementation.md) - Technische details

## Wat is een BABS?

**BABS** = **B**uitengewoon **A**mbtenaar **B**urgerlijke **S**tand

Dit zijn de **trouwambtenaren** - de personen die ceremonieel huwelijken en partnerschappen mogen voltrekken (zoals wethouders, beëdigde ambtenaren, externe trouwambtenaren).

## Overzicht

BABS (Buitengewoon Ambtenaar Burgerlijke Stand) beheer met geavanceerde calendar-based beschikbaarheid.

### Features

- 📅 **Visual Calendar** - React Big Calendar integratie
- 🚫 **Quick Block** - Snel datums blokkeren
- ➕ **Recurring Rules** - Terugkerende patronen (weekly, biweekly, monthly)
- 🔒 **Role-based Access** - `babs_admin` rol voor de BABS persoon zelf (de trouwambtenaar)
- 🎨 **Modern UI** - Kleurgecodeerde events met Nederlandse lokalisatie

### Twee Niveaus van Toegang

1. **Gemeente medewerkers** (`hb_admin`, `loket_medewerker`)
   - Beheren de BABS-lijst (toevoegen/bewerken/verwijderen)
   - Wijzen BABS toe aan ceremonies
   - Bekijken beschikbaarheid van alle BABS
   - Via: `/gemeente/beheer/lookup?tab=babs`

2. **BABS zelf** (`babs_admin` rol)
   - De trouwambtenaar die ceremonies uitvoert
   - Beheert alleen eigen beschikbaarheid
   - Bekijkt eigen toegewezen ceremonies
   - Via: `/babs/beschikbaarheid`

## Gerelateerde Documentatie

- [Database Schema](../../architecture/database/schema.md)
- [API Endpoints](../../architecture/api/gemeente-endpoints.md)
- [Migrations](../../deployment/migrations/babs-calendar-success.md)

## Quick Links

- **Hoofdpagina:** `/gemeente/beheer/babs/[babsId]/calendar`
- **BABS Portal:** `/babs/beschikbaarheid`
- **API Base:** `/api/gemeente/babs/[babsId]/`

