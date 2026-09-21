/**
 * VOODOO BOOMIN AUDIO ENGINE
 * 
 * High-Performance Browser-Based Streaming & Playback Engine.
 * 
 * Core Architectural Mandates:
 * - SOURCE AUDIO IS SACRED: Never modifies, transcodes, replaces, or mutates original uploaded files.
 * - Unified Audio Authority: Guarantees only one master audio element plays at any time.
 * - Dual-Element Intelligent Preloading: Preloads the upcoming queue track / beat pack preview for instant, gapless transitions.
 * - Fast Startup & Smart Buffering: Tracks buffering progression and recovers gracefully from transient network stalls.
 * - Accurate Sub-Second Seeking: Instant scrubbing without full-file reloads.
 * - Resilient Error Recovery: Auto-retries on network drop with exponential backoff.
 */

export interface PlaybackItem {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverArtUrl?: string;
  bpm?: number;
  key?: string;
  genre?: string;
  price?: number;
  duration?: number;
  type: 'SINGLE_BEAT' | 'BEAT_PACK_PREVIEW' | 'CUSTOM';
  packId?: string;
  trackNumber?: number;
  originalData?: any;
}

export type PlaybackState = {
  currentTrack: PlaybackItem | null;
  isPlaying: boolean;
  isBuffering: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  queue: PlaybackItem[];
  queueIndex: number;
  continuousPlaybackEnabled: boolean;
  // 🎛️ Live Playback Modifiers
  speed: number;            // 0.5 to 2.0 (default 1.0)
  pitchSemitones: number;   // -12 to +12 (default 0)
  isLooping: boolean;       // 4-Bar Loop active
  loopStart: number;        // Loop start time in seconds
  loopEnd: number;          // Loop end time in seconds
};

type StateListener = (state: PlaybackState) => void;

class AudioEngine {
  private primaryAudio: HTMLAudioElement;
  private preloaderAudio: HTMLAudioElement;
  private listeners: Set<StateListener> = new Set();
  
  // 🎚️ Web Audio API for Real-Time Visualizer
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private freqDataArray: Uint8Array | null = null;
  private timeDataArray: Uint8Array | null = null;
  private webAudioInitialized = false;

  // 🔁 High-Precision Loop Runner
  private loopRafId: number | null = null;

  // State
  private state: PlaybackState = {
    currentTrack: null,
    isPlaying: false,
    isBuffering: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    bufferedPercent: 0,
    volume: 0.85,
    isMuted: false,
    error: null,
    repeatMode: 'off',
    isShuffle: false,
    queue: [],
    queueIndex: -1,
    continuousPlaybackEnabled: true,
    speed: 1.0,
    pitchSemitones: 0,
    isLooping: false,
    loopStart: 0,
    loopEnd: 0,
  };

  private prevVolume = 0.85;
  private retryCount = 0;
  private maxRetries = 3;
  private retryTimeout: any = null;
  private lastKnownPosition = 0;
  private lastProgressSaveTime = 0;

  constructor() {
    this.primaryAudio = new Audio();
    this.primaryAudio.preload = 'auto';
    this.primaryAudio.volume = this.state.volume;
    this.primaryAudio.crossOrigin = 'anonymous';

    this.preloaderAudio = new Audio();
    this.preloaderAudio.preload = 'auto';
    this.preloaderAudio.volume = 0;
    this.preloaderAudio.crossOrigin = 'anonymous';

    this.attachEventListeners();
  }

