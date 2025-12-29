# PDF Samenvatting Layout Update - Compleet

**Datum:** 27 december 2025  
**Status:** ✅ Geïmplementeerd

## Probleem

De PDF had een andere layout en structuur dan de samenvatting pagina, waardoor gebruikers verwarring konden ervaren.

## Oplossing

De PDF generator is volledig herzien om **exact** overeen te komen met de samenvatting pagina layout.

## Wijzigingen

### 1. Header Styling

**Voor:**
- Grote logo box
- Titel: "Overzicht Aankondiging"
- Geen subtitel

**Na:**
- Kleine logo box (zoals samenvatting)
- Titel: "Samenvatting"
- Subtitel: "Huwelijk of partnerschap aankondigen"
- Intro tekst: "Controleer uw gegevens..."

### 2. Sectie Styling

**Voor:**
- Blauw gekleurde headers met witte tekst
- Geen borders rondom secties
- Eenvoudige layout

**Na:**
- Lichte grijze achtergrond voor headers
- Borders rondom elke sectie (zoals samenvatting)
- Label + waarde format voor elk veld
- Consistent met web UI

### 3. Content Structuur

#### Aankondiging Sectie
```
[SECTIE BORDER]
Aankondiging

Wat wilt u aankondigen bij de gemeente?
Huwelijk / Geregistreerd partnerschap
[/SECTIE BORDER]
```

#### Partner Secties
```
[SECTIE BORDER]
Gegevens partner 1

Voornamen
Emma Louise Maria

Achternaam
Janssen

Geboortedatum
23-05-1990

Geboorteplaats
Amsterdam

Adres
Kerkstraat 12
1017 GL Amsterdam

Burgerlijke staat
Gescheiden

E-mailadres
emma@example.com
[/SECTIE BORDER]
```

#### Curatele Sectie
```
[SECTIE BORDER]
Curatele

Staat Emma onder curatele?
Nee / Ja

Toestemmingsformulier van de curator (indien van toepassing)
bestand.pdf

Staat Sergio onder curatele?
Nee / Ja
[/SECTIE BORDER]
```

#### Kinderen Sectie
```
[SECTIE BORDER]
Kinderen uit een ander huwelijk

Heeft Emma kinderen uit een ander huwelijk?
Ja / Nee

Kinderen (indien ja)
• Lisa Janssen, geboren op 15-03-2010
• Thijs Janssen, geboren op 22-08-2012

Heeft Sergio kinderen uit een ander huwelijk?
Ja / Nee

Kinderen (indien ja)
• Sofia García, geboren op 10-05-2015
[/SECTIE BORDER]
```

#### Bloedverwantschap Sectie
```
[SECTIE BORDER]
Bloedverwantschap

Zijn de partners bloedverwanten van elkaar?
Nee / Ja
[/SECTIE BORDER]
```

### 4. Footer

**Voor:**
- 3 regels disclaimer tekst
- Generieke contact informatie

**Na:**
- 2 regels disclaimer tekst
- Simpele en duidelijke messaging
- Consistent met samenvatting

## Visuele Vergelijking

### Samenvatting Webpagina Layout
```
┌─────────────────────────────────────┐
│ [LOGO] Samenvatting                 │
│ Huwelijk of partnerschap aankondigen│
│ Dossiernummer: ABC12345             │
│ Datum: 27 december 2025             │
├─────────────────────────────────────┤
│ Controleer uw gegevens...           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Aankondiging              [Edit]│ │
│ │ Wat wilt u aankondigen?         │ │
│ │ Huwelijk                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Gegevens partner 1               │ │
│ │ Voornamen: Emma Louise Maria     │ │
│ │ Achternaam: Janssen              │ │
│ │ ...                              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Meer secties...]                   │
└─────────────────────────────────────┘
```

### PDF Layout (NU - Identiek!)
```
┌─────────────────────────────────────┐
│ [LOGO] Samenvatting                 │
│ Huwelijk of partnerschap aankondigen│
│ Dossiernummer: ABC12345             │
│ Datum: 27 december 2025             │
├─────────────────────────────────────┤
│ Controleer uw gegevens...           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Aankondiging                     │ │
│ │ Wat wilt u aankondigen?         │ │
│ │ Huwelijk                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Gegevens partner 1               │ │
│ │ Voornamen: Emma Louise Maria     │ │
│ │ Achternaam: Janssen              │ │
│ │ ...                              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Meer secties...]                   │
└─────────────────────────────────────┘
```

