/**
 * TVWidgets - Reusable Widget Components for Waiting Room TV
 *
 * Card: FI-UI-FEAT-TVD-001
 * Based on 2025 healthcare digital signage best practices
 *
 * Research insights:
 * - Digital signage reduces perceived wait time by 35%
 * - Calming visuals (nature, meditation) reduce anxiety
 * - Interactive content (trivias, exercises) improve engagement
 * - Weather + time anchors patients to reality
 */

'use client';

import { useEffect, useState } from 'react';

// ============================================================================
// WEATHER WIDGET
// ============================================================================

interface WeatherWidgetProps {
  city?: string;
}

export function WeatherWidget({ city = 'Ciudad de México' }: WeatherWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock weather data (in real app, would fetch from API)
  const weather = {
    temp: 22,
    condition: 'Soleado',
    icon: '☀️',
    humidity: 45,
  };

  const formattedTime = currentTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-gradient-to-br from-blue-950/40 to-cyan-950/40 border border-blue-600/40 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        {/* Left: Time & Date */}
        <div>
          <div className="text-5xl font-bold text-white mb-2 font-mono">
            {formattedTime}
          </div>
          <div className="text-sm text-blue-300 capitalize">
            {formattedDate}
          </div>
        </div>

        {/* Right: Weather */}
        <div className="text-right">
          <div className="text-6xl mb-2">{weather.icon}</div>
          <div className="text-3xl font-bold text-white">{weather.temp}°C</div>
          <div className="text-sm text-blue-300">{weather.condition}</div>
          <div className="text-xs text-blue-400/60 mt-1">
            Humedad: {weather.humidity}%
          </div>
        </div>
      </div>

      {/* City */}
      <div className="mt-4 pt-4 border-t border-blue-700/30">
        <div className="flex items-center gap-2 text-blue-300 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>{city}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HEALTH TRIVIA WIDGET
// ============================================================================

interface HealthTriviaWidgetProps {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export function HealthTriviaWidget({
  question,
  options,
  correctAnswer,
  explanation,
}: HealthTriviaWidgetProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    // Auto-reveal answer after 10 seconds
    const timer = setTimeout(() => setShowAnswer(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-gradient-to-br from-emerald-950/40 to-teal-950/40 border border-emerald-600/40 rounded-xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🧠</div>
        <div>
          <h3 className="text-lg font-bold text-emerald-300">Trivia de Salud</h3>
          <p className="text-xs text-emerald-400/60">¿Cuánto sabes?</p>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="text-white text-lg font-medium leading-relaxed">
          {question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option, index) => (
          <div
            key={index}
            className={`
              px-4 py-3 rounded-lg border transition-all duration-300
              ${showAnswer && index === correctAnswer
                ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/30 border-slate-700 hover:border-emerald-600/50'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-emerald-300 font-bold text-lg">
                {String.fromCharCode(65 + index)}.
              </span>
              <span className="text-slate-200">{option}</span>
              {showAnswer && index === correctAnswer && (
                <svg className="w-5 h-5 text-emerald-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Explanation (revealed) */}
      {showAnswer && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-600/30 rounded-lg animate-fade-in">
          <p className="text-sm text-emerald-200 leading-relaxed">
            <span className="font-semibold text-emerald-300">✓ Respuesta correcta: </span>
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BREATHING EXERCISE WIDGET
// ============================================================================

export function BreathingExerciseWidget() {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev === 1) {
          // Switch phase
          setPhase(current => {
            if (current === 'inhale') return 'hold';
            if (current === 'hold') return 'exhale';
            return 'inhale';
          });
          return phase === 'hold' ? 7 : 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const phaseConfig = {
    inhale: {
      label: 'Inhala profundamente',
      color: 'text-cyan-300',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-500',
      icon: '↑',
    },
    hold: {
      label: 'Sostén la respiración',
      color: 'text-purple-300',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500',
      icon: '⏸',
    },
    exhale: {
      label: 'Exhala lentamente',
      color: 'text-orange-300',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500',
      icon: '↓',
    },
  };

  const config = phaseConfig[phase];

  return (
    <div className="bg-gradient-to-br from-slate-950/80 to-slate-900/80 border border-slate-700 rounded-xl p-8 backdrop-blur-sm">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-3xl mb-2">🧘</div>
        <h3 className="text-lg font-bold text-white">Ejercicio de Respiración</h3>
        <p className="text-xs text-slate-400">Técnica 4-7-8 para reducir ansiedad</p>
      </div>

      {/* Animated Circle */}
      <div className="flex items-center justify-center mb-8">
        <div
          className={`
            relative w-48 h-48 rounded-full
            ${config.bgColor} ${config.borderColor} border-4
            flex items-center justify-center
            transition-all duration-1000 ease-in-out
            ${phase === 'inhale' ? 'scale-110' : phase === 'exhale' ? 'scale-90' : 'scale-100'}
          `}
        >
          <div className="text-center">
            <div className={`text-6xl font-bold ${config.color} mb-2`}>
              {count}
            </div>
            <div className={`text-4xl ${config.color}`}>
              {config.icon}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className={`text-xl font-semibold ${config.color}`}>
          {config.label}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// DAILY TIP WIDGET (Will be FI-generated)
// ============================================================================

interface DailyTipWidgetProps {
  tip: string;
  category: 'nutrition' | 'exercise' | 'mental_health' | 'prevention';
  generatedBy?: 'FI' | 'static';
}

export function DailyTipWidget({ tip, category, generatedBy = 'static' }: DailyTipWidgetProps) {
  const categoryConfig = {
    nutrition: {
      icon: '🥗',
      label: 'Nutrición',
      color: 'text-green-300',
      bgColor: 'bg-green-950/40',
      borderColor: 'border-green-600/40',
    },
    exercise: {
      icon: '🏃',
      label: 'Actividad Física',
      color: 'text-blue-300',
      bgColor: 'bg-blue-950/40',
      borderColor: 'border-blue-600/40',
    },
    mental_health: {
      icon: '🧠',
      label: 'Salud Mental',
      color: 'text-purple-300',
      bgColor: 'bg-purple-950/40',
      borderColor: 'border-purple-600/40',
    },
    prevention: {
      icon: '🛡️',
      label: 'Prevención',
      color: 'text-orange-300',
      bgColor: 'bg-orange-950/40',
      borderColor: 'border-orange-600/40',
    },
  };

  const config = categoryConfig[category];

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-6 backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{config.icon}</div>
          <div>
            <h3 className={`text-lg font-bold ${config.color}`}>Tip del Día</h3>
            <p className="text-xs text-slate-400">{config.label}</p>
          </div>
        </div>
        {generatedBy === 'FI' && (
          <div className="flex items-center gap-1 text-xs text-purple-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
            </svg>
            <span>Generado por FI</span>
          </div>
        )}
      </div>

      {/* Tip Content with Marquee Animation */}
      <div className="relative overflow-hidden py-1">
        {tip.length > 120 ? (
          <div className="flex animate-marquee">
            <span className="text-white text-base leading-relaxed whitespace-nowrap px-4">
              {tip}
            </span>
            <span className="text-white text-base leading-relaxed whitespace-nowrap px-4">
              {tip}
            </span>
          </div>
        ) : (
          <div className="text-white text-base leading-relaxed">
            {tip}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CLINIC IMAGE WIDGET
// ============================================================================

interface ClinicImageWidgetProps {
  imageUrl: string;
  title?: string;
  description?: string;
}

export function ClinicImageWidget({ imageUrl, title, description }: ClinicImageWidgetProps) {
  return (
    <div className="bg-gradient-to-br from-slate-950/80 to-slate-900/80 border border-slate-700 rounded-xl overflow-hidden backdrop-blur-sm">
      {/* Image */}
      <div className="relative w-full h-80 bg-slate-900">
        <img
          src={imageUrl}
          alt={title || 'Clinic image'}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Caption */}
      {(title || description) && (
        <div className="p-6 border-t border-slate-700/50">
          {title && (
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
            </svg>
            <span>Contenido de su clínica</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CLINIC VIDEO WIDGET
// ============================================================================

interface ClinicVideoWidgetProps {
  videoUrl: string;
  title?: string;
  description?: string;
}

export function ClinicVideoWidget({ videoUrl, title, description }: ClinicVideoWidgetProps) {
  return (
    <div className="bg-gradient-to-br from-slate-950/80 to-slate-900/80 border border-slate-700 rounded-xl overflow-hidden backdrop-blur-sm">
      {/* Video */}
      <div className="relative w-full h-80 bg-slate-900">
        <video
          src={videoUrl}
          className="w-full h-full object-contain"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>

      {/* Caption */}
      {(title || description) && (
        <div className="p-6 border-t border-slate-700/50">
          {title && (
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <span>Contenido de su clínica</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CLINIC CUSTOM MESSAGE WIDGET
// ============================================================================

interface ClinicMessageWidgetProps {
  message: string;
  title?: string;
}

export function ClinicMessageWidget({ message, title }: ClinicMessageWidgetProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 border border-indigo-600/40 rounded-xl p-8 backdrop-blur-sm">
      {/* Icon */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border-2 border-indigo-500/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-indigo-300">
            {title || 'Mensaje del Doctor'}
          </h3>
          <p className="text-xs text-indigo-400/60">Información importante</p>
        </div>
      </div>

      {/* Message content */}
      <div className="text-white text-lg leading-relaxed">
        {message}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-indigo-700/30">
        <div className="flex items-center gap-2 text-xs text-indigo-400">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <span>Mensaje personalizado de su clínica</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CALMING NATURE WIDGET
// ============================================================================

export function CalmingNatureWidget() {
  const scenes = [
    { emoji: '🌊', label: 'Olas del océano', color: 'from-blue-600/20 to-cyan-600/20' },
    { emoji: '🌲', label: 'Bosque tranquilo', color: 'from-green-600/20 to-emerald-600/20' },
    { emoji: '🏔️', label: 'Montañas serenas', color: 'from-slate-600/20 to-blue-600/20' },
    { emoji: '🌅', label: 'Atardecer', color: 'from-orange-600/20 to-pink-600/20' },
  ];

  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScene(prev => (prev + 1) % scenes.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const scene = scenes[currentScene];

  return (
    <div className={`bg-gradient-to-br ${scene.color} border border-slate-700/50 rounded-xl p-12 backdrop-blur-sm text-center transition-all duration-1000`}>
      <div className="text-8xl mb-6 animate-pulse">
        {scene.emoji}
      </div>
      <h3 className="text-2xl font-semibold text-white mb-2">
        {scene.label}
      </h3>
      <p className="text-slate-300 text-sm">
        Respira profundo y relájate
      </p>
    </div>
  );
}
