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

import { useState } from 'react';

interface TranscriptionSourcesProps {
  webSpeechTranscripts: string[];
  whisperChunks: Array<{ chunk_number: number; text: string }>;
  fullTranscription: string;
  className?: string;
}

type ActiveTab = 'webspeech' | 'chunks' | 'full';

export function TranscriptionSources({
  webSpeechTranscripts,
  whisperChunks,
  fullTranscription,
  className = '',
}: TranscriptionSourcesProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('webspeech');

  return (
    <div className={`bg-slate-800 rounded-xl p-4 border border-slate-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-3">Fuentes de Transcripción</h3>

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
