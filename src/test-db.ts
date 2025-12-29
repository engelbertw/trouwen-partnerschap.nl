import 'dotenv/config';
import { db } from './db';
import { dossier, typeCeremonie, locatie, babs } from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔍 Testing Drizzle ORM connection to Neon...\n');

  try {
    // Test 1: Get ceremony types
    console.log('📋 Fetching ceremony types...');
    const ceremonyTypes = await db.select().from(typeCeremonie);
    console.log(`✓ Found ${ceremonyTypes.length} ceremony types:`);
    ceremonyTypes.forEach((type) => {
      console.log(`  - ${type.naam} (${type.code}): ${type.openstellingWeken} weeks`);
    });

    // Test 2: Get locations
    console.log('\n📍 Fetching locations...');
    const locations = await db.select().from(locatie).where(eq(locatie.actief, true));
    console.log(`✓ Found ${locations.length} active locations:`);
    locations.slice(0, 5).forEach((loc) => {
      console.log(`  - ${loc.naam} (${loc.type})`);
    });

    // Test 3: Get BABS
    console.log('\n👥 Fetching BABS...');
    const babsList = await db.select().from(babs).where(eq(babs.actief, true));
    console.log(`✓ Found ${babsList.length} active BABS:`);
    babsList.forEach((b) => {
      console.log(`  - ${b.naam} (${b.status})`);
    });

    // Test 4: Get dossiers
    console.log('\n📄 Fetching dossiers...');
    const dossiers = await db.select().from(dossier);
    console.log(`✓ Found ${dossiers.length} dossiers`);
    if (dossiers.length > 0) {
      console.log('  First dossier:', {
        id: dossiers[0].id,
        status: dossiers[0].status,
        createdAt: dossiers[0].createdAt,
      });
    }

    console.log('\n✅ Database connection successful!');
    console.log('\n🎉 Drizzle ORM is configured and working with Neon!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

