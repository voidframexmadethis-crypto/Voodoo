import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Sparkles, Activity, BarChart2, Radio, Palette } from 'lucide-react';

export type VisualizerMode = 'bars' | 'wave' | 'dual';
export type VisualizerColor = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  glow: string;
};

export const VISUALIZER_THEMES: VisualizerColor[] = [
  { id: 'voodoo-purple', name: 'Voodoo Purple', primary: '#a855f7', secondary: '#c084fc', glow: 'rgba(168, 85, 247, 0.4)' },
  { id: 'electric-violet', name: 'Electric Violet', primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(139, 92, 246, 0.4)' },
  { id: 'cyber-cyan', name: 'Cyber Cyan', primary: '#06b6d4', secondary: '#67e8f9', glow: 'rgba(6, 182, 212, 0.4)' },
  { id: 'neon-emerald', name: 'Neon Emerald', primary: '#10b981', secondary: '#6ee7b7', glow: 'rgba(16, 185, 129, 0.4)' },
  { id: 'amber-gold', name: 'Amber Gold', primary: '#f59e0b', secondary: '#fcd34d', glow: 'rgba(245, 158, 11, 0.4)' },
  { id: 'crimson-fire', name: 'Crimson Fire', primary: '#ef4444', secondary: '#f87171', glow: 'rgba(239, 68, 68, 0.4)' },
];

interface AudioVisualizerProps {
  className?: string;
  height?: number;
  showControls?: boolean;
}

export default function AudioVisualizer({
  className = '',
  height = 120,
  showControls = true
}: AudioVisualizerProps) {
  const { isPlaying, getFrequencyData, getTimeDomainData, initWebAudio } = useAudioPlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<VisualizerMode>('bars');
  const [currentTheme, setCurrentTheme] = useState<VisualizerColor>(() => {
    const saved = localStorage.getItem('VOODOO_VIZ_THEME');
    if (saved) {
      const found = VISUALIZER_THEMES.find(t => t.id === saved);
      if (found) return found;
    }
    return VISUALIZER_THEMES[0];
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Peak history for smooth bar decay
  const peakHistoryRef = useRef<number[]>([]);

  const handleThemeChange = (theme: VisualizerColor) => {
    setCurrentTheme(theme);
    localStorage.setItem('VOODOO_VIZ_THEME', theme.id);
    setShowColorPicker(false);
  };

  useEffect(() => {
    if (isPlaying) {
      initWebAudio();
    }
  }, [isPlaying, initWebAudio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = (height || rect.height || 120) * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);
    resizeCanvas();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Main render loop
    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;

      ctx.clearRect(0, 0, width, canvasHeight);

      // Deep dark canvas background
      ctx.fillStyle = 'rgba(7, 7, 10, 0.95)';
      ctx.fillRect(0, 0, width, canvasHeight);

      // Subtle background grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSteps = 4;
      for (let i = 1; i < gridSteps; i++) {
        const y = (canvasHeight / gridSteps) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (!isPlaying) {
        // Resting flatline at center or bottom (Zero fake movement)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight / 2);
        ctx.lineTo(width, canvasHeight / 2);
        ctx.stroke();

        // Subtle resting dots
        const numDots = 32;
        const dotSpacing = width / numDots;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < numDots; i++) {
          ctx.beginPath();
          ctx.arc(i * dotSpacing + dotSpacing / 2, canvasHeight / 2, 1, 0, Math.PI * 2);
          ctx.fill();
        }

        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const freqData = getFrequencyData();
      const timeData = getTimeDomainData();

      if (mode === 'bars' || mode === 'dual') {
        // Draw Frequency Spectrum Bars
        const barCount = Math.min(48, Math.floor(width / 8));
        const barWidth = Math.max(3, (width / barCount) - 3);
        const barSpacing = (width - (barCount * barWidth)) / (barCount + 1);

        if (peakHistoryRef.current.length !== barCount) {
          peakHistoryRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          let value = 0;
          if (freqData && freqData.length > 0) {
            // Map bar index to frequency bins logarithmically
            const binIdx = Math.floor(Math.pow(i / barCount, 1.3) * (freqData.length * 0.75));
            value = freqData[Math.min(binIdx, freqData.length - 1)] / 255;
          }

          // Smooth peak decay
          if (value > peakHistoryRef.current[i]) {
            peakHistoryRef.current[i] = value;
          } else {
            peakHistoryRef.current[i] = Math.max(0, peakHistoryRef.current[i] - 0.035);
          }

          const currentVal = peakHistoryRef.current[i];
          const barHeight = Math.max(4, currentVal * (canvasHeight - 16));
          const x = barSpacing + i * (barWidth + barSpacing);
          const y = canvasHeight - barHeight - 4;

          // Gradient for bar
          const gradient = ctx.createLinearGradient(0, y, 0, canvasHeight);
          gradient.addColorStop(0, currentTheme.secondary);
          gradient.addColorStop(1, currentTheme.primary);

          ctx.fillStyle = gradient;
          ctx.shadowColor = currentTheme.glow;
          ctx.shadowBlur = currentVal > 0.6 ? 8 : 2;

          // Rounded top bar
          const radius = Math.min(barWidth / 2, 3);
          ctx.beginPath();
          ctx.moveTo(x, y + radius);
          ctx.arcTo(x, y, x + radius, y, radius);
          ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
          ctx.lineTo(x + barWidth, canvasHeight - 4);
          ctx.lineTo(x, canvasHeight - 4);
          ctx.closePath();
          ctx.fill();

          // Peak cap indicator
          if (currentVal > 0.08) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, Math.max(2, y - 2), barWidth, 1.5);
          }
        }
        ctx.shadowBlur = 0;
      }

      if (mode === 'wave' || mode === 'dual') {
        // Draw Oscilloscope Waveform
        if (timeData && timeData.length > 0) {
          ctx.lineWidth = mode === 'dual' ? 1.5 : 2.5;
          ctx.strokeStyle = mode === 'dual' ? '#ffffff' : currentTheme.primary;
          ctx.shadowColor = currentTheme.glow;
          ctx.shadowBlur = 6;

          ctx.beginPath();
          const sliceWidth = width / timeData.length;
          let x = 0;

          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0; // 0..2
            const y = (v * canvasHeight) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [isPlaying, mode, currentTheme, height, getFrequencyData, getTimeDomainData]);

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950/90 shadow-xl ${className}`}>
      {/* Visualizer Top Bar & Customization Toolbar */}
      {showControls && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-900 bg-black/40 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
              Real-Time Spectrum
            </span>
            {isPlaying ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE FFT
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500 text-[10px] font-bold">
                STANDBY
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
              <button
                onClick={() => setMode('bars')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  mode === 'bars' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                title="Frequency Spectrum Bars"
              >
                <BarChart2 className="w-3 h-3" />
                <span className="hidden sm:inline">Bars</span>
              </button>
              <button
                onClick={() => setMode('wave')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  mode === 'wave' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                title="Oscilloscope Waveform"
              >
                <Activity className="w-3 h-3" />
                <span className="hidden sm:inline">Wave</span>
              </button>
              <button
                onClick={() => setMode('dual')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  mode === 'dual' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                title="Dual Spectrum"
              >
                <Radio className="w-3 h-3" />
                <span className="hidden sm:inline">Dual</span>
              </button>
            </div>

            {/* Color Accent Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-7 h-7 rounded-lg border border-neutral-800 flex items-center justify-center transition-colors hover:border-neutral-700"
                style={{ backgroundColor: `${currentTheme.primary}20` }}
                title="Customize Visualizer Accent Color"
              >
                <span 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: currentTheme.primary }}
                />
              </button>

              {showColorPicker && (
                <div className="absolute right-0 top-9 z-30 p-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col gap-1.5 w-40">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider px-1 pb-1 border-b border-neutral-800">
                    Visualizer Accent
                  </span>
                  {VISUALIZER_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-left text-xs transition-colors ${
                        currentTheme.id === theme.id ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full shrink-0" 
                        style={{ backgroundColor: theme.primary }} 
                      />
                      <span className="truncate">{theme.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full relative"
        style={{ height: `${height}px` }}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block" 
        />
      </div>
    </div>
  );
}
