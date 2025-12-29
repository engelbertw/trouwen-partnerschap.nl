# Doorklik naar Huwelijksdossier - Beheer Scherm Verbetering

## ✅ Wat is Toegevoegd

Verbeterde navigatie vanuit het gemeente beheer scherm naar het volledige huwelijksdossier met **drie klikbare elementen**:

### 1. Dossiernummer (Kolom 1) - Klikbaar

**Voor**:
```tsx
<div className="text-sm font-medium text-gray-900">
  {item.dossier.identificatie || item.dossier.id.substring(0, 8)}
</div>
```

**Na**:
```tsx
<Link
  href={`/dossier/${item.dossier.id}`}
  className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
>
  {item.dossier.identificatie || item.dossier.id.substring(0, 8)}
</Link>
```

**Effect**: Het dossiernummer (bijv. "HUW-2025-000001") is nu blauw en klikbaar ✅

### 2. Partnernamen (Kolom 2) - Klikbaar

**Voor**:
```tsx
<div className="text-sm text-gray-900">
  {item.partner1.voornamen} {item.partner1.geslachtsnaam}
</div>
<div className="text-sm text-gray-500">
  en {item.partner2.voornamen} {item.partner2.geslachtsnaam}
</div>
```

**Na**:
```tsx
<Link
  href={`/dossier/${item.dossier.id}`}
  className="block hover:underline"
>
  <div className="text-sm text-gray-900">
    {item.partner1.voornamen} {item.partner1.geslachtsnaam}
  </div>
  <div className="text-sm text-gray-500">
    en {item.partner2.voornamen} {item.partner2.geslachtsnaam}
  </div>
</Link>
```

**Effect**: De gehele partnernamen cel is nu klikbaar met hover underline ✅

### 3. "Dossier" Knop (Acties Kolom) - Verbeterd

**Voor**:
```tsx
<Link href={`/dossier/${item.dossier.id}`} className="text-blue-600 hover:text-blue-900">
  Bekijken
</Link>
```

**Na**:
```tsx
<Link
  href={`/dossier/${item.dossier.id}`}
  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 font-medium"
  title="Bekijk volledig huwelijksdossier"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  Dossier
</Link>
```

**Effect**: 
- Duidelijk document icoon toegevoegd 📄
- Tekst gewijzigd van "Bekijken" naar "Dossier"
- Tooltip toegevoegd: "Bekijk volledig huwelijksdossier"
- Visual separator (|) tussen links ✅

## 🎨 Visuele Verbeteringen

### Tabelweergave

```
┌─────────────┬──────────────────────┬────────────┬────────────┬──────────┬─────────────────────────┐
│ Dossier     │ Partners             │ Type       │ Aangemaakt │ Status   │ Acties                  │
├─────────────┼──────────────────────┼────────────┼────────────┼──────────┼─────────────────────────┤
│ HUW-2025-   │ Jan de Vries         │ Huwelijk   │ 27-12-2025 │ Te       │ 📄 Dossier | Goedkeuren │
│ 000001      │ en Maria Janssen     │            │            │ beoord.  │   Afkeuren              │
│ (klikbaar)  │ (klikbaar)           │            │            │          │                         │
└─────────────┴──────────────────────┴────────────┴────────────┴──────────┴─────────────────────────┘
```

### Hover States

1. **Dossiernummer hover**: Blauwe kleur + underline
2. **Partnernamen hover**: Underline op beide namen
3. **Dossier knop hover**: Donkerder blauw
4. **Row hover**: Lichte grijze achtergrond (bestaand)

## 🔗 Navigatie Flow

### Scenario 1: Klik op Dossiernummer
```
Gemeente Beheer Scherm
├─ Tabel met aankondigingen
│  ├─ "HUW-2025-000001" (klik) 👆
│  └─ → Redirect naar /dossier/[id]
└─ Huwelijksdossier Pagina
   ├─ Partner gegevens
   ├─ Ceremonie details
   ├─ Getuigen
   ├─ Documenten
   └─ Naamgebruik
```

### Scenario 2: Klik op Partnernamen
```
Gemeente Beheer Scherm
├─ Tabel met aankondigingen
│  ├─ "Jan de Vries en Maria Janssen" (klik) 👆
│  └─ → Redirect naar /dossier/[id]
└─ Huwelijksdossier Pagina (zelfde als boven)
```

### Scenario 3: Klik op "Dossier" Knop
```
Gemeente Beheer Scherm
├─ Acties kolom
│  ├─ "📄 Dossier" (klik) 👆
│  └─ → Redirect naar /dossier/[id]
└─ Huwelijksdossier Pagina (zelfde als boven)
```

## 📱 Responsive Gedrag

