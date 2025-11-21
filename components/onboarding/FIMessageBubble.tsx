/**
 * FIMessageBubble Component
 *
 * Card: FI-ONBOARD-002
 * Displays Free-Intelligence messages with persona-based styling
 * Enhanced with smart timestamps and tooltips
 */

import type { FIMessage } from '@/types/assistant';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Stethoscope, FileEdit, Microscope, Compass, Network, Shield, TrendingUp, Activity, type LucideIcon } from 'lucide-react';
import { MessageTimestamp } from '@/components/chat/MessageTimestamp';
import { CopyButton, SpeakButton } from '@/components/chat/MessageActions';
import type { TimestampConfig } from '@/config/chat.config';
import { usePersonas } from '@/hooks/usePersonas';

/**
 * Persona-based styling configuration
 * Maps backend personas to VISUAL themes ONLY
 *
 * NOTE: Labels are no longer hardcoded here.
 * Persona names come from backend dynamically.
 */
const PERSONA_STYLES = {
  // Onboarding Guide - Sovereignty theme (emerald)
  onboarding_guide: {
    border: 'border-emerald-600/60',
    bg: 'bg-emerald-950/20',
    glow: 'shadow-emerald-500/10',
    Icon: Compass,
    labelColor: 'text-emerald-300',
  },

  // General Assistant - Neutral theme (slate)
  general_assistant: {
    border: 'border-slate-600/60',
    bg: 'bg-slate-900/20',
    glow: 'shadow-slate-500/10',
    Icon: Stethoscope,
    labelColor: 'text-slate-300',
  },

  // Clinical Advisor - Evidence-based theme (blue)
  clinical_advisor: {
    border: 'border-blue-600/60',
    bg: 'bg-blue-950/20',
    glow: 'shadow-blue-500/10',
    Icon: Microscope,
    labelColor: 'text-blue-300',
  },

  // SOAP Editor - Precision theme (cyan)
  soap_editor: {
    border: 'border-cyan-600/60',
    bg: 'bg-cyan-950/20',
    glow: 'shadow-cyan-500/10',
    Icon: FileEdit,
    labelColor: 'text-cyan-300',
  },

  // Waiting Room Host - Welcoming theme (purple)
  waiting_room_host: {
    border: 'border-purple-600/60',
    bg: 'bg-purple-950/20',
    glow: 'shadow-purple-500/10',
    Icon: Compass,
    labelColor: 'text-purple-300',
  },

  // ==== PHILOSOPHICAL PERSONAS (Free Intelligence Core Principles) ====

  // Pattern Weaver - Memory archaeology theme (violet)
  pattern_weaver: {
    border: 'border-violet-600/60',
    bg: 'bg-violet-950/20',
    glow: 'shadow-violet-500/10',
    Icon: Network,
    labelColor: 'text-violet-300',
  },

  // Sovereignty Guide - Data sovereignty theme (amber)
  sovereignty_guide: {
    border: 'border-amber-600/60',
    bg: 'bg-amber-950/20',
    glow: 'shadow-amber-500/10',
    Icon: Shield,
    labelColor: 'text-amber-300',
  },

  // Growth Mirror - Symbiotic development theme (rose)
  growth_mirror: {
    border: 'border-rose-600/60',
    bg: 'bg-rose-950/20',
    glow: 'shadow-rose-500/10',
    Icon: TrendingUp,
    labelColor: 'text-rose-300',
  },

  // Honest Limiter - Anti-oracle theme (orange)
  honest_limiter: {
    border: 'border-orange-600/60',
    bg: 'bg-orange-950/20',
    glow: 'shadow-orange-500/10',
    Icon: Activity,
    labelColor: 'text-orange-300',
  },
} as const;

/**
 * Fallback style for unknown personas
 */
const FALLBACK_STYLE = {
  border: 'border-slate-600/60',
  bg: 'bg-slate-900/20',
  glow: 'shadow-slate-500/10',
  Icon: Stethoscope,
  labelColor: 'text-slate-300',
};

