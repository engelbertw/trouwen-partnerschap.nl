import 'dotenv/config';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import ws from 'ws';

// Configure WebSocket for Node.js environments (not needed in Edge)
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Lazy initialization to avoid errors during build time
// During Next.js build, DATABASE_URL may not be available, so we defer initialization
let _db: NeonDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;

function getDb(): NeonDatabase<typeof schema> {
  // Only check DATABASE_URL when actually needed (at runtime, not build time)
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // Initialize pool and db lazily
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  if (!_db) {
    _db = drizzle(_pool, { schema });
  }

  return _db;
}

// Use Proxy to lazily initialize the database connection
// This ensures the connection is only created when actually used (at runtime)
// and not during Next.js build-time static analysis
export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_target, prop) {
    try {
      const dbInstance = getDb();
      const value = dbInstance[prop as keyof NeonDatabase<typeof schema>];
      // If it's a function, bind it to maintain 'this' context
      if (typeof value === 'function') {
        return value.bind(dbInstance);
      }
      return value;
    } catch (error) {
      // During build, if DATABASE_URL is not set, Next.js may try to analyze the code
      // We need to allow the build to complete, but ensure runtime errors are clear
      // Check if this looks like a build-time error (no DATABASE_URL in build context)
      const isBuildContext =
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.VERCEL === '1' ||
        (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV);

      if (
        error instanceof Error &&
        error.message.includes('DATABASE_URL is not set') &&
        isBuildContext &&
        !process.env.DATABASE_URL
      ) {
        // Return a placeholder function that will throw a helpful error at runtime
        // This allows the build to complete
        if (
          prop === 'select' ||
          prop === 'insert' ||
          prop === 'update' ||
          prop === 'delete' ||
          prop === 'transaction'
        ) {
          return () => {
            throw new Error(
              'DATABASE_URL is not set. Please configure it in your Vercel environment variables.'
            );
          };
        }
        // For other properties, return undefined to allow build to continue
        return undefined;
      }
      // Re-throw other errors
      throw error;
    }
  },
});

