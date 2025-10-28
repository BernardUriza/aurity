import { useState, useRef, useCallback, useEffect } from 'react';

interface UseWebSpeechCaptureReturn {
  isRecording: boolean;
  transcript: string;
  isAvailable: boolean;
  error: string | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  clearTranscript: () => void;
}

export const useWebSpeechCapture = (): UseWebSpeechCaptureReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check if WebSpeech API is available
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    setIsAvailable(!!SpeechRecognition);
  }, []);

  // Start real-time transcription
  const startRealTimeTranscription = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Web Speech API no está disponible en este navegador');
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-MX';
      
      recognition.onresult = (event: any) => {
        const results = Array.from(event.results);
        const transcript = results
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Error de reconocimiento: ${event.error}`);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      setError(null);
      return true;
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Error al iniciar el reconocimiento de voz');
      return false;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) {
      setError('Transcripción en tiempo real no disponible. Solo se usará Whisper.');
      return false;
    }

    try {
      setIsRecording(true);
      setTranscript('');
      const success = startRealTimeTranscription();
      
      if (!success) {
        setIsRecording(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setTranscript('');
      recognitionRef.current?.stop();
      return false;
    }
  }, [isAvailable, startRealTimeTranscription]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isRecording,
    transcript,
    isAvailable,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  };
};
