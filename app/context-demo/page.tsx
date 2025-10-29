'use client';

/**
 * Demo Page: /context-demo
 *
 * Demonstrates no_context_loss policy
 * Shows auto-save, recovery, warning modal, and session management
 */

import React, { useState } from 'react';
import { ContextProvider, useFIContext } from '../../aurity/modules/fi-context';

function ContextDemoContent() {
  const {
    currentSession,
    sessions,
    isLoading,
    error,
    createSession,
    resumeSession,
    endSession,
    warnBeforeReset,
    policy,
  } = useFIContext();

  const [interactionCount, setInteractionCount] = useState(0);

  const handleCreateSession = async () => {
    await createSession();
    setInteractionCount(0);
  };

  const handleEndSession = async () => {
    if (currentSession) {
      await endSession(currentSession.session_id, false); // Show warning
    }
  };

  const handleDangerousAction = async () => {
    const confirmed = await warnBeforeReset('clear all data');
    if (confirmed) {
      alert('Action confirmed! (This is just a demo)');
    } else {
      alert('Action cancelled by user');
    }
  };

  const handleSimulateInteraction = () => {
    setInteractionCount((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Recovering session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="context-demo-page min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            No Context Loss Policy Demo
          </h1>
          <p className="text-gray-400">
            Free Intelligence - Una conversación infinita, nunca fragmentada
          </p>
        </div>
      </header>

      {/* Policy Config */}
      <div className="bg-blue-900 bg-opacity-30 border-b border-blue-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-semibold text-blue-400 mb-2">
            Active Policy Configuration
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Auto-save:</span>{' '}
              <span className="font-mono text-green-400">
                {policy.autosave ? 'ON' : 'OFF'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Interval:</span>{' '}
              <span className="font-mono text-gray-200">
                {policy.autosaveInterval}ms
              </span>
            </div>
            <div>
              <span className="text-gray-400">Warn on Reset:</span>{' '}
              <span className="font-mono text-green-400">
                {policy.warnOnReset ? 'ON' : 'OFF'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Warn on Leave:</span>{' '}
              <span className="font-mono text-green-400">
                {policy.warnOnNavigateAway ? 'ON' : 'OFF'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Auto-recover:</span>{' '}
              <span className="font-mono text-green-400">
                {policy.recoverOnLoad ? 'ON' : 'OFF'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Max History:</span>{' '}
              <span className="font-mono text-gray-200">
                {policy.maxSessionHistory}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded p-4 mb-6">
            <p className="text-red-400">Error: {error.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Session */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Current Session</h2>

            {currentSession ? (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Session ID:</span>
                    <span className="font-mono text-gray-200">
                      {currentSession.session_id}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-gray-200">
                      {new Date(currentSession.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last Active:</span>
                    <span className="text-gray-200">
                      {new Date(currentSession.last_active).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Interactions:</span>
                    <span className="font-mono text-green-400">
                      {currentSession.interaction_count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Persisted:</span>
                    <span
                      className={`font-semibold ${
                        currentSession.is_persisted
                          ? 'text-green-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {currentSession.is_persisted ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleSimulateInteraction}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
                  >
                    Simulate Interaction (+1)
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium"
                  >
                    End Session (with Warning)
                  </button>
                  <button
                    onClick={handleDangerousAction}
                    className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded font-medium"
                  >
                    Test Warning Modal
                  </button>
                </div>

                <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded p-3">
                  <p className="text-xs text-blue-300">
                    ℹ️ Session is auto-saved every 5 seconds. Try refreshing the
                    page to test recovery!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No active session</p>
                <button
                  onClick={handleCreateSession}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-medium"
                >
                  Create New Session
                </button>
              </div>
            )}
          </div>

          {/* Session History */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Session History</h2>

            {sessions.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="bg-gray-800 rounded p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-mono text-gray-200">
                        {session.session_id}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(session.created_at).toLocaleString()}
                      </p>
                    </div>
                    {session.session_id !== currentSession?.session_id && (
                      <button
                        onClick={() => resumeSession(session.session_id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No sessions in history</p>
              </div>
            )}
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex gap-3">
              <span className="text-blue-400 font-bold">1.</span>
              <p>
                <strong>Create session</strong> - Click &quot;Create New Session&quot; to start
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-400 font-bold">2.</span>
              <p>
                <strong>Simulate interactions</strong> - Click &quot;Simulate Interaction&quot; to
                add interactions
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-400 font-bold">3.</span>
              <p>
                <strong>Test auto-save</strong> - Wait 5 seconds, check &quot;Persisted: YES&quot;
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-400 font-bold">4.</span>
              <p>
                <strong>Test recovery</strong> - Refresh page (⌘+R), session should restore
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-400 font-bold">5.</span>
              <p>
                <strong>Test warning modal</strong> - Click &quot;End Session&quot; or &quot;Test
                Warning&quot;
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-400 font-bold">6.</span>
              <p>
                <strong>Test navigate away</strong> - Try closing tab, warning should appear
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContextDemoPage() {
  return (
    <ContextProvider
      policy={{
        autosave: true,
        autosaveInterval: 5000,
        warnOnReset: true,
        warnOnNavigateAway: true,
        recoverOnLoad: true,
        maxSessionHistory: 100,
      }}
    >
      <ContextDemoContent />
    </ContextProvider>
  );
}
