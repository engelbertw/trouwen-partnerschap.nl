import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gemeente } from '@/db/schema';

/**
 * GET /api/aankondiging/test
 * 
 * Test database connection and check if gemeente exists
 */
export async function GET() {
  try {
    // Try to fetch gemeente
    const gemeentes = await db.select().from(gemeente).limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Database verbinding werkt!',
      gemeenteCount: gemeentes.length,
      hasGemeente: gemeentes.length > 0,
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database verbinding mislukt',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

