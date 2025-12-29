# Clerk Custom OIDC Configuration for Keycloak/DigiD

Complete guide for integrating Clerk with Keycloak as a Custom OIDC provider for DigiD authentication.

## Prerequisites

- ✅ Clerk **Enterprise plan** (Custom OIDC requires Enterprise)
- ✅ Keycloak configured with DigiD SAML IdP (see `infrastructure/keycloak/`)
- ✅ Keycloak client credentials (Client ID and Secret from `configure-realm.sh`)
- ✅ Production domain with HTTPS

## Architecture Overview

```
User → Clerk Sign-in Button 
     → Keycloak (OIDC Provider) 
     → DigiD (SAML IdP) 
     → Keycloak issues tokens 
     → Clerk creates session 
     → User logged into app
```

## Part 1: Configure Clerk Dashboard

### Step 1: Navigate to Enterprise Connections

1. Go to https://dashboard.clerk.com
2. Select your application: **Huwelijk**
3. Navigate to **Configure** → **Authentication**
4. Scroll to **Enterprise Connections**
5. Click **Add connection**

### Step 2: Select Custom OIDC Provider

1. Choose **Custom OIDC Provider**
2. You'll see a configuration form

### Step 3: Fill in Provider Details

**Display Name** (shown to users):
```
DigiD via Keycloak
```

**Provider Key** (used in code):
```
keycloak-digid
```

**Discovery Endpoint** (from Keycloak):
```
https://auth.huwelijk.nl/realms/nl-huwelijk/.well-known/openid-configuration
```

**Client ID** (from configure-realm.sh output):
```
clerk-huwelijk
```

**Client Secret** (from configure-realm.sh output):
```
<paste secret from configure-realm.sh output>
```

**Scopes** (space-separated):
```
openid profile email
```

### Step 4: Configure Attribute Mapping

Map OIDC claims to Clerk user fields:

| OIDC Claim | Clerk Field | Notes |
|------------|-------------|-------|
| `sub` | `id` | User identifier (required) |
| `given_name` | `first_name` | From DigiD |
| `family_name` | `last_name` | From DigiD |
| `email` | `email_address` | Placeholder (DigiD doesn't provide email) |
| `bsn` | `public_metadata.bsn` | **Sensitive!** Only if legally justified |
| `loa` | `public_metadata.loa` | Authentication level |
| `date_of_birth` | `public_metadata.date_of_birth` | From DigiD |
| `idp` | `public_metadata.identity_provider` | Track which IdP was used |

**In Clerk Dashboard**:

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

### Step 5: Save and Get Redirect URIs

After saving, Clerk will provide redirect URIs like:

```
https://beloved-squirrel-12.clerk.accounts.dev/v1/oauth_callback
https://app.huwelijk.nl/sso-callback
```

**Important**: Copy these URIs - you'll need them in the next step!

### Step 6: Update Keycloak Client with Clerk Redirect URIs

Run this command with your actual Clerk redirect URIs:

```bash
# SSH into your Keycloak server or use docker exec
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

# Update redirect URIs
docker exec -i keycloak-digid /opt/keycloak/bin/kcadm.sh update clients/$CLIENT_UUID \
  -r nl-huwelijk \
  -s 'redirectUris=["https://beloved-squirrel-12.clerk.accounts.dev/v1/oauth_callback","https://app.huwelijk.nl/sso-callback","http://localhost:3000/sso-callback"]'
```

### Step 7: Test the Connection

1. In Clerk Dashboard, find your **DigiD via Keycloak** connection
2. Click **Test** button
3. You should be redirected to Keycloak
4. Keycloak will redirect to DigiD
5. After DigiD authentication, you'll return to Clerk
6. Verify user data is correctly mapped

## Part 2: Integrate in Your Next.js App

### Install Clerk SDK (if not already installed)

```bash
npm install @clerk/nextjs
```

### Configure Environment Variables

Add to `.env.local`:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Keycloak/DigiD
NEXT_PUBLIC_DIGID_PROVIDER_KEY=keycloak-digid
```

### Create DigiD Sign-In Button Component

```typescript
// src/components/auth/DigiDSignInButton.tsx
'use client';

import { useSignIn } from '@clerk/nextjs';
import { Button } from '@utrecht/component-library-react';
import { useState } from 'react';

export function DigiDSignInButton() {
  const { signIn, isLoaded } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    
    setIsLoading(true);
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_keycloak-digid', // matches Provider Key
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (error) {
      console.error('DigiD login error:', error);
      setIsLoading(false);
      // Handle error - show toast notification
    }
  };

  return (
    <Button
      appearance="primary-action-button"
      onClick={handleSignIn}
      disabled={!isLoaded || isLoading}
    >
      {isLoading ? 'Bezig met inloggen...' : 'Inloggen met DigiD'}
    </Button>
  );
}
```

### Create SSO Callback Page

```typescript
// src/app/sso-callback/page.tsx
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
```

### Create Sign-In Page

```typescript
// src/app/sign-in/page.tsx
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

