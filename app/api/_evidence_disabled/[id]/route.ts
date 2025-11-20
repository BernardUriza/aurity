/**
 * Evidence Pack API Endpoint
 * GET /api/evidence/[id]
 *
 * Serves Evidence Pack JSON files from export/evidence/
 * FI-DATA-RES-021: Evidence Packs Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Required for static export (Next.js 16 with output: 'export')
// Note: dynamicParams not compatible with static export
export const dynamic = 'force-static';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packId = params.id;

    // Path to evidence pack JSON file
    // In production, this would be relative to project root
    const filePath = join(process.cwd(), '..', '..', 'export', 'evidence', `${packId}.json`);

    // Read the JSON file
    const fileContent = await readFile(filePath, 'utf-8');
    const evidencePack = JSON.parse(fileContent);

    return NextResponse.json(evidencePack, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error loading evidence pack:', error);

    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Evidence pack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to load evidence pack' },
      { status: 500 }
    );
  }
}
