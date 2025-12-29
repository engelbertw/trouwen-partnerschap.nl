# Scripts Directory

Deze directory bevat development en deployment scripts.

## 📦 Gepubliceerde Scripts

De volgende scripts zijn **wel** beschikbaar op GitHub omdat ze nuttig zijn voor setup:

- **`deploy-database.js`** - Deploy database schema naar Neon PostgreSQL
  - Voert alle SQL migration files uit in de juiste volgorde
  - Vereist: `DATABASE_URL` environment variable
  
- **`verify-clerk-keys.js`** - Verifieer Clerk API keys configuratie
  - Controleert of Clerk keys correct zijn ingesteld
  - Vereist: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` en `CLERK_SECRET_KEY`

## ⚠️ Niet Gepubliceerde Scripts

De meeste scripts worden **niet** naar GitHub gepusht omdat ze:
- Database credentials kunnen bevatten (via environment variables)
- Lokaal-specifieke configuratie bevatten
- Alleen voor development/test doeleinden zijn
- Test data of gevoelige informatie kunnen bevatten

## 📋 Beschikbare Scripts

### Database Scripts
- `deploy-database.js` - Deploy database schema naar Neon
- `clean-database.ts` - Clean database voor testing
- `run-*-migration.js` - Database migrations

### Development Scripts
- `generate-screenshots.ts` - Maak screenshots van applicatie
- `setup-test-data.ts` - Setup test data
- `check-*.ts` - Validatie en check scripts

### Utility Scripts
- `verify-clerk-keys.js` - Verifieer Clerk API keys
- `test-*.js` - Test scripts

## 🚀 Gebruik

### Database Deployment

```bash
# Via npm script (gebruikt Drizzle ORM)
npm run db:push

# Of via deploy script (gebruikt SQL files)
node scripts/deploy-database.js
```

### Clerk Keys Verificatie

```bash
node scripts/verify-clerk-keys.js
```

### Alle Scripts

Alle scripts gebruiken environment variables uit `.env` of `.env.local`.

**Lokale development scripts** (niet op GitHub):
- `npm run screenshots` - Screenshots maken
- `npm run setup:test-data` - Test data setup
- `npm run db:clean` - Database opschonen

## 📝 Documentatie

Zie individuele script bestanden voor specifieke documentatie.

