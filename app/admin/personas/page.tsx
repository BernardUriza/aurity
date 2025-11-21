/**
 * Personas Admin Page
 *
 * Admin panel for managing AI personas (SOAP Editor, Clinical Advisor, etc.)
 * Route: /admin/personas
 */

'use client';

import { useState, useEffect } from 'react';
import { Brain, Plus, Loader2, AlertCircle } from 'lucide-react';
import type { Persona } from '@/types/persona';
import { fetchPersonas } from '@/lib/api/personas';
import { PersonaCard } from '@/components/admin/PersonaCard';
import { PersonaEditor } from '@/components/admin/PersonaEditor';

export default function PersonasAdminPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load personas on mount
  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPersonas();
      setPersonas(data);
    } catch (err) {
      console.error('Failed to load personas:', err);
      setError(
        err instanceof Error ? err.message : 'Error al cargar las personas'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (personaId: string) => {
    setSelectedPersona(personaId);
    setIsEditing(true);
  };

  const handleSave = (updatedPersona: Persona) => {
    // Update persona in list
    setPersonas((prev) =>
      prev.map((p) => (p.id === updatedPersona.id ? updatedPersona : p))
    );
    setIsEditing(false);
    setSelectedPersona(null);
  };

  const handleClose = () => {
    setIsEditing(false);
    setSelectedPersona(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              Gestión de AI Personas
            </h1>
            <p className="text-slate-400 mt-2">
              Configura y optimiza las personas médicas del sistema
            </p>
          </div>
          {/* Placeholder for future "New Persona" button */}
          {/* <button
            onClick={() => {
              // TODO: Create new persona functionality
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Persona
          </button> */}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
            <p className="text-slate-400">Cargando personas...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="p-6 bg-red-950/20 border border-red-800 rounded-lg max-w-md">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-red-300">
                  Error al Cargar Personas
                </h3>
              </div>
              <p className="text-red-200 text-sm">{error}</p>
              <button
                onClick={loadPersonas}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors w-full"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Personas Grid */}
        {!loading && !error && personas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {personas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                isSelected={selectedPersona === persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                onEdit={() => handleEdit(persona.id)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && personas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <Brain className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              No hay personas configuradas
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              Las personas permiten configurar diferentes comportamientos del
              asistente médico.
            </p>
          </div>
        )}

        {/* Editor Panel (Slide-over) */}
        {selectedPersona && isEditing && (
          <PersonaEditor
            personaId={selectedPersona}
            isOpen={isEditing}
            onClose={handleClose}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