### Protect Routes with Clerk Middleware

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
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
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

### Access User Data in Server Components

```typescript
// src/app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  // Access DigiD data from public_metadata
  const bsn = user?.publicMetadata?.bsn as string | undefined;
  const loa = user?.publicMetadata?.loa as string | undefined;
  const dateOfBirth = user?.publicMetadata?.date_of_birth as string | undefined;
  const idp = user?.publicMetadata?.identity_provider as string | undefined;

  return (
    <main className="container mx-auto p-8">
      <article className="max-w-prose">
        <h1 className="font-serif text-4xl font-bold mb-4">
          Dashboard
        </h1>
        <p className="text-lg mb-8">
          Welkom, {user?.firstName} {user?.lastName}
        </p>

        <dl className="grid grid-cols-1 gap-4">
          {idp && (
            <>
              <dt className="font-bold">Ingelogd via:</dt>
              <dd>{idp === 'digid' ? 'DigiD' : idp}</dd>
            </>
          )}
          
          {loa && (
            <>
              <dt className="font-bold">Betrouwbaarheidsniveau:</dt>
              <dd>{loa}</dd>
            </>
          )}

          {dateOfBirth && (
            <>
              <dt className="font-bold">Geboortedatum:</dt>
              <dd>{new Date(dateOfBirth).toLocaleDateString('nl-NL')}</dd>
            </>
          )}
        </dl>

        {/* NEVER display BSN in UI unless absolutely necessary */}
      </article>
    </main>
  );
}
```

### Access User Data in Client Components

```typescript
// src/components/UserProfile.tsx
'use client';

import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Laden...</div>;
  }

  if (!user) {
    return <div>Niet ingelogd</div>;
  }

  const loa = user.publicMetadata?.loa as string | undefined;

  return (
    <div>
      <h2>Profiel</h2>
      <p>Naam: {user.firstName} {user.lastName}</p>
      {loa && <p>Betrouwbaarheidsniveau: {loa}</p>}
    </div>
  );
}
```

## Part 3: Organization-Based Access (Optional)

If you're using Clerk Organizations for multi-tenant setup:

### Enable DigiD for Organizations

1. In Clerk Dashboard, navigate to **Organizations**
2. Click on your organization or **Organization Settings**
3. Under **Authentication**, enable **DigiD via Keycloak**
4. Configure organization-specific settings

### Organization Sign-In

```typescript
// src/components/auth/OrganizationSignIn.tsx
'use client';

import { useOrganization, useSignIn } from '@clerk/nextjs';

export function OrganizationSignIn() {
  const { organization } = useOrganization();
  const { signIn } = useSignIn();

  const handleSignIn = async () => {
    if (!signIn || !organization) return;

    await signIn.authenticateWithRedirect({
      strategy: 'oauth_keycloak-digid',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: `/organization/${organization.slug}/dashboard`,
    });
  };

  return (
    <button onClick={handleSignIn}>
      Inloggen met DigiD voor {organization?.name}
    </button>
  );
}
```

