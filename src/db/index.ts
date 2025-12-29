import 'dotenv/config';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import ws from 'ws';

// Configure WebSocket for Node.js environments (not needed in Edge)
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

