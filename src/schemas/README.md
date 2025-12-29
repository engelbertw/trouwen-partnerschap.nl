# Validation Schemas

This directory contains all **Zod validation schemas** for the ihuwelijk application.

## Purpose

- ✅ **Type-safe validation** of all user input and data mutations
- ✅ **Centralized validation logic** - single source of truth for data rules
- ✅ **TypeScript type inference** - schemas automatically generate types
- ✅ **Reusable across Server Actions** - import and use in any action

## Architecture

```
schemas/
├── dossier.ts      # Dossier creation/update schemas
├── partner.ts      # Partner management schemas
├── ceremonie.ts    # Ceremony configuration schemas
├── getuige.ts      # Witness (getuige) validation schemas
├── index.ts        # Central export point
└── README.md       # This file
```

## Usage Pattern

### 1. Define Schema

```typescript
// schemas/partner.ts
import { z } from 'zod';

export const createPartnerSchema = z.object({
  dossierId: z.string().uuid('Ongeldig dossier ID'),
  voornamen: z.string().min(1, 'Voornamen zijn verplicht'),
  geslachtsnaam: z.string().min(1, 'Geslachtsnaam is verplicht'),
  geboortedatum: z.string().date('Ongeldige datum'),
  email: z.string().email('Ongeldig e-mailadres').optional(),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
```

### 2. Use in Server Action

```typescript
// app/actions/partner.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { createPartnerSchema, type CreatePartnerInput } from '@/schemas/partner';

export async function createPartner(input: CreatePartnerInput) {
  const { userId } = await auth();
  if (!userId) return { error: 'Unauthorized' };

  // Validate
  const validation = createPartnerSchema.safeParse(input);
  if (!validation.success) {
    return { 
      error: 'Validation failed',
      details: validation.error.flatten().fieldErrors,
    };
  }

  const data = validation.data;
  
  // ... rest of implementation
}
```

### 3. Use in Client Component

```typescript
// components/PartnerForm.tsx
'use client';

import { useTransition } from 'react';
import { createPartner } from '@/app/actions/partner';
import type { CreatePartnerInput } from '@/schemas/partner';

export function PartnerForm({ dossierId }: { dossierId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const input: CreatePartnerInput = {
      dossierId,
      voornamen: formData.get('voornamen') as string,
      geslachtsnaam: formData.get('geslachtsnaam') as string,
      geboortedatum: formData.get('geboortedatum') as string,
      email: formData.get('email') as string || undefined,
    };

    startTransition(async () => {
      const result = await createPartner(input);
      // Handle result...
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Schema Files

### `dossier.ts`
Schemas for dossier lifecycle:
- `createDossierSchema` - Create new dossier
- `updateDossierSchema` - Update dossier status/details
- `updateDossierBlockSchema` - Mark blocks as complete

### `partner.ts`
Schemas for partner management:
- `createPartnerSchema` - Add partner to dossier
- `updatePartnerSchema` - Update partner information

### `ceremonie.ts`
Schemas for ceremony configuration:
- `ceremonieWensenSchema` - Ceremony wishes (speech, music, etc.)
- `createCeremonieSchema` - Schedule ceremony
- `updateCeremonieSchema` - Update ceremony details
- `eigenBabsSchema` - Validate own BABS (4 months rule)

### `getuige.ts`
Schemas for witnesses:
- `getuigeSchema` - Single witness validation
- `createGetuigenSchema` - Add 2-4 witnesses
- `addGetuigeSchema` - Add single witness
- `updateGetuigeSchema` - Update witness details
- `deleteGetuigeSchema` - Remove witness (maintain 2-4 rule)

## Validation Patterns

### Required Fields
```typescript
z.string().min(1, 'Dit veld is verplicht')
```

### Optional Fields
```typescript
z.string().email('Ongeldig e-mailadres').optional()
```

### Nullable Fields (database)
```typescript
z.string().optional().nullable()
```

### Enums
```typescript
z.enum(['draft', 'in_review', 'locked'], {
  errorMap: () => ({ message: 'Ongeldige status' }),
})
```

### UUIDs
```typescript
z.string().uuid('Ongeldig ID')
```

### Dates
```typescript
z.string().date('Ongeldige datum')
```

### Regex
```typescript
z.string().regex(/^\d{9}$/, 'BSN moet 9 cijfers zijn')
```

### Arrays
```typescript
z.array(itemSchema)
  .min(2, 'Minimaal 2 items')
  .max(4, 'Maximaal 4 items')