## Technische Details

### Helper Functies

1. **`addSection(title)`** - Voegt sectie toe met border en achtergrond
2. **`addField(label, value)`** - Voegt label + waarde toe (bold + normal)
3. **`closeSection()`** - Sluit sectie af met extra ruimte
4. **`addLine()`** - Generieke tekst functie met indent support

### Styling Constants

```typescript
const COLORS = {
  primary: '#154273',      // Rijksoverheid blauw
  text: '#1a1a1a',         // Hoofdtekst
  textLight: '#5a5a5a',    // Waarden
  border: '#d4d4d4',       // Sectie borders
  background: '#f5f5f5',   // Sectie headers
};
```

### Font Sizes

- **Titel**: 16pt bold
- **Subtitel**: 10pt normal
- **Sectie headers**: 12pt bold
- **Labels**: 9pt bold
- **Waarden**: 9pt normal
- **Footer**: 8pt normal

## User Experience

### Voor Update
- ❌ PDF zag er anders uit dan samenvatting
- ❌ Andere volgorde van informatie
- ❌ Andere styling (blauw vs grijs)
- ❌ Verwarring bij gebruikers

### Na Update
- ✅ PDF is **identiek** aan samenvatting
- ✅ Zelfde volgorde van informatie
- ✅ Zelfde styling en kleuren
- ✅ Consistent experience
- ✅ Gebruikers herkennen de layout direct

## Testing

### Test Checklist
- [x] Header ziet er hetzelfde uit
- [x] Secties hebben borders
- [x] Label + waarde format werkt
- [x] Kinderen lijst met bullets
- [x] Alle velden worden getoond
- [x] Paginering werkt correct
- [x] Footer is simpel en duidelijk
- [x] Kleuren komen overeen

### Test Scenarios

**Minimale data:**
```
✅ Aankondiging: Huwelijk
✅ Partner 1: Basisgegevens
✅ Partner 2: Basisgegevens  
✅ Curatele: Nee/Nee
✅ Kinderen: Nee/Nee
✅ Bloedverwantschap: Nee
```

**Maximale data:**
```
✅ Aankondiging: Partnerschap
✅ Partner 1: Alle velden gevuld
✅ Partner 2: Alle velden gevuld
✅ Curatele: Ja met document
✅ Kinderen: 5 kinderen per partner
✅ Bloedverwantschap: Ja
✅ Multi-page PDF werkt correct
```

## Bestanden Gewijzigd

- ✅ `src/lib/pdf-generator.ts` (volledig herzien)

## Voordelen

1. **Consistency** - Web en PDF zijn identiek
2. **Recognition** - Gebruikers herkennen de layout
3. **Trust** - Professionele, uniforme uitstraling
4. **Usability** - Makkelijk te vergelijken met web versie
5. **Maintenance** - Duidelijke structuur voor toekomstige updates

## Code Quality

### Verbeteringen

- **Herbruikbare helpers** - `addSection()`, `addField()`, `closeSection()`
- **Consistent styling** - Alle secties gebruiken zelfde format
- **Type safety** - Alle parameters zijn getypeerd
- **Comments** - Duidelijke sectie markers
- **Readability** - Code is makkelijk te begrijpen en aan te passen

### Maintainability

Als je de samenvatting pagina update, hoef je alleen:
1. De volgorde in de PDF aan te passen
2. Nieuwe velden toe te voegen met `addField()`
3. De helper functies blijven hetzelfde

## Deployment

✅ **Production Ready**

De PDF generator is klaar voor productie en genereert PDF's die exact overeenkomen met de samenvatting pagina.

## Usage

```typescript
// Gebruik in bevestiging page
const handleDownloadPDF = () => {
  const formData = getAankondigingData();
  generateAndDownloadAankondigingPDF(formData, dossierId);
  // PDF wordt gedownload met identieke layout als samenvatting!
};
```

---

**Status:** ✅ **COMPLETE**

De PDF heeft nu **exact** dezelfde layout en structuur als de samenvatting pagina. Gebruikers krijgen een consistent experience van begin tot eind! 🎉

