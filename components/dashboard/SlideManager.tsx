/**
 * SlideManager - Slide Order Management for TV Display
 *
 * Allows doctors to:
 * - View all active slides
 * - Reorder slides (drag & drop or buttons)
 * - Toggle active/inactive
 * - Delete slides
 * - Preview order changes
 */

'use client';

import { useState, useEffect } from 'react';
import { Trash2, Eye, EyeOff, ChevronUp, ChevronDown, GripVertical, Lock } from 'lucide-react';
import type { ContentItem } from './FIAvatar';

interface Slide {
  media_id: string;
  media_type: 'image' | 'video' | 'message';
  title?: string;
  description?: string;
  file_path?: string;
  uploaded_at: number;
  duration: number;
  is_active: boolean;
  display_order?: number;
}

interface SlideManagerProps {
  clinicId?: string;
  onSlidesUpdate?: () => void;
  carouselContent?: ContentItem[];
}

export function SlideManager({ clinicId, onSlidesUpdate, carouselContent = [] }: SlideManagerProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSlides = async () => {
    setIsLoading(true);
    try {
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
      const params = new URLSearchParams();
      // Don't filter by clinic_id - show all slides
      params.append('active_only', 'false');

      const response = await fetch(`${backendURL}/api/workflows/aurity/clinic-media/list?${params}`);
      if (!response.ok) throw new Error('Failed to fetch slides');

      const data = await response.json();
      // Sort by upload time (newest first) or by display_order if available
      const sorted = (data.media || []).sort((a: Slide, b: Slide) => {
        if (a.display_order !== undefined && b.display_order !== undefined) {
          return a.display_order - b.display_order;
        }
        return b.uploaded_at - a.uploaded_at;
      });
      setSlides(sorted);
    } catch (error) {
      console.error('Failed to fetch slides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('¿Eliminar este slide del TV?')) return;

    try {
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
      const response = await fetch(`${backendURL}/api/workflows/aurity/clinic-media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete slide');

      await fetchSlides();
      onSlidesUpdate?.();
    } catch (error) {
      console.error('Failed to delete slide:', error);
      alert('Error al eliminar. Intente nuevamente.');
    }
  };

  const handleToggleActive = async (mediaId: string, currentState: boolean) => {
    try {
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
      const response = await fetch(`${backendURL}/api/workflows/aurity/clinic-media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      });

      if (!response.ok) throw new Error('Failed to update slide');

      await fetchSlides();
      onSlidesUpdate?.();
    } catch (error) {
      console.error('Failed to update slide:', error);
      alert('Error al actualizar. Intente nuevamente.');
    }
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    // Swap slides
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    setSlides(newSlides);

    // TODO: Persist order to backend
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const activeSlides = slides.filter(s => s.is_active);
  const inactiveSlides = slides.filter(s => !s.is_active);

  // Helper function to get icon/label for content type
  const getContentInfo = (item: ContentItem, index: number) => {
    if (item.widgetType === 'clinic_image') return { icon: '📷', label: item.widgetData?.title || 'Imagen', editable: true };
    if (item.widgetType === 'clinic_video') return { icon: '🎬', label: item.widgetData?.title || 'Video', editable: true };
    if (item.widgetType === 'clinic_message') return { icon: '💬', label: item.widgetData?.title || 'Mensaje', editable: true };
    if (item.widgetType === 'weather') return { icon: '🌤️', label: 'Clima y Hora', editable: false };
    if (item.widgetType === 'trivia') return { icon: '🧠', label: 'Trivia de Salud', editable: false };
    if (item.widgetType === 'breathing') return { icon: '🫁', label: 'Ejercicio de Respiración', editable: false };
    if (item.widgetType === 'daily_tip') return { icon: '💡', label: 'Tip del Día', editable: false };
    if (item.widgetType === 'calming') return { icon: '🌿', label: 'Naturaleza Relajante', editable: false };
    if (item.type === 'welcome') return { icon: '👋', label: 'Bienvenida FI', editable: false };
    if (item.type === 'philosophy') return { icon: '🏠', label: 'Filosofía FI', editable: false };
    if (item.type === 'tip') return { icon: '💊', label: 'Tip de Salud FI', editable: false };
    if (item.type === 'doctor_message') return { icon: '📢', label: 'Mensaje del Doctor', editable: false };
    return { icon: '📄', label: `Slide ${index + 1}`, editable: false };
  };

  return (
    <div className="space-y-6">
      {/* All Carousel Content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Todos los Slides ({carouselContent.length})
          </h3>
          <button
            onClick={fetchSlides}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>

        {carouselContent.length === 0 ? (
          <div className="text-center py-8 bg-slate-900/50 border border-slate-700 rounded-lg">
            <p className="text-sm text-slate-400">Cargando carousel...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {carouselContent.map((item, index) => {
              const info = getContentInfo(item, index);
              return (
                <div
                  key={`carousel-${index}`}
                  className={`flex items-center gap-3 p-6 rounded-xl transition-all duration-300 backdrop-blur-sm ${
                    info.editable
                      ? 'bg-gradient-to-br from-purple-950/40 to-indigo-950/40 border border-purple-600/40 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20'
                      : 'bg-gradient-to-br from-slate-950/40 to-slate-900/40 border border-slate-600/30 opacity-80'
                  }`}
                >
                  {/* Order Number */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/50 backdrop-blur-sm shadow-lg">
                    <span className="text-lg font-bold text-purple-200">{index + 1}</span>
                  </div>

                  {/* Slide Icon & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl drop-shadow-lg">{info.icon}</span>
                      <h4 className="text-base font-semibold text-white truncate">{info.label}</h4>
                      {!info.editable && (
                        <span
                          title="Contenido FI (no editable)"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/50 backdrop-blur-sm"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-medium text-slate-300">FI</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {(item.duration || 15000) / 1000}s
                      </span>
                      {!info.editable && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-900/20 border border-emerald-700/30 text-emerald-300">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Sistema
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (only for editable items) */}
                  {info.editable && (
                    <div className="flex items-center gap-2">
                      <button
                        disabled
                        className="p-2.5 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 text-slate-400 cursor-not-allowed backdrop-blur-sm"
                        title="Edición disponible próximamente"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                      <button
                        disabled
                        className="p-2.5 rounded-lg bg-gradient-to-br from-red-900/30 to-red-800/30 border border-red-700/40 text-red-400/50 cursor-not-allowed backdrop-blur-sm"
                        title="Eliminación disponible próximamente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
