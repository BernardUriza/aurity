/**
 * TriviaEditor - CRUD Interface for Health Trivia Questions
 *
 * Allows doctors to create/edit trivia questions for waiting room TV.
 * Integrates with backend widget-config API.
 *
 * Card: FI-TV-REFAC-003
 */

'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
}

interface TriviaEditorProps {
  question?: TriviaQuestion; // For editing existing
  onSave: (question: TriviaQuestion) => Promise<void>;
  onCancel: () => void;
}

export function TriviaEditor({ question, onSave, onCancel }: TriviaEditorProps) {
  const [formData, setFormData] = useState<TriviaQuestion>(
    question || {
      id: '',
      question: '',
      options: ['', '', '', ''],
      correct: 0,
      explanation: '',
      difficulty: 'medium',
      category: '',
      tags: [],
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.question.length < 10) {
      newErrors.question = 'La pregunta debe tener al menos 10 caracteres';
    }

    const validOptions = formData.options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      newErrors.options = 'Debe haber al menos 2 opciones';
    }

    if (formData.explanation.length < 10) {
      newErrors.explanation = 'La explicación debe tener al menos 10 caracteres';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La categoría es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Generate ID if creating new
      if (!formData.id) {
        formData.id = `${formData.category}-${Date.now()}`;
      }

      await onSave(formData);
    } catch (error) {
      console.error('Failed to save trivia:', error);
      setErrors({ general: 'Error al guardar. Intente nuevamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, ''],
      });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions,
        correct: formData.correct >= newOptions.length ? 0 : formData.correct,
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-600/40 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-900/90 to-teal-900/90 backdrop-blur-sm border-b border-emerald-600/40 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧠</span>
              <h2 className="text-2xl font-bold text-white">
                {question ? 'Editar Trivia' : 'Nueva Trivia'}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Error Banner */}
          {errors.general && (
            <div className="p-4 bg-red-900/20 border border-red-600/40 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-300">{errors.general}</p>
            </div>
          )}

          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-emerald-300 mb-2">
              Pregunta *
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              rows={3}
              placeholder="¿Cuántos vasos de agua se recomienda beber al día?"
            />
            {errors.question && (
              <p className="mt-1 text-xs text-red-400">{errors.question}</p>
            )}
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-emerald-300">
                Opciones * (mínimo 2, máximo 6)
              </label>
              <button
                onClick={addOption}
                disabled={formData.options.length >= 6}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:bg-slate-700/20 disabled:cursor-not-allowed text-emerald-300 disabled:text-slate-500 text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar opción
              </button>
            </div>

            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.correct === index}
                    onChange={() => setFormData({ ...formData, correct: index })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                  />
                  {formData.options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 rounded-lg bg-red-900/20 hover:bg-red-900/30 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="mt-1 text-xs text-red-400">{errors.options}</p>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-emerald-300 mb-2">
              Explicación de la Respuesta Correcta *
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              rows={3}
              placeholder="Se recomienda beber entre 8 y 10 vasos al día..."
            />
            {errors.explanation && (
              <p className="mt-1 text-xs text-red-400">{errors.explanation}</p>
            )}
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-emerald-300 mb-2">
                Dificultad
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Media</option>
                <option value="hard">Difícil</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-emerald-300 mb-2">
                Categoría *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="hydration, exercise..."
              />
              {errors.category && (
                <p className="mt-1 text-xs text-red-400">{errors.category}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-emerald-300 mb-2">
                Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="agua, salud..."
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tags Display */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-900/30 border border-emerald-600/40 rounded-full text-sm text-emerald-300"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-t border-slate-700 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-lg transition-all shadow-lg disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar Trivia'}
          </button>
        </div>
      </div>
    </div>
  );
}
