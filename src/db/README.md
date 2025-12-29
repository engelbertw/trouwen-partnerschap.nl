# Database Setup - Drizzle ORM + Neon Postgres

This directory contains the database configuration using Drizzle ORM with Neon Postgres.

## 📁 Structure

```
src/db/
├── schema.ts    # Database schema definitions (tables, columns)
├── index.ts     # Database connection and Drizzle instance
├── seed.ts      # Seeding script for development data
└── README.md    # This file
```

## 🚀 Quick Start

### 1. Add Database Connection String

Open your `.env` file and add your Neon connection string:

```bash
# Neon Postgres Database
DATABASE_URL=postgresql://username:password@your-neon-host.neon.tech/dbname?sslmode=require
```

**Get your connection string from Neon:**
1. Go to https://console.neon.tech
2. Select your project
3. Go to Dashboard → Connection Details
4. Copy the connection string

### 2. Push Schema to Database

```bash
# Push schema changes directly to database (recommended for development)
npm run db:push
```

This will create all tables defined in `schema.ts` in your Neon database.

### 3. (Optional) Generate Migrations

For production, you might want to generate migration files:

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

### 4. (Optional) Seed the Database

```bash
npm run db:seed
```

## 📊 Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema changes directly to database (no migration files) |
| `npm run db:generate` | Generate SQL migration files from schema |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:studio` | Open Drizzle Studio (visual database browser) |
| `npm run db:seed` | Run seed script to populate database with test data |

## 🗄️ Using the Database

### In Server Components (Next.js App Router)

```typescript
import { db } from '@/db';
import { usersTable } from '@/db/schema';

export default async function UsersPage() {
  const users = await db.select().from(usersTable);
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### In API Routes

```typescript
// src/app/api/users/route.ts
import { db } from '@/db';
import { usersTable } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await db.select().from(usersTable);
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const newUser = await db
    .insert(usersTable)
    .values(body)
    .returning();
    
  return NextResponse.json(newUser[0]);
}
```

### With Server Actions

```typescript
// src/app/actions/users.ts
'use server';

import { db } from '@/db';
import { usersTable } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const age = parseInt(formData.get('age') as string);

  await db.insert(usersTable).values({
    name,
    email,
    age,
  });

  revalidatePath('/users');
}
```

## 🏗️ Schema Design

### Example Tables for Wedding App

```typescript
// src/db/schema.ts
import { integer, pgTable, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';

// Guests table
export const guestsTable = pgTable('guests', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 20 }),
  plusOne: boolean('plus_one').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RSVP table
export const rsvpTable = pgTable('rsvp', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  guestId: integer('guest_id').references(() => guestsTable.id).notNull(),
  attending: boolean().notNull(),
  dietaryRestrictions: text('dietary_restrictions'),
  songRequest: varchar('song_request', { length: 255 }),
  notes: text(),
  respondedAt: timestamp('responded_at').defaultNow().notNull(),
});
```

## 🔍 Drizzle Studio

Drizzle Studio is a visual database browser:

```bash
npm run db:studio
```

This will open a browser at http://local.drizzle.studio where you can:
- Browse all tables
- View and edit data
- Run queries
- Manage relationships

## 📚 Resources

- **Drizzle ORM Docs**: https://orm.drizzle.team
- **Neon Docs**: https://neon.tech/docs
- **Drizzle + Neon Guide**: https://orm.drizzle.team/docs/get-started/neon-new

## 🔐 Security Notes

- ✅ DATABASE_URL is in `.env` (not committed to git)
- ✅ Connection uses SSL (`sslmode=require`)
- ✅ Use environment variables for all sensitive data
- ✅ Never commit `.env` file

## 🐛 Troubleshooting

### "DATABASE_URL is not set"
- Make sure `.env` file exists in project root
- Verify `DATABASE_URL` is set correctly
- Restart your dev server after adding environment variables

### "relation does not exist"
- Run `npm run db:push` to create tables
- Or run `npm run db:migrate` if using migrations

### "connect ECONNREFUSED"
- Check your Neon connection string is correct
- Verify your Neon database is running
- Check network/firewall settings

---

**Ready to use!** 🚀 Add your DATABASE_URL to `.env` and run `npm run db:push` to get started.

