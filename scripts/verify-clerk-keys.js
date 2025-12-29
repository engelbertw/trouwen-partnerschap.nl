/**
 * Verify Clerk API Keys
 * 
 * This script checks if Clerk keys are correctly configured
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Fallback to .env

console.log('🔍 Clerk Keys Verification\n');

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

// Check if keys exist
if (!publishableKey) {
  console.error('❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is niet ingesteld');
  console.log('\nVoeg toe aan .env of .env.local:');
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...\n');
  process.exit(1);
}

if (!secretKey) {
  console.error('❌ CLERK_SECRET_KEY is niet ingesteld');
  console.log('\nVoeg toe aan .env of .env.local:');
  console.log('CLERK_SECRET_KEY=sk_test_...\n');
  process.exit(1);
}

console.log('✅ Beide keys zijn ingesteld\n');

// Validate key formats
const publishableKeyPattern = /^pk_(test|live)_[a-zA-Z0-9]+$/;
const secretKeyPattern = /^sk_(test|live)_[a-zA-Z0-9]+$/;

if (!publishableKeyPattern.test(publishableKey)) {
  console.error('❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY heeft ongeldig formaat');
  console.log('Verwacht formaat: pk_test_... of pk_live_...\n');
  process.exit(1);
}

if (!secretKeyPattern.test(secretKey)) {
  console.error('❌ CLERK_SECRET_KEY heeft ongeldig formaat');
  console.log('Verwacht formaat: sk_test_... of sk_live_...\n');
  process.exit(1);
}

console.log('✅ Key formaten zijn correct\n');

// Check if keys match (same environment)
const publishableEnv = publishableKey.split('_')[1]; // test or live
const secretEnv = secretKey.split('_')[1]; // test or live

if (publishableEnv !== secretEnv) {
  console.error('❌ Keys komen niet overeen!');
  console.error(`   Publishable key: ${publishableEnv}`);
  console.error(`   Secret key: ${secretEnv}`);
  console.log('\nBeide keys moeten van hetzelfde environment zijn (test of live)\n');
  process.exit(1);
}

console.log(`✅ Keys zijn van hetzelfde environment: ${publishableEnv}\n`);

// Extract instance identifiers (first few chars after env)
const publishableInstance = publishableKey.substring(0, 20);
const secretInstance = secretKey.substring(0, 20);

console.log('📋 Key details:');
console.log(`   Publishable: ${publishableInstance}...`);
console.log(`   Secret: ${secretInstance}...`);
console.log(`   Environment: ${publishableEnv}\n`);

// Check if they're from the same instance (they should start similarly)
// Note: This is a basic check - actual instance matching requires API call
if (publishableKey.split('_')[2]?.substring(0, 5) !== secretKey.split('_')[2]?.substring(0, 5)) {
  console.warn('⚠️  Waarschuwing: Keys lijken van verschillende instances te komen');
  console.warn('   Dit kan de infinite redirect loop veroorzaken!\n');
  console.log('💡 Oplossing:');
  console.log('   1. Ga naar Clerk Dashboard: https://dashboard.clerk.com');
  console.log('   2. Selecteer je applicatie');
  console.log('   3. Ga naar "API Keys"');
  console.log('   4. Kopieer de Publishable Key en Secret Key opnieuw');
  console.log('   5. Zorg dat beide keys van dezelfde applicatie zijn\n');
} else {
  console.log('✅ Keys lijken van dezelfde instance te komen\n');
}

console.log('✅ Verificatie voltooid!\n');
console.log('💡 Als je nog steeds een infinite redirect loop hebt:');
console.log('   1. Stop de development server (Ctrl+C)');
console.log('   2. Verwijder .next folder: rm -rf .next (of Remove-Item -Recurse -Force .next op Windows)');
console.log('   3. Start de server opnieuw: npm run dev\n');

