import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1,
  X, 
  Music, 
  ChevronUp, 
  ChevronDown, 
  Disc, 
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Shuffle,
  Repeat,
  Repeat1,
  ShoppingCart,
  User,
  Info,
  Sliders,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ListMusic,
  Radio,
  Layers,
  Package,
  SlidersHorizontal,
  Activity,
  Gauge,
  Heart,
  Share2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useStore } from '../context/StoreContext';
import CheckoutModal from './CheckoutModal';
import CheckoutErrorBoundary from './CheckoutErrorBoundary';
import AudioVisualizer from './AudioVisualizer';
import LivePlaybackControls from './LivePlaybackControls';

export default function AudioPlayer() {
  const { 
    currentTrack,
    activePlaybackItem,
    playbackType,
    currentPackId,
    activeTrackNum,
    isPlaying, 
    isBuffering,
    isLoading,
    currentTime, 
    duration, 
    bufferedPercent,
    volume, 
    isMuted,
    repeatMode,
    isShuffle,
    playbackError,
    waveformData,
    speed,
    pitchSemitones,
    isLooping,
    loopStart,
    loopEnd,
    queue,
    queueIndex,
    togglePlay, 
    seek, 
    skipForward,
    skipBackward,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    setRepeatMode,
    toggleShuffle,
    retryPlayback,
    playTrack,
    continuousPlaybackEnabled,
    setContinuousPlaybackEnabled,
    removeFromQueue,
    clearQueue,
    reorderQueue
  } = useAudioPlayer();
  
  const { state, updateBeat, incrementAnalytics, favorites, toggleFavorite } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'monitor' | 'modifiers' | 'queue'>('monitor');
  const [checkoutBeat, setCheckoutBeat] = useState<any | null>(null);
  const [isHoveringWaveform, setIsHoveringWaveform] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Custom states for continuous scrubbing & sharing
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingMicro, setIsDraggingMicro] = useState(false);
  const microScrubberRef = useRef<HTMLDivElement | null>(null);
  const [copiedPlayer, setCopiedPlayer] = useState(false);

  // Helper to translate coordinates into seek times
  const handleScrub = (clientX: number, container: HTMLDivElement) => {
    if (!duration) return;
    const rect = container.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  // Expanded Waveform Scrubbing drag effects
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (waveformContainerRef.current) {
        handleScrub(e.clientX, waveformContainerRef.current);
      }
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault(); // Prevent body scroll while scrubbing on iPad
      }
      if (waveformContainerRef.current && e.touches[0]) {
        handleScrub(e.touches[0].clientX, waveformContainerRef.current);
      }
    };

    const handleWindowTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [isDragging, duration]);

  // Micro Scrubber Continuous dragging scrub effects
  useEffect(() => {
    if (!isDraggingMicro) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (microScrubberRef.current) {
        handleScrub(e.clientX, microScrubberRef.current);
      }
    };

    const handleWindowMouseUp = () => {
      setIsDraggingMicro(false);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      if (microScrubberRef.current && e.touches[0]) {
        handleScrub(e.touches[0].clientX, microScrubberRef.current);
      }
    };

    const handleWindowTouchEnd = () => {
      setIsDraggingMicro(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [isDraggingMicro, duration]);

  // Unified Share & Copy handler
  const handleSharePlayer = async () => {
    const item = activePlaybackItem || currentTrack;
    if (!item) return;

    const cleanId = item.id.includes('_track_') ? currentTrack?.id || item.id : item.id;
    const shareUrl = `${window.location.origin}${window.location.pathname}?beat=${cleanId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Listen to "${item.title}" on Voodoo Boomin!`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedPlayer(true);
      setTimeout(() => setCopiedPlayer(false), 2500);
    } catch (e) {
      console.error('Clipboard error:', e);
    }
  };

  if (!activePlaybackItem && !currentTrack) return null;

  const displayTitle = activePlaybackItem?.title || currentTrack?.title || 'Untitled Instrumental';
  const displayProducer = (activePlaybackItem?.artist || currentTrack?.producer || 'Voodoo Boomin').toUpperCase() === 'KRYPSIDE' 
    ? 'VOODOO BOOMIN' 
    : (activePlaybackItem?.artist || currentTrack?.producer || 'Voodoo Boomin');
  
  const displayCover = activePlaybackItem?.coverArtUrl || currentTrack?.coverArtUrl || '';
  const displayBpm = activePlaybackItem?.bpm || currentTrack?.bpm;
  const displayKey = activePlaybackItem?.key || currentTrack?.key;
  const displayPrice = activePlaybackItem?.price !== undefined ? activePlaybackItem.price : (currentTrack?.price !== undefined ? currentTrack.price : 29.99);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const remainingTime = duration && duration > currentTime ? duration - currentTime : 0;
  const progressPercent = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  // Waveform click / drag seek calculation
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformContainerRef.current || !duration) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformContainerRef.current || !duration) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverTime(ratio * duration);
  };

  const cycleRepeatMode = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const handlePurchase = () => {
    if (currentTrack) {
      setCheckoutBeat(currentTrack);
    }
  };

  const handlePurchaseSuccess = (beat: any) => {
    updateBeat(beat.id, { purchases: (beat.purchases || 0) + 1, earnings: (beat.earnings || 0) + beat.price });
    incrementAnalytics('totalEarnings', beat.price);
    incrementAnalytics('platformFees', beat.price * 0.25);
  };

  return (
    <>
      {/* 🚀 EXPANDED STUDIO MONITOR / QUEUE DRAWER */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 140 }}
            className="fixed bottom-[74px] sm:bottom-[80px] left-0 right-0 z-40 bg-neutral-950/98 border-t border-purple-900/40 backdrop-blur-2xl shadow-[0_-25px_60px_rgba(0,0,0,0.98)] text-white overflow-y-auto max-h-[85vh] md:max-h-[640px]"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
              {/* Header inside the Expanded Drawer */}
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
                    <button
                      onClick={() => setActiveDrawerTab('monitor')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeDrawerTab === 'monitor'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Studio Monitor
                    </button>
                    <button
                      onClick={() => setActiveDrawerTab('modifiers')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeDrawerTab === 'modifiers'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Live Modifiers
                      {(pitchSemitones !== 0 || speed !== 1.0 || isLooping) && (
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveDrawerTab('queue')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeDrawerTab === 'queue'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <ListMusic className="w-3.5 h-3.5" />
                      Up Next ({queue.length})
                    </button>
                  </div>

                  {playbackType === 'BEAT_PACK_PREVIEW' && (
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[10px] text-indigo-300 font-extrabold tracking-wider uppercase">
                      Beat Pack Preview Engine
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
                  title="Minimize Player"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Tab 1: Studio Monitor View */}
              {activeDrawerTab === 'monitor' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6">
                    {/* Glowing cover artwork */}
                    <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0 bg-neutral-950 border border-purple-900/50 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.2)] group relative">
                      <img 
                        src={displayCover} 
                        alt={displayTitle} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      {isPlaying && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-purple-500/40 text-[10px] font-black text-purple-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                          LIVE STREAM
                        </div>
                      )}
                    </div>

                    {/* Metadata, tags and stream specs */}
                    <div className="flex-1 flex flex-col justify-between w-full">
                      <div className="space-y-3 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-[10px] font-extrabold text-purple-300 uppercase tracking-widest">
                            {activePlaybackItem?.genre || 'TRAP'}
                          </span>
                          {displayBpm && (
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
                              {Math.round(displayBpm * speed)} BPM {speed !== 1.0 ? `(${Math.round(speed * 100)}%)` : ''}
                            </span>
                          )}
                          {displayKey && (
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
                              {displayKey} {pitchSemitones !== 0 ? `(${pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones}st)` : ''}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-emerald-400 font-bold">
                            LOSSLESS 44.1kHz • 320kbps
                          </span>
                        </div>

                        <div>
                          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                            {displayTitle}
                          </h2>
                          <p className="text-sm font-bold text-neutral-400 uppercase tracking-wider mt-1">
                            Produced by <span className="text-purple-400">{displayProducer}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action Bar inside Expanded View */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 pt-4 border-t border-neutral-900">
                        {currentTrack && (
                          <button 
                            onClick={handlePurchase}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>License & Purchase (${displayPrice.toFixed(2)})</span>
                          </button>
                        )}

                        <button 
                          onClick={handleSharePlayer}
                          className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 relative cursor-pointer"
                          title="Share / Copy Beat Link"
                        >
                          <Share2 className="w-4 h-4 text-purple-400" />
                          <span>{copiedPlayer ? 'Link Copied!' : 'Share Beat'}</span>
                        </button>

                        <span className="text-xs text-neutral-500 font-mono">
                          Source Audio Protected • Stream Safe
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🎛️ Real-Time Audio Visualizer */}
                  <AudioVisualizer height={140} showControls={true} />

                  {/* Interactive Dynamic Waveform Visualizer Display with Loop Highlighting */}
                  <div className="bg-neutral-900/60 border border-purple-900/30 rounded-2xl p-4 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                      <span className="text-purple-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> High-Resolution Amplitude Track Map
                      </span>
                      <span>Click or drag along waveform to seek accurately</span>
                    </div>

                    <div 
                      ref={waveformContainerRef}
                      onMouseDown={(e) => {
                        if (e.button === 0) {
                          setIsDragging(true);
                          handleScrub(e.clientX, waveformContainerRef.current!);
                        }
                      }}
                      onTouchStart={(e) => {
                        setIsDragging(true);
                        if (e.touches[0]) {
                          handleScrub(e.touches[0].clientX, waveformContainerRef.current!);
                        }
                      }}
                      onMouseMove={handleWaveformMouseMove}
                      onMouseEnter={() => setIsHoveringWaveform(true)}
                      onMouseLeave={() => setIsHoveringWaveform(false)}
                      className="relative h-20 sm:h-24 flex items-end gap-[3px] sm:gap-1 cursor-pointer select-none group pt-4"
                    >
                      {/* Active 4-Bar Loop Region Highlight */}
                      {isLooping && duration > 0 && loopEnd > loopStart && (
                        <div 
                          className="absolute top-0 bottom-0 bg-purple-500/20 border-x-2 border-purple-400/80 z-10 pointer-events-none rounded transition-all"
                          style={{
                            left: `${(loopStart / duration) * 100}%`,
                            width: `${((loopEnd - loopStart) / duration) * 100}%`,
                          }}
                        >
                          <span className="absolute -top-4 left-1 text-[9px] font-mono font-bold text-purple-300 bg-purple-950/90 px-1 py-0.2 rounded">
                            4-BAR LOOP
                          </span>
                        </div>
                      )}

                      {/* Hover seeker line */}
                      {isHoveringWaveform && (
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
                          style={{ left: `${(hoverTime / (duration || 1)) * 100}%` }}
                        >
                          <span className="absolute -top-5 -translate-x-1/2 bg-black/90 text-[10px] font-mono text-white px-1.5 py-0.5 rounded border border-neutral-700">
                            {formatTime(hoverTime)}
                          </span>
                        </div>
                      )}

                      {(waveformData.length > 0 ? waveformData : Array(64).fill(40)).map((peak, idx) => {
                        const barPct = (idx / (waveformData.length || 64)) * 100;
                        const isPassed = barPct <= progressPercent;
                        return (
                          <div 
                            key={idx}
                            className="flex-1 rounded-full transition-all duration-75"
                            style={{ 
                              height: `${peak}%`,
                              backgroundColor: isPassed ? '#a855f7' : '#262626'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Embedded Live Playback Controls */}
                  <LivePlaybackControls />
                </div>
              )}

              {/* Tab 2: Modifiers & DSP View */}
              {activeDrawerTab === 'modifiers' && (
                <div className="space-y-6">
                  <LivePlaybackControls />
                  <AudioVisualizer height={160} showControls={true} />
                </div>
              )}

              {/* Tab 3: Up Next Queue View */}
              {activeDrawerTab === 'queue' && (
                <div className="space-y-4">
                  {/* Dynamic Control Area: Continuous Playback Toggle & Clean up */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-900">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                        Now Playing & Upcoming Playlist ({queue.length} Beats)
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Feature 12 — Continuous Playback Autoplay Switch */}
                      <button
                        onClick={() => setContinuousPlaybackEnabled(!continuousPlaybackEnabled)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          continuousPlaybackEnabled
                            ? 'bg-emerald-600 border border-emerald-500 text-white shadow-md shadow-emerald-600/20 font-extrabold'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                        title="Automatically plays the next beat in queue when the current one finishes"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${continuousPlaybackEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
                        Continuous Playback: {continuousPlaybackEnabled ? 'ON' : 'OFF'}
                      </button>

                      {queue.length > 0 && (
                        <button
                          onClick={() => clearQueue()}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-950/30 hover:bg-red-900/20 border border-red-900/30 text-red-400 hover:text-red-300 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear Queue
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feature 11 — Queue List Representation */}
                  <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-neutral-900/60 scrollbar-thin scrollbar-thumb-neutral-850">
                    {queue.length === 0 ? (
                      <div className="text-center py-16 text-neutral-500 text-xs font-mono">
                        Your listening queue is empty. Explore the Marketplace and tap "Add to Queue" on beats to fill this up!
                      </div>
                    ) : (
                      queue.map((item, idx) => {
                        const isCurrent = idx === queueIndex;
                        return (
                          <div
                            key={`${item.id}_${idx}`}
                            onClick={() => playTrack(item, queue, idx)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                              isCurrent 
                                ? 'bg-purple-950/30 border border-purple-500/30 text-white' 
                                : 'hover:bg-neutral-900/60 text-neutral-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-xs font-bold text-neutral-500 w-6 shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-850">
                                <img src={item.coverArtUrl || displayCover} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <span className={`text-sm font-bold truncate block ${isCurrent ? 'text-purple-400 font-extrabold' : 'text-white'}`}>
                                  {item.title}
                                </span>
                                <span className="text-[11px] text-neutral-500 block truncate">
                                  {item.artist} {item.type === 'BEAT_PACK_PREVIEW' ? '• Beat Pack Preview' : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {isCurrent && isPlaying && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold animate-pulse">
                                  PLAYING
                                </span>
                              )}

                              {/* Up/Down Reordering Buttons (Touch Safe iPad Controls) */}
                              <div className="flex items-center border border-neutral-900 bg-neutral-950/60 rounded-lg p-0.5 shrink-0">
                                <button
                                  disabled={idx === 0}
                                  onClick={() => reorderQueue(idx, idx - 1)}
                                  className="p-1 rounded text-neutral-500 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors cursor-pointer"
                                  title="Move Up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={idx === queue.length - 1}
                                  onClick={() => reorderQueue(idx, idx + 1)}
                                  className="p-1 rounded text-neutral-500 hover:text-white disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors cursor-pointer"
                                  title="Move Down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Remove individual track button */}
                              <button
                                onClick={() => removeFromQueue(idx)}
                                className="p-2 rounded-lg bg-neutral-900/60 hover:bg-red-950/30 text-neutral-400 hover:text-red-400 border border-neutral-800/40 hover:border-red-900/30 transition-all cursor-pointer flex items-center justify-center shrink-0"
                                title="Remove from queue"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎵 PRIMARY FLOATING BOTTOM AUDIO PLAYER BAR (Spotify / Apple Music Inspired) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-purple-900/30 backdrop-blur-xl shadow-[0_-10px_35px_rgba(0,0,0,0.9)] text-white select-none">
        {/* Network Error Recovery Strip */}
        {playbackError && (
          <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{playbackError}</span>
            </div>
            <button
              onClick={retryPlayback}
              className="px-2.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-[10px] uppercase tracking-wider transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Micro Waveform / Progress Scrub Header Line */}
        <div 
          ref={microScrubberRef}
          onMouseDown={(e) => {
            if (e.button === 0) {
              setIsDraggingMicro(true);
              handleScrub(e.clientX, microScrubberRef.current!);
            }
          }}
          onTouchStart={(e) => {
            setIsDraggingMicro(true);
            if (e.touches[0]) {
              handleScrub(e.touches[0].clientX, microScrubberRef.current!);
            }
          }}
          className="relative h-2 w-full bg-neutral-900/90 cursor-pointer group hover:h-3.5 transition-all duration-150 overflow-hidden"
          title="Scrub Track Position"
        >
          {/* Buffered Background Bar */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-neutral-700/60 transition-all duration-200"
            style={{ width: `${bufferedPercent}%` }}
          />

          {/* Active 4-Bar Loop Region Highlight on Micro Scrubber */}
          {isLooping && duration > 0 && loopEnd > loopStart && (
            <div 
              className="absolute top-0 bottom-0 bg-purple-500/40 border-x border-purple-300 z-10 pointer-events-none"
              style={{
                left: `${(loopStart / duration) * 100}%`,
                width: `${((loopEnd - loopStart) / duration) * 100}%`,
              }}
            />
          )}

          {/* Active Playback Progress Fill */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-400 transition-all duration-75 relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Scrubber thumb circle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Player Controls Container */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Column: Artwork & Track Info */}
          <div className="flex items-center gap-3 min-w-0 max-w-[42%] sm:max-w-[340px]">
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden bg-neutral-900 border border-purple-900/40 shrink-0 cursor-pointer group shadow-md"
            >
              {displayCover ? (
                <img 
                  src={displayCover} 
                  alt={displayTitle} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-950 text-purple-400">
                  <Music className="w-5 h-5" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronUp className="w-4 h-4 text-white" />}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate block tracking-tight">
                  {displayTitle}
                </span>
                {playbackType === 'BEAT_PACK_PREVIEW' && (
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-wider shrink-0">
                    PACK #{activeTrackNum}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-neutral-400 truncate block mt-0.5">
                {displayProducer}
              </span>
            </div>

            {/* Quick Favorites & Sharing Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-1">
              <button
                onClick={() => currentTrack && toggleFavorite(currentTrack.id)}
                className={`p-1.5 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer ${
                  currentTrack && favorites.includes(currentTrack.id) ? 'text-red-500' : 'text-neutral-400 hover:text-white'
                }`}
                title={currentTrack && favorites.includes(currentTrack.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`w-3.5 h-3.5 ${currentTrack && favorites.includes(currentTrack.id) ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleSharePlayer}
                className="p-1.5 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors relative cursor-pointer"
                title="Share / Copy Beat Link"
              >
                {copiedPlayer && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-purple-600 text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap animate-bounce z-50">
                    COPIED!
                  </span>
                )}
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Column: Master Playback Transport Controls */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-xl">
            <div className="flex items-center gap-1.5 sm:gap-4">
              {/* Shuffle Toggle */}
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-lg transition-colors hidden sm:flex items-center justify-center ${
                  isShuffle ? 'text-purple-400 bg-purple-500/10' : 'text-neutral-400 hover:text-white'
                }`}
                title="Shuffle Queue"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Previous Track */}
              <button
                onClick={prevTrack}
                className="p-2 sm:p-2.5 text-neutral-300 hover:text-white transition-all active:scale-90 cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              {/* 10s Rewind */}
              <button
                onClick={() => skipBackward(10)}
                className="p-1.5 text-neutral-400 hover:text-white transition-all active:scale-90 hidden md:block"
                title="Rewind 10 Seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Central Play / Pause Master Button */}
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 transition-all hover:scale-105 active:scale-95 cursor-pointer relative"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering || isLoading ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* 10s Fast-Forward */}
              <button
                onClick={() => skipForward(10)}
                className="p-1.5 text-neutral-400 hover:text-white transition-all active:scale-90 hidden md:block"
                title="Forward 10 Seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Next Track */}
              <button
                onClick={nextTrack}
                className="p-2 sm:p-2.5 text-neutral-300 hover:text-white transition-all active:scale-90 cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              {/* Repeat Mode Toggle */}
              <button
                onClick={cycleRepeatMode}
                className={`p-2 rounded-lg transition-colors hidden sm:flex items-center justify-center ${
                  repeatMode !== 'off' ? 'text-purple-400 bg-purple-500/10' : 'text-neutral-400 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>

            {/* Time counters under transport on larger screens */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 w-full justify-between px-2 hidden sm:flex">
              <span>{formatTime(currentTime)}</span>
              <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 uppercase tracking-widest font-sans font-bold">
                {isBuffering ? (
                  <span className="text-purple-400 animate-pulse">Buffering...</span>
                ) : (
                  <span>Voodoo Audio Stream Engine</span>
                )}
              </div>
              <span>-{formatTime(remainingTime)}</span>
            </div>
          </div>

          {/* Right Column: Volume, Queue & Quick Purchase */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Volume Control */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-18 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                title="Volume Slider"
              />
            </div>

            {/* Studio Monitor Drawer Toggle Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isExpanded 
                  ? 'bg-purple-600 border-purple-500 text-white' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
              title="Open Studio Monitor"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Studio</span>
            </button>

            {/* Quick Buy CTA */}
            {currentTrack && (
              <button
                onClick={handlePurchase}
                className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">${displayPrice.toFixed(2)}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal if user clicks purchase in player */}
      {checkoutBeat && (
        <CheckoutErrorBoundary>
          <CheckoutModal 
            beat={checkoutBeat} 
            onClose={() => setCheckoutBeat(null)}
            onSuccess={handlePurchaseSuccess}
          />
        </CheckoutErrorBoundary>
      )}
    </>
  );
}
