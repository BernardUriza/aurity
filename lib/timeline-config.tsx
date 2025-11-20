/**
 * Timeline Event Configuration
 *
 * Unified configuration for medical events + audio chunks
 * Supports: transcription, diarization, SOAP notes, audio playback, STT provider info
 */

import React from 'react';
import { Clock, Play, Pause, Zap, Radio, FileAudio, ChevronDown, ChevronUp } from 'lucide-react';
import type { TimelineConfig, TimelineEvent } from '@/components/audit/EventTimeline';

export const timelineEventConfig: TimelineConfig = {
  title: 'Session Events',
  emptyMessage: 'No hay eventos de transcripción disponibles',
  showSearch: true,
  showExport: true,
  maxHeight: 'max-h-[700px]',

  // Format timestamp (8:41:36 PM style)
  formatTimestamp: (timestamp: string | number): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  },

  // Color scheme for event types
  getColors: (event: TimelineEvent) => {
    const type = event.type.toLowerCase();

    if (type === 'transcription') {
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500',
      };
    }

    if (type === 'diarization') {
      return {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        badge: 'bg-purple-500',
      };
    }

    if (type === 'soap') {
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        badge: 'bg-blue-500',
      };
    }

    return {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      badge: 'bg-slate-500',
    };
  },

  // Custom header with event number + audio controls + expand/collapse
  renderHeader: (event, isExpanded, toggleExpanded, actions) => {
    const colors = timelineEventConfig.getColors!(event);
    const eventNumber = event.metadata?.event_number || event.metadata?.chunk_number || '?';
    const sttProvider = event.metadata?.stt_provider || event.metadata?.provider;
    const duration = event.metadata?.duration;
    const confidence = event.metadata?.confidence;
    const isPlaying = actions?.playingId === event.id;

    // Status badge logic
    const hasTranscript = event.content.trim().length > 0;
    const hasDuration = duration && duration > 0;
    let statusBadge = null;

    if (hasTranscript && hasDuration) {
      statusBadge = (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
          ✓ Valid
        </span>
      );
    } else if (hasDuration) {
      statusBadge = (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          ⚠ Empty
        </span>
      );
    } else if (event.type.toLowerCase() === 'transcription') {
      statusBadge = (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
          ✗ Invalid
        </span>
      );
    }

    return (
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Event Number */}
          <div className="text-slate-500 font-mono text-sm">#{eventNumber}</div>

          {/* Event Type Badge */}
          <div className={`px-3 py-1 rounded-md ${colors.bg} border ${colors.border}`}>
            <span className={`text-sm font-semibold ${colors.text}`}>
              {event.type}
            </span>
          </div>

          {/* Status Badge (for transcription events) */}
          {statusBadge}

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded-md">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-xs font-mono text-slate-400">
              {timelineEventConfig.formatTimestamp!(event.timestamp)}
            </span>
          </div>

          {/* STT Provider (if available) */}
          {sttProvider && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-950/30 border border-blue-800 rounded-md">
              <Radio className="h-3 w-3 text-blue-400" />
              <span className="text-xs font-mono text-blue-300">
                {sttProvider === 'azure_whisper' ? 'Azure Whisper' :
                 sttProvider === 'deepgram' ? 'Deepgram' : sttProvider}
              </span>
            </div>
          )}

          {/* Duration (if available) */}
          {duration && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded-md">
              <FileAudio className="h-3 w-3 text-slate-400" />
              <span className="text-xs font-mono text-slate-400">
                {duration.toFixed(1)}s
              </span>
            </div>
          )}

          {/* Confidence (if available) */}
          {confidence !== undefined && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
              confidence > 0.8 ? 'bg-emerald-950/30 border-emerald-800' :
              confidence > 0.6 ? 'bg-amber-950/30 border-amber-800' :
              'bg-red-950/30 border-red-800'
            }`}>
              <Zap className={`h-3 w-3 ${
                confidence > 0.8 ? 'text-emerald-400' :
                confidence > 0.6 ? 'text-amber-400' :
                'text-red-400'
              }`} />
              <span className={`text-xs font-mono ${
                confidence > 0.8 ? 'text-emerald-300' :
                confidence > 0.6 ? 'text-amber-300' :
                'text-red-300'
              }`}>
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Play/Pause Button (if audio available) */}
          {event.metadata?.audio_hash && actions?.onPlay && (
            <button
              onClick={() => actions.onPlay!(event)}
              className={`p-1.5 rounded-lg transition-all ${
                isPlaying
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Expand/Collapse Button */}
          <button
            onClick={toggleExpanded}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
            aria-label={isExpanded ? 'Contraer' : 'Expandir'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    );
  },

  // Custom content rendering with preview + technical details
  renderContent: (event: TimelineEvent, isExpanded: boolean) => {
    const preview = event.content.substring(0, 100);
    const hasMore = event.content.length > 100;

    // Technical details (for audio chunks)
    const hasAudioData = event.metadata?.audio_hash || event.metadata?.latency_ms;
    const audioHash = event.metadata?.audio_hash;
    const latencyMs = event.metadata?.latency_ms;
    const language = event.metadata?.language;
    const audioQuality = event.metadata?.audio_quality;

    return (
      <div className="space-y-2">
        {/* Main text (always visible) */}
        <p className="text-white font-medium leading-relaxed">
          {isExpanded ? event.content : preview}
          {!isExpanded && hasMore && '...'}
        </p>

        {/* Technical Details (when expanded and available) */}
        {isExpanded && hasAudioData && (
          <div className="pt-3 mt-3 border-t border-slate-700/50 space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Technical Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {language && (
                <div className="flex items-center justify-between px-2 py-1 bg-slate-800/50 rounded">
                  <span className="text-slate-500">Language:</span>
                  <span className="text-slate-300 font-mono">{language}</span>
                </div>
              )}
              {latencyMs !== undefined && (
                <div className="flex items-center justify-between px-2 py-1 bg-slate-800/50 rounded">
                  <span className="text-slate-500">Latency:</span>
                  <span className="text-slate-300 font-mono">{latencyMs}ms</span>
                </div>
              )}
              {audioQuality && (
                <div className="flex items-center justify-between px-2 py-1 bg-slate-800/50 rounded">
                  <span className="text-slate-500">Quality:</span>
                  <span className="text-slate-300 font-mono">{audioQuality}</span>
                </div>
              )}
              {audioHash && (
                <div className="flex items-center justify-between px-2 py-1 bg-slate-800/50 rounded col-span-2">
                  <span className="text-slate-500">Hash:</span>
                  <span className="text-slate-300 font-mono text-[10px]">
                    {audioHash.substring(0, 16)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },

  // Custom footer with tags
  renderFooter: (event: TimelineEvent) => {
    const who = event.metadata?.who || 'system';
    const tags = event.metadata?.tags || [];

    return (
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">by</span>
        <span className="px-2 py-0.5 bg-slate-700/30 rounded text-xs text-slate-400 font-mono">
          {who}
        </span>
        {tags.map((tag: string) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-slate-700/30 rounded text-xs text-slate-400"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  },

  // Export to Markdown
  formatExport: (events: TimelineEvent[]): string => {
    const header = `# Session Timeline Export\n\nGenerated: ${new Date().toISOString()}\nTotal Events: ${events.length}\n\n---\n\n`;

    const body = events
      .map((event, idx) => {
        const timestamp = timelineEventConfig.formatTimestamp!(event.timestamp);
        return `## Event #${idx + 1} - ${event.type}\n**Time:** ${timestamp}\n**Content:** ${event.content}\n\n`;
      })
      .join('\n');

    return header + body;
  },

  // Search filter
  searchFilter: (event: TimelineEvent, query: string): boolean => {
    return (
      event.content.toLowerCase().includes(query) ||
      event.type.toLowerCase().includes(query) ||
      (event.metadata?.who && event.metadata.who.toLowerCase().includes(query)) ||
      (event.metadata?.tags &&
        event.metadata.tags.some((tag: string) => tag.toLowerCase().includes(query)))
    );
  },

  // Audio playback action
  actions: {
    onPlay: (event: TimelineEvent) => {
      // Get audio hash from metadata
      const audioHash = event.metadata?.audio_hash;
      const chunkNumber = event.metadata?.event_number || event.metadata?.chunk_number;

      if (!audioHash) {
        console.warn('[Timeline] No audio hash found for event', event.id);
        return;
      }

      // TODO(human): Implement audio playback
      // For now, just log
      console.log('[Timeline] Playing audio for event', event.id, {
        audioHash,
        chunkNumber,
      });
    },
  },
};
