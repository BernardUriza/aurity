/**
 * Policy API Route
 * Card: FI-UI-FEAT-204
 *
 * Returns effective policy configuration from fi.policy.yaml
 * Read-only endpoint for displaying current policy settings
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export async function GET() {
  try {
    // Read fi.policy.yaml from project root
    const policyPath = path.join(process.cwd(), '..', '..', 'config', 'fi.policy.yaml');

    // Check if file exists
    if (!fs.existsSync(policyPath)) {
      return NextResponse.json(
        { error: 'Policy file not found', path: policyPath },
        { status: 404 }
      );
    }

    // Read and parse YAML
    const policyContent = fs.readFileSync(policyPath, 'utf8');
    const policy = yaml.parse(policyContent);

    // Return policy with metadata
    return NextResponse.json({
      policy,
      metadata: {
        source: 'fi.policy.yaml',
        version: policy.version || '1.0',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error loading policy:', error);
    return NextResponse.json(
      {
        error: 'Failed to load policy',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
