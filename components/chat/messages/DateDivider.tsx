'use client';

/**
 * DateDivider - Shows date separators between message groups
 *
 * Displays "Hoy", "Ayer", or formatted date between messages from different days.
 * Similar to WhatsApp/iMessage date dividers.
 *
 * SOLID: Single responsibility - only renders date dividers
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DateDividerType } from '@/hooks/useMessageGroups';

export interface DateDividerProps {
  /** The label to display */
  label: string;
  /** Type of divider for styling */
  type?: DateDividerType;
  /** Show lines on sides */
  showLines?: boolean;
  /** Animate entrance */
  animate?: boolean;
}

export const DateDivider = memo(function DateDivider({
  label,
  type = 'date',
  showLines = true,
  animate = true,
}: DateDividerProps) {
  const content = (
    <div className="flex items-center justify-center gap-3 py-4">
      {/* Left line */}
      {showLines && (
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-slate-700/50" />
      )}

      {/* Date pill */}
      <span
        className={`
          px-3 py-1
          text-xs font-medium
          rounded-full
          ${type === 'today'
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            : type === 'yesterday'
              ? 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
              : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'
          }
        `}
      >
        {label}
      </span>

      {/* Right line */}
      {showLines && (
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-700/50 to-slate-700/50" />
      )}
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  );
});

// ============================================================================
// COMPACT VARIANT (for inline use)
// ============================================================================

export const DateDividerCompact = memo(function DateDividerCompact({
  label,
}: Pick<DateDividerProps, 'label'>) {
  return (
    <div className="flex justify-center py-2">
      <span className="px-2 py-0.5 text-[10px] text-slate-500 bg-slate-800/30 rounded">
        {label}
      </span>
    </div>
  );
});
