import React from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { 
  RotateCcw, 
  Repeat, 
  Gauge, 
  Music2, 
  Minus, 
  Plus, 
  SlidersHorizontal,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface LivePlaybackControlsProps {
  compact?: boolean;
  className?: string;
}

export default function LivePlaybackControls({
  compact = false,
  className = ''
}: LivePlaybackControlsProps) {
  const {
    currentTrack,
    activePlaybackItem,
    speed,
    pitchSemitones,
    isLooping,
    loopStart,
    loopEnd,
    currentTime,
    setSpeed,
    resetSpeed,
    setPitch,
    resetPitch,
    toggleLoop,
  } = useAudioPlayer();

  const originalBpm = activePlaybackItem?.bpm || currentTrack?.bpm || 140;
  const currentBpm = Math.round(originalBpm * speed);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  const speedPresets = [
    { label: '0.75x', value: 0.75 },
    { label: '0.85x', value: 0.85 },
    { label: '1.0x', value: 1.0 },
    { label: '1.15x', value: 1.15 },
    { label: '1.25x', value: 1.25 },
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        {/* Pitch Badge / Stepper */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
          <span className="text-[10px] font-mono text-neutral-400 pl-1.5 flex items-center gap-1 font-bold">
            <Music2 className="w-3 h-3 text-purple-400" />
            Pitch:
          </span>
          <button
            onClick={() => setPitch(pitchSemitones - 1)}
            className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold text-xs active:scale-95"
            title="Pitch Down (-1 Semitone)"
          >
            -
          </button>
          <span className={`text-xs font-mono font-bold px-1.5 min-w-[38px] text-center ${pitchSemitones !== 0 ? 'text-purple-400' : 'text-white'}`}>
            {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} st
          </span>
          <button
            onClick={() => setPitch(pitchSemitones + 1)}
            className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold text-xs active:scale-95"
            title="Pitch Up (+1 Semitone)"
          >
            +
          </button>
          {pitchSemitones !== 0 && (
            <button
              onClick={resetPitch}
              className="p-1 rounded-md text-[10px] text-purple-400 hover:text-white"
              title="Reset Pitch"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Speed / BPM */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
          <span className="text-[10px] font-mono text-neutral-400 pl-1.5 flex items-center gap-1 font-bold">
            <Gauge className="w-3 h-3 text-purple-400" />
            Speed:
          </span>
          <span className={`text-xs font-mono font-bold px-1.5 ${speed !== 1.0 ? 'text-purple-400' : 'text-white'}`}>
            {Math.round(speed * 100)}% ({currentBpm} BPM)
          </span>
          {speed !== 1.0 && (
            <button
              onClick={resetSpeed}
              className="p-1 rounded-md text-[10px] text-purple-400 hover:text-white"
              title="Reset Speed to 100%"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 4-Bar Loop Button */}
        <button
          onClick={() => toggleLoop(originalBpm)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 ${
            isLooping 
              ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/40 animate-pulse' 
              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
          }`}
          title="Toggle 4-Bar Precision Loop"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>4-Bar Loop {isLooping ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-purple-900/30 text-white space-y-4 shadow-xl ${className}`}>
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Live Playback Modifiers
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
            Real-Time DSP
          </span>
        </div>
        <span className="text-[10px] font-mono text-neutral-500">
          Source Audio Protected • Client-Side DSP
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Pitch Shift (Semitones) */}
        <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-purple-400" />
              Pitch Shifter
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                pitchSemitones !== 0 ? 'bg-purple-950 border border-purple-700 text-purple-300' : 'bg-neutral-900 text-neutral-400'
              }`}>
                {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} semitones
              </span>
              {pitchSemitones !== 0 && (
                <button
                  onClick={resetPitch}
                  className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] font-bold text-neutral-300 hover:text-white uppercase transition-colors"
                  title="Reset to 0 Semitones"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPitch(pitchSemitones - 1)}
              disabled={pitchSemitones <= -12}
              className="w-11 h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-800 flex items-center justify-center font-bold text-base active:scale-95 transition-all cursor-pointer"
              title="Shift Down 1 Semitone"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitchSemitones}
              onChange={(e) => setPitch(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              title="Pitch Semitone Slider (-12 to +12)"
            />

            <button
              onClick={() => setPitch(pitchSemitones + 1)}
              disabled={pitchSemitones >= 12}
              className="w-11 h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-800 flex items-center justify-center font-bold text-base active:scale-95 transition-all cursor-pointer"
              title="Shift Up 1 Semitone"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 px-1">
            <span>-12 st (Octave Down)</span>
            <span>0 st (Original)</span>
            <span>+12 st (Octave Up)</span>
          </div>
        </div>

        {/* 2. Speed / BPM Control */}
        <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              Tempo & BPM
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                speed !== 1.0 ? 'bg-purple-950 border border-purple-700 text-purple-300' : 'bg-neutral-900 text-neutral-400'
              }`}>
                {currentBpm} BPM ({Math.round(speed * 100)}%)
              </span>
              {speed !== 1.0 && (
                <button
                  onClick={resetSpeed}
                  className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[10px] font-bold text-neutral-300 hover:text-white uppercase transition-colors"
                  title="Reset to 100% / Original BPM"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              title="Playback Speed Slider"
            />

            <div className="flex items-center justify-between gap-1">
              {speedPresets.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setSpeed(preset.value)}
                  className={`flex-1 py-1 text-[10px] font-mono font-bold rounded-md transition-colors border ${
                    Math.abs(speed - preset.value) < 0.01 
                      ? 'bg-purple-600 border-purple-500 text-white' 
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 px-1">
            <span>50% (Slowdown)</span>
            <span>100% ({originalBpm} BPM)</span>
            <span>150% (Speedup)</span>
          </div>
        </div>

        {/* 3. 4-Bar Loop Function */}
        <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-purple-400" />
              4-Bar Loop
            </span>
            <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
              isLooping 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse' 
                : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
            }`}>
              {isLooping ? 'ACTIVE 4-BARS' : 'INACTIVE'}
            </span>
          </div>

          <button
            onClick={() => toggleLoop(originalBpm)}
            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer ${
              isLooping
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-600/40 border border-purple-400'
                : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white'
            }`}
          >
            <Repeat className={`w-4 h-4 ${isLooping ? 'animate-spin' : ''}`} />
            <span>{isLooping ? 'Exit 4-Bar Loop' : 'Activate 4-Bar Loop'}</span>
          </button>

          <div className="text-[10px] font-mono text-neutral-400 flex items-center justify-between px-1">
            {isLooping ? (
              <span className="text-purple-300 font-bold truncate">
                Loop: {formatTime(loopStart)} → {formatTime(loopEnd)} [4-Bars @ {currentBpm} BPM]
              </span>
            ) : (
              <span className="text-neutral-500 truncate">
                Loops 16 musical beats accurately from current position
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
