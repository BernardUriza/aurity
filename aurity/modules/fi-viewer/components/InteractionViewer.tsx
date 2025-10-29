'use client';

/**
 * FI-VIEWER Module - Main Interaction Viewer Component
 *
 * Features:
 * - Split view (prompt | response)
 * - Markdown rendering with syntax highlighting
 * - Expandable metadata panel
 * - Prev/Next navigation
 * - Copy to clipboard
 * - Export individual interaction
 */

import React, { useState } from 'react';
import type { InteractionViewerProps } from '../types/interaction';
import { MarkdownViewer } from './MarkdownViewer';
import { MetadataPanel } from './MetadataPanel';

export const InteractionViewer: React.FC<InteractionViewerProps> = ({
  interaction,
  showMetadata = true,
  onNavigatePrev,
  onNavigateNext,
  onCopy,
  onExport,
  className = '',
}) => {
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [copied, setCopied] = useState<'prompt' | 'response' | null>(null);

  // Handle copy to clipboard
  const handleCopy = async (content: string, type: 'prompt' | 'response') => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      onCopy?.(content);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Handle export
  const handleExport = () => {
    onExport?.(interaction);
  };

  // Extract metadata
  const metadata = {
    interaction_id: interaction.interaction_id,
    session_id: interaction.session_id,
    thread_id: interaction.thread_id,
    model: interaction.model,
    timestamp: interaction.timestamp,
    tokens: interaction.tokens,
    duration_ms: interaction.duration_ms,
    user_id: interaction.user_id,
    owner_hash: interaction.owner_hash,
  };

  return (
    <div className={`interaction-viewer flex flex-col h-full ${className}`}>
      {/* Navigation header */}
      <div className="viewer-header bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-200">
            Interaction Viewer
          </h2>
          <span className="text-sm text-gray-400 font-mono">
            {interaction.interaction_id.substring(0, 8)}...
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Navigation buttons */}
          {(onNavigatePrev || onNavigateNext) && (
            <div className="flex gap-1 mr-2">
              <button
                onClick={onNavigatePrev}
                disabled={!onNavigatePrev}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
                aria-label="Previous interaction"
              >
                ← Prev
              </button>
              <button
                onClick={onNavigateNext}
                disabled={!onNavigateNext}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
                aria-label="Next interaction"
              >
                Next →
              </button>
            </div>
          )}

          {/* Export button */}
          {onExport && (
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-2"
              aria-label="Export interaction"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="viewer-content flex-1 flex overflow-hidden">
        {/* Split view: Prompt | Response */}
        <div className="split-view flex flex-1">
          {/* Prompt panel */}
          <div className="prompt-panel flex-1 flex flex-col border-r border-gray-700 overflow-hidden">
            <div className="panel-header bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
              <h3 className="font-semibold text-gray-200">Prompt</h3>
              <button
                onClick={() => handleCopy(interaction.prompt, 'prompt')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1"
                aria-label="Copy prompt to clipboard"
              >
                {copied === 'prompt' ? (
                  <>✓ Copied</>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="panel-content flex-1 overflow-y-auto p-4 bg-gray-900">
              <MarkdownViewer content={interaction.prompt} />
            </div>
          </div>

          {/* Response panel */}
          <div className="response-panel flex-1 flex flex-col overflow-hidden">
            <div className="panel-header bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
              <h3 className="font-semibold text-gray-200">Response</h3>
              <button
                onClick={() => handleCopy(interaction.response, 'response')}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1"
                aria-label="Copy response to clipboard"
              >
                {copied === 'response' ? (
                  <>✓ Copied</>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="panel-content flex-1 overflow-y-auto p-4 bg-gray-900">
              <MarkdownViewer content={interaction.response} />
            </div>
          </div>
        </div>

        {/* Metadata sidebar (conditional) */}
        {showMetadata && (
          <div className="metadata-sidebar w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <MetadataPanel
              metadata={metadata}
              isExpanded={isMetadataExpanded}
              onToggle={() => setIsMetadataExpanded(!isMetadataExpanded)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

InteractionViewer.displayName = 'InteractionViewer';