```

### Custom Validation (Refinements)
```typescript
schema.refine(
  (data) => {
    // Custom logic
    return data.field1 === data.field2;
  },
  {
    message: 'Velden komen niet overeen',
    path: ['field2'],
  }
)
```

### Nested Objects
```typescript
z.object({
  parent: z.string(),
  nested: z.object({
    child: z.string(),
  }),
})
```

## Business Rules in Schemas

### BABS 4-Month Rule
```typescript
eigenBabsSchema.refine(
  (data) => {
    const ceremonyDate = new Date(data.ceremonieDatum);
    const swornInDate = new Date(data.beedigd_vanaf);
    const fourMonthsBefore = new Date(ceremonyDate);
    fourMonthsBefore.setMonth(fourMonthsBefore.getMonth() - 4);
    return swornInDate <= fourMonthsBefore;
  },
  {
    message: 'BABS moet minimaal 4 maanden voor de ceremonie beëdigd zijn',
    path: ['beedigd_vanaf'],
  }
)
```

### Future Date Validation
```typescript
createCeremonieSchema.refine(
  (data) => {
    const ceremonyDate = new Date(data.datum);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return ceremonyDate >= today;
  },
  {
    message: 'Ceremonie datum moet in de toekomst liggen',
    path: ['datum'],
  }
)
```

### Witness Count (2-4)
```typescript
z.array(getuigeSchema)
  .min(2, 'Minimaal 2 getuigen zijn verplicht')
  .max(4, 'Maximaal 4 getuigen zijn toegestaan')
```

## Error Handling

Zod provides two validation methods:

### `safeParse()` - Preferred
Returns `{ success: boolean, data?: T, error?: ZodError }`

```typescript
const validation = schema.safeParse(input);
if (!validation.success) {
  return { 
    error: 'Validation failed',
    details: validation.error.flatten().fieldErrors,
  };
}
const data = validation.data; // Type-safe!
```

### `parse()` - Throws
Throws `ZodError` on failure. **Avoid** unless you handle with try/catch.

```typescript
try {
  const data = schema.parse(input); // Throws on error
} catch (error) {
  // Handle ZodError
}
```

## Error Format

### Field Errors
```typescript
validation.error.flatten().fieldErrors
// Returns: { fieldName: ['error message'], ... }
```

### Form Errors
```typescript
validation.error.flatten().formErrors
// Returns: ['global error 1', 'global error 2']
```

### All Issues
```typescript
validation.error.issues
// Returns: [{ path: ['field'], message: 'error', ... }, ...]
```

## Best Practices

1. ✅ **Always use `safeParse()`** instead of `parse()`
2. ✅ **Export both schema and type** for reusability
3. ✅ **Use Dutch error messages** for user-facing text
4. ✅ **Define schemas close to domain logic**
5. ✅ **Reuse base schemas** with `.extend()` or `.pick()`
6. ✅ **Add custom validation** with `.refine()` for complex rules
7. ✅ **Document business rules** in schema comments

## Related Rules

- **data-flow-architecture.mdc** - Server Actions & validation patterns
- **database-drizzle-orm.mdc** - Database types and Drizzle integration
- **authorization-clerk-security.mdc** - Authentication in actions

---

**Last Updated**: 2025-12-26  
**Maintained By**: ihuwelijk development team

