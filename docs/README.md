# Huwelijk Applicatie Documentatie

**Laatst bijgewerkt:** 28 december 2026

## 📚 Documentatie Structuur

Deze documentatie is georganiseerd volgens functionaliteit:

### [🎯 Features](./features/README.md)
Feature-specifieke implementatie documentatie
- [BABS](./features/babs/README.md) - Calendar beschikbaarheid
- [Aankondiging](./features/aankondiging/README.md) - Multi-step flow
- [Getuigen](./features/getuigen/README.md) - Getuigen beheer
- [Ceremonie](./features/ceremonie/README.md) - Planning
- [Documenten](./features/documenten/README.md) - Document beheer
- [Naamgebruik](./features/naamgebruik/README.md) - Naam keuze

### [🏗️ Architecture](./architecture/README.md)
Architectuur en design documentatie
- [Database](./architecture/database/README.md) - Schema, migrations
- [API](./architecture/api/README.md) - API design
- [Multi-tenancy](./architecture/multi-tenancy/README.md) - Gemeente scheiding

### [🚀 Deployment](./deployment/README.md)
Deployment en infrastructure
- [Migrations](./deployment/migrations/README.md) - Database migrations
- [Setup](./deployment/setup/README.md) - Installatie instructies

### [🔌 Integrations](./integrations/README.md)
Externe integraties
- [Clerk](./integrations/clerk/README.md) - Authentication
- [GEMMA](./integrations/gemma/README.md) - GEMMA standaard
- [BAG API](./integrations/bag-api/README.md) - Adres validatie

### [✅ Validation](./validation/README.md)
Validatie systeem documentatie

## 🚀 Quick Start

1. [Setup Guide](./SETUP-GUIDE.md) - Eerste installatie
2. [Quick Start](./QUICK-START.md) - Snel aan de slag
3. [Troubleshooting](./TROUBLESHOOTING-GEMEENTE-METADATA.md) - Problemen oplossen

## 🔗 Important Links

- [MASTERPLAN.md](../MASTERPLAN.md) - Project masterplan (blijft in root)
- [README.md](../README.md) - Project README (blijft in root)

## 📝 Documentatie Conventies

Zie [Documentation Structure](./.cursor/rules/documentation-structure.mdc) voor:
- Naamgeving conventies
- Folder structuur
- Link referenties
- Maintenance procedures

## 🔍 Zoeken

Gebruik je IDE's search functie om documentatie te doorzoeken:
- **VS Code/Cursor**: `Ctrl+Shift+F` → Zoek in `docs/`
- **Grep**: `grep -r "zoekterm" docs/`

## 📊 Status

| Categorie | Status | Documentatie |
|-----------|--------|--------------|
| Features | ✅ Complete | Volledig gedocumenteerd |
| Architecture | ✅ Complete | Schemas en diagrammen |
| Deployment | ✅ Complete | Setup guides |
| Integrations | ✅ Complete | API documentatie |
| Validation | ✅ Complete | Regel overzicht |


