import 'dotenv/config';

/**
 * Database seeding script
 * 
 * Note: Actual seeding is done via SQL files:
 * - sql/060_seeds.sql - Configuration data (ceremony types, locations, BABS)
 * - sql/080_validation_seeds.sql - Validation rules
 * 
 * To seed the database, run the SQL files directly:
 * psql $DATABASE_URL -f sql/060_seeds.sql
 * psql $DATABASE_URL -f sql/080_validation_seeds.sql
 */
async function main() {
  console.log('🌱 Database seeding...');
  console.log('ℹ️  Note: Seeding is done via SQL files, not this TypeScript script.');
  console.log('ℹ️  Run: psql $DATABASE_URL -f sql/060_seeds.sql');
  console.log('🎉 Seeding script complete!');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

