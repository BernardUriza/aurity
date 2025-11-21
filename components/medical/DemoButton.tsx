/**
 * DemoButton Component
 *
 * Button to play/pause/resume demo audio consultation.
 *
 * Features:
 * - Play/Pause/Resume states with icons
 * - Visual feedback (color changes)
 * - Disabled state during processing
 *
 * Extracted from ConversationCapture (Phase 7)
 */

interface DemoButtonProps {
  isDemoPlaying: boolean;
  isDemoPaused: boolean;
  isProcessing: boolean;
  onToggle: () => void;
}

export function DemoButton({
  isDemoPlaying,
  isDemoPaused,
  isProcessing,
  onToggle,
}: DemoButtonProps) {
  return (
    <div className="absolute top-0 left-0 z-10">
      <button
        onClick={onToggle}
        disabled={isProcessing}
        className={`
          ${isDemoPlaying && !isDemoPaused
            ? 'bg-purple-500'
            : isDemoPaused
            ? 'bg-amber-600 hover:bg-amber-700'
            : 'bg-purple-600 hover:bg-purple-700'
          }
          text-white font-semibold
          px-4 py-2 rounded-lg shadow-lg
          transition-all duration-200
          flex items-center gap-2
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
        `}
        title={
          isDemoPaused
            ? 'Continuar reproducción'
            : isDemoPlaying
            ? 'Pausar demo'
            : 'Reproducir consulta de demostración'
        }
      >
        {isDemoPaused ? (
          <>
            {/* Resume icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            <span className="text-sm">Continuar</span>
          </>
        ) : isDemoPlaying ? (
          <>
            {/* Pause icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
            </svg>
            <span className="text-sm">Pausar</span>
          </>
        ) : (
          <>
            {/* Play icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            <span className="text-sm">Demo</span>
          </>
        )}
      </button>
    </div>
  );
}