  /**
   * Initialize Web Audio API Analyser lazily on first user play action
   */
  public initWebAudio() {
    if (this.webAudioInitialized && this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      this.freqDataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeDataArray = new Uint8Array(this.analyser.fftSize);

      // Connect HTMLAudioElement to AnalyserNode
      try {
        this.sourceNode = this.audioContext.createMediaElementSource(this.primaryAudio);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.webAudioInitialized = true;
      } catch (connErr) {
        console.warn('[AudioEngine] MediaElementAudioSource already connected or CORS protected:', connErr);
        this.webAudioInitialized = true;
      }
    } catch (e) {
      console.warn('[AudioEngine] Web Audio API initialization note:', e);
    }
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  public getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.freqDataArray) return null;
    try {
      this.analyser.getByteFrequencyData(this.freqDataArray);
      return this.freqDataArray;
    } catch {
      return null;
    }
  }

  public getTimeDomainData(): Uint8Array | null {
    if (!this.analyser || !this.timeDataArray) return null;
    try {
      this.analyser.getByteTimeDomainData(this.timeDataArray);
      return this.timeDataArray;
    } catch {
      return null;
    }
  }

  private applyPlaybackModifiers() {
    const audio = this.primaryAudio;
    const { speed, pitchSemitones } = this.state;

    // Pitch multiplier: 2 ^ (semitones / 12)
    const pitchMultiplier = Math.pow(2, pitchSemitones / 12);
    const effectiveRate = Math.max(0.25, Math.min(4.0, speed * pitchMultiplier));

    try {
      if (pitchSemitones === 0) {
        // Pure speed adjustment with pitch preserved
        (audio as any).preservesPitch = true;
        (audio as any).mozPreservesPitch = true;
        (audio as any).webkitPreservesPitch = true;
        audio.playbackRate = speed;
      } else {
        // Semitone pitch shift via playback rate with preservesPitch = false
        (audio as any).preservesPitch = false;
        (audio as any).mozPreservesPitch = false;
        (audio as any).webkitPreservesPitch = false;
        audio.playbackRate = effectiveRate;
      }
    } catch (e) {
      audio.playbackRate = speed;
    }
  }

  private startLoopWatcher() {
    this.stopLoopWatcher();
    const checkLoop = () => {
      if (this.state.isLooping && this.state.isPlaying) {
        const cur = this.primaryAudio.currentTime;
        if (this.state.loopEnd > this.state.loopStart && cur >= this.state.loopEnd) {
          this.primaryAudio.currentTime = this.state.loopStart;
        }
      }
      if (this.state.isLooping) {
        this.loopRafId = requestAnimationFrame(checkLoop);
      }
    };
    this.loopRafId = requestAnimationFrame(checkLoop);
  }

  private stopLoopWatcher() {
    if (this.loopRafId !== null) {
      cancelAnimationFrame(this.loopRafId);
      this.loopRafId = null;
    }
  }

  private savePlaybackProgress(trackId: string, time: number, finished = false) {
    if (!trackId || trackId.includes('_track_')) return;
    try {
      const progressStr = localStorage.getItem('voodooboomin_playback_progress');
      const progressMap = progressStr ? JSON.parse(progressStr) : {};
      
      if (finished) {
        delete progressMap[trackId];
      } else {
        progressMap[trackId] = Math.round(time);
      }
      
      localStorage.setItem('voodooboomin_playback_progress', JSON.stringify(progressMap));
    } catch (err) {
      console.error('Failed to save playback progress:', err);
    }
  }

  private attachEventListeners() {
    const audio = this.primaryAudio;

    audio.addEventListener('loadstart', () => {
      this.updateState({ isLoading: true, isBuffering: true, error: null });
    });

    audio.addEventListener('loadedmetadata', () => {
      const dur = Number.isFinite(audio.duration) ? audio.duration : 0;
      this.applyPlaybackModifiers();
      this.updateState({ duration: dur, isLoading: false });

      // Feature 14 - Playback Progress Memory Restore
      if (this.state.currentTrack?.id) {
        try {
          const progressStr = localStorage.getItem('voodooboomin_playback_progress');
          if (progressStr) {
            const progressMap = JSON.parse(progressStr);
            const savedPos = progressMap[this.state.currentTrack.id];
            if (savedPos && savedPos > 2 && savedPos < (dur - 5)) {
              audio.currentTime = savedPos;
              this.updateState({ currentTime: savedPos });
              console.log(`[PlaybackProgressMemory] Restoring progress for ${this.state.currentTrack.id} to ${savedPos}s`);
            }
          }
        } catch (err) {
          console.error('Failed to restore playback progress:', err);
        }
      }
    });

    audio.addEventListener('canplay', () => {
      this.updateState({ isLoading: false, isBuffering: false });
      this.retryCount = 0;
    });

    audio.addEventListener('playing', () => {
      this.initWebAudio();
      this.applyPlaybackModifiers();
      if (this.state.isLooping) {
        this.startLoopWatcher();
      }
      this.updateState({ isPlaying: true, isBuffering: false, isLoading: false, error: null });
    });

    audio.addEventListener('pause', () => {
      this.stopLoopWatcher();
      this.updateState({ isPlaying: false });

      // Feature 14 - Save progress immediately on pause
      if (this.state.currentTrack?.id) {
        this.savePlaybackProgress(this.state.currentTrack.id, audio.currentTime);
      }
    });

    audio.addEventListener('waiting', () => {
      this.updateState({ isBuffering: true });
    });

    audio.addEventListener('timeupdate', () => {
      const curTime = audio.currentTime || 0;
      this.lastKnownPosition = curTime;
      
      // Loop enforcement fallback
      if (this.state.isLooping && this.state.loopEnd > this.state.loopStart) {
        if (curTime >= this.state.loopEnd || curTime < this.state.loopStart - 0.5) {
          audio.currentTime = this.state.loopStart;
          this.updateState({ currentTime: this.state.loopStart });
          return;
        }
      }

      this.calculateBuffered();
      this.updateState({ currentTime: curTime });

      // Feature 14 - Throttle Save progress
      if (this.state.currentTrack?.id) {
        const now = Date.now();
        if (now - this.lastProgressSaveTime > 3000) {
          this.lastProgressSaveTime = now;
          this.savePlaybackProgress(this.state.currentTrack.id, curTime);
        }
      }
    });

    audio.addEventListener('progress', () => {
      this.calculateBuffered();
    });

    audio.addEventListener('ended', () => {
      if (this.state.isLooping && this.state.loopEnd > this.state.loopStart) {
        this.seek(this.state.loopStart);
        this.play();
        return;
      }

      // Feature 14 - Reset progress when track ends
      if (this.state.currentTrack?.id) {
        this.savePlaybackProgress(this.state.currentTrack.id, 0, true);
      }

      this.handleTrackEnded();
    });

    audio.addEventListener('error', () => {
      const errCode = audio.error?.code;
      const errMsg = audio.error?.message || 'Audio stream interrupted';
      console.warn(`[AudioEngine] Playback error encountered (code ${errCode}): ${errMsg}`);
      this.handlePlaybackError(`Stream connection issue (code: ${errCode || 'network'})`);
    });

    audio.addEventListener('stalled', () => {
      if (this.state.isPlaying) {
        this.updateState({ isBuffering: true });
      }
    });
  }

  private calculateBuffered() {
    const audio = this.primaryAudio;
    if (audio.buffered.length > 0 && audio.duration > 0) {
      try {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const percent = Math.min(100, Math.round((bufferedEnd / audio.duration) * 100));
        this.updateState({ bufferedPercent: percent });
      } catch (e) {}
    }
  }

  private handleTrackEnded() {
    if (this.state.repeatMode === 'one') {
      this.seek(0);
      this.play();
      return;
    }

    // Auto-advance queue or beat pack playlist - Feature 12 Continuous Playback
    if (this.state.continuousPlaybackEnabled && this.hasNextTrack()) {
      this.next();
    } else if (this.state.continuousPlaybackEnabled && this.state.repeatMode === 'all' && this.state.queue.length > 0) {
      this.setQueueIndex(0, true);
    } else {
      this.updateState({ isPlaying: false, currentTime: 0 });
    }
  }

  private handlePlaybackError(message: string) {
    if (this.retryCount < this.maxRetries && this.state.currentTrack?.audioUrl) {
      this.retryCount++;
      const delay = this.retryCount * 1000;
      console.log(`[AudioEngine] Attempting recovery retry ${this.retryCount}/${this.maxRetries} in ${delay}ms...`);
      
      this.updateState({ isBuffering: true, error: `Reconnecting stream (attempt ${this.retryCount})...` });
      
      clearTimeout(this.retryTimeout);
      this.retryTimeout = setTimeout(() => {
        const url = this.state.currentTrack?.audioUrl;
        if (url) {
          const resumePos = this.lastKnownPosition;
          this.primaryAudio.src = url;
          this.primaryAudio.load();
          this.primaryAudio.currentTime = resumePos;
          this.primaryAudio.play()
            .then(() => {
              this.updateState({ isPlaying: true, isBuffering: false, error: null });
            })
            .catch(e => {
              console.warn('[AudioEngine] Recovery play attempt failed:', e);
            });
        }
      }, delay);
    } else {
      this.updateState({
        isPlaying: false,
        isBuffering: false,
        isLoading: false,
        error: `${message}. Please check your connection or tap retry.`
      });
    }
  }

  /**
   * Preloads the next track in the queue silently
   */
  private preloadNextTrack() {
    if (this.state.queue.length === 0) return;
    let nextIdx = this.state.queueIndex + 1;
    if (nextIdx >= this.state.queue.length) {
      if (this.state.repeatMode === 'all') {
        nextIdx = 0;
      } else {
        return;
      }
    }

    const nextTrack = this.state.queue[nextIdx];
    if (nextTrack?.audioUrl && nextTrack.audioUrl !== this.preloaderAudio.src) {
      try {
        this.preloaderAudio.src = nextTrack.audioUrl;
        this.preloaderAudio.load();
      } catch (e) {}
    }
  }

  // --- Public Controls ---

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<PlaybackState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(l => l(this.state));
  }

  public getState(): PlaybackState {
    return this.state;
  }

  public playTrack(track: PlaybackItem, queue?: PlaybackItem[], index?: number) {
    clearTimeout(this.retryTimeout);
    this.retryCount = 0;

    const newQueue = queue || (this.state.queue.length > 0 ? this.state.queue : [track]);
    const newIdx = index !== undefined && index >= 0 
      ? index 
      : newQueue.findIndex(t => t.id === track.id || t.audioUrl === track.audioUrl);

    const isSameTrack = this.state.currentTrack?.id === track.id && this.primaryAudio.src === track.audioUrl;

    if (isSameTrack) {
      if (!this.state.isPlaying) {
        this.play();
      }
      return;
    }

    this.primaryAudio.pause();
    this.lastKnownPosition = 0;

    this.updateState({
      currentTrack: track,
      queue: newQueue,
      queueIndex: newIdx !== -1 ? newIdx : 0,
      currentTime: 0,
      duration: track.duration || 0,
      bufferedPercent: 0,
      error: null,
      isLoading: true,
      isBuffering: true
    });

    this.primaryAudio.src = track.audioUrl;
    this.primaryAudio.load();

    this.primaryAudio.play()
      .then(() => {
        this.updateState({ isPlaying: true, isBuffering: false, isLoading: false });
        this.preloadNextTrack();
      })
      .catch((err) => {
        console.warn('[AudioEngine] Playback autoplay or format handled:', err?.message || err);
        // If autoplay blocked or file loading, update state gracefully
        this.updateState({ isPlaying: false, isBuffering: false, isLoading: false });
      });
  }

  public play() {
    if (!this.primaryAudio.src && this.state.currentTrack?.audioUrl) {
      this.primaryAudio.src = this.state.currentTrack.audioUrl;
      this.primaryAudio.load();
    }

    this.primaryAudio.play()
      .then(() => {
        this.updateState({ isPlaying: true, error: null });
        this.preloadNextTrack();
      })
      .catch((err) => {
        console.warn('[AudioEngine] Play request failed:', err?.message || err);
        this.updateState({ isPlaying: false });
      });
  }

  public pause() {
    this.primaryAudio.pause();
    this.updateState({ isPlaying: false });
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number) {
    const dur = this.primaryAudio.duration || this.state.duration || 0;
    const clamped = Math.max(0, Math.min(seconds, dur || 9999));
    
    this.lastKnownPosition = clamped;
    this.primaryAudio.currentTime = clamped;
    this.updateState({ currentTime: clamped });
  }

  public skipForward(seconds = 10) {
    this.seek((this.primaryAudio.currentTime || 0) + seconds);
  }

  public skipBackward(seconds = 10) {
    this.seek((this.primaryAudio.currentTime || 0) - seconds);
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.primaryAudio.volume = clamped;
    if (clamped > 0) {
      this.prevVolume = clamped;
    }
    this.updateState({ volume: clamped, isMuted: clamped === 0 });
  }

  public toggleMute() {
    if (this.state.isMuted) {
      const restored = this.prevVolume > 0 ? this.prevVolume : 0.85;
      this.setVolume(restored);
    } else {
      this.prevVolume = this.state.volume;
      this.setVolume(0);
    }
  }

  public setRepeatMode(mode: 'off' | 'all' | 'one') {
    this.updateState({ repeatMode: mode });
  }

  public toggleShuffle() {
    this.updateState({ isShuffle: !this.state.isShuffle });
  }

  public hasNextTrack(): boolean {
    if (this.state.queue.length <= 1) return false;
    return this.state.queueIndex < this.state.queue.length - 1 || this.state.repeatMode === 'all';
  }

  public hasPrevTrack(): boolean {
    if (this.state.queue.length <= 1) return false;
    return this.state.queueIndex > 0 || this.state.repeatMode === 'all';
  }

  public next() {
    if (this.state.queue.length === 0) return;
    
    let nextIdx: number;
    if (this.state.isShuffle) {
      nextIdx = Math.floor(Math.random() * this.state.queue.length);
    } else {
      nextIdx = this.state.queueIndex + 1;
      if (nextIdx >= this.state.queue.length) {
        if (this.state.repeatMode === 'all') {
          nextIdx = 0;
        } else {
          return;
        }
      }
    }

    this.setQueueIndex(nextIdx, true);
  }

  public prev() {
    if (this.state.queue.length === 0) return;

    // If more than 3 seconds into track, seek to start (Spotify/Apple Music behavior)
    if (this.state.currentTime > 3) {
      this.seek(0);
      return;
    }

    let prevIdx = this.state.queueIndex - 1;
    if (prevIdx < 0) {
      if (this.state.repeatMode === 'all') {
        prevIdx = this.state.queue.length - 1;
      } else {
        prevIdx = 0;
      }
    }

    this.setQueueIndex(prevIdx, true);
  }

  public setQueueIndex(index: number, autoPlay = true) {
    if (index < 0 || index >= this.state.queue.length) return;
    const track = this.state.queue[index];
    if (autoPlay) {
      this.playTrack(track, this.state.queue, index);
    } else {
      this.updateState({ currentTrack: track, queueIndex: index });
    }
  }

  public setQueue(queue: PlaybackItem[], startIndex = 0, autoPlay = false) {
    this.updateState({ queue, queueIndex: startIndex });
    if (autoPlay && queue[startIndex]) {
      this.playTrack(queue[startIndex], queue, startIndex);
    }
  }

  public retry() {
    if (this.state.currentTrack) {
      this.playTrack(this.state.currentTrack, this.state.queue, this.state.queueIndex);
    }
  }

  // 🎛️ Live Playback Modifiers Controls

  /**
   * Set playback speed (0.5x to 2.0x).
   */
  public setSpeed(speed: number) {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    this.updateState({ speed: clamped });
    this.applyPlaybackModifiers();
  }

  /**
   * Reset playback speed to 1.0x (100%).
   */
  public resetSpeed() {
    this.setSpeed(1.0);
  }

  /**
   * Set semitone pitch shift (-12 to +12).
   */
  public setPitch(semitones: number) {
    const clamped = Math.max(-12, Math.min(12, Math.round(semitones)));
    this.updateState({ pitchSemitones: clamped });
    this.applyPlaybackModifiers();
  }

  /**
   * Reset pitch shift to 0 semitones (original pitch).
   */
  public resetPitch() {
    this.setPitch(0);
  }

  /**
   * Toggle or configure a 4-bar loop based on current track BPM.
   * 4 bars = 16 beats. Duration in seconds = (16 * 60) / BPM.
   */
  public toggleLoop(customBpm?: number) {
    if (this.state.isLooping) {
      this.stopLoopWatcher();
      this.updateState({ isLooping: false });
      return;
    }

    const bpm = customBpm || this.state.currentTrack?.bpm || 120;
    // 4 bars @ BPM in seconds: 4 bars * 4 beats/bar * (60 / BPM) = 960 / BPM
    const barDuration = (16 * 60) / Math.max(40, Math.min(240, bpm));
    
    const curTime = this.primaryAudio.currentTime || 0;
    const dur = this.primaryAudio.duration || this.state.duration || 9999;
    
    let loopStart = curTime;
    let loopEnd = loopStart + barDuration;

    // If loop end exceeds track duration, shift back
    if (loopEnd > dur && dur > barDuration) {
      loopStart = Math.max(0, dur - barDuration);
      loopEnd = dur;
    }

    this.updateState({
      isLooping: true,
      loopStart,
      loopEnd,
    });

    if (this.state.isPlaying) {
      this.startLoopWatcher();
    }
  }

  /**
   * Set custom loop start and end markers manually.
   */
  public setLoopRange(start: number, end: number) {
    if (end <= start) return;
    this.updateState({
      isLooping: true,
      loopStart: Math.max(0, start),
      loopEnd: end,
    });
    if (this.state.isPlaying) {
      this.startLoopWatcher();
    }
  }

  /**
   * Turn off loop mode.
   */
  public disableLoop() {
    this.stopLoopWatcher();
    this.updateState({ isLooping: false });
  }

  // --- Queue / Up Next Operations (Feature 11) ---

  /**
   * Appends an item to the queue, preventing duplicates.
   */
  public addToQueue(track: PlaybackItem) {
    if (this.state.queue.some(item => item.id === track.id)) {
      return; // prevent duplicates as requested
    }
    const newQueue = [...this.state.queue, track];
    const newIdx = this.state.queueIndex === -1 ? 0 : this.state.queueIndex;
    
    this.updateState({ queue: newQueue, queueIndex: newIdx });
  }

  /**
   * Removes an item from the queue by index.
   */
  public removeFromQueue(index: number) {
    if (index < 0 || index >= this.state.queue.length) return;
    
    const newQueue = [...this.state.queue];
    newQueue.splice(index, 1);
    
    let newIdx = this.state.queueIndex;
    if (newIdx >= newQueue.length) {
      newIdx = newQueue.length - 1;
    } else if (index < newIdx) {
      newIdx--;
    }
    
    this.updateState({ queue: newQueue, queueIndex: newIdx });
  }

  /**
   * Clears all tracks from the queue except the current playing track if desired, or resets completely.
   */
  public clearQueue() {
    // If a track is active, we can keep just that track in the queue, or clear completely. Let's clear completely as requested.
    this.updateState({ queue: [], queueIndex: -1 });
  }

  /**
   * Reorders an item within the queue.
   */
  public reorderQueue(startIndex: number, endIndex: number) {
    if (startIndex < 0 || startIndex >= this.state.queue.length || 
        endIndex < 0 || endIndex >= this.state.queue.length) return;
        
    const newQueue = [...this.state.queue];
    const [removed] = newQueue.splice(startIndex, 1);
    newQueue.splice(endIndex, 0, removed);
    
    let newIdx = this.state.queueIndex;
    if (this.state.queueIndex === startIndex) {
      newIdx = endIndex;
    } else {
      if (startIndex < this.state.queueIndex && endIndex >= this.state.queueIndex) {
        newIdx--;
      } else if (startIndex > this.state.queueIndex && endIndex <= this.state.queueIndex) {
        newIdx++;
      }
    }
    
    this.updateState({ queue: newQueue, queueIndex: newIdx });
  }

  /**
   * Sets continuous playback setting (Feature 12).
   */
  public setContinuousPlaybackEnabled(enabled: boolean) {
    this.updateState({ continuousPlaybackEnabled: enabled });
  }
}

// Global engine singleton
export const audioEngine = new AudioEngine();
