# Button Kleur Verschil Analyse

**Datum**: 2026-01-11  
**Status**: ❌ Verschil gevonden tussen Figma en Codebase

---

## 📊 Resultaten

### Primary Button Kleuren

| Bron | Hex Kleur | RGB | Opmerking |
|------|-----------|-----|-----------|
| **Figma Design** | `#2e75d4` | rgb(46, 117, 212) | Lichter blauw |
| **Codebase** | `#154273` | rgb(21, 66, 115) | Donkerder blauw |
| **Verschil** | - | R=25, G=51, B=97 | **173 punten totaal** |

### Hover State Kleuren

| Bron | Hex Kleur | RGB | Opmerking |
|------|-----------|-----|-----------|
| **Codebase** | `#1a5a99` | rgb(26, 90, 153) | Huidige hover |
| **Aanbevolen** | `#4d8ada` | rgb(77, 138, 218) | Lichter (15% lichter dan #2e75d4) |

---

## 🔍 Analyse

### Verschil Details

- **Rood verschil**: 25 punten (46 vs 21)
- **Groen verschil**: 51 punten (117 vs 66)
- **Blauw verschil**: 97 punten (212 vs 115)
- **Totaal verschil**: 173 punten

**Conclusie**: Het verschil is **significant en duidelijk zichtbaar**. De Figma button is veel lichter blauw dan de codebase button.

### Visuele Impact

- **Figma**: Lichtere, meer heldere blauwe button (`#2e75d4`)
- **Codebase**: Donkere, meer formele blauwe button (`#154273`)
- **Impact**: Gebruikers zullen een duidelijk verschil zien tussen design en implementatie

---

## 💡 Aanbevelingen

### Optie 1: Update Codebase naar Figma (Aanbevolen)

**Voordelen**:
- ✅ Exacte match met design
- ✅ Consistent met Figma specificaties
- ✅ Betere user experience (design = implementatie)

**Nadelen**:
- ⚠️  Moet in alle button componenten worden aangepast
- ⚠️  Hover state moet ook worden aangepast

### Optie 2: Update Figma naar Codebase

**Voordelen**:
- ✅ Geen code wijzigingen nodig
- ✅ Huidige implementatie blijft

**Nadelen**:
- ❌ Design wijkt af van codebase
- ❌ Inconsistent met NL Design System mogelijk

---

## 🔧 Implementatie

### Stap 1: Update Primary Button Kleur

Vervang in alle button componenten:

```typescript
// OUD
className="... bg-[#154273] ... hover:bg-[#1a5a99] ... focus:ring-[#154273] ..."

// NIEUW
className="... bg-[#2e75d4] ... hover:bg-[#4d8ada] ... focus:ring-[#2e75d4] ..."
```

### Stap 2: Update Hover State

```typescript
// OUD
hover:bg-[#1a5a99]

// NIEUW  
hover:bg-[#4d8ada]  // 15% lichter dan #2e75d4
```

### Stap 3: Update Focus Ring

```typescript
// OUD
focus:ring-[#154273]

// NIEUW
focus:ring-[#2e75d4]
```

### Stap 4: Update CSS Variabelen

Update `src/app/globals.css` of waar CSS variabelen zijn gedefinieerd:

```css
/* OUD */
--primary-blue: #154273;
--primary-hover: #1a5a99;

/* NIEUW */
--primary-blue: #2e75d4;
--primary-hover: #4d8ada;
```

---

## 📋 Bestanden die moeten worden geüpdatet

Gebaseerd op de codebase scan, moeten deze bestanden worden geüpdatet:

1. `src/app/page.tsx` - Home page button
2. `src/app/000-aankondiging/000-inleiding/page.tsx` - Start aankondiging button
3. `src/app/000-aankondiging/010-aankondiging/page.tsx` - Form buttons
4. `src/app/000-aankondiging/021-partner1-gegevens/page.tsx` - Form buttons
5. `src/app/000-aankondiging/031-partner2-gegevens/page.tsx` - Form buttons
6. `src/app/000-aankondiging/040-curatele/page.tsx` - Form buttons
7. `src/app/dossier/[id]/page.tsx` - Dossier action buttons
8. `src/app/layout.tsx` - Clerk theme colorPrimary
9. Alle andere bestanden met `bg-[#154273]`

**Totaal**: ~142 instanties gevonden in codebase scan

---

## 🎨 Kleur Vergelijking

### Visuele Vergelijking

```
Figma (#2e75d4):  ████████████████  (Lichter blauw)
Codebase (#154273): ████████          (Donkerder blauw)
```

### RGB Vergelijking

```
Figma:     R: 46  G: 117  B: 212  (Helder blauw)
Codebase:  R: 21  G: 66   B: 115  (Donker blauw)
Verschil:  R: 25  G: 51   B: 97   (Significant)
```

---

## ✅ Volgende Stappen

1. **Beslissing**: Update codebase naar Figma of Figma naar codebase?
2. **Implementatie**: Als codebase update:
   - Maak een script om alle buttons te updaten
   - Test alle button states (default, hover, focus, disabled)
   - Verifieer contrast ratios (WCAG compliance)
3. **Verificatie**: Test in browser en vergelijk met Figma design
4. **Documentatie**: Update design system documentatie

---

## 📚 Referenties

- **Figma Component**: `Type=Primary, State=Default` (key: `23:417`)
- **Figma Design**: [Schermen vernieuwd huwelijk](https://www.figma.com/design/egmJPMnreeZSwiLYYTwsZo/Schermen-vernieuwd-huwelijk)
- **Analyse Script**: `scripts/get-primary-button-component.ts`
- **Codebase Scan**: 142 instanties van `#154273` gevonden

---

**Laatst bijgewerkt**: 2026-01-11  
**Analyse uitgevoerd door**: Figma Color Extraction Script

