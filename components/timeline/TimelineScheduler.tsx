'use client';

/**
 * TimelineScheduler Component
 *
 * Bryntum SchedulerPro visualization for the unified timeline.
 * Shows chat and audio events as horizontal bars on a time axis.
 *
 * Features:
 * - Two resource rows: Chat messages, Audio transcriptions
 * - Event coloring by type (chat_user=sky, chat_assistant=violet, transcription=emerald)
 * - Navigate drawer for session filtering and time navigation
 * - Day/Week/Month view presets
 * - Event tooltips with content preview
 *
 * Card: FI-PHIL-DOC-014
 * Created: 2025-11-22
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  PanelLeftOpen,
  PanelLeftClose,
  Search,
  X,
  MessageCircle,
  Mic,
} from 'lucide-react';
import { type UnifiedEvent } from '@/lib/api/unified-timeline';
import { TIMELINE_COLORS } from '@/config/timeline.config';

// ============================================================================
// Types
// ============================================================================

interface TimelineSchedulerProps {
  events: UnifiedEvent[];
  isLoading?: boolean;
  onEventClick?: (event: UnifiedEvent) => void;
  className?: string;
}

type ViewMode = 'day' | 'week' | 'month';

interface ViewPresetConfig {
  id: string;
  label: string;
  icon: typeof CalendarDays;
  preset: object;
  getDateRange: (date: Date) => { start: Date; end: Date };
  navigationUnit: 'day' | 'week' | 'month';
}

const VIEW_PRESETS: Record<ViewMode, ViewPresetConfig> = {
  day: {
    id: 'day',
    label: 'Día',
    icon: CalendarDays,
    preset: {
      base: 'hourAndDay',
      tickWidth: 60,
      headers: [
        { unit: 'day', dateFormat: 'dddd, D MMMM YYYY' },
        { unit: 'hour', dateFormat: 'HH:mm' },
      ],
    },
    getDateRange: (date: Date) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
    navigationUnit: 'day',
  },
  week: {
    id: 'week',
    label: 'Semana',
    icon: CalendarRange,
    preset: {
      base: 'weekAndDay',
      tickWidth: 80,
      headers: [
        { unit: 'week', dateFormat: 'Semana W, MMMM YYYY' },
        { unit: 'day', dateFormat: 'ddd D' },
      ],
    },
    getDateRange: (date: Date) => {
      const start = new Date(date);
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
    navigationUnit: 'week',
  },
  month: {
    id: 'month',
    label: 'Mes',
    icon: LayoutGrid,
    preset: {
      base: 'monthAndYear',
      tickWidth: 40,
      headers: [
        { unit: 'month', dateFormat: 'MMMM YYYY' },
        { unit: 'day', dateFormat: 'D' },
      ],
    },
    getDateRange: (date: Date) => {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    },
    navigationUnit: 'month',
  },
};

// ============================================================================
// Color Mapping
// ============================================================================

function getEventColor(eventType: string): string {
  switch (eventType) {
    case 'chat_user':
      return '#0ea5e9'; // sky-500
    case 'chat_assistant':
      return '#8b5cf6'; // violet-500
    case 'transcription':
      return '#10b981'; // emerald-500
    default:
      return '#64748b'; // slate-500
  }
}

function getResourceForEvent(event: UnifiedEvent): string {
  return event.source === 'chat' ? 'chat' : 'audio';
}

// ============================================================================
// Navigate Drawer Component
// ============================================================================

interface NavigateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: string[];
  selectedSession: string | null;
  onSessionSelect: (session: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  chatCount: number;
  audioCount: number;
}

function NavigateDrawer({
  isOpen,
  onClose,
  sessions,
  selectedSession,
  onSessionSelect,
  searchQuery,
  onSearchChange,
  chatCount,
  audioCount,
}: NavigateDrawerProps) {
  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Navegar</h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-slate-700 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-700/30">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-sky-400" />
            <span className="text-lg font-bold text-sky-400">{chatCount}</span>
          </div>
          <div className="text-xs text-slate-400">Chat</div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-700/30">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-emerald-400" />
            <span className="text-lg font-bold text-emerald-400">{audioCount}</span>
          </div>
          <div className="text-xs text-slate-400">Audio</div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar sesión..."
            className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2">
        <button
          onClick={() => onSessionSelect(null)}
          className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
            selectedSession === null
              ? 'bg-emerald-600 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Todas las sesiones
        </button>

        {filteredSessions.map((session) => (
          <button
            key={session}
            onClick={() => onSessionSelect(session)}
            className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors mt-1 ${
              selectedSession === session
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="font-mono text-xs truncate">{session.slice(0, 16)}...</div>
          </button>
        ))}

        {filteredSessions.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-4">
            No hay sesiones
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TimelineScheduler({
  events,
  isLoading = false,
  onEventClick,
  className = '',
}: TimelineSchedulerProps) {
  const schedulerRef = useRef<HTMLDivElement>(null);
  const schedulerInstanceRef = useRef<unknown>(null);

  const [schedulerReady, setSchedulerReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique sessions from events
  const sessions = useMemo(() => {
    const sessionSet = new Set<string>();
    events.forEach((e) => {
      if (e.session_id) sessionSet.add(e.session_id);
    });
    return Array.from(sessionSet);
  }, [events]);

  // Filter events by selected session
  const filteredEvents = useMemo(() => {
    if (!selectedSession) return events;
    return events.filter((e) => e.session_id === selectedSession);
  }, [events, selectedSession]);

  // Calculate counts
  const chatCount = useMemo(
    () => filteredEvents.filter((e) => e.source === 'chat').length,
    [filteredEvents]
  );
  const audioCount = useMemo(
    () => filteredEvents.filter((e) => e.source === 'audio').length,
    [filteredEvents]
  );

  // Determine initial date from events
  useEffect(() => {
    if (events.length > 0 && !schedulerReady) {
      const latestEvent = events[0];
      const eventDate = new Date(latestEvent.timestamp * 1000);
      setCurrentDate(eventDate);
    }
  }, [events, schedulerReady]);

  // ============================================================================
  // Bryntum Initialization
  // ============================================================================

  const initializeScheduler = useCallback(async () => {
    if (!schedulerRef.current || schedulerInstanceRef.current) return;

    // Load CSS
    const existingLink = document.querySelector('link[href*="schedulerpro.classic-dark.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/css/bryntum/schedulerpro.classic-dark.css';
      document.head.appendChild(link);
    }

    // Load Bryntum module
    return new Promise<void>((resolve, reject) => {
      // Check if already loaded
      // @ts-expect-error - dynamically loaded
      if (window.__BryntumSchedulerPro) {
        // @ts-expect-error - dynamically loaded
        createScheduler(window.__BryntumSchedulerPro);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import { SchedulerPro } from "/js/bryntum/schedulerpro.wc.module.js";
        window.__BryntumSchedulerPro = SchedulerPro;
        window.dispatchEvent(new CustomEvent("bryntum-timeline-loaded"));
      `;

      const handleLoaded = () => {
        window.removeEventListener('bryntum-timeline-loaded', handleLoaded);
        // @ts-expect-error - dynamically loaded
        const SchedulerPro = window.__BryntumSchedulerPro;
        if (SchedulerPro) {
          createScheduler(SchedulerPro);
          resolve();
        } else {
          reject(new Error('Bryntum SchedulerPro not loaded'));
        }
      };

      window.addEventListener('bryntum-timeline-loaded', handleLoaded);
      document.head.appendChild(script);

      setTimeout(() => {
        window.removeEventListener('bryntum-timeline-loaded', handleLoaded);
      }, 10000);
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createScheduler = (SchedulerPro: any) => {
    if (!schedulerRef.current || schedulerInstanceRef.current) return;

    const viewConfig = VIEW_PRESETS[viewMode];
    const { start, end } = viewConfig.getDateRange(currentDate);

    const scheduler = new SchedulerPro({
      appendTo: schedulerRef.current,
      startDate: start,
      endDate: end,
      viewPreset: viewConfig.preset,
      rowHeight: 50,
      barMargin: 4,

      features: {
        eventDrag: false,
        eventResize: false,
        eventEdit: false,
        eventTooltip: {
          template: ({ eventRecord }: { eventRecord: { data: Record<string, unknown> } }) => {
            const content = (eventRecord.data.content as string) || '';
            const preview = content.length > 200 ? content.slice(0, 200) + '...' : content;
            const eventType = eventRecord.data.event_type as string;
            const timestamp = new Date((eventRecord.data.timestamp as number) * 1000);

            return `
              <div class="p-3 max-w-sm">
                <div class="flex items-center gap-2 mb-2">
                  <span class="w-2 h-2 rounded-full" style="background-color: ${getEventColor(eventType)}"></span>
                  <span class="font-medium text-white text-sm">${
                    eventType === 'chat_user' ? 'Usuario' :
                    eventType === 'chat_assistant' ? 'Asistente' : 'Transcripción'
                  }</span>
                </div>
                <div class="text-xs text-slate-400 mb-2">
                  ${timestamp.toLocaleString('es-MX')}
                </div>
                <div class="text-sm text-slate-300 whitespace-pre-wrap">${preview}</div>
                ${eventRecord.data.duration ? `<div class="text-xs text-slate-500 mt-2">Duración: ${(eventRecord.data.duration as number).toFixed(1)}s</div>` : ''}
              </div>
            `;
          },
        },
      },

      columns: [
        {
          type: 'resourceInfo',
          text: 'Fuente',
          width: 120,
          showImage: false,
        },
      ],

      resources: [
        {
          id: 'chat',
          name: '💬 Chat',
          eventColor: '#0ea5e9',
        },
        {
          id: 'audio',
          name: '🎙️ Audio',
          eventColor: '#10b981',
        },
      ],

      events: transformEventsForScheduler(filteredEvents),

      listeners: {
        eventClick: ({ eventRecord }: { eventRecord: { data: { originalEvent?: UnifiedEvent } } }) => {
          if (onEventClick && eventRecord.data.originalEvent) {
            onEventClick(eventRecord.data.originalEvent);
          }
        },
      },
    });

    schedulerInstanceRef.current = scheduler;
    setSchedulerReady(true);
  };

  // Initialize scheduler on mount
  useEffect(() => {
    if (schedulerRef.current && !schedulerInstanceRef.current && !isLoading) {
      initializeScheduler();
    }
  }, [initializeScheduler, isLoading]);

  // Update scheduler data when events change
  useEffect(() => {
    if (schedulerInstanceRef.current && schedulerReady) {
      const scheduler = schedulerInstanceRef.current as {
        eventStore?: { data: unknown[] };
      };
      if (scheduler.eventStore) {
        scheduler.eventStore.data = transformEventsForScheduler(filteredEvents);
      }
    }
  }, [filteredEvents, schedulerReady]);

  // Transform events for Bryntum format
  function transformEventsForScheduler(evts: UnifiedEvent[]) {
    return evts.map((e) => {
      const startDate = new Date(e.timestamp * 1000);
      // Duration: use actual duration for audio, or estimate 30s for chat
      const durationMs = (e.duration || 30) * 1000;
      const endDate = new Date(startDate.getTime() + durationMs);

      return {
        id: e.id,
        resourceId: getResourceForEvent(e),
        startDate,
        endDate,
        name: e.content.slice(0, 50) + (e.content.length > 50 ? '...' : ''),
        eventColor: getEventColor(e.event_type),
        content: e.content,
        event_type: e.event_type,
        timestamp: e.timestamp,
        duration: e.duration,
        originalEvent: e,
      };
    });
  }

  // Navigation handlers
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const viewConfig = VIEW_PRESETS[viewMode];
    const delta = direction === 'next' ? 1 : -1;

    switch (viewConfig.navigationUnit) {
      case 'day':
        newDate.setDate(newDate.getDate() + delta);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + delta * 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + delta);
        break;
    }

    setCurrentDate(newDate);
    updateSchedulerTimeSpan(newDate);
  };

  const updateSchedulerTimeSpan = (date: Date) => {
    const scheduler = schedulerInstanceRef.current as {
      startDate?: Date;
      endDate?: Date;
    } | null;

    if (scheduler) {
      const viewConfig = VIEW_PRESETS[viewMode];
      const { start, end } = viewConfig.getDateRange(date);
      scheduler.startDate = start;
      scheduler.endDate = end;
    }
  };

  const changeViewMode = (newMode: ViewMode) => {
    setViewMode(newMode);

    const scheduler = schedulerInstanceRef.current as {
      startDate?: Date;
      endDate?: Date;
      viewPreset?: object;
    } | null;

    if (scheduler) {
      const viewConfig = VIEW_PRESETS[newMode];
      const { start, end } = viewConfig.getDateRange(currentDate);
      scheduler.viewPreset = viewConfig.preset;
      scheduler.startDate = start;
      scheduler.endDate = end;
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    updateSchedulerTimeSpan(today);
  };

  const getDateDisplayText = (): string => {
    const viewConfig = VIEW_PRESETS[viewMode];

    if (viewMode === 'week') {
      const { start, end } = viewConfig.getDateRange(currentDate);
      const startStr = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
      const endStr = end.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }

    return currentDate.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {/* Navigate Drawer Toggle */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`p-2 rounded-lg transition-colors ${
              drawerOpen
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Navegar"
          >
            {drawerOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>

          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
            {(Object.keys(VIEW_PRESETS) as ViewMode[]).map((mode) => {
              const config = VIEW_PRESETS[mode];
              const Icon = config.icon;
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => changeViewMode(mode)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                  title={config.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => navigateDate('prev')}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs font-medium hover:bg-slate-700 rounded text-slate-300"
          >
            Hoy
          </button>
          <span className="px-2 py-1 text-xs font-medium min-w-[120px] text-center text-slate-200">
            {getDateDisplayText()}
          </span>
          <button
            onClick={() => navigateDate('next')}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Event Legend */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-slate-400">Usuario</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-slate-400">Asistente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Audio</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigate Drawer */}
        <NavigateDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sessions={sessions}
          selectedSession={selectedSession}
          onSessionSelect={setSelectedSession}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          chatCount={chatCount}
          audioCount={audioCount}
        />

        {/* Scheduler Container */}
        <div className="flex-1 relative">
          <div
            ref={schedulerRef}
            className="absolute inset-0"
            style={{ minHeight: '300px' }}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
            </div>
          )}

          {!isLoading && events.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
              <div className="text-center">
                <CalendarDays className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Sin eventos en el período seleccionado</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimelineScheduler;
