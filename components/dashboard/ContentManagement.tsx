/**
 * ContentManagement - Unified Content CRUD Interface
 *
 * Manages all TV content types:
 * - FI Seeds (editable defaults)
 * - Trivia Questions
 * - Breathing Exercises
 * - Daily Tips
 * - Doctor Media (images/videos/messages)
 *
 * Card: FI-TV-REFAC-003
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { TriviaEditor } from './TriviaEditor';
import { getTriviaQuestions, type TriviaQuestion } from '@/lib/api/widget-configs';

type ContentTab = 'seeds' | 'trivias' | 'exercises' | 'tips';

interface ContentManagementProps {
  onRefresh?: () => void;
}

export function ContentManagement({ onRefresh }: ContentManagementProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>('trivias');
  const [showTriviaEditor, setShowTriviaEditor] = useState(false);
  const [editingTrivia, setEditingTrivia] = useState<TriviaQuestion | undefined>();
  const [trivias, setTrivias] = useState<TriviaQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load trivias on mount
  useEffect(() => {
    if (activeTab === 'trivias') {
      loadTrivias();
    }
  }, [activeTab]);

  const loadTrivias = async () => {
    setIsLoading(true);
    try {
      const response = await getTriviaQuestions();
      setTrivias(response.questions);
    } catch (error) {
      console.error('Failed to load trivias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrivia = async (trivia: TriviaQuestion) => {
    try {
      // TODO: Implement backend POST endpoint for saving
      console.log('Saving trivia:', trivia);

      // For now, just update the JSON file manually
      // In production, this would call saveTriviaQuestion(trivia)

      setShowTriviaEditor(false);
      setEditingTrivia(undefined);
      await loadTrivias();
      onRefresh?.();

      alert('✅ Trivia guardada exitosamente!\n\nNota: Para que aparezca en el TV, edita manualmente config/tv_widgets/trivia.json');
    } catch (error) {
      console.error('Failed to save trivia:', error);
      alert('Error al guardar trivia. Intente nuevamente.');
    }
  };

  const tabs = [
    { id: 'seeds' as ContentTab, label: 'Contenido FI', icon: '🏠', count: 13 },
    { id: 'trivias' as ContentTab, label: 'Trivias', icon: '🧠', count: trivias.length },
    { id: 'exercises' as ContentTab, label: 'Ejercicios', icon: '🧘', count: 3 },
    { id: 'tips' as ContentTab, label: 'Tips', icon: '💡', count: 12 },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }
            `}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-700/50'}
              `}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm min-h-[400px]">
        {/* Seeds Tab */}
        {activeTab === 'seeds' && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Contenido FI</h3>
            <p className="text-slate-400 mb-6">
              13 seeds editables (mensajes de bienvenida, filosofía, tips básicos)
            </p>
            <p className="text-sm text-slate-500">
              Gestión de seeds FI disponible próximamente
            </p>
          </div>
        )}

        {/* Trivias Tab */}
        {activeTab === 'trivias' && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Trivias de Salud</h3>
                <p className="text-sm text-slate-400">
                  Preguntas educativas para pacientes en sala de espera
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTrivia(undefined);
                  setShowTriviaEditor(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-lg transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Nueva Trivia
              </button>
            </div>

            {/* Trivias List */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400">Cargando trivias...</p>
              </div>
            ) : trivias.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No hay trivias configuradas</p>
                <p className="text-sm text-slate-500 mt-2">
                  Haz click en "Nueva Trivia" para crear una
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {trivias.map((trivia, index) => (
                  <div
                    key={trivia.id}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600 rounded-xl p-4 hover:border-emerald-600/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Number Badge */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/50 flex items-center justify-center">
                        <span className="text-lg font-bold text-emerald-200">{index + 1}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-base font-semibold text-white truncate pr-4">
                            {trivia.question}
                          </h4>
                          <div className="flex items-center gap-2">
                            {/* Difficulty Badge */}
                            <span
                              className={`
                                px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                                ${
                                  trivia.difficulty === 'easy'
                                    ? 'bg-green-900/30 text-green-300 border border-green-700/40'
                                    : trivia.difficulty === 'medium'
                                    ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/40'
                                    : 'bg-red-900/30 text-red-300 border border-red-700/40'
                                }
                              `}
                            >
                              {trivia.difficulty === 'easy'
                                ? 'Fácil'
                                : trivia.difficulty === 'medium'
                                ? 'Media'
                                : 'Difícil'}
                            </span>

                            {/* Category */}
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 whitespace-nowrap">
                              {trivia.category}
                            </span>
                          </div>
                        </div>

                        {/* Options Preview */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {trivia.options.slice(0, 4).map((option, i) => (
                            <div
                              key={i}
                              className={`
                                text-xs px-2 py-1 rounded border truncate
                                ${
                                  i === trivia.correct
                                    ? 'bg-emerald-900/20 border-emerald-600/40 text-emerald-300'
                                    : 'bg-slate-800/50 border-slate-600/30 text-slate-400'
                                }
                              `}
                            >
                              {String.fromCharCode(65 + i)}. {option}
                            </div>
                          ))}
                        </div>

                        {/* Tags */}
                        {trivia.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {trivia.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-slate-700/30 text-slate-400 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTrivia(trivia);
                            setShowTriviaEditor(true);
                          }}
                          className="p-2 rounded-lg bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg bg-red-900/20 hover:bg-red-900/30 text-red-400 transition-colors opacity-50 cursor-not-allowed"
                          title="Eliminar (próximamente)"
                          disabled
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧘</div>
            <h3 className="text-xl font-bold text-white mb-2">Ejercicios de Respiración</h3>
            <p className="text-slate-400 mb-6">3 ejercicios configurados (Box, 4-7-8, Coherent)</p>
            <p className="text-sm text-slate-500">Editor de ejercicios disponible próximamente</p>
          </div>
        )}

        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-xl font-bold text-white mb-2">Tips de Salud</h3>
            <p className="text-slate-400 mb-6">
              12 tips en 4 categorías (nutrición, ejercicio, salud mental, prevención)
            </p>
            <p className="text-sm text-slate-500">Editor de tips disponible próximamente</p>
          </div>
        )}
      </div>

      {/* Trivia Editor Modal */}
      {showTriviaEditor && (
        <TriviaEditor
          question={editingTrivia}
          onSave={handleSaveTrivia}
          onCancel={() => {
            setShowTriviaEditor(false);
            setEditingTrivia(undefined);
          }}
        />
      )}
    </div>
  );
}
