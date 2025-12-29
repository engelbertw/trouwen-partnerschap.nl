# Quick Start - Aankondiging Flow

## 🚀 Test de Implementatie

### 1. Start de Development Server

```bash
npm run dev
```

De applicatie draait nu op `http://localhost:3000`

### 2. Navigeer naar de Inleiding Pagina

Open je browser en ga naar: `http://localhost:3000`

Je ziet nu de **"Huwelijk of partnerschap aankondigen"** inleiding pagina.

### 3. Test de Flow

#### Stap 1: Bekijk de Inleiding
- ✅ Lees de informatie over DigiD/eIDAS
- ✅ Bekijk de uitleg over "Opslaan en later verder"
- ✅ Klik op de DigiD.nl link (opent in nieuw tabblad)

#### Stap 2: Start het Proces
- ✅ Klik op "Start aankondiging" button
- ✅ Je wordt doorgestuurd naar `/aankondiging/start`
- ✅ Als je niet bent ingelogd: redirect naar Clerk login
- ✅ Na inloggen: redirect terug naar start, dan door naar stap 1

#### Stap 3: Bekijk Stap 1 (Placeholder)
- ✅ Je ziet de placeholder pagina voor stap 1
- ✅ Header toont nu de sluit-knop (X)
- ✅ Klik op X om terug te gaan naar home

## 🎨 Visuele Elementen Checklist

### Header
- [ ] "LOGO GEMEENTE" placeholder zichtbaar
- [ ] "Huwelijk" titel naast logo
- [ ] Inlog/Registreer knoppen (als uitgelogd)
- [ ] User avatar button (als ingelogd)
- [ ] Sluit-knop (X) alleen op `/aankondiging/*` routes

### Landing Page
- [ ] Blauwe header balk met titel
- [ ] Lichtblauwe gradient achtergrond
- [ ] Witte content kaart met schaduw
- [ ] Grote serif heading
- [ ] Twee secties met bold headings
- [ ] DigiD.nl link werkt en opent nieuw tabblad
- [ ] "Start aankondiging" button met pijl icoon

### Responsive Design
- [ ] Mobile (< 640px): compact layout
- [ ] Tablet (640px - 1024px): medium spacing
- [ ] Desktop (> 1024px): optimal reading width

## ⌨️ Keyboard Navigation Test

1. **Tab door alle interactieve elementen**:
   - [ ] Logo link heeft focus indicator
   - [ ] DigiD.nl link heeft focus indicator
   - [ ] "Start aankondiging" button heeft focus indicator
   - [ ] Header navigatie items hebben focus indicators

2. **Enter key activeert links en buttons**:
   - [ ] Logo link navigeert naar home
   - [ ] DigiD.nl link opent in nieuw tabblad
   - [ ] "Start aankondiging" button start het proces

3. **Escape key**:
   - [ ] Sluit modals (indien van toepassing)

## 🔐 Authenticatie Test

### Scenario 1: Uitgelogde Gebruiker
```
1. Bezoek /
2. Klik "Start aankondiging"
3. Verwacht: Redirect naar /sign-in?redirect_url=/aankondiging/start
4. Log in met test account
5. Verwacht: Redirect terug naar /aankondiging/start
6. Verwacht: Automatische redirect naar /aankondiging/stap-1
```

### Scenario 2: Ingelogde Gebruiker
```
1. Log eerst in via header
2. Bezoek /
3. Klik "Start aankondiging"
4. Verwacht: Direct naar /aankondiging/stap-1
```

## 🎯 User Experience Checklist

### Visuele Feedback
- [ ] Buttons veranderen van kleur bij hover
- [ ] Links veranderen van kleur bij hover
- [ ] Focus indicators zijn duidelijk zichtbaar
- [ ] Smooth transitions op interactive elementen

### Leesbaarheid
- [ ] Tekst is goed leesbaar (contrast > 4.5:1)
- [ ] Regels zijn niet te lang (max 75 karakters)
- [ ] Line height is comfortabel (1.5)
- [ ] Font size is groot genoeg (16px minimum)

### Toegankelijkheid
- [ ] Screen reader kan alle content voorlezen
- [ ] Headings zijn in logische volgorde (h1 → h2 → h3)
- [ ] Links hebben beschrijvende tekst
- [ ] Buttons hebben duidelijke labels
- [ ] Images hebben alt text (indien van toepassing)

## 📱 Mobile Testing

### iOS Safari
```
1. Open http://localhost:3000 (of deployed URL)
2. Test portrait orientatie
3. Test landscape orientatie
4. Test touch targets (minstens 44x44px)
5. Test scrolling behavior
```

### Android Chrome
```
1. Open http://localhost:3000 (of deployed URL)
2. Test portrait orientatie
3. Test landscape orientatie
4. Test touch targets
5. Test back button behavior
```

## 🐛 Known Issues / TODOs

### Stap 1 (Placeholder)
- [ ] Formulier moet nog geïmplementeerd worden
- [ ] Validatie logica toevoegen
- [ ] Database integratie voor opslaan

### "Opslaan en later verder"
- [ ] Email versturen met link naar dossier
- [ ] Dossier status opslaan in database
- [ ] Resume flow implementeren

### Partner Flow
- [ ] Partner uitnodigen via email
- [ ] Partner authenticatie (DigiD/eIDAS)
- [ ] Gezamenlijk formulier invullen

## 🔧 Development Tips

### Hot Reload
- Wijzigingen in `src/` worden automatisch herladen
- Browser refresh niet nodig
- Check console voor errors

### TypeScript Errors
```bash
# Check TypeScript errors
npm run build

# Check linting
npm run lint
```

### Database Testing
```bash
# Test database connection (als geïmplementeerd)
npm run test:db
```

### Environment Variables
Zorg dat `.env.local` bestaat met:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (Neon)
DATABASE_URL=postgresql://...
```

## 📚 Documentatie Links

- **Aankondiging Flow**: `docs/AANKONDIGING-FLOW.md`
- **Visual Implementation**: `docs/VISUAL-IMPLEMENTATION.md`
- **Delivery Summary**: `AANKONDIGING-INLEIDING-DONE.md`
- **Setup Guide**: `docs/SETUP-GUIDE.md`

## 💡 Tips voor Next Steps

### Als je formulieren gaat bouwen:
1. Gebruik Zod voor validatie (`src/schemas/`)
2. Volg bestaande schema patterns (zie `src/schemas/dossier.ts`)
3. Implementeer React Hook Form voor form state management
4. Gebruik Server Actions voor form submissions

### Als je database integratie gaat doen:
1. Check `src/db/schema.ts` voor database schema
2. Gebruik Drizzle ORM voor queries
3. Volg multi-tenancy patterns (gemeente_oin)
4. Test met `npm run test:db`

### Als je styling aanpast:
1. Volg NL Design System guidelines (`.cursor/rules/nl-design-system.mdc`)
2. Gebruik Tailwind utility classes
3. Maintain WCAG 2.2 Level AA accessibility
4. Test op meerdere schermformaten

---

**Happy coding! 🎉**

Vragen? Check de documentatie in `docs/` of de cursor rules in `.cursor/rules/`

