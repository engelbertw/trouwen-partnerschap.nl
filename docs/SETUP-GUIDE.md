# Complete Setup Guide: Keycloak + DigiD + Clerk Integration

Step-by-step guide to set up the complete authentication architecture for the Huwelijk application.

## Overview

This guide will help you set up:

1. **Keycloak** - Identity broker and OIDC provider
2. **DigiD Integration** - Dutch government authentication via SAML
3. **Clerk Integration** - Session management for your Next.js app

**Estimated Setup Time**: 2-3 hours (development), 1-2 weeks (production with DigiD registration)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User → Clerk UI → Keycloak (OIDC) → DigiD (SAML) → User  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Software Requirements

- [x] Docker & Docker Compose installed
- [x] Node.js 18+ (for Next.js app)
- [x] Git
- [x] curl or Postman (for testing)
- [x] OpenSSL (for certificate generation)

### Accounts & Access

- [x] Clerk account with **Enterprise plan** (for Custom OIDC)
- [x] DigiD preprod access (apply at Logius)
- [x] Production domain with HTTPS

## Part 1: Keycloak Setup (30 minutes)

### Step 1.1: Clone and Configure

```bash
# Navigate to infrastructure directory
cd infrastructure/keycloak

# Copy environment template
cp .env.template .env

# Edit .env with your settings
nano .env
```

**Key settings to configure**:

```bash
# Change these for production!
KC_ADMIN_USER=admin
KC_ADMIN_PASS=<strong-password>

# Your domain
KEYCLOAK_HOSTNAME=auth.huwelijk.nl
KEYCLOAK_BASE_URL=https://auth.huwelijk.nl

# Database
KC_DB_PASSWORD=<strong-password>

# DigiD
DIGID_ENVIRONMENT=preprod
DIGID_REQUIRED_LOA=midden
```

### Step 1.2: Download Extended SAML IDP Plugin

```bash
# Create providers directory if not exists
mkdir -p providers

# Download from GitHub (check latest version)
cd providers
wget https://github.com/First8/Extended-SAML-IDP/releases/download/v2.0.0/keycloak-saml-extended-2.0.0.jar

cd ..
```

### Step 1.3: Generate Development Certificates

**For development only** (production requires PKIoverheid):

```bash
cd certs

# Generate signing certificate
openssl genrsa -out sp-signing.key 4096

openssl req -new -x509 -key sp-signing.key -out sp-signing.crt -days 365 \
  -subj "/C=NL/O=Huwelijk Dev/CN=auth.huwelijk.local"

# Use same for encryption
cp sp-signing.crt sp-encryption.crt

# Secure private key
chmod 600 sp-signing.key

cd ..
```

### Step 1.4: Start Keycloak

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start services
./scripts/start-dev.sh

# Wait for services to be ready (takes ~60 seconds)
```

**Verify Keycloak is running**:

Open http://localhost:8080/admin (or your configured URL)

### Step 1.5: Configure Realm and DigiD

```bash
# Run configuration script
./scripts/configure-realm.sh
```

**Save the output!** You'll need:
- Client ID: `clerk-huwelijk`
- Client Secret: `<long-secret-string>`
- Discovery URL: `http://localhost:8080/realms/nl-huwelijk/.well-known/openid-configuration`

### Step 1.6: Configure Protocol Mappers

```bash
# Configure attribute mapping
./scripts/configure-protocol-mappers.sh
```

### Step 1.7: Test Keycloak Setup

```bash
# Run integration tests
./scripts/test-integration.sh
```

**Expected output**: All tests should pass ✅

## Part 2: DigiD Registration (2-5 business days for preprod)

### Step 2.1: Download SP Metadata

```bash
curl http://localhost:8080/realms/nl-huwelijk/broker/digid/endpoint/descriptor \
  > sp-metadata.xml
```

### Step 2.2: Apply for DigiD Preprod Access

1. Visit https://www.logius.nl/aanmelden-digid
2. Fill in the application form
3. Specify your organization details
4. Request **DigiD DV (development/test)** access
5. Upload SP metadata (`sp-metadata.xml`)
6. Specify required LoA (e.g., "midden")
7. Submit application

**Wait time**: 3-5 business days

### Step 2.3: Receive DigiD Preprod Credentials

Logius will provide:
- Access to DigiD DV environment
- Test accounts for authentication testing
- Instructions for integration

