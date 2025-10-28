// =============================================================================
// useAudioRecorder Hook - Audio Recording Management
// =============================================================================
// Manages MediaRecorder and audio capture
// Version: 0.1.0
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { RecordingOptions, AudioMetadata, CaptureError, ErrorType } from '../types';

interface UseAudioRecorderResult {
  isRecording: boolean;
  isPaused: boolean;
  audioBlob: Blob | null;
  audioMetadata: AudioMetadata | null;
  error: CaptureError | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  reset: () => void;
}

const DEFAULT_RECORDING_OPTIONS: RecordingOptions = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000,
  sampleRate: 48000,
  channels: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export function useAudioRecorder(
  options: RecordingOptions = {}
): UseAudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);
  const [error, setError] = useState<CaptureError | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const mergedOptions = { ...DEFAULT_RECORDING_OPTIONS, ...options };

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: mergedOptions.echoCancellation,
          noiseSuppression: mergedOptions.noiseSuppression,
          autoGainControl: mergedOptions.autoGainControl,
          sampleRate: mergedOptions.sampleRate,
          channelCount: mergedOptions.channels,
        },
      });

      streamRef.current = stream;

      // Determine supported MIME type
      let mimeType = mergedOptions.mimeType || 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: mergedOptions.audioBitsPerSecond,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const duration = (Date.now() - startTimeRef.current) / 1000;

        setAudioBlob(blob);
        setAudioMetadata({
          duration,
          sampleRate: mergedOptions.sampleRate || 48000,
          channels: mergedOptions.channels || 1,
          format: mimeType,
          size: blob.size,
        });
        setIsRecording(false);
        setIsPaused(false);
      };

      // Handle errors
      mediaRecorder.onerror = (event: any) => {
        const captureError: CaptureError = {
          type: ErrorType.RECORDING_FAILED,
          message: 'Recording failed',
          details: event.error,
          timestamp: new Date(),
        };
        setError(captureError);
        setIsRecording(false);
      };

      // Start recording
      startTimeRef.current = Date.now();
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setError(null);
    } catch (err) {
      const captureError: CaptureError = {
        type: ErrorType.MICROPHONE_ACCESS,
        message: 'Failed to access microphone',
        details: err,
        timestamp: new Date(),
      };
      setError(captureError);
    }
  }, [mergedOptions]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mediaRecorderRef.current?.mimeType || 'audio/webm',
          });
          const duration = (Date.now() - startTimeRef.current) / 1000;

          setAudioBlob(blob);
          setAudioMetadata({
            duration,
            sampleRate: mergedOptions.sampleRate || 48000,
            channels: mergedOptions.channels || 1,
            format: mediaRecorderRef.current?.mimeType || 'audio/webm',
            size: blob.size,
          });
          setIsRecording(false);
          setIsPaused(false);

          resolve(blob);
        };

        mediaRecorderRef.current.stop();

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      } else {
        resolve(null);
      }
    });
  }, [isRecording, mergedOptions]);

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setAudioMetadata(null);
    setError(null);

    // Clear audio chunks to prevent memory leak
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      // Clear chunks to prevent memory leak
      chunksRef.current = [];
      mediaRecorderRef.current = null;
    };
  }, [isRecording]);

  return {
    isRecording,
    isPaused,
    audioBlob,
    audioMetadata,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
  };
}
