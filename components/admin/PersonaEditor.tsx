/**
 * PersonaEditor Component
 *
 * Slide-over panel for editing persona configurations with tabs:
 * - Configuración: Basic settings, model, temperature
 * - System Prompt: Edit system prompt
 * - Examples: Manage few-shot examples
 * - Probar: Test persona with sample input
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  Save,
  Settings,
  FileText,
  List,
  Zap,
  Plus,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import type { Persona, PersonaUpdateRequest, PersonaExample } from '@/types/persona';
import { LLM_MODELS } from '@/types/persona';
import { fetchPersona, updatePersona, testPersona } from '@/lib/api/personas';

interface PersonaEditorProps {
  personaId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: Persona) => void;
}

type TabValue = 'config' | 'prompt' | 'examples' | 'test';

export function PersonaEditor({ personaId, isOpen, onClose, onSave }: PersonaEditorProps) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('config');

  // Test tab state
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Load persona data
  useEffect(() => {
    if (isOpen && personaId) {
      loadPersona();
    }
  }, [isOpen, personaId]);

  const loadPersona = async () => {
    try {
      setLoading(true);
      const data = await fetchPersona(personaId);
      setPersona(data);
    } catch (error) {
      console.error('Failed to load persona:', error);
      alert('Error al cargar la persona');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!persona) return;

    try {
      setSaving(true);

      const updates: PersonaUpdateRequest = {
        name: persona.name,
        description: persona.description,
        system_prompt: persona.system_prompt,
        model: persona.model,
        temperature: persona.temperature,
        max_tokens: persona.max_tokens,
        examples: persona.examples,
      };

      const updated = await updatePersona(personaId, updates);
      onSave(updated);
      onClose();
    } catch (error) {
      console.error('Failed to save persona:', error);
      alert('Error al guardar la persona');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;

    try {
      setTesting(true);
      const result = await testPersona(personaId, { input: testInput });
      setTestResult(result);
    } catch (error) {
      console.error('Failed to test persona:', error);
      alert('Error al probar la persona');
    } finally {
      setTesting(false);
    }
  };

  const addExample = () => {
    if (!persona) return;
    setPersona({
      ...persona,
      examples: [
        ...persona.examples,
        { input: '', output: '' },
      ],
    });
  };

  const removeExample = (index: number) => {
    if (!persona) return;
    setPersona({
      ...persona,
      examples: persona.examples.filter((_, i) => i !== index),
    });
  };

  const updateExample = (index: number, field: 'input' | 'output', value: string) => {
    if (!persona) return;
    const newExamples = [...persona.examples];
    newExamples[index] = {
      ...newExamples[index],
      [field]: value,
    };
    setPersona({
      ...persona,
      examples: newExamples,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 flex max-w-5xl">
        <div className="relative w-screen max-w-5xl">
          <div className="flex h-full flex-col bg-slate-900 shadow-2xl">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : persona ? (
              <>
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Brain className="w-7 h-7 text-purple-400" />
                        Editar Persona: {persona.name}
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Versión {persona.version} · Última actualización:{' '}
                        {new Date(persona.last_updated).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Guardar Cambios
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mt-6">
                    {[
                      { value: 'config' as const, label: 'Configuración', icon: Settings },
                      { value: 'prompt' as const, label: 'System Prompt', icon: FileText },
                      { value: 'examples' as const, label: 'Examples', icon: List },
                      { value: 'test' as const, label: 'Probar', icon: Zap },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          activeTab === tab.value
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  {/* Config Tab */}
                  {activeTab === 'config' && (
                    <div className="space-y-6 max-w-3xl">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nombre de Persona
                          </label>
                          <input
                            type="text"
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            value={persona.name}
                            onChange={(e) => setPersona({ ...persona, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            ID Interno
                          </label>
                          <input
                            type="text"
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-500 font-mono"
                            value={persona.id}
                            disabled
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Descripción
                        </label>
                        <textarea
                          className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          rows={3}
                          value={persona.description}
                          onChange={(e) =>
                            setPersona({ ...persona, description: e.target.value })
                          }
                          placeholder="Describe el propósito y especialización de esta persona..."
                        />
                      </div>

                      {/* Model Selection */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Modelo LLM
                          </label>
                          <select
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            value={persona.model}
                            onChange={(e) => setPersona({ ...persona, model: e.target.value })}
                          >
                            {LLM_MODELS.map((model) => (
                              <option key={model.value} value={model.value}>
                                {model.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Max Tokens
                          </label>
                          <input
                            type="number"
                            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:border-purple-500 focus:outline-none"
                            value={persona.max_tokens}
                            onChange={(e) =>
                              setPersona({ ...persona, max_tokens: parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                      </div>

                      {/* Temperature Slider */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Temperature: {persona.temperature.toFixed(2)}
                          <span className="text-xs text-slate-500 ml-2">
                            (
                            {persona.temperature < 0.3
                              ? 'Determinístico'
                              : persona.temperature < 0.7
                              ? 'Balanceado'
                              : 'Creativo'}
                            )
                          </span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                          value={persona.temperature}
                          onChange={(e) =>
                            setPersona({ ...persona, temperature: parseFloat(e.target.value) })
                          }
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>0.0 (Preciso)</span>
                          <span>0.5 (Balance)</span>
                          <span>1.0 (Creativo)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prompt Tab */}
                  {activeTab === 'prompt' && (
                    <div className="space-y-4 max-w-4xl">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-300">System Prompt</label>
                        <div className="text-xs text-slate-500">
                          {persona.system_prompt.length} caracteres
                        </div>
                      </div>
                      <textarea
                        className="w-full p-4 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:border-purple-500 focus:outline-none"
                        rows={25}
                        value={persona.system_prompt}
                        onChange={(e) =>
                          setPersona({ ...persona, system_prompt: e.target.value })
                        }
                        placeholder="Eres un..."
                      />
                    </div>
                  )}

                  {/* Examples Tab */}
                  {activeTab === 'examples' && (
                    <div className="space-y-4 max-w-4xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          Few-Shot Examples ({persona.examples.length})
                        </h3>
                        <button
                          onClick={addExample}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar Example
                        </button>
                      </div>

                      {persona.examples.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No hay examples configurados</p>
                          <p className="text-sm mt-1">
                            Agrega examples para mejorar la precisión de la persona
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {persona.examples.map((example, index) => (
                            <div
                              key={index}
                              className="p-4 bg-slate-800 border border-slate-700 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-white">
                                  Example {index + 1}
                                </span>
                                <button
                                  onClick={() => removeExample(index)}
                                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                                  aria-label="Eliminar example"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Input</label>
                                  <textarea
                                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded text-white text-sm font-mono focus:border-purple-500 focus:outline-none"
                                    rows={3}
                                    value={example.input}
                                    onChange={(e) => updateExample(index, 'input', e.target.value)}
                                    placeholder="Entrada de ejemplo..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">
                                    Output
                                  </label>
                                  <textarea
                                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded text-white text-sm font-mono focus:border-purple-500 focus:outline-none"
                                    rows={3}
                                    value={
                                      typeof example.output === 'string'
                                        ? example.output
                                        : JSON.stringify(example.output, null, 2)
                                    }
                                    onChange={(e) => updateExample(index, 'output', e.target.value)}
                                    placeholder="Salida esperada..."
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test Tab */}
                  {activeTab === 'test' && (
                    <div className="space-y-4 max-w-4xl">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Probar Persona
                        </h3>
                        <p className="text-sm text-slate-400">
                          Prueba la persona con un input de ejemplo para ver cómo responde
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Input de Prueba
                        </label>
                        <textarea
                          className="w-full p-4 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          rows={6}
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          placeholder="Ingresa un caso de prueba..."
                        />
                      </div>

                      <button
                        onClick={handleTest}
                        disabled={testing || !testInput.trim()}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {testing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Probando...
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            Probar Persona
                          </>
                        )}
                      </button>

                      {testResult && (
                        <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                          <h4 className="text-sm font-semibold text-white mb-3">Resultado</h4>
                          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-900 p-4 rounded overflow-x-auto">
                            {JSON.stringify(testResult.output, null, 2)}
                          </pre>
                          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Latencia:</span>{' '}
                              <span className="text-white font-semibold">
                                {testResult.latency_ms.toFixed(0)}ms
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Tokens:</span>{' '}
                              <span className="text-white font-semibold">
                                {testResult.tokens_used}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Costo:</span>{' '}
                              <span className="text-white font-semibold">
                                ${testResult.cost_usd.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
