/**
 * CheckinQRDisplay - QR Code Display for TV
 *
 * Card: FI-CHECKIN-001
 * Shows scannable QR code on waiting room TV for patient check-in
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { QrCode, RefreshCw, Smartphone } from 'lucide-react';

interface CheckinQRDisplayProps {
  clinicId: string;
  clinicName?: string;
  /** Refresh interval in seconds (default: 4 minutes) */
  refreshInterval?: number;
  /** Compact mode for sidebar display */
  compact?: boolean;
}

interface QRData {
  qrDataUrl: string;
  expiresAt: Date;
}

/**
 * Generate QR code locally using canvas
 * In production, this would call the backend API
 */
async function generateQRCode(clinicId: string): Promise<QRData> {
  // For MVP: Generate URL that will be encoded in QR
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://app.aurity.io';

  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 10);
  const expiresAt = new Date(timestamp + 5 * 60 * 1000); // 5 minutes

  const checkinUrl = `${baseUrl}/checkin?clinic=${clinicId}&t=${timestamp}&n=${nonce}`;

  // Use dynamic import for QR code generation
  // This keeps bundle size small and loads only when needed
  try {
    const QRCode = (await import('qrcode')).default;
    const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1e1b4b', // Indigo-950
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    return { qrDataUrl, expiresAt };
  } catch (error) {
    console.error('QR generation failed:', error);
    // Return placeholder if QRCode library not available
    return {
      qrDataUrl: '',
      expiresAt,
    };
  }
}

export function CheckinQRDisplay({
  clinicId,
  clinicName = 'Clínica',
  refreshInterval = 240, // 4 minutes
  compact = false,
}: CheckinQRDisplayProps) {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const refreshQR = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await generateQRCode(clinicId);
      setQrData(data);
      setTimeLeft(Math.floor((data.expiresAt.getTime() - Date.now()) / 1000));
    } catch (err) {
      setError('Error generando código QR');
      console.error('QR generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  // Initial load and refresh interval
  useEffect(() => {
    refreshQR();

    const interval = setInterval(refreshQR, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshQR, refreshInterval]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          refreshQR();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, refreshQR]);

  // Format time remaining
  const formatTimeLeft = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-600/40 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* QR Code */}
          <div className="flex-shrink-0">
            {isLoading ? (
              <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : qrData?.qrDataUrl ? (
              <img
                src={qrData.qrDataUrl}
                alt="Check-in QR Code"
                className="w-20 h-20 rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                <QrCode className="w-8 h-8 text-slate-600" />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-300">Check-in Rápido</p>
            <p className="text-xs text-slate-400 mt-1">
              Escanea con tu celular
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-600/40 rounded-xl p-8 backdrop-blur-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-900/30 border border-indigo-500/30 rounded-full mb-4">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-indigo-300">Check-in Digital</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          ¿Tienes cita hoy?
        </h3>
        <p className="text-slate-400">
          Escanea el código QR con tu celular para hacer check-in
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {isLoading ? (
            <div className="w-64 h-64 bg-slate-800/50 rounded-2xl flex items-center justify-center">
              <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="w-64 h-64 bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center">
              <QrCode className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={refreshQR}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : qrData?.qrDataUrl ? (
            <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-indigo-500/20">
              <img
                src={qrData.qrDataUrl}
                alt="Check-in QR Code"
                className="w-56 h-56"
              />
            </div>
          ) : (
            <div className="w-64 h-64 bg-slate-800/50 rounded-2xl flex items-center justify-center">
              <QrCode className="w-16 h-16 text-slate-600" />
            </div>
          )}

          {/* Timer badge */}
          {!isLoading && !error && timeLeft > 0 && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full">
              <span className="text-xs text-slate-400">
                Actualiza en {formatTimeLeft(timeLeft)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-indigo-400">1</span>
          </div>
          <div>
            <p className="text-sm text-white font-medium">Abre la cámara de tu celular</p>
            <p className="text-xs text-slate-400">O usa cualquier app de escaneo QR</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-indigo-400">2</span>
          </div>
          <div>
            <p className="text-sm text-white font-medium">Apunta al código QR</p>
            <p className="text-xs text-slate-400">Se abrirá automáticamente el check-in</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-indigo-400">3</span>
          </div>
          <div>
            <p className="text-sm text-white font-medium">Ingresa tu código de cita</p>
            <p className="text-xs text-slate-400">6 dígitos que recibiste por SMS/email</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-indigo-700/30">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{clinicName}</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Sistema activo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
