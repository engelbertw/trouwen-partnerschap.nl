#!/usr/bin/env node

/**
 * Deploy ihuwelijk Database to Neon
 * 
 * This script executes all SQL migration files in order to create
 * the complete database schema in Neon Postgres.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config();

const SQL_FILES = [
  '000_schema.sql',
  '010_enums_lookups.sql',
  '015_gemeente_table.sql',            // Multi-tenancy: Gemeente master table (FIRST)
  '020_core_tables.sql',                // Core tables (dossier, partner, etc.)
  '030_payment_communication.sql',      // Payment, communication, etc.
  '016_add_gemeente_oin_to_tables.sql', // Multi-tenancy: Add gemeente_oin (AFTER all tables exist)
  '017_gemeente_immutability.sql',      // Multi-tenancy: Immutability triggers
  '040_triggers_functions.sql',
  '050_views.sql',
  '060_seeds.sql',
];

const sqlDir = path.join(__dirname, '..', 'sql');

async function deployDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('  Deploying ihuwelijk Database to Neon');
  console.log('='.repeat(60) + '\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('\nPlease add to .env file:');
    console.error('DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL found');
  console.log(`✓ Deploying ${SQL_FILES.length} SQL files\n`);

  // Create client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Neon uses SSL
    },
  });

  try {
    // Connect
    console.log('🔌 Connecting to Neon...');
    await client.connect();
    console.log('✓ Connected successfully\n');

    // Execute each SQL file
    for (let i = 0; i < SQL_FILES.length; i++) {
      const fileName = SQL_FILES[i];
      const filePath = path.join(sqlDir, fileName);
      
      console.log(`📄 [${i + 1}/${SQL_FILES.length}] Running ${fileName}...`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }

      let sql = fs.readFileSync(filePath, 'utf-8');
      
      // Remove psql-specific commands that pg client doesn't support
      sql = sql.split('\n')
        .filter(line => !line.trim().startsWith('\\echo'))
        .filter(line => !line.trim().startsWith('\\'))
        .join('\n');
      
      try {
        await client.query(sql);
        console.log(`✅ ${fileName} completed\n`);
      } catch (error) {
        console.error(`❌ Error in ${fileName}:`);
        console.error(error.message);
        console.error('\nFull error:', error);
        process.exit(1);
      }
    }

    // Verification
    console.log('='.repeat(60));
    console.log('  Verification');
    console.log('='.repeat(60) + '\n');

    // Count tables
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'ihw'
    `);
    console.log(`✓ Tables created: ${tablesResult.rows[0].count}`);

    // Count ceremony types
    const ceremonyResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM ihw.type_ceremonie
    `);
    console.log(`✓ Ceremony types: ${ceremonyResult.rows[0].count}`);

    // Count locations
    const locationResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM ihw.locatie
    `);
    console.log(`✓ Locations: ${locationResult.rows[0].count}`);

    // Count BABS
    const babsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM ihw.babs
    `);
    console.log(`✓ BABS: ${babsResult.rows[0].count}`);

    // Count time slots
    const slotsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM ihw.tijdslot
    `);
    console.log(`✓ Time slots: ${slotsResult.rows[0].count}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Deployment completed successfully!');
    console.log('='.repeat(60) + '\n');

    console.log('Next steps:');
    console.log('  1. Review database in Neon Console');
    console.log('  2. Run verification queries (see sql/README.md)');
    console.log('  3. Test connection from your Next.js app');
    console.log('');

  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run deployment
deployDatabase().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

