"use client";

/**
 * SlimConversationCapture Component
 * Card: (Created for legacy removal)
 *
 * Minimal audio recording + transcription component
 * Replaced 1,425 lines legacy with ~150 lines essential functionality
 *
 * Features:
 * - Record audio (MediaRecorder API)
 * - Basic recording controls (start/stop)
 * - Simple transcription output
 * - Minimal UI (no waveforms, no live transcription, no sweetalert2)
 */

import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

export interface TranscriptionSegment {
  text: string;
  isFinal: boolean;
  timestamp?: number;
}

export interface ConversationSession {
  audioBlob: Blob;
  transcription: TranscriptionSegment[];
  duration: number;
  timestamp: string;
}

interface SlimConversationCaptureProps {
  onSave: (session: ConversationSession) => Promise<void>;
  onCancel?: () => void;
  darkMode?: boolean;
}

export function SlimConversationCapture({
  onSave,
  onCancel,
  darkMode = true,
}: SlimConversationCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start recording
  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every 1s
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Update timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      setError("Failed to access microphone");
      console.error("Recording error:", err);
    }
  }, []);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    setIsRecording(false);
    setIsProcessing(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

    // Wait for ondataavailable to finish
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create audio blob
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

    // Create session (no actual transcription - placeholder)
    const session: ConversationSession = {
      audioBlob,
      transcription: [
        {
          text: "[Audio recording completed - transcription not implemented in slim version]",
          isFinal: true,
          timestamp: Date.now(),
        },
      ],
      duration,
      timestamp: new Date().toISOString(),
    };

    try {
      await onSave(session);
      setIsProcessing(false);
      handleReset();
    } catch (err) {
      setError("Failed to save recording");
      setIsProcessing(false);
    }
  }, [duration, onSave]);

  // Reset state
  const handleReset = useCallback(() => {
    setIsRecording(false);
    setIsProcessing(false);
    setDuration(0);
    setError(null);
    audioChunksRef.current = [];
  }, []);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    }
    handleReset();
    onCancel?.();
  }, [isRecording, onCancel, handleReset]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`p-6 rounded-lg border ${
        darkMode
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-gray-300"
      }`}
    >
      {/* Title */}
      <h3
        className={`text-lg font-semibold mb-4 ${
          darkMode ? "text-slate-50" : "text-gray-900"
        }`}
      >
        Audio Recording
      </h3>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Timer */}
      <div className="text-center mb-6">
        <div
          className={`text-4xl font-mono ${
            darkMode ? "text-slate-50" : "text-gray-900"
          }`}
        >
          {formatDuration(duration)}
        </div>
        {isRecording && (
          <div className="text-sm text-red-500 mt-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Recording...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording && !isProcessing && (
          <button
            onClick={handleStartRecording}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        )}

        {isRecording && (
          <button
            onClick={handleStopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            <Square className="w-5 h-5" />
            Stop Recording
          </button>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-blue-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </div>
        )}

        {(isRecording || isProcessing) && (
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              darkMode
                ? "bg-slate-700 hover:bg-slate-600 text-slate-50"
                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Note about slim version */}
      <div
        className={`mt-6 text-xs ${
          darkMode ? "text-slate-400" : "text-gray-500"
        }`}
      >
        <p>
          <strong>Note:</strong> This is a slim version without live transcription.
          Full transcription features require backend integration.
        </p>
      </div>
    </div>
  );
}
