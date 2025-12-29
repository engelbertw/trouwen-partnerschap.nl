# PDF Download - Dossier Pagina's Toegevoegd

**Datum:** 27 december 2025  
**Status:** ✅ Compleet

## Probleem

PDF download werkte niet op:
- ❌ Dossier detail pagina (`/dossier/[id]`)
- ❌ Dossier samenvatting pagina (`/dossier/[id]/samenvatting`)

## Oplossing

PDF download functionaliteit is nu geïmplementeerd op **beide** dossier pagina's!

## Implementatie Details

### 1. Dossier Samenvatting Pagina

**Locatie:** `src/app/dossier/[id]/samenvatting/page.tsx`

**Wijzigingen:**
- ✅ Import PDF generator toegevoegd
- ✅ Data conversie naar AankondigingData format
- ✅ Handler functie geïmplementeerd
- ✅ Gebruikt echt dossier ID

```typescript
const handleDownloadPDF = () => {
  try {
    // Convert dossier data to AankondigingData format
    const aankondigingData: AankondigingData = {
      type: data.type,
      partner1: {
        voornamen: data.partner1.voornamen,
        achternaam: data.partner1.geslachtsnaam,
        geboortedatum: data.partner1.geboortedatum,
        plaats: data.partner1.geboorteplaats,
        email: data.partner1.email || undefined,
      },
      partner2: {
        voornamen: data.partner2.voornamen,
        achternaam: data.partner2.geslachtsnaam,
        geboortedatum: data.partner2.geboortedatum,
        plaats: data.partner2.geboorteplaats,
        email: data.partner2.email || undefined,
      },
    };

    // Use real dossier ID
    generateAndDownloadAankondigingPDF(aankondigingData, data.id);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Er ging iets mis bij het genereren van de PDF. Probeer het opnieuw.');
  }
};
```

**Button:**
```typescript
<button
  onClick={handleDownloadPDF}
  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-sans text-base px-6 py-3 rounded"
>
  <svg>Download icon</svg>
  Download als PDF
</button>
```

### 2. Dossier Detail Pagina

**Locatie:** `src/app/dossier/[id]/page.tsx`

**Wijzigingen:**
- ✅ Import PDF generator toegevoegd
- ✅ Data conversie (beperkte data beschikbaar)
- ✅ Handler functie geïmplementeerd
- ✅ Download button toegevoegd onder "Samenvatting bekijken"

```typescript
const handleDownloadPDF = () => {
  try {
    const aankondigingData: AankondigingData = {
      type: dossier.type,
      partner1: {
        voornamen: dossier.partner1.voornamen,
        achternaam: dossier.partner1.geslachtsnaam,
        geboortedatum: '', // Not available in detail view
      },
      partner2: {
        voornamen: dossier.partner2.voornamen,
        achternaam: dossier.partner2.geslachtsnaam,
        geboortedatum: '', // Not available in detail view
      },
    };

    generateAndDownloadAankondigingPDF(aankondigingData, dossier.id);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Er ging iets mis bij het genereren van de PDF. Probeer het opnieuw.');
  }
};
```

**Button:**
```typescript
<button
  onClick={handleDownloadPDF}
  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium underline"
>
  <svg>Download icon</svg>
  Download als PDF
</button>
```

## Volledige Overzicht - Alle Locaties

### Aankondiging Flow (070, 080, 090)
1. ✅ **Samenvatting** (`/000-aankondiging/070-samenvatting`)
2. ✅ **Ondertekenen** (`/000-aankondiging/080-ondertekenen`)
3. ✅ **Bevestiging** (`/000-aankondiging/090-bevestiging`)

### Dossier Pagina's (Nieuw!)
4. ✅ **Dossier Detail** (`/dossier/[id]`) ← NIEUW
5. ✅ **Dossier Samenvatting** (`/dossier/[id]/samenvatting`) ← NIEUW

## User Flow

### Scenario: Bekijk bestaand dossier

```
[Login met DigiD]
        ↓
[Dossier Detail]
    ↓ [Download als PDF] ← NIEUW!
    ↓ [Samenvatting bekijken]
        ↓
[Dossier Samenvatting]
    ↓ [Download als PDF] ← NIEUW!
        ↓
[Terug naar dossier]
```

## Data Conversie

### Dossier Samenvatting → PDF
**Beschikbare data:**
- ✅ Type (huwelijk/partnerschap)
- ✅ Partner namen
- ✅ Geboortedata
- ✅ Geboorteplaatsen
- ✅ Email adressen
- ✅ Echt dossier ID

**PDF Kwaliteit:** ⭐⭐⭐⭐⭐ Volledig

### Dossier Detail → PDF
**Beschikbare data:**
- ✅ Type (huwelijk/partnerschap)
- ✅ Partner namen
- ❌ Geboortedata (niet beschikbaar)
- ❌ Andere details

**PDF Kwaliteit:** ⭐⭐⭐ Basis (alleen namen)

**Note:** Voor volledige PDF → Ga naar "Samenvatting bekijken"

## Visuele Plaatsing

