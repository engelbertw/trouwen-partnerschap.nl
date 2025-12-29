# Naamgebruik Flow - Implementatie Compleet

## ✅ Wat is geïmplementeerd

### 1. **Database Schema** (Reeds aanwezig)

**Tabel**: `partner` 
**Veld**: `naamgebruik_keuze` (enum type)

**Opties**:
- `eigen` - Alleen eigen achternaam
- `partner` - Alleen achternaam van partner
- `eigen_partner` - Eigen achternaam gevolgd door partner
- `partner_eigen` - Partner achternaam gevolgd door eigen naam

### 2. **UI Pagina's**

#### A. Introductie Pagina
**Locatie**: `src/app/dossier/[id]/naamgebruik/page.tsx`

**Functionaliteit**:
- Uitleg over naamgebruik keuze
- DigiD informatie
- Start knop naar partner 1

#### B. Partner 1 Naamgebruik
**Locatie**: `src/app/dossier/[id]/naamgebruik/partner1/page.tsx`

**Functionaliteit**:
- Radio buttons met 4 opties
- Dynamische teksten gebaseerd op partner namen
- Voortgangsbalk (50%)
- Opslaan naar database
- Navigate naar partner 2

**Features**:
- Laadt bestaande keuze van database
- Pre-selecteert als al eerder gekozen
- "Opslaan en later verder" link
- Error handling

#### C. Partner 2 Naamgebruik
**Locatie**: `src/app/dossier/[id]/naamgebruik/partner2/page.tsx`

**Functionaliteit**:
- Radio buttons met 4 opties voor partner 2
- Dynamische teksten (omgekeerd t.o.v. partner 1)
- Voortgangsbalk (100%)
- Opslaan naar database
- Terug naar dossier overzicht

**Features**:
- Laadt bestaande keuze
- "Opslaan en sluiten" knop
- Navigatie terug naar dossier

### 3. **API Endpoints**

**Locatie**: `src/app/api/dossier/[id]/naamgebruik/route.ts`

#### GET /api/dossier/[id]/naamgebruik
**Functie**: Haal partner gegevens op voor naamgebruik selectie

**Response**:
```json
{
  "success": true,
  "partner1": {
    "voornamen": "Emma Louise Maria",
    "voorvoegsel": null,
    "geslachtsnaam": "Janssen",
    "naamgebruikKeuze": "eigen_partner"
  },
  "partner2": {
    "voornamen": "Sergio",
    "voorvoegsel": "García",
    "geslachtsnaam": "Fernández",
    "naamgebruikKeuze": "partner"
  }
}
```

**Validaties**:
- User authentication
- Dossier ownership check
- Beide partners moeten ingevuld zijn

#### POST /api/dossier/[id]/naamgebruik
**Functie**: Sla naamgebruik keuze op voor een partner

**Request Body**:
```json
{
  "partnerId": 1,  // 1 of 2
  "naamgebruikKeuze": "eigen_partner"  // eigen | partner | eigen_partner | partner_eigen
}
```

**Validaties**:
- PartnerId moet 1 of 2 zijn
- NaamgebruikKeuze moet geldig zijn
- User authentication
- Dossier ownership

**Response**:
```json
{
  "success": true,
  "message": "Naamgebruik keuze opgeslagen"
}
```

### 4. **Dossier Overzicht Integratie**

**Locatie**: `src/app/dossier/[id]/page.tsx` (Reeds geïntegreerd)

**Functionaliteit**:
- Toont "Kies naamgebruik" in openstaande acties
- Alleen zichtbaar als nog niet beide partners een keuze hebben gemaakt
- Link naar `/dossier/[id]/naamgebruik`

**Status Bepaling** (in API):
```typescript
const naamgebruikVoltooid = partners.length === 2 && 
  partners[0].naamgebruikKeuze !== null && 
  partners[1].naamgebruikKeuze !== null;

const acties = {
  naamgebruik: !naamgebruikVoltooid,
  // ... andere acties
};
```

## 🎯 Workflow

### Voor Burgers:

1. **Start**: Ga naar dossier overzicht
2. **Actie**: Klik op "Kies naamgebruik"
3. **Introductie**: Lees uitleg over naamgebruik
4. **Partner 1**: 
   - Zie volledige naam van partner 1
   - Kies uit 4 opties
   - Submit → Database opgeslagen
5. **Partner 2**:
   - Zie volledige naam van partner 2
   - Kies uit 4 opties (perspectief omgedraaid)
   - Submit → Database opgeslagen
6. **Terug**: Automatisch terug naar dossier overzicht
7. **Status**: "Kies naamgebruik" verdwijnt uit openstaande acties

### Opties Uitgelegd

Voor **Partner 1** (bijv. Emma Janssen met partner Sergio García Fernández):

| Keuze | Betekenis | Resultaat |
|-------|-----------|-----------|
| `eigen` | Alleen uw eigen achternaam | Emma Janssen |
| `partner` | Alleen achternaam partner | Emma García Fernández |
| `eigen_partner` | Eigen gevolgd door partner | Emma Janssen-García Fernández |
| `partner_eigen` | Partner gevolgd door eigen | Emma García Fernández-Janssen |

