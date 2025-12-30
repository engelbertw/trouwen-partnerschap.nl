# Huwelijk - Open Source Trouwapplicatie

Een moderne, toegankelijke trouwapplicatie gebouwd met Next.js 15 en het NL Design System voor Nederlandse gemeenten.

## 🚀 Features

- **Multi-tenant architectuur** - Ondersteuning voor meerdere gemeenten
- **Aankondiging flow** - Stapsgewijs huwelijksaankondiging proces
- **BABS beheer** - Beschikbaarheid en ceremonie planning
- **Getuigen beheer** - Getuigen registratie en beheer
- **Document generatie** - Automatische PDF generatie
- **BAG API integratie** - Automatische adresvalidatie
- **Clerk authenticatie** - Veilige gebruikersauthenticatie
- **Validatie systeem** - Uitgebreide data validatie met wettelijke basis

## 📋 Vereisten

- Node.js 18+ 
- PostgreSQL database (Neon, Supabase, of lokaal)
- Clerk account voor authenticatie
- BAG API key (optioneel, voor adresvalidatie)

## 🛠️ Installatie

1. **Clone de repository**
   ```bash
   git clone https://github.com/engelbertw/trouwen-partnerschap.nl.git
   cd huwelijk
   ```

2. **Installeer dependencies**
   ```bash
   npm install
   ```

3. **Configureer environment variabelen**
   ```bash
   cp .env.example .env
   ```
   
   Vul de volgende variabelen in:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
   - `CLERK_SECRET_KEY` - Clerk secret key
   - `BAG_API_KEY` - BAG API key (optioneel)

4. **Setup database**
   ```bash
   # Run database migrations
   npm run db:push
   
   # Seed initial data (optioneel)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🚀 Deployment

Voor deployment naar Vercel, zie de [Vercel Deployment Guide](./docs/deployment/VERCEL-DEPLOYMENT.md).

**Belangrijk**: Configureer alle environment variables in Vercel **voordat** je de eerste build start, inclusief:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (verplicht)
- `CLERK_SECRET_KEY` (verplicht)
- `DATABASE_URL` (verplicht)

## 📚 Documentatie

Volledige documentatie is beschikbaar in de [`docs/`](./docs/) directory:

- [Setup Guide](./docs/SETUP-GUIDE.md) - Uitgebreide installatie instructies
- [Quick Start](./docs/QUICK-START.md) - Snel aan de slag
- [Vercel Deployment](./docs/deployment/VERCEL-DEPLOYMENT.md) - Deployment naar Vercel
- [Architecture](./docs/architecture/README.md) - Architectuur documentatie
- [Features](./docs/features/README.md) - Feature documentatie
- [API Documentation](./docs/architecture/api/README.md) - API endpoints
- [Validation System](./docs/VALIDATION-SYSTEM.md) - Validatie systeem

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: v19
- **TypeScript**: v5.7+
- **Database**: PostgreSQL met Drizzle ORM
- **Styling**: Tailwind CSS + NL Design System
- **Authentication**: Clerk
- **Email**: Resend (optioneel)

## 🤝 Bijdragen

Bijdragen zijn welkom! Zie [CONTRIBUTING.md](./CONTRIBUTING.md) voor richtlijnen.

## 📄 Licentie

Dit project is gelicenseerd onder de [European Union Public Licence v. 1.2](LICENSE) (EUPL-1.2).

De EUPL is een open source licentie die specifiek is ontworpen voor de Europese Unie en is compatibel met veel andere open source licenties zoals GPL, AGPL, MPL, en LGPL.

## 🔒 Security

Als je een security issue vindt, open een issue of stuur een email naar [engelbert.wijnhoven@pinkroccade.nl].

## 🙏 Credits

Gebouwd met:
- [NL Design System](https://nldesignsystem.nl/)
- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
