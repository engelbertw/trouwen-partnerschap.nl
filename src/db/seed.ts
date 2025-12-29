import 'dotenv/config';
import { db } from './index';
import { usersTable } from './schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test user
  const user: typeof usersTable.$inferInsert = {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com',
  };

  await db.insert(usersTable).values(user);
  console.log('✅ New user created!');

  // Get all users
  const users = await db.select().from(usersTable);
  console.log('📋 All users:', users);

  // Update user
  await db
    .update(usersTable)
    .set({ age: 31 })
    .where(eq(usersTable.email, user.email));
  console.log('✅ User info updated!');

  // Delete user
  await db.delete(usersTable).where(eq(usersTable.email, user.email));
  console.log('✅ User deleted!');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

