// =============================================================================
// AudioWaveform Component
// =============================================================================
// Animated audio waveform visualization
// Version: 0.1.0
// =============================================================================

'use client';

import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  volume: number; // 0-100
  className?: string;
}

export function AudioWaveform({
  isRecording,
  volume,
  className = '',
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 40;
    const barWidth = canvas.width / bars;
    const heights = new Array(bars).fill(0);

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isRecording) {
        // Update heights with random variation based on volume
        heights.forEach((_, i) => {
          const baseHeight = (volume / 100) * canvas.height * 0.8;
          const variation = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
          heights[i] = baseHeight * variation;
        });
      } else {
        // Decay to 0 when not recording
        heights.forEach((_, i) => {
          heights[i] *= 0.95;
        });
      }

      // Draw bars
      heights.forEach((height, i) => {
        const x = i * barWidth;
        const y = (canvas.height - height) / 2;

        // Gradient based on height
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // Blue
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0.8)'); // Purple

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, height);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, volume]);

  return (
    <div className={`audio-waveform ${className}`}>
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        style={{ width: '100%', height: '100px' }}
      />
    </div>
  );
}
