/**
 * TranscriptionSources - 3 separate sources display
 *
 * Shows 3 independent transcription sources (NO mixing):
 * 1. WebSpeech (instant preview, browser native)
 * 2. Whisper Chunks (high quality, per-chunk)
 * 3. Full Transcription (concatenated final)
 *
 * All 3 sources stored separately in HDF5 for LLM analysis during diarization.
 */

'use client';

import { useState, useEffect } from 'react';

interface TranscriptionSourcesProps {
  webSpeechTranscripts: string[];
  whisperChunks: Array<{ chunk_number: number; text: string }>;
  fullTranscription: string;
  sessionId?: string;
  isFinalized?: boolean;
  className?: string;
}

type ActiveTab = 'webspeech' | 'chunks' | 'full';

export function TranscriptionSources({
  webSpeechTranscripts,
  whisperChunks,
  fullTranscription,
  sessionId,
  isFinalized = false,
  className = '',
}: TranscriptionSourcesProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('webspeech');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Build audio URL if session is finalized
  const audioUrl = sessionId && isFinalized
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001'}/api/workflows/aurity/sessions/${sessionId}/audio`
    : null;

  // Debug: Log audio URL only when it changes
  useEffect(() => {
    if (audioUrl) {
      console.log('[TranscriptionSources] Audio URL:', audioUrl);
    }
  }, [audioUrl]);

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    const error = audio.error;
    let errorMessage = 'Error desconocido al cargar audio';

    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Carga de audio abortada';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Error de red al cargar audio';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Error al decodificar audio';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Formato de audio no soportado o archivo no encontrado';
          break;
      }
    }

    console.error('[TranscriptionSources] Audio error:', errorMessage, error);
    setAudioError(errorMessage);
  };

  const handleAudioCanPlay = () => {
    console.log('[TranscriptionSources] Audio loaded successfully');
    setAudioLoaded(true);
    setAudioError(null);
  };

  return (
    <div className={`bg-slate-800 rounded-xl p-4 border border-slate-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-3">Fuentes de Transcripción</h3>

      {/* Audio Player (only when finalized) */}
      {audioUrl && (
        <div className="mb-4 bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span className="text-sm font-medium text-purple-400">Audio de la Consulta</span>
            {audioLoaded && (
              <span className="text-xs text-green-400 ml-auto">✓ Cargado</span>
            )}
          </div>

          <audio
            controls
            controlsList="nodownload"
            className="w-full"
            src={audioUrl}
            preload="auto"
            onError={handleAudioError}
            onCanPlay={handleAudioCanPlay}
            onLoadedMetadata={() => console.log('[TranscriptionSources] Audio metadata loaded')}
          >
            Tu navegador no soporta reproducción de audio.
          </audio>

          {audioError && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-700/30 rounded text-xs text-red-400">
              ⚠️ {audioError}
              <div className="mt-1 text-red-400/60">
                URL: {audioUrl}
              </div>
            </div>
          )}

          {!audioError && (
            <p className="text-xs text-slate-500 mt-2">
              💡 Escucha la grabación completa de la consulta médica
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('webspeech')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'webspeech'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          WebSpeech ({webSpeechTranscripts.length})
        </button>
        <button
          onClick={() => setActiveTab('chunks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'chunks'
              ? 'bg-green-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Whisper Chunks ({whisperChunks.length})
        </button>
        <button
          onClick={() => setActiveTab('full')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'full'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Full Transcription
        </button>
      </div>

      {/* Content with scroll */}
      <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto border border-slate-700">
        {activeTab === 'webspeech' && (
          <div className="space-y-2">
            {webSpeechTranscripts.length === 0 ? (
              <p className="text-slate-400 text-sm italic">
                No hay transcripciones de WebSpeech aún...
              </p>
            ) : (
              webSpeechTranscripts.map((text, idx) => (
                <div
                  key={idx}
                  className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-sm text-blue-200"
                >
                  <span className="text-blue-400 font-mono text-xs mr-2">[{idx}]</span>
                  {text}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'chunks' && (
          <div className="space-y-2">
            {whisperChunks.length === 0 ? (
              <p className="text-slate-400 text-sm italic">
                Esperando chunks de Whisper (~20s por chunk)...
              </p>
            ) : (
              whisperChunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className="bg-green-500/10 border border-green-500/20 rounded p-2 text-sm text-green-200"
                >
                  <span className="text-green-400 font-mono text-xs mr-2">
                    [Chunk {chunk.chunk_number}]
                  </span>
                  {chunk.text}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'full' && (
          <div className="text-sm text-slate-200 leading-relaxed">
            {fullTranscription ? (
              <p className="whitespace-pre-wrap">{fullTranscription}</p>
            ) : (
              <p className="text-slate-400 italic">
                La transcripción completa se generará al finalizar la sesión...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Info badge */}
      <div className="mt-3 text-xs text-slate-400">
        💡 Las 3 fuentes se almacenan por separado en HDF5 para análisis del LLM durante
        diarización
      </div>
    </div>
  );
}
