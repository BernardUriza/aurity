'use client';

/**
 * Personal History Timeline Page
 *
 * FI-UI-FEAT-004: Modo historia personal
 *
 * Vista interactiva donde el usuario explora:
 * - Mis decisiones
 * - Mis conversaciones
 * - Mi evolución temporal
 */

import React, { useState, useEffect } from 'react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'conversation' | 'decision' | 'milestone';
  title: string;
  summary: string;
  metadata: {
    sessionId?: string;
    tags?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
}

export default function HistoryPage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // Mock data initialization
  useEffect(() => {
    const mockEvents: TimelineEvent[] = [
      {
        id: '1',
        timestamp: '2025-10-29T10:00:00Z',
        type: 'conversation',
        title: 'Consulta sobre arquitectura de sistema',
        summary: 'Discusión sobre diseño event-sourced y políticas append-only',
        metadata: {
          sessionId: 'session_20251029_100000',
          tags: ['arquitectura', 'event-sourcing'],
          sentiment: 'positive',
        },
      },
      {
        id: '2',
        timestamp: '2025-10-28T15:30:00Z',
        type: 'decision',
        title: 'Decisión: Usar HDF5 para storage',
        summary: 'Selección de HDF5 sobre SQLite por append-only y compresión',
        metadata: {
          tags: ['storage', 'decisión-técnica'],
          sentiment: 'positive',
        },
      },
      {
        id: '3',
        timestamp: '2025-10-27T09:15:00Z',
        type: 'milestone',
        title: 'Sprint 1 completado',
        summary: '5/5 cards completadas. Sistema de configuración y logging operativo',
        metadata: {
          tags: ['sprint', 'milestone'],
          sentiment: 'positive',
        },
      },
    ];

    setEvents(mockEvents);
  }, []);

  const filteredEvents = events.filter(event => {
    // Filter by type
    if (filter !== 'all' && event.type !== filter) return false;

    // Filter by search query
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.summary.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by date range
    if (dateRange.start && new Date(event.timestamp) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(event.timestamp) > new Date(dateRange.end)) return false;

    return true;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'conversation': return '💬';
      case 'decision': return '🎯';
      case 'milestone': return '🏆';
      default: return '📌';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-500';
      case 'negative': return 'text-rose-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur border-b bg-slate-900/80 border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                Mi Historia Personal
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Memoria longitudinal · Simetría contextual
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors">
                <span>⇣</span>
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Search */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Búsqueda</h3>
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              />
            </div>

            {/* Filter by Type */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Tipo de Evento</h3>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Todos', icon: '📋' },
                  { value: 'conversation', label: 'Conversaciones', icon: '💬' },
                  { value: 'decision', label: 'Decisiones', icon: '🎯' },
                  { value: 'milestone', label: 'Hitos', icon: '🏆' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      filter === option.value
                        ? 'bg-slate-800 text-slate-100'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Rango de Fechas</h3>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Estadísticas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total eventos</span>
                  <span className="text-slate-300 font-medium">{filteredEvents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Conversaciones</span>
                  <span className="text-slate-300 font-medium">
                    {events.filter(e => e.type === 'conversation').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Decisiones</span>
                  <span className="text-slate-300 font-medium">
                    {events.filter(e => e.type === 'decision').length}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Timeline */}
          <main className="lg:col-span-9">
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-12 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">🔍</span>
                  </div>
                  <p className="text-slate-400">No se encontraron eventos</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </div>
              ) : (
                filteredEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-6 hover:ring-white/10 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center text-xl">
                          {getEventIcon(event.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-semibold text-slate-100 mb-1">
                              {event.title}
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                              {event.summary}
                            </p>
                          </div>
                          <span className={`text-2xl ${getSentimentColor(event.metadata.sentiment)}`}>
                            {event.metadata.sentiment === 'positive' ? '✓' :
                             event.metadata.sentiment === 'negative' ? '✗' : '—'}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-slate-500">
                            {new Date(event.timestamp).toLocaleString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {event.metadata.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-800/60 text-xs text-slate-400 ring-1 ring-slate-700"
                            >
                              {tag}
                            </span>
                          ))}

                          {event.metadata.sessionId && (
                            <button className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                              Ver sesión →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
