# Vercel Deployment Guide

Deze guide beschrijft hoe je de Huwelijk applicatie deployt naar Vercel.

## 📋 Vereisten

- Vercel account (gratis tier is voldoende)
- Clerk account voor authenticatie
- PostgreSQL database (Neon, Supabase, of andere provider)
- BAG API key (optioneel, voor adresvalidatie)

## 🔑 Environment Variables

**BELANGRIJK**: Configureer de volgende environment variables in Vercel voordat je deployt.

### Verplichte Environment Variables

Ga naar je Vercel project → **Settings** → **Environment Variables** en voeg toe:

#### Clerk Authentication
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # of pk_live_... voor production
CLERK_SECRET_KEY=sk_test_...                   # of sk_live_... voor production
```

**Waar te vinden:**
1. Ga naar [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecteer je applicatie
3. Ga naar **API Keys**
4. Kopieer de **Publishable Key** en **Secret Key**
5. **Belangrijk**: Zorg dat beide keys van hetzelfde environment zijn (beide `test` of beide `live`)

#### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

**Voor Neon:**
- Ga naar je Neon project → **Connection Details**
- Kopieer de connection string
- Voor production, gebruik de **Connection Pooler** URL

### Optionele Environment Variables

#### BAG API (voor adresvalidatie)
```bash
BAG_API_KEY=your_bag_api_key_here
```

#### Clerk URLs (optioneel, defaults worden gebruikt)
```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### DigiD Integration (als je Keycloak gebruikt)
```bash
NEXT_PUBLIC_DIGID_PROVIDER_KEY=keycloak-digid
```

## 🚀 Deployment Stappen

### Stap 1: Push naar GitHub

Zorg dat je code op GitHub staat:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Stap 2: Import Project in Vercel

1. Ga naar [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik op **Add New** → **Project**
3. Import je GitHub repository
4. Selecteer de repository: `engelbertw/demo26-trouwen-partnerschap.nl`

### Stap 3: Configureer Environment Variables

**BELANGRIJK**: Configureer environment variables **VOORDAT** je de eerste build start!

1. In het import scherm, klik op **Environment Variables**
2. Voeg alle verplichte environment variables toe (zie hierboven)
3. Selecteer voor elke variable:
   - **Production** ✅
   - **Preview** ✅ (voor pull requests)
   - **Development** ✅ (optioneel)

### Stap 4: Configureer Build Settings

Vercel detecteert automatisch Next.js, maar controleer:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (automatisch)
- **Output Directory**: `.next` (automatisch)
- **Install Command**: `npm install` (automatisch)

### Stap 5: Deploy

1. Klik op **Deploy**
2. Wacht tot de build compleet is
3. Als de build faalt, check de logs voor missing environment variables

## 🔍 Troubleshooting

### Build Fails: "Missing publishableKey"

**Fout:**
```
Error: @clerk/clerk-react: Missing publishableKey
```

**Oplossing:**
1. Ga naar Vercel → **Settings** → **Environment Variables**
2. Controleer of `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is ingesteld
3. Zorg dat de variable naam **exact** klopt (case-sensitive)
4. Zorg dat de variable beschikbaar is voor **Production** environment
5. Redeploy na het toevoegen van de variable

### Build Fails: Database Connection

**Fout:**
```
Error: connect ECONNREFUSED
```

**Oplossing:**
1. Controleer of `DATABASE_URL` correct is ingesteld
2. Zorg dat je database **publicly accessible** is (niet alleen localhost)
3. Voor Neon: gebruik de connection string met `?sslmode=require`
4. Check firewall settings van je database provider

### Build Succeeds but App Doesn't Work

1. **Check Runtime Logs**: Vercel → **Deployments** → **Functions** → Check logs
2. **Check Environment Variables**: Zorg dat alle variables zijn ingesteld voor het juiste environment
3. **Check Database Migrations**: Zorg dat je database schema up-to-date is
4. **Check Clerk Configuration**: Verifieer dat Clerk keys correct zijn

## 📝 Post-Deployment Checklist

Na een succesvolle deployment:

- [ ] Test de applicatie op de production URL
- [ ] Test inloggen met Clerk
- [ ] Test database connectie (maak een test dossier aan)
- [ ] Check Vercel logs voor errors
- [ ] Configureer custom domain (optioneel)
- [ ] Setup monitoring (optioneel)

## 🔄 Continuous Deployment

Vercel deployt automatisch bij elke push naar `main` branch.

Voor pull requests:
- Vercel maakt automatisch preview deployments
- Environment variables worden overgenomen van Production (tenzij je Preview-specifieke variables hebt)

## 🌍 Custom Domain

1. Ga naar Vercel → **Settings** → **Domains**
2. Voeg je custom domain toe (bijv. `huwelijk.nl`)
3. Volg de DNS instructies
4. Wacht tot SSL certificaat is gegenereerd (automatisch)

## 📊 Monitoring

Vercel biedt built-in monitoring:
- **Analytics**: Page views, performance metrics
- **Logs**: Runtime errors, function logs
- **Speed Insights**: Core Web Vitals

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Ze staan al in `.gitignore`
2. **Use different Clerk keys** voor development en production
3. **Rotate secrets regularly** - Update environment variables periodiek
4. **Use Vercel's built-in secrets management** - Nooit hardcode secrets in code
5. **Enable Vercel Authentication** voor team access (optioneel)

## 📚 Referenties

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Clerk Deployment Guide](https://clerk.com/docs/deployments/overview)
- [Neon Connection Pooling](https://neon.tech/docs/connect/connection-pooling)

## 🆘 Hulp Nodig?

Als je problemen hebt met deployment:
1. Check de [Troubleshooting](#-troubleshooting) sectie hierboven
2. Bekijk Vercel build logs voor specifieke errors
3. Check de [docs/TROUBLESHOOTING.md](../TROUBLESHOOTING.md) voor algemene issues