### Dossier Detail
```
┌─────────────────────────────────────┐
│ Huwelijksdossier                    │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ Aankondiging                  │   │
│ │ Status: ✅ Goedgekeurd        │   │
│ │                               │   │
│ │ [Samenvatting bekijken]       │   │
│ │ [⬇ Download als PDF] ← NIEUW │   │ 
│ └───────────────────────────────┘   │
│                                     │
│ [Ceremonie sectie...]               │
└─────────────────────────────────────┘
```

### Dossier Samenvatting
```
┌─────────────────────────────────────┐
│ Samenvatting aankondiging           │
│                                     │
│ [Type aankondiging...]              │
│ [Partner 1...]                      │
│ [Partner 2...]                      │
│ [Datum aankondiging...]             │
│                                     │
│ [Download als PDF]        (primair) │ ← NIEUW
│ [Terug naar dossier]     (second.)  │
└─────────────────────────────────────┘
```

## Technical Notes

### Data Mapping

**Van Database → Naar PDF:**
```typescript
// Database format
{
  geslachtsnaam: "Janssen",
  geboorteplaats: "Amsterdam"
}

// PDF format
{
  achternaam: "Janssen",
  plaats: "Amsterdam"
}
```

### Error Handling

Beide pagina's hebben consistente error handling:
- Try-catch block
- Console logging
- User-friendly alert in Nederlands
- Graceful degradation

### Dossiernummer

**Aankondiging flow:**
- Preview: `preview-1735297200000`
- Definitief: UUID van database

**Dossier pagina's:**
- Altijd: UUID van database (echt dossiernummer)
- Bestandsnaam: `huwelijksaankondiging-abc12345.pdf`

## Testing

### Test Checklist

**Dossier Detail:**
- [x] PDF download button zichtbaar
- [x] Button werkt (geen alert meer)
- [x] PDF wordt gegenereerd
- [x] Bestandsnaam bevat dossier ID
- [x] Basis gegevens in PDF (namen, type)

**Dossier Samenvatting:**
- [x] PDF download button zichtbaar (primair)
- [x] Button werkt
- [x] PDF wordt gegenereerd
- [x] Volledige gegevens in PDF
- [x] Layout komt overeen met web samenvatting

### Test Scenario

```bash
1. Ga naar http://localhost:3000
2. Login/selecteer bestaand dossier
3. Kom op dossier detail pagina
4. Klik "Download als PDF" ✓
5. PDF downloadt met basis info
6. Klik "Samenvatting bekijken"
7. Kom op dossier samenvatting pagina
8. Klik "Download als PDF" ✓
9. PDF downloadt met volledige info
```

## Files Changed

### Nieuw Geïmplementeerd
- ✅ `src/app/dossier/[id]/page.tsx` (PDF download toegevoegd)
- ✅ `src/app/dossier/[id]/samenvatting/page.tsx` (PDF download geïmplementeerd)

### Bestaande Implementaties
- ✅ `src/app/000-aankondiging/070-samenvatting/page.tsx`
- ✅ `src/app/000-aankondiging/080-ondertekenen/page.tsx`
- ✅ `src/app/000-aankondiging/090-bevestiging/page.tsx`

### Shared Library
- ✅ `src/lib/pdf-generator.ts` (gebruikt door alle 5 pagina's)

## Statistieken

### PDF Download Beschikbaar Op

| # | Pagina | Route | Status |
|---|--------|-------|--------|
| 1 | Aankondiging Samenvatting | `/000-aankondiging/070-samenvatting` | ✅ |
| 2 | Aankondiging Ondertekenen | `/000-aankondiging/080-ondertekenen` | ✅ |
| 3 | Aankondiging Bevestiging | `/000-aankondiging/090-bevestiging` | ✅ |
| 4 | Dossier Detail | `/dossier/[id]` | ✅ NIEUW |
| 5 | Dossier Samenvatting | `/dossier/[id]/samenvatting` | ✅ NIEUW |

**Totaal:** 5 pagina's met PDF download functionaliteit! 🎉

## Benefits

### Voor Gebruikers
- ✅ Download PDF op elk moment
- ✅ Vanuit aankondiging flow
- ✅ Vanuit bestaand dossier
- ✅ Consistent gedrag overal
- ✅ Offline kopie beschikbaar

### Voor Beheerders
- ✅ Minder support vragen
- ✅ Gebruikers kunnen zelf kopie downloaden
- ✅ Minder printopdrachten nodig
- ✅ Digitaal archief beschikbaar

## Future Enhancements

### 1. Volledige Dossier PDF
```typescript
// Include ceremonie details, getuigen, etc.
const fullDossierPDF = generateFullDossierPDF(dossier);
```

### 2. Email PDF
```typescript
// Auto-send PDF via email
await sendDossierPDFByEmail(dossier.id, email);
```

### 3. QR Code
```typescript
// Add QR code to PDF for verification
const qrCode = generateQRCode(dossierURL);
```

## Status

✅ **COMPLETE** - PDF download nu beschikbaar op **5 pagina's**:
1. Aankondiging Samenvatting ✅
2. Aankondiging Ondertekenen ✅
3. Aankondiging Bevestiging ✅
4. Dossier Detail ✅ **NIEUW**
5. Dossier Samenvatting ✅ **NIEUW**

---

**Conclusie:** PDF download is nu volledig geïntegreerd in zowel het aankondigingsproces als de dossier weergave. Gebruikers hebben overal toegang tot hun gegevens in PDF formaat! 🚀

