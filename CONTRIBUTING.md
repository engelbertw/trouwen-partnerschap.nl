# Bijdragen aan Huwelijk

Bedankt voor je interesse om bij te dragen aan dit open source project!

## Development Setup

1. **Fork de repository**
   - Klik op de "Fork" knop in de GitHub interface

2. **Clone je fork**
   ```bash
   git clone https://github.com/jouw-username/huwelijk.git
   cd huwelijk
   ```

3. **Installeer dependencies**
   ```bash
   npm install
   ```

4. **Maak een feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

5. **Maak je changes**
   - Volg de code style guidelines
   - Voeg tests toe waar nodig
   - Update documentatie

6. **Commit je changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

7. **Push naar je branch**
   ```bash
   git push origin feature/amazing-feature
   ```

8. **Open een Pull Request**
   - Ga naar de GitHub repository
   - Klik op "New Pull Request"
   - Selecteer je branch
   - Beschrijf je changes

## Code Style

- Volg de TypeScript conventies in `.cursor/rules/typescript-conventions.mdc`
- Gebruik het NL Design System voor UI componenten
- Schrijf toegankelijke code (WCAG 2.2 Level AA)
- Valideer data volgens het validatiesysteem
- Gebruik Nederlandse teksten voor user-facing content
- Code comments kunnen in het Engels

## Project Structuur

```
huwelijk/
├── src/
│   ├── app/          # Next.js App Router pages
│   ├── components/   # Reusable React components
│   ├── lib/          # Utility functions
│   ├── db/           # Database schema and config
│   └── schemas/      # Zod validation schemas
├── docs/             # Project documentation
├── sql/              # Database migrations
├── scripts/          # Development scripts
└── infrastructure/   # Infrastructure config (Keycloak, etc.)
```

## Testing

Voeg tests toe voor nieuwe features en bugfixes:

```bash
# Run tests (als beschikbaar)
npm test
```

## Documentatie

Update de documentatie in `docs/` wanneer je:
- Nieuwe features toevoegt
- API endpoints wijzigt
- Database schema verandert
- Nieuwe dependencies toevoegt

## Pull Request Guidelines

- Beschrijf duidelijk wat je hebt veranderd
- Verwijs naar gerelateerde issues
- Voeg screenshots toe voor UI changes
- Zorg dat alle tests slagen
- Update de documentatie waar nodig

## Code Review

Alle pull requests worden gereviewd. Wees geduldig en reageer constructief op feedback.

## Vragen?

Open een issue als je vragen hebt over het project of hoe je kunt bijdragen.

Bedankt voor je bijdrage! 🎉

