/**
 * Personas API Client
 *
 * Functions for managing AI personas (SOAP Editor, Clinical Advisor, etc.)
 */

import type {
  Persona,
  PersonaUpdateRequest,
  PersonaTestRequest,
  PersonaTestResponse,
} from '@/types/persona';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

/**
 * Fetch all personas
 */
export async function fetchPersonas(): Promise<Persona[]> {
  const response = await fetch(`${BACKEND_URL}/api/admin/personas`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch personas: ${response.statusText}`);
  }

  const data = await response.json();
  return data.personas;
}

/**
 * Fetch a specific persona by ID
 */
export async function fetchPersona(personaId: string): Promise<Persona> {
  const response = await fetch(`${BACKEND_URL}/api/admin/personas/${personaId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch persona ${personaId}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update a persona configuration
 */
export async function updatePersona(
  personaId: string,
  updates: PersonaUpdateRequest
): Promise<Persona> {
  const response = await fetch(`${BACKEND_URL}/api/admin/personas/${personaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update persona ${personaId}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Test a persona with sample input
 */
export async function testPersona(
  personaId: string,
  testRequest: PersonaTestRequest
): Promise<PersonaTestResponse> {
  const response = await fetch(`${BACKEND_URL}/api/admin/personas/${personaId}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to test persona ${personaId}: ${response.statusText}`);
  }

  return response.json();
}
