'use client';

/**
 * FI-VIEWER Module - Metadata Panel Component
 *
 * Expandable sidebar showing interaction metadata
 * Displays: thread_id, user_id, model, timestamps, tokens, duration
 */

import React from 'react';
import type { MetadataPanelProps } from '../types/interaction';

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  metadata,
  isExpanded,
  onToggle,
  className = '',
}) => {
  // Format timestamp to readable format
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return isoString;
    }
  };

  // Format duration to human readable
  const formatDuration = (ms?: number): string => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`metadata-panel ${className}`}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="metadata-toggle w-full p-4 bg-gray-800 hover:bg-gray-700 flex items-center justify-between transition-colors"
        aria-expanded={isExpanded}
        aria-label="Toggle metadata panel"
      >
        <span className="font-semibold text-gray-200">Metadata</span>
        <svg
          className={`w-5 h-5 transform transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Metadata content */}
      {isExpanded && (
        <div className="metadata-content bg-gray-800 p-4 space-y-3 border-t border-gray-700">
          <MetadataRow label="Interaction ID" value={metadata.interaction_id} mono />
          <MetadataRow label="Session ID" value={metadata.session_id} mono />
          {metadata.thread_id && (
            <MetadataRow label="Thread ID" value={metadata.thread_id} mono />
          )}
          <MetadataRow label="Model" value={metadata.model} />
          <MetadataRow
            label="Timestamp"
            value={formatTimestamp(metadata.timestamp)}
          />
          {metadata.tokens !== undefined && (
            <MetadataRow label="Tokens" value={metadata.tokens.toString()} />
          )}
          {metadata.duration_ms !== undefined && (
            <MetadataRow
              label="Duration"
              value={formatDuration(metadata.duration_ms)}
            />
          )}
          {metadata.user_id && (
            <MetadataRow label="User ID" value={metadata.user_id} mono />
          )}
          {metadata.owner_hash && (
            <MetadataRow
              label="Owner Hash"
              value={`${metadata.owner_hash.substring(0, 16)}...`}
              mono
            />
          )}
        </div>
      )}
    </div>
  );
};

MetadataPanel.displayName = 'MetadataPanel';

// Helper component for metadata rows
interface MetadataRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

const MetadataRow: React.FC<MetadataRowProps> = ({ label, value, mono }) => {
  return (
    <div className="metadata-row">
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-gray-200 ${mono ? 'font-mono' : ''} break-all`}
      >
        {value}
      </dd>
    </div>
  );
};
