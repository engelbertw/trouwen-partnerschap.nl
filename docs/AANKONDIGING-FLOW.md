# Aankondiging Flow - Documentatie

## Overzicht

De aankondiging flow is het proces waarmee burgers hun huwelijk of partnerschap kunnen aankondigen bij de gemeente. Deze implementatie volgt de NL Design System richtlijnen en biedt een toegankelijke, gebruiksvriendelijke ervaring.

## Route Structuur

```
/                           → Inleiding pagina (000 - aankondiging - inleiding)
/aankondiging/start         → Start proces (controleert authenticatie)
/aankondiging/stap-1        → Eerste formulier stap
```

## Pagina's

### 1. Landing Page (`/`)

**Bestand**: `src/app/page.tsx`

**Doel**: Introduceer gebruikers in het aankondigingsproces

**Functies**:
- Uitleg over DigiD/eIDAS authenticatie vereisten
- Informatie over opslaan en later verder werken
- "Start aankondiging" call-to-action button
- Link naar DigiD.nl voor aanvraag

**Design kenmerken**:
- Blauwe header met titel (NL Design System blauw: `#154273`)
- Witte content kaart met schaduwen
- Gradient achtergrond (blauw 50 → blauw 100)
- Toegankelijke focus states en hover effecten
- Responsive design (mobile-first)

### 2. Start Pagina (`/aankondiging/start`)

**Bestand**: `src/app/aankondiging/start/page.tsx`

**Doel**: Authenticatie checkpoint en routing

**Functionaliteit**:
- Controleert of gebruiker is ingelogd via Clerk
- Redirect naar login indien nodig met `redirect_url` parameter
- TODO: Controleer op bestaand actief dossier
- Redirect naar eerste stap van formulier

**Authenticatie flow**:
```typescript
// Niet ingelogd → /sign-in?redirect_url=/aankondiging/start
// Wel ingelogd → /aankondiging/stap-1
```

### 3. Stap 1 (`/aankondiging/stap-1`)

**Bestand**: `src/app/aankondiging/stap-1/page.tsx`

**Doel**: Eerste stap van aankondigingsformulier

**Status**: Placeholder (TODO)

**Toekomstige implementatie**:
- Persoonlijke gegevens formulier
- Validatie
- Voortgang indicator
- Opslaan en later verder functionaliteit

## Componenten

### Header Component

**Bestand**: `src/components/Header.tsx`

**Kenmerken**:
- Logo placeholder met "LOGO GEMEENTE" tekst
- Dynamische navigatie (toont sluit-knop op formulier paginas)
- Clerk authenticatie integratie
- Responsive design
- Dark mode support

**Logica**:
```typescript
const isFormPage = pathname?.startsWith('/aankondiging');
// Toont X sluit-knop alleen op aankondiging paginas
```

## Styling & Design

### Kleuren (NL Design System)

- **Primary blue**: `#154273` (header, buttons)
- **Hover blue**: `#1a5a99`
- **Background gradient**: `from-blue-50 to-blue-100`
- **Text colors**: `gray-700` (body), `gray-900` (headings)

### Typografie

- **Headings**: Noto Serif (serif font)
- **Body text**: Noto Sans (sans-serif font)
- **Font sizes**: Base 16px (1rem)
- **Line height**: 1.5 voor leesbaarheid

### Toegankelijkheid (WCAG 2.2 Level AA)

✅ **Geïmplementeerd**:
- Semantic HTML (`<article>`, `<section>`, `<main>`)
- Focus indicators (ring-2, ring-offset-2)
- Hover states voor interactieve elementen
- Aria labels (`aria-hidden`, `aria-label`)
- Voldoende kleurcontrasten (4.5:1 voor tekst)
- Minimum touch targets (44x44px voor buttons)
- Responsive design (mobile-first)

### Responsive Breakpoints

```css
/* Mobile */
sm: 640px    → Kleinere padding, gestapelde layout
md: 768px    → Grotere content breedte
lg: 1024px   → Maximum content breedte (4xl: 56rem)
```

## Toekomstige Implementaties

### Prioriteit 1: Formulier Stappen

- [ ] Implementeer formulier voor stap 1 (persoonlijke gegevens)
- [ ] Voortgang indicator component
- [ ] Validatie logica met Zod schemas
- [ ] "Opslaan en later verder" functionaliteit

### Prioriteit 2: Database Integratie

- [ ] Dossier aanmaken in database
- [ ] Opslaan van formulier data
- [ ] Controleren op bestaande dossiers
- [ ] Status tracking (concept, ingediend, etc.)

### Prioriteit 3: Email Notificaties

- [ ] Email met link bij "Opslaan en later verder"
- [ ] Bevestigingsmail na indienen
- [ ] Reminder emails

### Prioriteit 4: Partner Flow

- [ ] Uitnodiging partner via email
- [ ] Partner authenticatie (DigiD/eIDAS)
- [ ] Gezamenlijk formulier invullen
- [ ] Getuigen toevoegen

## Code Kwaliteit

### TypeScript

- ✅ Strict mode enabled
- ✅ Expliciete return types (`JSX.Element`)
- ✅ Type-safe Metadata exports
- ✅ Geen `any` types gebruikt

### Next.js 15 Best Practices

- ✅ Server Components by default
- ✅ Async/await voor auth checks
- ✅ Metadata exports voor SEO
- ✅ Proper redirect handling
- ✅ App Router file conventions

### NL Design System Compliance

- ✅ Aanbevolen kleuren gebruikt
- ✅ Typografie richtlijnen gevolgd
- ✅ Toegankelijkheid standaarden
- ✅ Semantic HTML
- ✅ Nederlandse taal

## Testing Checklist

### Handmatig Testen

- [ ] Navigatie van landingspagina naar start
- [ ] Authenticatie redirect werkt correct
- [ ] "Opslaan en later verder" link werkt (na implementatie)
- [ ] DigiD.nl externe link opent in nieuw tabblad
- [ ] Sluit-knop (X) werkt en redirect naar home
- [ ] Responsive design op mobile/tablet/desktop
- [ ] Keyboard navigatie werkt correct
- [ ] Focus indicators zijn zichtbaar
- [ ] Hover states werken op alle interactieve elementen

### Browser Compatibiliteit

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers (Android/iOS)

### Toegankelijkheid Testing

- [ ] Screen reader test (NVDA/JAWS/VoiceOver)
- [ ] Keyboard-only navigatie
- [ ] Kleurcontrast check (WCAG AA)
- [ ] Touch target sizes (minimum 44x44px)

## Referenties

- [NL Design System](https://nldesignsystem.nl/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Clerk Authentication](https://clerk.com/docs)

