# Clerk Quick Reference - Huwelijk Project

Quick reference for implementing Clerk authentication in the Huwelijk Next.js application.

**Full Documentation**: `.cursor/rules/clerk-nextjs-integration.mdc`

---

## ⚡ Quick Setup (5 Minutes)

### 1. Install

```bash
npm install @clerk/nextjs
```

### 2. Environment Variables

Create `.env`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

### 3. Middleware

Create `src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)']);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect();
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};
```

### 4. Root Layout

Update `src/app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import { nlNL } from '@clerk/localizations';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={nlNL}>
      <html lang="nl">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Done!** Clerk is now integrated. ✅

---

## 🎯 Common Patterns

### Server Component - Check Auth

```typescript
import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  const { userId } = await auth();
  if (!userId) return <div>Niet ingelogd</div>;
  return <div>Welkom!</div>;
}
```

### Server Component - Get User Data

```typescript
import { currentUser } from '@clerk/nextjs/server';

export default async function Page() {
  const user = await currentUser();
  return <div>Hallo, {user?.firstName}</div>;
}
```

### Client Component - Check Auth

```typescript
'use client';
import { useAuth } from '@clerk/nextjs';

export function Component() {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return <div>Laden...</div>;
  if (!userId) return <div>Niet ingelogd</div>;
  return <div>Ingelogd!</div>;
}
```

### Client Component - Get User Data

```typescript
'use client';
import { useUser } from '@clerk/nextjs';

export function Component() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <div>Laden...</div>;
  return <div>Hallo, {user?.firstName}</div>;
}
```

### Protected API Route

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ message: 'Success' });
}
```

---

## 🔧 Pre-Built Components

### Sign In Button

```typescript
import { SignInButton } from '@clerk/nextjs';

<SignInButton mode="modal">
  <button>Inloggen</button>
</SignInButton>
```

### User Button (Profile Menu)

```typescript
import { UserButton } from '@clerk/nextjs';

<UserButton afterSignOutUrl="/" />
```

### Conditional Rendering

```typescript
import { SignedIn, SignedOut } from '@clerk/nextjs';

<SignedOut>
  <SignInButton />
</SignedOut>
<SignedIn>
  <UserButton />
</SignedIn>
```

### Full Sign In Page

```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return <SignIn routing="path" path="/sign-in" />;
}
```

---

## 🇳🇱 Dutch Integration

### Localization

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import { nlNL } from '@clerk/localizations';

<ClerkProvider localization={nlNL}>
  {children}
</ClerkProvider>
```

### Custom Translations

```typescript
const customNl = {
  ...nlNL,
  signIn: {
    ...nlNL.signIn,
    start: {
      title: 'Inloggen bij Huwelijk',
      subtitle: 'om verder te gaan',
    },
  },
};

<ClerkProvider localization={customNl}>
```

---

## 🔐 DigiD Integration

### DigiD Sign-In Button

```typescript
'use client';
import { useSignIn } from '@clerk/nextjs';

export function DigiDSignInButton() {
  const { signIn } = useSignIn();
  
  const handleSignIn = async () => {
    await signIn?.authenticateWithRedirect({
      strategy: 'oauth_keycloak-digid',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  };
  
  return <button onClick={handleSignIn}>Inloggen met DigiD</button>;
}
```

### SSO Callback Page

```typescript
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}
```

**Setup Guide**: See `docs/clerk-oidc-setup.md` for complete DigiD configuration

---

## 🎨 NL Design System Styling

```typescript
<ClerkProvider
  appearance={{
    variables: {
      colorPrimary: '#154273',
      fontFamily: '"Noto Sans", sans-serif',
      fontSize: '1rem',
    },
    elements: {
      card: 'shadow-md',
      formButtonPrimary: 'bg-primary-blue hover:bg-primary-blue-dark',
    },
  }}
>
```

---

## ✅ Correct Imports

### Server Components & API Routes

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
```

### Client Components

```typescript
import { 
  useAuth, 
  useUser, 
  SignInButton, 
  UserButton,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs';
```

### Middleware

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
```

---

## ❌ Common Mistakes

### Wrong: Missing async/await

```typescript
// ❌ WRONG
const { userId } = auth(); 

// ✅ CORRECT
const { userId } = await auth();
```

### Wrong: Using deprecated authMiddleware

```typescript
// ❌ WRONG - Deprecated!
import { authMiddleware } from '@clerk/nextjs';
export default authMiddleware();

// ✅ CORRECT
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware();
```

### Wrong: Using getAuth

```typescript
// ❌ WRONG - Old API
import { getAuth } from '@clerk/nextjs/server';
const { userId } = getAuth(req);

// ✅ CORRECT
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();
```

### Wrong: Pages Router patterns

```typescript
// ❌ WRONG - Pages Router
// pages/_app.tsx
function MyApp({ Component, pageProps }) { ... }

// ✅ CORRECT - App Router
// app/layout.tsx
export default function RootLayout({ children }) { ... }
```

### Wrong: Environment file location

```bash
# ❌ WRONG - Don't use .env.local
# .env.local

# ✅ CORRECT - Use .env
# .env
```

---

## 🧪 Testing

### Mock Clerk in Tests

```typescript
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'user_123' }),
  useAuth: () => ({ isLoaded: true, userId: 'user_123' }),
}));
```

---

## 🚨 Security Checklist

- [ ] `.env.local` not committed (in `.gitignore`)
- [ ] Production keys in secure environment
- [ ] All protected routes using middleware
- [ ] API routes checking `userId`
- [ ] No API keys in code
- [ ] HTTPS enabled in production

---

## 📚 Full Documentation

- **Clerk Integration Rule**: `.cursor/rules/clerk-nextjs-integration.mdc`
- **DigiD Setup**: `docs/clerk-oidc-setup.md`
- **Keycloak Integration**: `.cursor/rules/keycloak-digid-clerk-integration.mdc`
- **Official Docs**: https://clerk.com/docs/quickstarts/nextjs

---

## 🆘 Troubleshooting

### "Can't resolve '@clerk/nextjs'"

```bash
npm install @clerk/nextjs
```

### "auth() is not a function"

```typescript
// Add await
const { userId } = await auth();
```

### "CLERK_SECRET_KEY not found"

Check `.env` exists and contains:
```bash
CLERK_SECRET_KEY=sk_test_...
```

### "Middleware not running"

Verify `middleware.ts` is in correct location:
- With `src/`: `src/middleware.ts`
- Without `src/`: `middleware.ts` (project root)

---

**Last Updated**: December 26, 2025  
**Version**: 1.0  
**Compatible with**: @clerk/nextjs@^5.0.0

