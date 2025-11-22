/**
 * usePersonas Hook
 *
 * Fetches available AI personas from backend API.
 * Single source of truth - personas are defined in backend YAML files.
 *
 * Architecture:
 * - Backend: /backend/config/personas/*.yaml
 * - API: GET /api/admin/personas
 * - Frontend: This hook (cached)
 *
 * @example
 * const { personas, loading, error } = usePersonas();
 */

import { useState, useEffect } from 'react';

export interface PersonaOption {
  id: string;
  name: string;
  description: string;
  icon?: string; // Optional frontend-only icon mapping
  voice?: string; // Azure TTS voice ID (e.g., "es-MX-DaliaNeural")
}

interface UsePersonasReturn {
  personas: PersonaOption[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

// Icon mapping for personas (frontend only)
const PERSONA_ICON_MAP: Record<string, string> = {
  'general_assistant': 'Stethoscope',
  'soap_editor': 'FileEdit',
  'clinical_advisor': 'Microscope',
  'onboarding_guide': 'Compass',
  'pattern_weaver': 'Network',
  'sovereignty_guide': 'Shield',
  'growth_mirror': 'TrendingUp',
  'honest_limiter': 'Activity',
};

export function usePersonas(): UsePersonasReturn {
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/admin/personas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch personas: ${response.status}`);
      }

      const data = await response.json();

      // Transform backend response to frontend format
      const transformedPersonas: PersonaOption[] = data.personas.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        icon: PERSONA_ICON_MAP[p.id],
        voice: p.voice, // Azure TTS voice from backend
      }));

      setPersonas(transformedPersonas);
    } catch (err) {
      console.error('[usePersonas] Error fetching personas:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // Fallback to empty list on error
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  return {
    personas,
    loading,
    error,
    refetch: fetchPersonas,
  };
}
