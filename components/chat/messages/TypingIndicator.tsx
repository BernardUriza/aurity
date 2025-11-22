'use client';

/**
 * TypingIndicator - Animated typing dots (like Slack/iMessage)
 *
 * Shows bouncing ellipsis to indicate the assistant is typing.
 * Builds anticipation and human connection during chat.
 *
 * Reference: Slack's typing indicator is a simple bouncing ellipsis
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

export interface TypingIndicatorProps {
  /** Is typing active? */
  isTyping: boolean;
  /** Custom label for screen readers */
  ariaLabel?: string;
  /** Dot color */
  dotColor?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// Animation configuration - using direct motion props instead of variants
// to avoid TypeScript issues with custom dynamic variants

const containerVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.15 },
  },
};

// Size configurations
const sizeConfig = {
  sm: { dot: 'w-1.5 h-1.5', gap: 'gap-1', container: 'px-3 py-2' },
  md: { dot: 'w-2 h-2', gap: 'gap-1.5', container: 'px-4 py-3' },
  lg: { dot: 'w-2.5 h-2.5', gap: 'gap-2', container: 'px-5 py-4' },
};

export const TypingIndicator = memo(function TypingIndicator({
  isTyping,
  ariaLabel = 'El asistente está escribiendo...',
  dotColor = 'bg-purple-400',
  size = 'md',
}: TypingIndicatorProps) {
  if (!isTyping) return null;

  const config = sizeConfig[size];

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        inline-flex items-center ${config.gap}
        ${config.container}
        bg-slate-800/60 backdrop-blur-sm
        border border-slate-700/50
        rounded-2xl rounded-tl-sm
      `}
      role="status"
      aria-label={ariaLabel}
    >
      {/* Screen reader text */}
      <span className="sr-only">{ariaLabel}</span>

      {/* Animated dots - using inline animation for proper TypeScript support */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ y: 0 }}
          animate={{
            y: [-2, 2, -2],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'loop',
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
          className={`${config.dot} ${dotColor} rounded-full`}
        />
      ))}
    </motion.div>
  );
});

// ============================================================================
// ALTERNATIVE: Pulse variant (more subtle)
// ============================================================================

export const TypingIndicatorPulse = memo(function TypingIndicatorPulse({
  isTyping,
  ariaLabel = 'El asistente está escribiendo...',
}: Pick<TypingIndicatorProps, 'isTyping' | 'ariaLabel'>) {
  if (!isTyping) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        flex items-center gap-2
        px-4 py-2
        text-sm text-slate-400
      "
      role="status"
      aria-label={ariaLabel}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-2 h-2 bg-purple-500 rounded-full"
      />
      <span>FI está pensando...</span>
    </motion.div>
  );
});
