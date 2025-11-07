/**
 * /t21/session - Main T21 Live Session Page
 * Integrates SESION-04 + SESION-05: Live session + Post-session analysis
 * Connected to backend API: /api/athlete-sessions/*
 */

'use client';

import React, { useState } from 'react';
import { LiveSessionCard } from '../components/LiveSessionCard';
import { PostSessionAnalysis } from '../components/PostSessionAnalysis';

interface SessionState {
  athleteId: string;
  exerciseName: string;
  targetReps: number;
  maxHeartRate?: number;
  isSessionActive: boolean;
  backendSessionId?: string; // Session ID from backend
  sessionData?: {
    athleteId: string;
    exerciseName: string;
    repsCompleted: number;
    sessionTime: number;
    emotionalCheck: 1 | 2 | 3 | 4 | 5;
    timestamp: string;
    heartRateAvg?: number;
  };
  analysis?: {
    analysis: string;
    achievement: string | null;
    next_recommendation: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001/api';

export default function T21SessionPage() {
  const [sessionState, setSessionState] = useState<SessionState>({
    athleteId: 'athlete-001', // In real app, get from auth/URL params
    exerciseName: 'Press de Pecho',
    targetReps: 20,
    maxHeartRate: 140,
    isSessionActive: false, // Start with false, will initialize on mount
  });
  const [loading, setLoading] = useState(false);

  // Initialize session on mount
  React.useEffect(() => {
    const initializeSession = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/athlete-sessions/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            athlete_id: sessionState.athleteId,
            exercise_name: sessionState.exerciseName,
            target_reps: sessionState.targetReps,
            max_heart_rate: sessionState.maxHeartRate,
          }),
        });

        if (!response.ok) throw new Error('Failed to start session');

        const data = await response.json();
        setSessionState((prev) => ({
          ...prev,
          isSessionActive: true,
          backendSessionId: data.session_id,
        }));
      } catch (error) {
        console.error('Session init error:', error);
        // Fallback: allow offline mode
        setSessionState((prev) => ({
          ...prev,
          isSessionActive: true,
          backendSessionId: `session_offline_${Date.now()}`,
        }));
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [sessionState.athleteId, sessionState.exerciseName]);

  const handleSessionEnd = async (data: SessionState['sessionData']) => {
    if (!sessionState.backendSessionId) return;

    try {
      // Send end session to backend
      const response = await fetch(
        `${API_BASE_URL}/athlete-sessions/${sessionState.backendSessionId}/end`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reps_completed: data.repsCompleted,
            session_time: data.sessionTime,
            final_emotional_check: data.emotionalCheck,
            avg_heart_rate: data.heartRateAvg,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSessionState((prev) => ({
          ...prev,
          isSessionActive: false,
          sessionData: data,
          analysis: result.analysis,
        }));
      } else {
        throw new Error('Failed to end session');
      }
    } catch (error) {
      console.error('Session end error:', error);
      // Fallback: offline mode
      setSessionState((prev) => ({
        ...prev,
        isSessionActive: false,
        sessionData: data,
      }));
    }
  };

  const handleContinue = () => {
    // Reset for new session
    window.location.reload();
  };

  // Mock goal stats (in real app, fetch from API)
  const goalStats = {
    totalReps: 20,
    weeklyAverage: 16.5,
    personalRecord: 22,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 uppercase mb-2">
            {sessionState.exerciseName}
          </h1>
          <p className="text-2xl text-gray-700">
            {sessionState.isSessionActive ? 'Sesión en vivo' : 'Análisis de sesión'}
          </p>
        </header>

        {/* Main Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-2xl text-gray-700">Iniciando sesión...</p>
          </div>
        ) : sessionState.isSessionActive ? (
          <LiveSessionCard
            athleteId={sessionState.athleteId}
            exerciseName={sessionState.exerciseName}
            targetReps={sessionState.targetReps}
            maxHeartRate={sessionState.maxHeartRate}
            sessionId={sessionState.backendSessionId}
            onSessionEnd={handleSessionEnd}
          />
        ) : sessionState.sessionData ? (
          <PostSessionAnalysis
            sessionData={sessionState.sessionData}
            goalStats={goalStats}
            onContinue={handleContinue}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-2xl text-gray-700">Cargando análisis...</p>
          </div>
        )}
      </div>
    </div>
  );
}
