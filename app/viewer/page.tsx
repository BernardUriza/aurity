'use client';

/**
 * Demo Page: /viewer
 *
 * Interactive demonstration of the InteractionViewer component
 * Shows live integration with Free Intelligence backend
 */

import React, { useState } from 'react';
import { InteractionViewer } from '../../aurity/modules/fi-viewer';
import { useInteractions } from '../../aurity/modules/fi-viewer/hooks/useInteractions';

export default function ViewerDemoPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [autoFetch, setAutoFetch] = useState(false);

  const {
    currentInteraction,
    currentIndex,
    interactions,
    loading,
    error,
    hasNext,
    hasPrev,
    navigateNext,
    navigatePrev,
    refresh,
  } = useInteractions({
    sessionId: sessionId || undefined,
    autoFetch,
  });

  const handleExport = (interaction: any) => {
    // Export as JSON
    const json = JSON.stringify(interaction, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interaction-${interaction.interaction_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (content: string) => {
    console.log('Copied to clipboard:', content.substring(0, 50) + '...');
  };

  return (
    <div className="viewer-demo-page min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            InteractionViewer Demo
          </h1>
          <p className="text-gray-400">
            Free Intelligence - Resident, Persistent AI Memory
          </p>
        </div>
      </header>

      {/* Controls */}
      <div className="controls bg-gray-900 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <input
            type="text"
            placeholder="Session ID (optional)"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => setAutoFetch(!autoFetch)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium"
          >
            {autoFetch ? 'Stop Fetching' : 'Start Fetching'}
          </button>
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="status bg-gray-900 border-b border-gray-700 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              Total: <span className="text-white font-mono">{interactions.length}</span>
            </span>
            <span className="text-gray-400">
              Current: <span className="text-white font-mono">{currentIndex + 1}</span>
            </span>
          </div>
          {error && (
            <span className="text-red-400">
              Error: {error.message}
            </span>
          )}
        </div>
      </div>

      {/* Main Viewer */}
      <main className="viewer-container h-[calc(100vh-240px)]">
        {loading && !currentInteraction && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading interactions...</p>
            </div>
          </div>
        )}

        {error && !currentInteraction && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2">Error Loading Interactions</h2>
              <p className="text-gray-400 mb-4">{error.message}</p>
              <p className="text-sm text-gray-500">
                Make sure the backend is running on port 7000, or development mode will show mock data.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && interactions.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-gray-600 text-6xl mb-4">📭</div>
              <h2 className="text-xl font-semibold mb-2">No Interactions Found</h2>
              <p className="text-gray-400 mb-4">
                {sessionId
                  ? `No interactions found for session: ${sessionId}`
                  : 'Click "Start Fetching" to load interactions'}
              </p>
            </div>
          </div>
        )}

        {currentInteraction && (
          <InteractionViewer
            interaction={currentInteraction}
            showMetadata={true}
            onNavigatePrev={hasPrev ? navigatePrev : undefined}
            onNavigateNext={hasNext ? navigateNext : undefined}
            onCopy={handleCopy}
            onExport={handleExport}
            className="h-full"
          />
        )}
      </main>
    </div>
  );
}
