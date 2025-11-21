/**
 * TypeScript Types for Free-Intelligence Assistant API
 *
 * Card: FI-ONBOARD-001
 * Free-Intelligence personality system with tone-based responses
 */

/**
 * FI Tone variants for contextual responses
 * - neutral: Standard informational tone
 * - empathetic: Supportive, understanding tone (for frustration/confusion)
 * - obsessive: Detail-oriented, thorough tone (for deep dives)
 * - sharp: Direct, incisive tone (for advanced users)
 */
export type FITone = 'neutral' | 'empathetic' | 'obsessive' | 'sharp';

/**
 * Onboarding phase context
 */
export type OnboardingPhase =
  | 'welcome'           // Phase 0: Meet FI
  | 'survey'            // Phase 1: Personalization
  | 'glitch'            // Phase 2: Glitch Elegante (error tolerance)
  | 'beta'              // Phase 3: Beta Permanente (continuous learning)
  | 'residencia'        // Phase 4: Residencia (sovereignty)
  | 'patient_setup'     // Phase 5: Patient Setup
  | 'first_consult'     // Phase 6: First Consultation
  | 'export'            // Phase 7: Export Evidence
  | 'complete';         // Phase 8: Pacto Sellado

/**
 * User role for personalization
 */
export type UserRole = 'medico_general' | 'especialista' | 'enfermera' | 'administrador';

/**
 * Clinic type for personalization
 */
export type ClinicType = 'privada' | 'publica' | 'mixta';

/**
 * AI experience level
 */
export type AIExperience = 'ninguna' | 'basica' | 'avanzada';

/**
 * Chat context passed to FI for personalization
 */
export interface FIChatContext {
  /** Current onboarding phase */
  phase?: OnboardingPhase;

  /** User role (from survey) */
  userRole?: UserRole;

  /** Clinic type (from survey) */
  clinicType?: ClinicType;

  /** AI experience level (from survey) */
  aiExperience?: AIExperience;

  /** Consultas per day (from survey) */
  consultasPerDay?: '1-5' | '6-15' | '16-30' | '31+';

  /** Progress percentage (0-100) */
  progress?: number;

  /** Additional metadata */
  [key: string]: any;
}

/**
 * Single message in FI conversation
 */
export interface FIMessage {
  /** Message role (user or assistant) */
  role: 'user' | 'assistant';

  /** Message content */
  content: string;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Optional metadata */
  metadata?: {
    /** FI tone used (assistant only) */
    tone?: FITone;

    /** Onboarding phase */
    phase?: OnboardingPhase;

    /** Message ID for tracking */
    id?: string;

    /** Azure TTS voice for this persona (assistant only) */
    voice?: string;
  };
}

/**
 * Request payload for /api/assistant/chat
 */
export interface FIChatRequest {
  /** User message */
  message: string;

  /** Context for personalization */
  context?: FIChatContext;

  /** Conversation history for continuity */
  conversationHistory?: FIMessage[];
}

/**
 * Response from /api/workflows/aurity/assistant/chat or /introduction
 * (Backend schema - adapted to match existing implementation)
 */
export interface FIChatResponse {
  /** FI response message */
  message: string;

  /** Persona used for response (e.g., "onboarding_guide", "general_assistant") */
  persona: string;

  /** Tokens consumed in this interaction */
  tokens_used: number;

  /** Response latency in milliseconds */
  latency_ms: number;

  /** Azure TTS voice for this persona (optional for backward compatibility) */
  voice?: string;
}

/**
 * Error response from Assistant API
 */
export interface FIErrorResponse {
  /** Error message */
  error: string;

  /** Error code */
  code?: string;

  /** HTTP status code */
  status?: number;

  /** Additional details */
  details?: any;
}

/**
 * Introduction request context
 */
export interface FIIntroductionContext {
  /** User's name (optional) */
  name?: string;

  /** User role (optional) */
  userRole?: UserRole;

  /** Any additional context */
  [key: string]: any;
}
