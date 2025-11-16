/**
 * Diarization Segments Viewer
 *
 * Displays diarization results with timestamps, speaker labels, and improved text.
 *
 * Features:
 * - Timeline view with speaker color coding (MEDICO=blue, PACIENTE=green)
 * - Timestamp navigation (MM:SS format)
 * - Improved text display (Azure GPT-4 enhancements)
 * - Confidence indicators
 * - Audio playback sync (optional)
 * - Compact/Expanded views
 *
 * Created: 2025-11-15
 * Author: Bernard Uriza Orozco
 */

'use client';

import { useState } from 'react';
import { Clock, User, Zap, ChevronDown, ChevronUp } from 'lucide-react';

export interface DiarizationSegment {
  speaker: 'MEDICO' | 'PACIENTE' | string;
  text: string;
  start_time: number; // seconds
  end_time: number; // seconds
  confidence?: number; // 0-1
  improved_text?: string; // GPT-4 enhanced version
}

interface DiarizationSegmentsViewerProps {
  segments: DiarizationSegment[];
  audioUrl?: string | null;
  onTimestampClick?: (time: number) => void;
  compact?: boolean;
  className?: string;
}

export function DiarizationSegmentsViewer({
  segments,
  audioUrl,
  onTimestampClick,
  compact = false,
  className = '',
}: DiarizationSegmentsViewerProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());
  const [currentTime, setCurrentTime] = useState(0);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get speaker color
  const getSpeakerColor = (speaker: string) => {
    if (speaker === 'MEDICO') {
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        badge: 'bg-blue-500',
      };
    }
    if (speaker === 'PACIENTE') {
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500',
      };
    }
    return {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      badge: 'bg-slate-500',
    };
  };

  // Toggle segment expansion
  const toggleSegment = (index: number) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSegments(newExpanded);
  };

  // Handle timestamp click
  const handleTimestampClick = (time: number) => {
    setCurrentTime(time);
    if (onTimestampClick) {
      onTimestampClick(time);
    }
  };

  if (!segments || segments.length === 0) {
    return (
      <div className={`bg-slate-800 rounded-xl p-6 border border-slate-700 ${className}`}>
        <p className="text-slate-400 text-center">
          No hay segmentos de diarización disponibles
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-xl p-6 border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Diarización Completada</h3>
            <p className="text-sm text-slate-400">
              {segments.length} segmentos identificados
            </p>
          </div>
        </div>

        {/* Speaker Legend */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-md">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-blue-400 font-medium">MÉDICO</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-emerald-400 font-medium">PACIENTE</span>
          </div>
        </div>
      </div>

      {/* Audio Player (if available) */}
      {audioUrl && (
        <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <audio
            controls
            className="w-full"
            src={audioUrl}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          >
            Tu navegador no soporta reproducción de audio.
          </audio>
          <p className="text-xs text-slate-500 mt-2">
            💡 Haz clic en los timestamps para navegar al momento exacto
          </p>
        </div>
      )}

      {/* Segments Timeline */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {segments.map((segment, index) => {
          const colors = getSpeakerColor(segment.speaker);
          const isExpanded = expandedSegments.has(index);
          const hasImprovedText = segment.improved_text && segment.improved_text !== segment.text;
          const duration = segment.end_time - segment.start_time;

          return (
            <div
              key={index}
              className={`rounded-lg border transition-all ${colors.bg} ${colors.border} ${
                currentTime >= segment.start_time && currentTime <= segment.end_time
                  ? 'ring-2 ring-purple-500/50'
                  : ''
              }`}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Speaker Badge */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${colors.bg} border ${colors.border}`}
                    >
                      <div className={`w-2 h-2 ${colors.badge} rounded-full`}></div>
                      <span className={`text-sm font-semibold ${colors.text}`}>
                        {segment.speaker}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <button
                      onClick={() => handleTimestampClick(segment.start_time)}
                      className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-md transition-colors group"
                      title="Ir a este momento"
                    >
                      <Clock className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
                      <span className="text-xs font-mono text-slate-400 group-hover:text-white">
                        {formatTime(segment.start_time)} → {formatTime(segment.end_time)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">
                        ({duration.toFixed(1)}s)
                      </span>
                    </button>
                  </div>

                  {/* Confidence & Expand */}
                  <div className="flex items-center gap-2">
                    {segment.confidence !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/30 rounded-md">
                        <Zap className="h-3 w-3 text-yellow-400" />
                        <span className="text-xs text-slate-400">
                          {Math.round(segment.confidence * 100)}%
                        </span>
                      </div>
                    )}

                    {hasImprovedText && (
                      <button
                        onClick={() => toggleSegment(index)}
                        className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                  {/* Original Text (always shown) */}
                  {!hasImprovedText && (
                    <p className="text-slate-300 leading-relaxed">{segment.text}</p>
                  )}

                  {/* Improved Text (shown by default if available) */}
                  {hasImprovedText && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-xs font-medium text-purple-400">
                            Texto mejorado (GPT-4)
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed font-medium">
                          {segment.improved_text}
                        </p>
                      </div>

                      {/* Original text (collapsible) */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-700/50">
                          <span className="text-xs text-slate-500 mb-1 block">
                            Texto original:
                          </span>
                          <p className="text-slate-400 text-sm leading-relaxed italic">
                            {segment.text}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{segments.length}</div>
            <div className="text-xs text-slate-400">Segmentos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {segments.filter((s) => s.speaker === 'MEDICO').length}
            </div>
            <div className="text-xs text-slate-400">Médico</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {segments.filter((s) => s.speaker === 'PACIENTE').length}
            </div>
            <div className="text-xs text-slate-400">Paciente</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom scrollbar styles (add to globals.css)
/*
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgb(30 41 59 / 0.5);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(100 116 139);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}
*/
