# Figma Component Analyse & Implementatie Aanbevelingen

**Datum**: 2026-01-11  
**Figma Design**: [Schermen vernieuwd huwelijk](https://www.figma.com/design/egmJPMnreeZSwiLYYTwsZo/Schermen-vernieuwd-huwelijk)  
**Status**: ✅ Analyse voltooid

---

## 📊 Samenvatting

- **Totaal componenten in Figma**: 61
- **Hoge prioriteit**: 11 componenten (essentieel)
- **Medium prioriteit**: 44 componenten (belangrijk)
- **Lage prioriteit**: 6 componenten (later)

### Utrecht Component Mapping

- **Met Utrecht equivalent**: 26 componenten (43%)
- **Zonder Utrecht equivalent**: 35 componenten (57%)
- **Direct hergebruik mogelijk**: 26 componenten

---

## 🔴 Hoge Prioriteit Componenten (Start hier!)

### 1. Input Components (9 componenten)

**Status**: ❌ Ontbrekend  
**Utrecht Equivalent**: `@utrecht/component-library-react Textbox` / `Select`

**Componenten**:
- `Selected=False, State=Default`
- `Selected=True, State=Default`
- `Selected=True, Indeterminate=False, State=Default`
- `Selected=False, Indeterminate=False, State=Default`
- `State=Selected`
- `Selected=True, Indeterminate=False, State=Disabled`
- `Selected=False, Indeterminate=True, State=Default`
- `Input validation`

**Implementatie**:
```typescript
// Gebruik Utrecht Textbox voor tekst input
import { Textbox } from '@utrecht/component-library-react';

<Textbox
  id="input-id"
  name="input-name"
  placeholder="Placeholder tekst"
  invalid={hasError}
  required
/>

// Gebruik Utrecht Select voor dropdowns
import { Select, SelectOption } from '@utrecht/component-library-react';

<Select id="select-id" name="select-name" required>
  <SelectOption value="">Kies een optie</SelectOption>
  <SelectOption value="option1">Optie 1</SelectOption>
</Select>
```

**Aanbeveling**: 
- ✅ Direct implementeren met Utrecht componenten
- ✅ Voeg error states toe (invalid prop)
- ✅ Voeg disabled states toe waar nodig
- ✅ Check placeholder requirements

---

### 2. Icon Components (2 componenten)

**Status**: ❌ Ontbrekend  
**Utrecht Equivalent**: `@utrecht/component-library-react Icon`

**Componenten**:
- `icon/icon-success`
- `icon/icon-info`

**Implementatie**:
```typescript
// Optie 1: Utrecht Icon component
import { Icon } from '@utrecht/component-library-react';

<Icon type="success" />  // Check beschikbare types
<Icon type="info" />

// Optie 2: Custom SVG icons (aanbevolen voor specifieke designs)
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

<CheckCircleIcon className="w-6 h-6 text-green-600" />
<InformationCircleIcon className="w-6 h-6 text-blue-600" />
```

**Aanbeveling**:
- ✅ Check welke icon varianten Utrecht ondersteunt
- ✅ Gebruik SVG icons als Utrecht geen exacte match heeft
- ✅ Gebruik NL Design System kleuren (green-600 voor success, blue-600 voor info)

---

## 🟡 Medium Prioriteit Componenten

### 3. Button Components

**Status**: ⚠️ Gedeeltelijk geïmplementeerd  
**Huidige implementatie**: `Button` van Utrecht wordt al gebruikt in `Header.tsx`

**Ontbrekende varianten**:
- `Type=Primary, State=Default` ✅ (al gebruikt)
- `Type=Secondary, State=Default` ✅ (al gebruikt)
- `Type=Primary, State=Disabled` ⚠️ (moet worden getest)

**Aanbeveling**:
- ✅ Verifieer dat disabled state correct werkt
- ✅ Check of alle button varianten in Figma overeenkomen met Utrecht
- ✅ Documenteer button usage patterns

---

### 4. Form Elements

**Status**: ❌ Ontbrekend  
**Utrecht Equivalent**: `Checkbox`, `RadioButton`

**Componenten**:
- `Selected=True, Indeterminate=False, State=Default` (Checkbox)
- `Selected=False, Indeterminate=False, State=Default` (Checkbox)
- `Radio Button List`

**Implementatie**:
```typescript
// Checkbox
import { Checkbox } from '@utrecht/component-library-react';

<Checkbox id="checkbox-id" name="checkbox-name" checked={isChecked} />

// Radio buttons
import { RadioButton, RadioGroup } from '@utrecht/component-library-react';

<RadioGroup name="radio-group">
  <RadioButton id="radio-1" value="option1">Optie 1</RadioButton>
  <RadioButton id="radio-2" value="option2">Optie 2</RadioButton>
</RadioGroup>
```

**Aanbeveling**:
- ✅ Implementeer voor formulier flows (aankondiging, naamgebruik, etc.)
- ✅ Check indeterminate state voor checkboxes
- ✅ Test radio button list variant

---

### 5. Feedback Components

**Status**: ❌ Ontbrekend  
**Utrecht Equivalent**: `Alert` (gedeeltelijk)

**Componenten**:
- `Property 1=Error` (Error state)
- `Status=Success` (Success state)
- `Property 1=Success` (Success variant)
- `Status=Idle` (Loading/Idle state)

**Implementatie**:
```typescript
// Optie 1: Utrecht Alert
import { Alert } from '@utrecht/component-library-react';

<Alert type="error">Foutmelding tekst</Alert>
<Alert type="success">Succesmelding tekst</Alert>

// Optie 2: Custom feedback component (aanbevolen)
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
      <div className="flex items-start">
        <InformationCircleIcon className="w-5 h-5 text-red-600 mr-2" />
        <p className="text-sm text-red-800">{message}</p>
      </div>
    </div>
  );
}
```

**Aanbeveling**:
- ✅ Maak custom feedback componenten voor consistentie
- ✅ Gebruik NL Design System kleuren (red-600 voor errors, green-600 voor success)
- ✅ Voeg iconen toe voor visuele feedback
- ✅ Zorg voor WCAG 2.2 Level AA compliance

---

### 6. Label Components

**Status**: ❌ Ontbrekend  
**Utrecht Equivalent**: `Label`

**Componenten**:
- `Label type=Info`

**Implementatie**:
```typescript
import { Label } from '@utrecht/component-library-react';

<Label htmlFor="input-id">
  Label tekst
  <span className="text-gray-500 text-sm ml-2">(Optioneel)</span>
</Label>
```

**Aanbeveling**:
- ✅ Gebruik Utrecht Label component
- ✅ Check of info variant nodig is (mogelijk custom styling)
- ✅ Voeg help text toe waar nodig

---

## 🟢 Lage Prioriteit Componenten

### 7. Layout & Spacing

**Componenten**:
- `Spacing/12`
- `Spacing/24`

**Aanbeveling**:
- ✅ Gebruik Tailwind spacing utilities (`space-y-3`, `space-y-6`)
- ✅ Maak spacing component alleen als er specifieke requirements zijn
- ⏸️ Laagste prioriteit - implementeer later indien nodig

---

### 8. Specifieke Componenten

**Componenten**:
- `DigiD` (DigiD logo/button)
- `pdf` (PDF icon)

**Aanbeveling**:
- ✅ DigiD: Maak custom component wanneer DigiD integratie wordt geïmplementeerd
- ✅ PDF: Gebruik standaard PDF icon (Heroicons of custom SVG)
- ⏸️ Implementeer wanneer functionaliteit beschikbaar is

---

## 📋 Implementatie Roadmap

### Week 1: Basis UI Componenten
- [ ] **Input fields** (Textbox, Select) - 9 componenten
- [ ] **Icons** (Success, Info) - 2 componenten
- [ ] **Buttons** (Verifieer disabled states) - 3 componenten
- **Totaal**: 14 componenten

### Week 2: Form & Feedback
- [ ] **Form elements** (Checkbox, Radio) - 3 componenten
- [ ] **Feedback components** (Error, Success, Idle) - 4 componenten
- [ ] **Labels** (Info variant) - 1 component
- **Totaal**: 8 componenten

### Week 3: Verificatie & Testing
- [ ] **Verifieer alle componenten** tegen Figma designs
- [ ] **Test accessibility** (WCAG 2.2 Level AA)
- [ ] **Documenteer** component usage patterns
- [ ] **Update bestaande code** om nieuwe componenten te gebruiken

### Week 4: Layout & Specifieke Componenten
- [ ] **Spacing helpers** (indien nodig)
- [ ] **Specifieke componenten** (DigiD, PDF) - wanneer functionaliteit beschikbaar
- **Totaal**: 2-4 componenten

---

## ✅ Directe Acties

### 1. Maak Component Library Mapping

Maak een document dat Figma componenten mapt naar code componenten:

```typescript
// src/components/figma-mapping.ts
export const FIGMA_COMPONENT_MAP = {
  'Type=Primary, State=Default': {
    component: 'Button',
    import: '@utrecht/component-library-react',
    props: { appearance: 'primary-action-button' },
  },
  'Type=Secondary, State=Default': {
    component: 'Button',
    import: '@utrecht/component-library-react',
    props: { appearance: 'secondary-action-button' },
  },
  'icon/icon-success': {
    component: 'CheckCircleIcon',
    import: '@heroicons/react/24/solid',
    props: { className: 'w-6 h-6 text-green-600' },
  },
  // ... etc
};
```

### 2. Maak Shared Component Library

Maak een `src/components/ui/` directory voor herbruikbare componenten:

```
src/components/ui/
├── Button.tsx          (Wrapper voor Utrecht Button met custom variants)
├── Input.tsx           (Wrapper voor Utrecht Textbox)
├── Select.tsx          (Wrapper voor Utrecht Select)
├── Checkbox.tsx        (Wrapper voor Utrecht Checkbox)
├── RadioGroup.tsx      (Wrapper voor Utrecht RadioGroup)
├── Icon.tsx            (Icon component met success/info variants)
├── Alert.tsx           (Custom alert component)
├── ErrorMessage.tsx    (Error feedback component)
└── SuccessMessage.tsx  (Success feedback component)
```

### 3. Update Bestaande Code

- Scan alle formulier pagina's (`000-aankondiging/`, `dossier/`)
- Vervang custom inputs door Utrecht componenten
- Voeg error states toe waar nodig
- Voeg icons toe voor feedback

---

## 🎯 Prioritering Matrix

| Component | Prioriteit | Utrecht | Effort | Impact |
|-----------|-----------|---------|--------|--------|
| Input fields | 🔴 High | ✅ Ja | Laag | Hoog |
| Icons | 🔴 High | ✅ Ja | Laag | Hoog |
| Buttons | 🟡 Medium | ✅ Ja | Laag | Hoog |
| Form elements | 🟡 Medium | ✅ Ja | Laag | Hoog |
| Feedback | 🟡 Medium | ⚠️ Gedeeltelijk | Medium | Hoog |
| Labels | 🟡 Medium | ✅ Ja | Laag | Medium |
| Spacing | 🟢 Low | ❌ Nee | Laag | Laag |
| DigiD/PDF | 🟢 Low | ❌ Nee | Medium | Laag |

---

## 📚 Referenties

- [Utrecht Component Library](https://nl-design-system.github.io/utrecht/)
- [NL Design System Guidelines](https://nldesignsystem.nl/handboek)
- [Figma Design](https://www.figma.com/design/egmJPMnreeZSwiLYYTwsZo/Schermen-vernieuwd-huwelijk)
- [Component Analysis JSON](./figma-detailed-analysis.json)

---

## 🔄 Volgende Stappen

1. ✅ **Review deze analyse** met het team
2. ✅ **Prioriteer componenten** op basis van huidige development needs
3. ✅ **Start met Week 1** implementatie (Input fields + Icons)
4. ✅ **Test componenten** in bestaande formulieren
5. ✅ **Documenteer** component usage patterns
6. ✅ **Update MASTERPLAN.md** met component implementatie status

---

**Laatst bijgewerkt**: 2026-01-11  
**Analyse uitgevoerd door**: Figma Component Analysis Script  
**Export bestanden**: 
- `figma-component-analysis.json` (basis analyse)
- `figma-detailed-analysis.json` (gedetailleerde analyse)