### Step 2.4: Test DigiD Authentication

1. Open Keycloak account console: http://localhost:8080/realms/nl-huwelijk/account
2. Click on **DigiD** login button
3. You'll be redirected to DigiD preprod
4. Log in with test account provided by Logius
5. Verify you're redirected back to Keycloak with user attributes

## Part 3: Clerk Setup (20 minutes)

### Step 3.1: Create Clerk Application

1. Go to https://dashboard.clerk.com
2. Click **Create Application**
3. Name: **Huwelijk**
4. Select **Next.js** as framework
5. Select **Email** initially (we'll add OIDC)
6. Click **Create Application**

### Step 3.2: Upgrade to Enterprise Plan

Custom OIDC requires Clerk Enterprise.

1. Go to **Settings** → **Billing**
2. Upgrade to **Enterprise** plan
3. Contact Clerk sales if needed: https://clerk.com/contact/sales

### Step 3.3: Add Custom OIDC Provider

1. Navigate to **Configure** → **Authentication**
2. Scroll to **Enterprise Connections**
3. Click **Add connection** → **Custom OIDC Provider**

**Configuration**:

| Field | Value |
|-------|-------|
| Display Name | DigiD via Keycloak |
| Provider Key | keycloak-digid |
| Discovery Endpoint | http://localhost:8080/realms/nl-huwelijk/.well-known/openid-configuration |
| Client ID | clerk-huwelijk |
| Client Secret | <paste from Step 1.5> |
| Scopes | openid profile email |

**Attribute Mapping**:

```json
{
  "user_id": "{{sub}}",
  "first_name": "{{given_name}}",
  "last_name": "{{family_name}}",
  "email_address": "{{email}}",
  "public_metadata": {
    "bsn": "{{bsn}}",
    "loa": "{{loa}}",
    "date_of_birth": "{{date_of_birth}}",
    "identity_provider": "{{idp}}"
  }
}
```

4. Click **Create**
5. Copy the **Redirect URIs** provided by Clerk

### Step 3.4: Update Keycloak with Clerk Redirect URIs

```bash
cd infrastructure/keycloak

# Update client with Clerk redirect URIs
docker exec -i keycloak-digid /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 \
  --realm master \
  --user admin \
  --password admin

# Get client UUID
CLIENT_UUID=$(docker exec -i keycloak-digid /opt/keycloak/bin/kcadm.sh get clients \
  -r nl-huwelijk --fields id,clientId | \
  grep -A1 '"clientId" : "clerk-huwelijk"' | \
  grep '"id"' | sed 's/.*: "\(.*\)".*/\1/')

# Update redirect URIs (replace with actual Clerk URIs)
docker exec -i keycloak-digid /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_UUID \
  -r nl-huwelijk \
  -s 'redirectUris=["https://your-clerk-url.clerk.accounts.dev/v1/oauth_callback","http://localhost:3000/sso-callback"]'
```

### Step 3.5: Test Clerk Connection

1. In Clerk Dashboard, go to your **DigiD via Keycloak** connection
2. Click **Test** button
3. Follow the authentication flow
4. Verify successful authentication and attribute mapping

## Part 4: Next.js App Integration (30 minutes)

### Step 4.1: Install Clerk SDK

```bash
cd ../..  # Back to project root
npm install @clerk/nextjs
```

### Step 4.2: Configure Environment Variables

Create/update `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard

# Provider
NEXT_PUBLIC_DIGID_PROVIDER_KEY=keycloak-digid
```

### Step 4.3: Create Sign-In Component

```bash
# Create auth components directory
mkdir -p src/components/auth
```

Create `src/components/auth/DigiDSignInButton.tsx`:

```typescript
'use client';

import { useSignIn } from '@clerk/nextjs';
import { Button } from '@utrecht/component-library-react';

export function DigiDSignInButton() {
  const { signIn, isLoaded } = useSignIn();

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    
    await signIn.authenticateWithRedirect({
      strategy: 'oauth_keycloak-digid',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  };

  return (
    <Button
      appearance="primary-action-button"
      onClick={handleSignIn}
      disabled={!isLoaded}
    >
      Inloggen met DigiD
    </Button>
  );
}
```

### Step 4.4: Create Sign-In Page

Create `src/app/sign-in/page.tsx`:

```typescript
import { DigiDSignInButton } from '@/components/auth/DigiDSignInButton';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <article className="max-w-prose text-center">
        <h1 className="font-serif text-4xl font-bold mb-6">
          Welkom bij Huwelijk
        </h1>
        <p className="text-lg mb-8">
          Log in met uw DigiD om toegang te krijgen tot uw trouwplanner.
        </p>
        <DigiDSignInButton />
      </article>
    </main>
  );
}
```

### Step 4.5: Create SSO Callback Page

Create `src/app/sso-callback/page.tsx`:

```typescript
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
```

### Step 4.6: Protect Routes with Middleware

Create/update `src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sso-callback(.*)',
  '/',
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### Step 4.7: Create Dashboard Page

Create `src/app/dashboard/page.tsx`:

```typescript
import { auth, currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  const loa = user?.publicMetadata?.loa as string | undefined;

  return (
    <main className="container mx-auto p-8">
      <h1 className="font-serif text-4xl font-bold mb-4">
        Dashboard
      </h1>
      <p className="text-lg mb-8">
        Welkom, {user?.firstName} {user?.lastName}
      </p>
      {loa && (
        <p>Betrouwbaarheidsniveau: {loa}</p>
      )}
    </main>
  );
}
```

### Step 4.8: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000/sign-in

## Part 5: End-to-End Testing (15 minutes)

### Test Flow

1. Open http://localhost:3000/sign-in
2. Click **Inloggen met DigiD**
3. You're redirected to Keycloak
4. Click **DigiD** button in Keycloak
5. You're redirected to DigiD preprod
6. Log in with test DigiD account
7. You're redirected back to Keycloak
8. Keycloak processes attributes
9. You're redirected to Clerk
10. Clerk creates session
11. You're redirected to /dashboard
12. Verify user data is displayed correctly

### Troubleshooting

**Issue**: "Unable to authenticate"

Solution: Check Keycloak logs:
```bash
docker logs keycloak-digid
```

**Issue**: "Redirect URI mismatch"

Solution: Verify redirect URIs in Keycloak match Clerk exactly.

**Issue**: "Missing attributes"

Solution: Check attribute mapping in both Keycloak and Clerk.

## Part 6: Production Deployment

See comprehensive guides:
- `docs/production-checklist.md` - Complete production checklist
- `docs/certificate-setup.md` - PKIoverheid certificate setup
- `.cursor/rules/keycloak-digid-clerk-integration.mdc` - Full reference

**Key production steps**:

1. **Infrastructure**:
   - Deploy Keycloak on production infrastructure
   - Set up PostgreSQL with backups
   - Configure load balancer and HTTPS
   - Set up monitoring and logging

2. **DigiD Production**:
   - Obtain PKIoverheid certificates
   - Complete DigiD aansluitdocument
   - Security assessment by Logius
   - Register production SP metadata

3. **Security**:
   - Change all default passwords
   - Enable HSTS and security headers
   - Implement rate limiting
   - Set up WAF (Web Application Firewall)
   - Complete DPIA for BSN processing

4. **Compliance**:
   - Document legal basis for data processing
   - Implement data retention policies
   - Set up audit logging for BSN access
   - Create privacy statement
   - Train staff on AVG/GDPR

## Next Steps

- [ ] Review security checklist in `docs/production-checklist.md`
- [ ] Set up monitoring and alerting
- [ ] Implement BSN encryption and audit logging
- [ ] Complete AVG/GDPR compliance assessment
- [ ] Schedule penetration testing
- [ ] Plan production deployment timeline

## Support & Resources

### Documentation
- Keycloak: https://www.keycloak.org/documentation
- DigiD: https://www.logius.nl/onze-dienstverlening/toegang/digid/documentatie
- Clerk: https://clerk.com/docs

### Support
- Keycloak Community: https://keycloak.discourse.group
- Logius DigiD: digid@logius.nl
- Clerk Support: https://clerk.com/support

### Project Documentation
- Full integration guide: `.cursor/rules/keycloak-digid-clerk-integration.mdc`
- Infrastructure README: `infrastructure/keycloak/README.md`
- Clerk setup: `docs/clerk-oidc-setup.md`
- Certificate guide: `docs/certificate-setup.md`

---

**Last Updated**: December 26, 2025  
**Maintained By**: Huwelijk Development Team  
**Version**: 1.0

