/**
 * MediaUploader - Multimedia Upload Component for TV Display
 *
 * Card: FI-UI-FEAT-TVD-001
 * Allows doctors to upload images, videos, and custom messages
 * for waiting room TV display
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, Eye, EyeOff } from 'lucide-react';

interface MediaUploaderProps {
  /** Callback when media is uploaded */
  onMediaUpload: (media: UploadedMedia) => void;

  /** Clinic ID for categorization */
  clinicId?: string;

  /** Doctor ID (Auth0 sub) */
  doctorId?: string;
}

export interface UploadedMedia {
  mediaId: string;
  mediaType: 'image' | 'video' | 'message';
  title?: string;
  description?: string;
  url?: string; // For image/video
  message?: string; // For text messages
  duration: number; // Display duration in ms
}

interface MediaItem {
  media_id: string;
  media_type: 'image' | 'video' | 'message';
  title?: string;
  description?: string;
  file_path?: string;
  uploaded_at: number;
  duration: number;
  is_active: boolean;
}

export function MediaUploader({ onMediaUpload, clinicId, doctorId }: MediaUploaderProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'message'>('message');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [duration, setDuration] = useState(15); // seconds
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Archivo demasiado grande. Máximo 50MB.');
      return;
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (activeTab === 'image' && !validImageTypes.includes(file.type)) {
      alert('Tipo de imagen no válido. Use JPEG, PNG, GIF o WebP.');
      return;
    }

    if (activeTab === 'video' && !validVideoTypes.includes(file.type)) {
      alert('Tipo de video no válido. Use MP4, WebM o QuickTime.');
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', activeTab);
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      formData.append('duration', String(duration * 1000)); // Convert to ms
      if (clinicId) formData.append('clinic_id', clinicId);
      if (doctorId) formData.append('doctor_id', doctorId);

      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
      const response = await fetch(`${backendURL}/api/workflows/aurity/clinic-media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Notify parent component
      onMediaUpload({
        mediaId: data.media_id,
        mediaType: activeTab,
        title: title || file.name,
        description,
        url: `/api/workflows/aurity/clinic-media/${data.media_id}/file`,
        duration: duration * 1000,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setUploadProgress(100);

      // Refresh media list
      await fetchMediaList();

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Error al subir archivo. Intente nuevamente.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleMessageSubmit = async () => {
    if (!messageContent.trim()) {
      alert('El mensaje no puede estar vacío.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('media_type', 'message');
      formData.append('message_content', messageContent.trim());
      if (title) formData.append('title', title);
      formData.append('duration', String(duration * 1000)); // Convert to ms
      if (clinicId) formData.append('clinic_id', clinicId);
      if (doctorId) formData.append('doctor_id', doctorId);

      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
      const response = await fetch(`${backendURL}/api/workflows/aurity/clinic-media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Notify parent component
      onMediaUpload({
        mediaId: data.media_id,
        mediaType: 'message',
        title: title || 'Mensaje Personalizado',
        message: messageContent.trim(),
        duration: duration * 1000,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setMessageContent('');

      // Refresh media list
      await fetchMediaList();

      setIsUploading(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Error al enviar mensaje. Intente nuevamente.');
      setIsUploading(false);
    }
  };

  const fetchMediaList = async () => {
    setIsLoadingList(true);
    try {
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
      const params = new URLSearchParams();
      if (clinicId) params.append('clinic_id', clinicId);
      params.append('active_only', 'false');

      const response = await fetch(`${backendURL}/api/workflows/aurity/clinic-media/list?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media list');

      const data = await response.json();
      setMediaList(data.media || []);
    } catch (error) {
      console.error('Failed to fetch media list:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('¿Eliminar este contenido?')) return;

    try {
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
      const response = await fetch(`${backendURL}/api/workflows/aurity/clinic-media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete media');

      // Refresh list
      await fetchMediaList();
    } catch (error) {
      console.error('Failed to delete media:', error);
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

      if (!response.ok) throw new Error('Failed to update media');

      // Refresh list
      await fetchMediaList();
    } catch (error) {
      console.error('Failed to update media:', error);
      alert('Error al actualizar. Intente nuevamente.');
    }
  };

  // Load media list on mount
  useEffect(() => {
    fetchMediaList();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Subir Contenido al TV
        </h3>
        <p className="text-sm text-slate-400">Imágenes, videos o mensajes personalizados</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('message')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'message'
              ? 'bg-slate-900/50 text-cyan-300 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          💬 Mensaje
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'image'
              ? 'bg-slate-900/50 text-cyan-300 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          🖼️ Imagen
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'video'
              ? 'bg-slate-900/50 text-cyan-300 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          🎥 Video
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title Input (optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Título (opcional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del contenido"
            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            maxLength={100}
          />
        </div>

        {/* Message Tab */}
        {activeTab === 'message' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Mensaje *
            </label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Escribe tu mensaje personalizado para los pacientes..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-slate-500 mt-1">
              {messageContent.length}/500 caracteres
            </p>
          </div>
        )}

        {/* File Upload (Image/Video) */}
        {(activeTab === 'image' || activeTab === 'video') && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del contenido..."
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={2}
                maxLength={200}
              />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={activeTab === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full px-6 py-8 border-2 border-dashed border-slate-600 rounded-lg hover:border-cyan-500 hover:bg-slate-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium text-slate-300">
                    Haz clic para seleccionar {activeTab === 'image' ? 'imagen' : 'video'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeTab === 'image' ? 'JPEG, PNG, GIF, WebP' : 'MP4, WebM, QuickTime'} · Máx 50MB
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Duration Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Duración en pantalla
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-white font-medium w-16 text-right">{duration}s</span>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 text-center">
              {uploadProgress < 100 ? 'Subiendo...' : '✓ Completado'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        {activeTab === 'message' && (
          <button
            onClick={handleMessageSubmit}
            disabled={isUploading || !messageContent.trim()}
            className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Agregar al TV
              </>
            )}
          </button>
        )}
      </div>

      {/* Media List */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Contenido Subido ({mediaList.length})
          </h3>
        </div>

        <div className="p-6">
          {isLoadingList ? (
            <div className="text-center py-8">
              <svg className="w-8 h-8 animate-spin text-purple-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-sm text-slate-400 mt-2">Cargando...</p>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm text-slate-400">No hay contenido subido aún</p>
              <p className="text-xs text-slate-500 mt-1">Sube imágenes, videos o mensajes arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mediaList.map((item) => (
                <div
                  key={item.media_id}
                  className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        item.media_type === 'image' ? 'bg-blue-900/50 text-blue-300' :
                        item.media_type === 'video' ? 'bg-purple-900/50 text-purple-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {item.media_type === 'image' ? '📷 Imagen' : item.media_type === 'video' ? '🎬 Video' : '💬 Mensaje'}
                      </span>
                      {!item.is_active && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-700 text-slate-400">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-white truncate">{item.title || 'Sin título'}</h4>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-1 truncate">{item.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Duración: {item.duration / 1000}s · {new Date(item.uploaded_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(item.media_id, item.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.is_active
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title={item.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.media_id)}
                      className="p-2 bg-red-900/50 hover:bg-red-900 text-red-300 hover:text-red-100 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
