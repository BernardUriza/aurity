/**
 * DASHBOARD-09: Coach Dashboard
 * AC: Athlete list + real-time alerts + KPIs + one-tap emoji feedback + session history
 */

'use client';

import React, { useState, useEffect } from 'react';
import { T21Button, T21Card, Pictogram, Pictograms } from '../../../ui/components';

interface Athlete {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'resting';
  currentExercise?: string;
  repsCompleted?: number;
  targetReps?: number;
  heartRate?: number;
  lastSession?: {
    timestamp: string;
    reps: number;
    time: number;
  };
}

interface CoachDashboardMetrics {
  weeklyReps: number;
  consistency: number; // 0-100
  avgEffort: number; // 1-5
  alerts: string[];
}

const mockAthletes: Athlete[] = [
  {
    id: 'athlete-001',
    name: 'Juan',
    status: 'online',
    currentExercise: 'Press de Pecho',
    repsCompleted: 12,
    targetReps: 20,
    heartRate: 105,
    lastSession: { timestamp: '2025-11-06 10:30', reps: 18, time: 1200 },
  },
  {
    id: 'athlete-002',
    name: 'María',
    status: 'offline',
    lastSession: { timestamp: '2025-11-06 09:15', reps: 22, time: 1500 },
  },
  {
    id: 'athlete-003',
    name: 'Carlos',
    status: 'resting',
    currentExercise: 'Sentadillas',
    repsCompleted: 5,
    targetReps: 15,
    heartRate: 95,
  },
];