## Security Considerations

### BSN Handling (CRITICAL)

BSN is **bijzonder persoonsgegeven** (special category personal data) under AVG/GDPR.

**NEVER**:
- Display BSN in UI (unless legally required)
- Log BSN in application logs
- Store BSN in browser localStorage/sessionStorage
- Send BSN to third-party analytics

**ALWAYS**:
- Encrypt BSN at rest in your database
- Implement access controls and audit logging
- Have explicit legal justification for processing BSN
- Obtain user consent where required
- Implement data retention policies

### Example: Safe BSN Storage

```typescript
// src/lib/bsn-encryption.ts (server-side only!)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.BSN_ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encryptBSN(bsn: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(bsn, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptBSN(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Audit Logging

```typescript
// src/lib/audit-log.ts
import { db } from './db';

export async function logBSNAccess(params: {
  userId: string;
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';
  actor: string;
  ipAddress: string;
  purpose: string;
}) {
  await db.bsnAuditLog.create({
    data: {
      ...params,
      timestamp: new Date(),
    },
  });
}
```

## Troubleshooting

### Error: "Unable to authenticate"

**Causes**:
- Discovery endpoint not accessible from Clerk servers
- Client ID/Secret mismatch
- Redirect URIs not configured properly

**Solutions**:
1. Verify discovery endpoint is publicly accessible:
   ```bash
   curl https://auth.huwelijk.nl/realms/nl-huwelijk/.well-known/openid-configuration
   ```
2. Check client credentials in Keycloak admin console
3. Verify redirect URIs match exactly (including protocol)

### Error: "Missing attributes in user object"

**Causes**:
- Attribute mappers not configured in Keycloak
- DigiD not sending expected attributes
- Clerk attribute mapping incorrect

**Solutions**:
1. Test token manually:
   ```bash
   # Get token from Keycloak
   # Decode and inspect claims at jwt.io
   ```
2. Check Keycloak logs for attribute mapping
3. Verify Clerk attribute mapping configuration

### Error: "Redirect URI mismatch"

**Cause**: Redirect URI in Clerk doesn't match Keycloak client configuration

**Solution**:
```bash
# Update Keycloak client
docker exec -i keycloak-digid /opt/keycloak/bin/kcadm.sh update clients/<uuid> \
  -r nl-huwelijk \
  -s 'redirectUris=["<exact-clerk-uri>"]'
```

## Testing Checklist

- [ ] Discovery endpoint accessible publicly
- [ ] Test authentication flow in Clerk Dashboard
- [ ] Verify all attributes are mapped correctly
- [ ] Test in browser (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Test error scenarios (cancelled login, expired session)
- [ ] Test logout flow
- [ ] Verify BSN encryption and audit logging
- [ ] Test with real DigiD account (preprod)
- [ ] Load testing (if expecting high traffic)

## Production Checklist

- [ ] Use production DigiD endpoints (not preprod)
- [ ] Use production Keycloak (HTTPS with valid certificate)
- [ ] Enable HSTS and security headers
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerting
- [ ] Complete DPIA for BSN processing
- [ ] Document legal basis for data processing
- [ ] Implement data retention policies
- [ ] Train staff on AVG/GDPR compliance
- [ ] Set up incident response procedures

## Support

### Clerk Support
- Documentation: https://clerk.com/docs
- Support: https://clerk.com/support
- Community: https://discord.com/invite/clerk

### Keycloak Support
- Documentation: https://www.keycloak.org/documentation
- Community: https://keycloak.discourse.group

### DigiD Support
- Logius: https://www.logius.nl/contact
- Email: digid@logius.nl

---

**Last Updated**: December 26, 2025  
**Maintained By**: Huwelijk Development Team

