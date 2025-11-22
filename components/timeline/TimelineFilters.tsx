'use client';

/**
 * TimelineFilters Component
 *
 * Filter controls for the unified timeline:
 * - Event type tabs (All / Chat / Audio)
 * - Time range presets
 * - Custom date range picker
 *
 * Card: FI-PHIL-DOC-014
 * Created: 2025-11-22
 */

import React from 'react';
import { Filter, MessageCircle, Mic, Clock, Calendar } from 'lucide-react';
import {
  EVENT_TYPES,
  TIMELINE_TIME_RANGES,
  type EventTypeFilter,
  type TimelinePreset,
} from '@/config/timeline.config';

interface TimelineFiltersProps {
  // Current filter state
  eventType: EventTypeFilter;
  selectedPreset: TimelinePreset | null;

  // Counts for badges
  totalCount: number;
  chatCount: number;
  audioCount: number;

  // Callbacks
  onEventTypeChange: (type: EventTypeFilter) => void;
  onPresetChange: (preset: TimelinePreset) => void;
}

export function TimelineFilters({
  eventType,
  selectedPreset,
  totalCount,
  chatCount,
  audioCount,
  onEventTypeChange,
  onPresetChange,
}: TimelineFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Event Type Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-800/50 rounded-lg border border-slate-700 w-fit">
        <button
          onClick={() => onEventTypeChange(EVENT_TYPES.ALL)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            eventType === EVENT_TYPES.ALL
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Filter className="h-4 w-4" />
          Todo ({totalCount})
        </button>

        <button
          onClick={() => onEventTypeChange(EVENT_TYPES.CHAT)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            eventType === EVENT_TYPES.CHAT
              ? 'bg-sky-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Chat ({chatCount})
        </button>

        <button
          onClick={() => onEventTypeChange(EVENT_TYPES.AUDIO)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            eventType === EVENT_TYPES.AUDIO
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Mic className="h-4 w-4" />
          Audio ({audioCount})
        </button>
      </div>

      {/* Time Range Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Clock className="h-4 w-4" />
          <span>Período:</span>
        </div>

        {TIMELINE_TIME_RANGES.PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onPresetChange(preset)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedPreset?.label === preset.label
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 border border-transparent'
            }`}
          >
            {preset.label}
          </button>
        ))}

        {/* Custom Range Button (placeholder for date picker) */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 border border-transparent transition-colors"
          title="Rango personalizado (próximamente)"
        >
          <Calendar className="h-3 w-3" />
          Personalizado
        </button>
      </div>
    </div>
  );
}
