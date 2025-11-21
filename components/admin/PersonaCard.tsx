/**
 * PersonaCard Component
 *
 * Displays a persona in grid view with stats and edit button.
 */

'use client';

import { Brain, Edit } from 'lucide-react';
import type { Persona } from '@/types/persona';
import { PERSONA_COLORS } from '@/types/persona';

interface PersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
}

export function PersonaCard({ persona, isSelected, onClick, onEdit }: PersonaCardProps) {
  const color = PERSONA_COLORS[persona.id as keyof typeof PERSONA_COLORS] || 'slate';

  // Format last updated date
  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div
      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? `border-${color}-500 bg-${color}-950/30 shadow-lg shadow-${color}-900/20`
          : `border-${color}-700/30 bg-${color}-950/10 hover:border-${color}-600 hover:bg-${color}-950/20`
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${color}-900 border border-${color}-700`}>
            <Brain className={`w-6 h-6 text-${color}-400`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{persona.name}</h3>
            <p className="text-xs text-slate-400">v{persona.version}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 rounded hover:bg-slate-700 transition-colors"
          aria-label="Editar persona"
        >
          <Edit className="w-4 h-4 text-slate-400 hover:text-white" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 mb-4 line-clamp-2 min-h-[2.5rem]">
        {persona.description}
      </p>

      {/* Config Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
          <div className="text-xs text-slate-500">Model</div>
          <div className="text-sm font-mono text-white truncate" title={persona.model}>
            {persona.model}
          </div>
        </div>
        <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
          <div className="text-xs text-slate-500">Voice</div>
          <div className="text-sm font-mono text-white capitalize" title={persona.voice || 'No configurada'}>
            {persona.voice || 'N/A'}
          </div>
        </div>
        <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
          <div className="text-xs text-slate-500">Temperature</div>
          <div className="text-sm font-mono text-white">{persona.temperature.toFixed(2)}</div>
        </div>
        <div className="p-2 bg-slate-800/50 rounded border border-slate-700">
          <div className="text-xs text-slate-500">Max Tokens</div>
          <div className="text-sm font-mono text-white">{persona.max_tokens.toLocaleString()}</div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Invocaciones</span>
          <span className="font-semibold text-white">
            {persona.usage_stats.total_invocations.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-slate-500">Latencia Promedio</span>
          <span className="font-semibold text-white">
            {persona.usage_stats.avg_latency_ms > 0
              ? `${persona.usage_stats.avg_latency_ms.toFixed(0)}ms`
              : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-slate-500">Costo Promedio</span>
          <span className="font-semibold text-white">
            {persona.usage_stats.avg_cost_usd > 0
              ? `$${persona.usage_stats.avg_cost_usd.toFixed(4)}`
              : 'N/A'}
          </span>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
        Actualizado: {formatDate(persona.last_updated)} por {persona.updated_by}
      </div>
    </div>
  );
}