/**
 * Generate label from persona name (backend format → display format)
 * Examples:
 *   "General Assistant" → "FREE-INTELLIGENCE"
 *   "SOAP Editor" → "FREE-INTELLIGENCE · SOAP EDITOR"
 *   "Honest Limiter" → "FI · HONEST LIMITER"
 */
function generatePersonaLabel(personaName: string | undefined): string {
  if (!personaName) return 'FREE-INTELLIGENCE';

  // Philosophical personas use short "FI" prefix
  const philosophicalPersonas = ['Pattern Weaver', 'Sovereignty Guide', 'Growth Mirror', 'Honest Limiter'];
  const isPhilosophical = philosophicalPersonas.includes(personaName);

  if (personaName === 'General Assistant') {
    return 'FREE-INTELLIGENCE';
  }

  const prefix = isPhilosophical ? 'FI' : 'FREE-INTELLIGENCE';
  const suffix = personaName.toUpperCase();

  return `${prefix} · ${suffix}`;
}

export interface FIMessageBubbleProps {
  /** Message to display */
  message: FIMessage;

  /** Show timestamp */
  showTimestamp?: boolean;

  /** Timestamp configuration */
  timestampConfig?: Partial<TimestampConfig>;

  /** Animate entrance */
  animate?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Message bubble for Free-Intelligence responses
 *
 * Features:
 * - Persona-based visual styling
 * - Neo-minimalist glassmorphism design
 * - Smooth entrance animations
 * - Accessible markup
 *
 * @example
 * ```tsx
 * <FIMessageBubble
 *   message={{
 *     role: 'assistant',
 *     content: 'Hola, soy Free-Intelligence...',
 *     timestamp: '2025-11-18T12:00:00Z',
 *     metadata: { tone: 'onboarding_guide', phase: 'welcome' }
 *   }}
 *   showTimestamp
 *   animate
 * />
 * ```
 */
export function FIMessageBubble({
  message,
  showTimestamp = true,
  timestampConfig,
  animate = true,
  className = '',
}: FIMessageBubbleProps) {
  // Get persona from metadata (fallback to general_assistant)
  const persona = message.metadata?.tone || 'general_assistant';

  // Fetch personas to get real names from backend
  const { personas } = usePersonas();

  // Get style for persona (with fallback)
  const style = PERSONA_STYLES[persona as keyof typeof PERSONA_STYLES] || FALLBACK_STYLE;

  // Get persona name from backend (single source of truth)
  const personaData = personas.find(p => p.id === persona);
  const personaLabel = generatePersonaLabel(personaData?.name);

  return (
    <div
      className={`
        flex items-start gap-3
        ${animate ? 'animate-fade-in-up' : ''}
        ${className}
      `}
      role="article"
      aria-label="Free-Intelligence message"
    >
      {/* Message Bubble */}
      <div
        className={`
          relative group
          flex-1 max-w-[85%]
          p-4 rounded-2xl rounded-tl-sm
          border ${style.border}
          ${style.bg}
          backdrop-blur-xl
          shadow-lg ${style.glow}
          transition-all duration-300
          hover:shadow-xl
        `}
      >
        {/* Header: Label + Icon + Timestamp + Actions */}
        <div className="flex items-center gap-2 mb-3 justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold tracking-wide ${style.labelColor}`}>
              {personaLabel}
            </span>
            <style.Icon
              className={`w-3.5 h-3.5 ${style.labelColor}`}
              aria-label={`Persona: ${personaData?.name || persona}`}
            />
            {showTimestamp && (
              <MessageTimestamp
                timestamp={message.timestamp}
                config={timestampConfig}
                position="inline"
                size="xs"
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <CopyButton content={message.content} size="sm" />
            <SpeakButton content={message.content} size="sm" voice={message.metadata?.voice} />
          </div>
        </div>

        {/* Message Content */}
        <div className="text-sm text-slate-200 leading-relaxed prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Headings with gradients
              h1: ({ children }) => (
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mt-4 mb-3 leading-tight">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-300 to-emerald-100 bg-clip-text text-transparent mt-4 mb-2 leading-tight">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold text-emerald-200/90 mt-3 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60"></span>
                  {children}
                </h3>
              ),

              // Text formatting with enhanced styles
              strong: ({ children }) => (
                <strong className="font-bold text-white bg-gradient-to-r from-slate-100 to-slate-50 bg-clip-text text-transparent">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-slate-300 not-italic font-medium">
                  {children}
                </em>
              ),
              code: ({ children }) => (
                <code className="px-2 py-0.5 bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/20 rounded-md text-emerald-300 font-mono text-xs shadow-sm">
                  {children}
                </code>
              ),

              // Links with hover glow
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/50 hover:decoration-cyan-400 underline-offset-2 transition-all duration-200 hover:shadow-sm hover:shadow-cyan-500/20"
                >
                  {children} ↗
                </a>
              ),

              // Lists with custom bullets
              ul: ({ children }) => (
                <ul className="list-none space-y-1.5 my-3">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-none space-y-1.5 my-3 counter-reset-[item]">
                  {children}
                </ol>
              ),
              li: ({ children }) => {
                // Check if this is a checkbox item (GitHub Flavored Markdown)
                const content = String(children);
                if (content.includes('[ ]')) {
                  return (
                    <li className="flex items-start gap-2 text-slate-200">
                      <span className="flex-shrink-0 w-4 h-4 mt-0.5 border-2 border-slate-500/60 rounded" />
                      <span>{content.replace('[ ]', '').trim()}</span>
                    </li>
                  );
                }
                if (content.includes('[x]') || content.includes('[X]')) {
                  return (
                    <li className="flex items-start gap-2 text-slate-200">
                      <span className="flex-shrink-0 w-4 h-4 mt-0.5 bg-emerald-500/20 border-2 border-emerald-500/60 rounded flex items-center justify-center">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span>{content.replace(/\[x\]|\[X\]/i, '').trim()}</span>
                    </li>
                  );
                }
                // Regular bullet
                return (
                  <li className="flex items-start gap-2 text-slate-200 group">
                    <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 group-hover:shadow-sm group-hover:shadow-emerald-400/50 transition-shadow" />
                    <span className="flex-1">{children}</span>
                  </li>
                );
              },

              // Paragraphs with better spacing
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 text-slate-200/95 leading-relaxed">
                  {children}
                </p>
              ),

              // Code blocks with enhanced styling
              pre: ({ children }) => (
                <pre className="bg-gradient-to-br from-slate-950/80 to-slate-900/80 backdrop-blur-sm p-4 rounded-xl overflow-x-auto my-3 border border-emerald-500/10 shadow-lg shadow-emerald-500/5 font-mono text-xs leading-relaxed">
                  {children}
                </pre>
              ),

              // Horizontal rule with gradient
              hr: () => (
                <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              ),

              // Blockquote with accent
              blockquote: ({ children }) => (
                <blockquote className="relative border-l-4 border-emerald-500/50 pl-4 pr-4 py-2 my-3 italic text-slate-300/90 bg-emerald-950/10 rounded-r-lg">
                  <div className="absolute -left-2 top-2 w-4 h-4 bg-emerald-500/20 rounded-full blur-sm"></div>
                  {children}
                </blockquote>
              ),

              // Tables (GitHub Flavored Markdown)
              table: ({ children }) => (
                <div className="overflow-x-auto my-3">
                  <table className="min-w-full border border-slate-700/50 rounded-lg overflow-hidden">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-800/60">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-slate-700/30">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-slate-800/20 transition-colors">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-2 text-left text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2 text-sm text-slate-300">
                  {children}
                </td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Phase Badge (optional) */}
        {message.metadata?.phase && (
          <div className="mt-3 pt-3 border-t border-slate-700/30">
            <span className="text-xs text-slate-400/60 font-medium">
              Phase: {message.metadata.phase}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}


/**
 * Animation keyframes (add to global CSS or Tailwind config)
 *
 * @keyframes fade-in-up {
 *   from {
 *     opacity: 0;
 *     transform: translateY(10px);
 *   }
 *   to {
 *     opacity: 1;
 *     transform: translateY(0);
 *   }
 * }
 *
 * .animate-fade-in-up {
 *   animation: fade-in-up 0.4s ease-out;
 * }
 */
