/**
 * /t21 Layout - T21-specific routing with enhanced accessibility
 * All routes under /t21/* get T21 UI pack + audio guide support
 */

'use client';

export default function T21Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="t21-layout">
      {/* T21 Global Styles */}
      <style jsx global>{`
        .t21-layout {
          /* Reduced motion for accessibility */
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }

          /* High contrast support */
          @media (prefers-contrast: more) {
            button {
              border-width: 5px !important;
            }
            .text-lg {
              font-size: 1.375rem;
            }
            .text-xl {
              font-size: 1.5rem;
            }
            .text-2xl {
              font-size: 1.75rem;
            }
          }

          /* Focus visible for keyboard navigation */
          button:focus-visible,
          a:focus-visible {
            outline: 4px solid #fff;
            outline-offset: 4px;
          }
        }
      `}</style>

      {/* Content */}
      {children}
    </div>
  );
}