export default function CoachDashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>(mockAthletes);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Mock KPI calculation
  const calculateMetrics = (athlete: Athlete): CoachDashboardMetrics => {
    const alerts: string[] = [];

    if (athlete.heartRate && athlete.heartRate > 140) {
      alerts.push('⚠️ Ritmo cardíaco elevado');
    }
    if (athlete.repsCompleted && athlete.repsCompleted < athlete.targetReps! * 0.5) {
      alerts.push('💭 Rendimiento bajo hoy');
    }

    return {
      weeklyReps: athlete.lastSession?.reps || 0,
      consistency: 75, // Mock value
      avgEffort: 4,
      alerts,
    };
  };

  const getStatusEmoji = (status: Athlete['status']) => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'resting':
        return '🟡';
      case 'offline':
        return '🔴';
    }
  };

  const getStatusLabel = (status: Athlete['status']) => {
    switch (status) {
      case 'online':
        return 'En vivo';
      case 'resting':
        return 'Descansando';
      case 'offline':
        return 'Desconectado';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 uppercase mb-2">
            Panel de Entrenador
          </h1>
          <p className="text-2xl text-gray-700">
            Monitorea a tus atletas en tiempo real
          </p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Athletes List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 uppercase mb-4">
              Tus Atletas
            </h2>

            {athletes.map((athlete) => {
              const metrics = calculateMetrics(athlete);
              const isSelected = selectedAthlete?.id === athlete.id;

              return (
                <div
                  key={athlete.id}
                  onClick={() => setSelectedAthlete(athlete)}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected ? 'ring-4 ring-blue-500' : ''
                  }`}
                >
                  <T21Card
                    title={`${athlete.name} ${getStatusEmoji(athlete.status)}`}
                    icon={getStatusEmoji(athlete.status)}
                    color={
                      athlete.status === 'online'
                        ? 'green'
                        : athlete.status === 'resting'
                          ? 'yellow'
                          : 'blue'
                    }
                  >
                    <div className="space-y-4">
                      {/* Status */}
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-gray-700">
                          Estado:
                        </span>
                        <span className="text-2xl font-bold text-gray-900">
                          {getStatusLabel(athlete.status)}
                        </span>
                      </div>

                      {/* Current Exercise */}
                      {athlete.currentExercise && (
                        <div className="bg-white rounded-lg p-4 border-4 border-gray-700">
                          <p className="text-xl text-gray-700 mb-2">
                            Ejercicio actual:
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {athlete.currentExercise}
                          </p>

                          {/* Rep Progress */}
                          {athlete.repsCompleted !== undefined && (
                            <div className="mt-4">
                              <div className="flex justify-between mb-2">
                                <span className="text-2xl font-bold text-gray-700">
                                  {athlete.repsCompleted} / {athlete.targetReps}
                                </span>
                              </div>
                              <div className="w-full bg-gray-300 rounded-full h-6 overflow-hidden">
                                <div
                                  className="bg-green-500 h-full transition-all duration-300"
                                  style={{
                                    width: `${(athlete.repsCompleted / athlete.targetReps!) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Heart Rate */}
                          {athlete.heartRate && (
                            <div className="mt-4 flex items-center gap-2">
                              <Pictogram icon="HEART" size="lg" animated />
                              <span className="text-2xl font-bold text-red-700">
                                {athlete.heartRate} bpm
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Last Session */}
                      {athlete.lastSession && (
                        <div className="text-lg text-gray-700">
                          <p className="font-bold mb-1">Última sesión:</p>
                          <p>
                            {athlete.lastSession.reps} reps en{' '}
                            {Math.floor(athlete.lastSession.time / 60)}m
                            {' • '}
                            {athlete.lastSession.timestamp}
                          </p>
                        </div>
                      )}

                      {/* Alerts */}
                      {metrics.alerts.length > 0 && (
                        <div className="bg-red-50 border-4 border-red-700 rounded-lg p-4">
                          {metrics.alerts.map((alert, i) => (
                            <p
                              key={i}
                              className="text-xl font-bold text-red-700"
                            >
                              {alert}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Quick Feedback */}
                      {isSelected && (
                        <T21Button
                          onClick={() => setFeedbackModalOpen(true)}
                          variant="success"
                          size="xl"
                          icon={Pictograms.THUMBS_UP}
                          ariaLabel="Enviar retroalimentación"
                        >
                          Dar Feedback
                        </T21Button>
                      )}
                    </div>
                  </T21Card>
                </div>
              );
            })}
          </div>

          {/* Right Sidebar - Quick Stats */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 uppercase mb-4">
              Resumen de Hoy
            </h2>

            {/* Team Stats */}
            <T21Card title="Equipo" icon={Pictograms.TROPHY} color="blue">
              <div className="space-y-3">
                <div>
                  <p className="text-xl text-gray-700 mb-1">Online:</p>
                  <p className="text-4xl font-bold text-green-700">
                    {athletes.filter((a) => a.status === 'online').length}
                  </p>
                </div>
                <div>
                  <p className="text-xl text-gray-700 mb-1">Total de Reps:</p>
                  <p className="text-4xl font-bold text-purple-700">
                    {athletes.reduce(
                      (sum, a) => sum + (a.repsCompleted || 0),
                      0
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xl text-gray-700 mb-1">Consistencia:</p>
                  <p className="text-4xl font-bold text-blue-700">85%</p>
                </div>
              </div>
            </T21Card>

            {/* System Status */}
            <T21Card title="Estado del Sistema" icon="⚙️" color="green">
              <div className="space-y-2 text-xl text-gray-700">
                <p>🟢 Backend: Activo</p>
                <p>🟢 KATNISS: Activo</p>
                <p>🟢 Storage: Normal</p>
              </div>
            </T21Card>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModalOpen && selectedAthlete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full border-4 border-gray-900">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Feedback para {selectedAthlete.name}
            </h3>

            <div className="space-y-3 mb-6">
              {[
                { emoji: '👍', text: 'Excelente trabajo' },
                { emoji: '🌟', text: 'Muy bien hoy' },
                { emoji: '💪', text: 'Eres muy fuerte' },
                { emoji: '🎉', text: 'Objetivo alcanzado' },
              ].map((feedback, i) => (
                <T21Button
                  key={i}
                  onClick={() => {
                    // TODO: Send feedback via API
                    setFeedbackModalOpen(false);
                  }}
                  variant="success"
                  size="xl"
                  icon={feedback.emoji}
                  ariaLabel={feedback.text}
                >
                  {feedback.text}
                </T21Button>
              ))}
            </div>

            <T21Button
              onClick={() => setFeedbackModalOpen(false)}
              variant="info"
              size="xl"
              icon="✕"
              ariaLabel="Cerrar"
            >
              Cerrar
            </T21Button>
          </div>
        </div>
      )}
    </div>
  );
}