### Desktop (> 1024px)
- Alle drie links zichtbaar en werkend
- Document icoon zichtbaar
- Visual separators (|) tussen acties

### Tablet (768px - 1024px)
- Tabel scrollt horizontaal indien nodig
- Links blijven functioneel

### Mobile (< 768px)
- Tabel scrollt horizontaal
- Touch-friendly link sizes
- Dossiernummer blijft primaire identificatie

## 🎯 User Experience Verbeteringen

### Voor (Oud)
❌ Alleen "Bekijken" link in acties kolom  
❌ Dossiernummer niet klikbaar  
❌ Partnernamen niet klikbaar  
❌ Geen icoon voor visuele duidelijkheid  
❌ Onduidelijk wat "Bekijken" doet

### Na (Nieuw)
✅ **Drie** manieren om naar dossier te gaan  
✅ Dossiernummer **klikbaar** (blauw, underline on hover)  
✅ Partnernamen **klikbaar** (underline on hover)  
✅ Duidelijk document icoon 📄  
✅ Duidelijke tekst: "Dossier"  
✅ Tooltip: "Bekijk volledig huwelijksdossier"  
✅ Visual separators tussen acties

## 🧪 Test Scenarios

### Test 1: Klik Dossiernummer
1. ✅ Ga naar gemeente beheer scherm
2. ✅ Zie lijst met aankondigingen
3. ✅ Dossiernummer is blauw
4. ✅ Hover over dossiernummer → underline verschijnt
5. ✅ Klik dossiernummer → Redirect naar /dossier/[id]
6. ✅ Volledige dossier pagina laadt

### Test 2: Klik Partnernamen
1. ✅ Ga naar gemeente beheer scherm
2. ✅ Hover over partnernamen → underline verschijnt
3. ✅ Klik op namen → Redirect naar /dossier/[id]
4. ✅ Volledige dossier pagina laadt

### Test 3: Klik Dossier Knop
1. ✅ Ga naar gemeente beheer scherm
2. ✅ Zie "📄 Dossier" knop in acties kolom
3. ✅ Hover → tooltip "Bekijk volledig huwelijksdossier"
4. ✅ Klik → Redirect naar /dossier/[id]
5. ✅ Volledige dossier pagina laadt

### Test 4: Verschillende Statussen
Alle drie links werken voor:
- ✅ Te beoordelen aankondigingen
- ✅ Goedgekeurde aankondigingen
- ✅ Afgekeurde aankondigingen

## 📋 Code Details

### Imports
```typescript
import Link from 'next/link'; // Already imported
```

### Document Icon (SVG)
```tsx
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
</svg>
```

Dit is een "document with lines" icon van Heroicons.

### Visual Separator
```tsx
<span className="text-gray-300">|</span>
```

Subtiele grijze separator tussen links voor visuele scheiding.

## 🎨 Styling Classes

### Dossiernummer Link
```
text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline
```

### Partnernamen Link
```
block hover:underline
```

### Dossier Knop
```
inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 font-medium
```

### Visual Separator
```
text-gray-300
```

## 🚀 Deployment

### Files Changed
1. **src/app/gemeente/beheer/page.tsx**
   - Dossiernummer cell: Wrapped in Link
   - Partnernamen cell: Wrapped in Link
   - Acties kolom: "Bekijken" → "Dossier" met icon

### No Breaking Changes
- ✅ Bestaande functionaliteit blijft werken
- ✅ Alle knoppen (Goedkeuren, Afkeuren, etc.) blijven functioneel
- ✅ Modals blijven werken
- ✅ Filtering blijft werken

### No Database Changes
- ✅ Alleen UI/UX wijzigingen
- ✅ Geen schema updates nodig
- ✅ Geen migrations nodig

## 📊 Impact

### User Satisfaction
- ✅ Snellere navigatie (minder klikken nodig)
- ✅ Intuïtievere interface (alles wat blauw is, is klikbaar)
- ✅ Betere scanbaarheid (icoon trekt aandacht)

### Efficiency
- ✅ Meerdere click targets → minder misclicks
- ✅ Grotere klikbare oppervlaktes
- ✅ Duidelijkere call-to-action

### Consistency
- ✅ Volgt Next.js Link patterns
- ✅ Consistent met andere NL Design System applicaties
- ✅ Blauwe links = standaard web convention

## 🎉 Conclusie

Het gemeente beheer scherm heeft nu **drie intuïtieve manieren** om naar het volledige huwelijksdossier te navigeren:

1. 🔵 **Dossiernummer** - Direct klikbaar
2. 👥 **Partnernamen** - Hele cel klikbaar
3. 📄 **Dossier knop** - Met duidelijk icoon en tooltip

Dit maakt het scherm veel gebruiksvriendelijker en efficiënter voor gemeente medewerkers! ✨