Voor **Partner 2** (Sergio García Fernández met partner Emma Janssen):

| Keuze | Betekenis | Resultaat |
|-------|-----------|-----------|
| `eigen` | Alleen uw eigen achternaam | Sergio García Fernández |
| `partner` | Alleen achternaam partner | Sergio Janssen |
| `eigen_partner` | Eigen gevolgd door partner | Sergio García Fernández-Janssen |
| `partner_eigen` | Partner gevolgd door eigen | Sergio Janssen-García Fernández |

## 🔧 Technische Details

### Database Opslag

**Tabel**: `ihw.partner`
**Veld**: `naamgebruik_keuze` (enum)
**Type**: `ihw.naamgebruik_keuze`

**SQL**:
```sql
UPDATE ihw.partner
SET naamgebruik_keuze = 'eigen_partner',
    updated_at = CURRENT_TIMESTAMP
WHERE dossier_id = '...' AND sequence = 1;
```

### State Management

**Client-side**:
- `useState` voor geselecteerde optie
- `useEffect` voor laden van bestaande data
- Loading states tijdens fetch/save
- Error handling met user feedback

**Server-side**:
- Drizzle ORM voor database queries
- Clerk authentication
- Transaction-safe updates
- Ownership verification

### Navigatie Flow

```
Dossier Overzicht
  ↓
Naamgebruik Intro
  ↓
Partner 1 Selectie → Database
  ↓
Partner 2 Selectie → Database
  ↓
Terug naar Dossier Overzicht
```

### Validatie

**Client-side**:
- Radio button moet geselecteerd zijn
- Submit disabled tot selectie gemaakt

**Server-side**:
- PartnerId validatie (1 of 2)
- Enum validatie voor naamgebruikKeuze
- Authentication check
- Ownership verification

## 📋 Voorbeelden

### Voorbeeld 1: Traditionele Keuze

**Situatie**: Emma Janssen trouwt met Sergio García Fernández

**Partner 1 kiest**: `partner` (achternaam van partner)
→ Wordt: Emma García Fernández

**Partner 2 kiest**: `eigen` (eigen achternaam)
→ Blijft: Sergio García Fernández

### Voorbeeld 2: Dubbele Naam

**Situatie**: Beiden willen dubbele naam

**Partner 1 kiest**: `eigen_partner`
→ Wordt: Emma Janssen-García Fernández

**Partner 2 kiest**: `eigen_partner`  
→ Wordt: Sergio García Fernández-Janssen

### Voorbeeld 3: Geen Wijziging

**Situatie**: Beiden houden eigen naam

**Partner 1 kiest**: `eigen`
→ Blijft: Emma Janssen

**Partner 2 kiest**: `eigen`
→ Blijft: Sergio García Fernández

## ✨ Features

✅ **Database-driven**: Alle keuzes direct naar database  
✅ **Geen file storage**: Alleen database operaties  
✅ **Pre-filled forms**: Toont bestaande keuze bij herbezoek  
✅ **Real-time status**: Dossier overzicht update automatisch  
✅ **Voorvoegsel support**: Correcte handling van voorvoegsels  
✅ **User-friendly**: Duidelijke teksten en feedback  
✅ **Navigation**: Terug-knoppen en "opslaan en later verder"  
✅ **Progress indicator**: Voortgangsbalk toont 50% / 100%  
✅ **Error handling**: Graceful error messages in Nederlands  

## 📁 Aangepaste Bestanden

### Nieuwe Bestanden:
- `src/app/dossier/[id]/naamgebruik/page.tsx` (intro)
- `src/app/dossier/[id]/naamgebruik/partner1/page.tsx`
- `src/app/dossier/[id]/naamgebruik/partner2/page.tsx`
- `src/app/api/dossier/[id]/naamgebruik/route.ts`

### Bestaande Bestanden (Reeds geïntegreerd):
- `src/app/dossier/[id]/page.tsx` - Dossier overzicht (naamgebruik actie al aanwezig)
- `src/app/api/dossier/[id]/route.ts` - Dossier API (status check al aanwezig)
- `src/db/schema.ts` - Database schema (veld al aanwezig)
- `sql/020_core_tables.sql` - SQL schema (enum en veld al aanwezig)

## 🎉 Conclusie

De naamgebruik flow is **volledig geïmplementeerd** met:
- ✅ 3 UI pagina's (intro + 2 partners)
- ✅ Database integratie (GET + POST API)
- ✅ Dossier overzicht integratie
- ✅ Status tracking
- ✅ Geen file storage (alleen database)
- ✅ Complete flow van start tot finish

**Status**: ✅ **COMPLEET EN KLAAR VOOR GEBRUIK**

Burgers kunnen nu hun naamgebruik kiezen direct via het dossier, en alle keuzes worden veilig opgeslagen in de database!

