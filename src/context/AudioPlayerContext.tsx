import React, { createContext, useState, useEffect, ReactNode, useContext, useMemo, useCallback } from 'react';
import { Beat, BeatPack, PackTrack } from '../types';
import { audioEngine, PlaybackItem, PlaybackState } from '../lib/audioEngine';
import { getWaveformData } from '../lib/waveformEngine';
import { db } from '../lib/firebase';
import { doc, increment, updateDoc, getDoc } from 'firebase/firestore';
import { processTrackStreamMetric } from '../lib/milestoneTracker';

export interface AudioPlayerContextType {
  // Current track representations
  currentTrack: Beat | null; // Backwards compatibility with existing components
  activePlaybackItem: PlaybackItem | null;
  playbackType: 'SINGLE_BEAT' | 'BEAT_PACK_PREVIEW' | 'CUSTOM';
  currentPackId: string | null;
  activeTrackNum: number | null;

  // Real-time playback status
  isPlaying: boolean;
  isBuffering: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  playbackError: string | null;
  waveformData: number[];

  // Queue state
  queue: PlaybackItem[];
  queueIndex: number;

  // Actions
  playTrack: (track: Beat | PlaybackItem, queue?: (Beat | PlaybackItem)[], index?: number) => void;
  playPack: (pack: BeatPack, startTrackNumber?: number) => void;
  playPackTrack: (pack: BeatPack, track: PackTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlay: () => void;
  seek: (timeInSeconds: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  toggleShuffle: () => void;
  retryPlayback: () => void;
  clearPlaybackError: () => void;
}

export const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

// Helper to convert Beat -> PlaybackItem
export function beatToPlaybackItem(beat: Beat): PlaybackItem {
  return {
    id: beat.id,
    title: beat.title || 'Untitled Instrumental',
    artist: beat.producer || 'Voodoo Boomin',
    audioUrl: beat.watermarkedAudioUrl || beat.audioUrl || '',
    coverArtUrl: beat.coverArtUrl || (beat as any).coverUrl || '',
    bpm: beat.bpm,
    key: beat.key,
    genre: beat.primaryGenre || 'Trap',
    price: beat.price !== undefined ? beat.price : 29.99,
    type: 'SINGLE_BEAT',
    originalData: beat,
  };
}

// Helper to convert BeatPack + Track -> PlaybackItem
export function packTrackToPlaybackItem(pack: BeatPack, track: PackTrack): PlaybackItem {
  return {
    id: `${pack.id}_track_${track.trackNumber}`,
    title: track.title || `Track ${track.trackNumber}`,
    artist: 'Voodoo Boomin',
    audioUrl: track.previewUrl || track.audioUrl || '',
    coverArtUrl: pack.coverArtUrl || '',
    bpm: track.bpm,
    key: track.key,
    genre: 'Trap / Beat Pack',
    price: pack.price,
    duration: track.durationSeconds || 42,
    type: 'BEAT_PACK_PREVIEW',
    packId: pack.id,
    trackNumber: track.trackNumber,
    originalData: { pack, track }
  };
}

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [engineState, setEngineState] = useState<PlaybackState>(audioEngine.getState());
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Subscribe to central audio engine state updates
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      setEngineState(state);
    });
    return () => unsubscribe();
  }, []);

  // Update waveform peaks whenever the active track changes
  useEffect(() => {
    const item = engineState.currentTrack;
    if (!item) {
      setWaveformData([]);
      return;
    }

    let isSubscribed = true;
    getWaveformData(item.audioUrl, item.id || item.title, 64).then((peaks) => {
      if (isSubscribed) {
        setWaveformData(peaks);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [engineState.currentTrack?.id, engineState.currentTrack?.audioUrl]);

  // Backward compatible Beat representation
  const currentBeat: Beat | null = useMemo(() => {
    if (!engineState.currentTrack) return null;
    if (engineState.currentTrack.originalData && (engineState.currentTrack.originalData as Beat).licenses) {
      return engineState.currentTrack.originalData as Beat;
    }

    // Synthesize compatible Beat object for BeatPack tracks or custom items
    return {
      id: engineState.currentTrack.id,
      title: engineState.currentTrack.title,
      producer: engineState.currentTrack.artist || 'Voodoo Boomin',
      bpm: engineState.currentTrack.bpm || 130,
      key: engineState.currentTrack.key || 'D# Minor',
      price: engineState.currentTrack.price || 29.99,
      coverArtUrl: engineState.currentTrack.coverArtUrl || '',
      audioUrl: engineState.currentTrack.audioUrl,
      watermarkedAudioUrl: engineState.currentTrack.audioUrl,
      visibility: 'Public',
      trackType: 'Beat',
      licenses: {
        mp3Lease: { enabled: true, price: 29.99 },
        wavLease: { enabled: true, price: 39.99 },
        premiumLease: { enabled: true, price: 79.99 },
        unlimitedLease: { enabled: true, price: 149.99 },
        exclusive: { enabled: true, price: 499.99 },
      },
    };
  }, [engineState.currentTrack]);

  // Trigger non-blocking stream analytics
  const logStreamAnalytics = useCallback((trackId: string) => {
    if (!trackId || trackId.startsWith('local_') || trackId.startsWith('default_') || trackId.includes('_track_')) {
      return;
    }

    fetch('/api/streams/increment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: trackId }),
    }).catch(() => {});

    try {
      const beatRef = doc(db, 'beats', trackId);
      updateDoc(beatRef, { plays: increment(1) })
        .then(() => getDoc(beatRef))
        .then((snap) => {
          if (snap.exists()) {
            const currentPlays = snap.data().plays || 0;
            processTrackStreamMetric(trackId, currentPlays);
          }
        })
        .catch(() => {});
    } catch (e) {}
  }, []);

  const playTrack = useCallback((
    track: Beat | PlaybackItem, 
    queue?: (Beat | PlaybackItem)[], 
    index?: number
  ) => {
    const item: PlaybackItem = 'artist' in track && 'audioUrl' in track && 'type' in track 
      ? (track as PlaybackItem) 
      : beatToPlaybackItem(track as Beat);

    const convertedQueue: PlaybackItem[] | undefined = queue 
      ? queue.map(q => ('type' in q ? (q as PlaybackItem) : beatToPlaybackItem(q as Beat)))
      : undefined;

    audioEngine.playTrack(item, convertedQueue, index);
    if (item.type === 'SINGLE_BEAT' && item.id) {
      logStreamAnalytics(item.id);
    }
  }, [logStreamAnalytics]);

  const playPack = useCallback((pack: BeatPack, startTrackNumber = 1) => {
    if (!pack || !pack.tracks || pack.tracks.length === 0) return;

    const packQueue: PlaybackItem[] = pack.tracks.map(t => packTrackToPlaybackItem(pack, t));
    const startIdx = pack.tracks.findIndex(t => t.trackNumber === startTrackNumber);
    const targetIdx = startIdx !== -1 ? startIdx : 0;

    audioEngine.playTrack(packQueue[targetIdx], packQueue, targetIdx);
  }, []);

  const playPackTrack = useCallback((pack: BeatPack, track: PackTrack) => {
    playPack(pack, track.trackNumber);
  }, [playPack]);

  const pauseTrack = useCallback(() => audioEngine.pause(), []);
  const resumeTrack = useCallback(() => audioEngine.play(), []);
  const togglePlay = useCallback(() => audioEngine.togglePlay(), []);
  const seek = useCallback((time: number) => audioEngine.seek(time), []);
  const skipForward = useCallback((sec?: number) => audioEngine.skipForward(sec), []);
  const skipBackward = useCallback((sec?: number) => audioEngine.skipBackward(sec), []);
  const setVolume = useCallback((vol: number) => audioEngine.setVolume(vol), []);
  const toggleMute = useCallback(() => audioEngine.toggleMute(), []);
  const nextTrack = useCallback(() => audioEngine.next(), []);
  const prevTrack = useCallback(() => audioEngine.prev(), []);
  const setRepeatMode = useCallback((mode: 'off' | 'all' | 'one') => audioEngine.setRepeatMode(mode), []);
  const toggleShuffle = useCallback(() => audioEngine.toggleShuffle(), []);
  const retryPlayback = useCallback(() => audioEngine.retry(), []);
  const clearPlaybackError = useCallback(() => audioEngine.retry(), []);

  const playbackType = engineState.currentTrack?.type || 'SINGLE_BEAT';
  const currentPackId = engineState.currentTrack?.packId || null;
  const activeTrackNum = engineState.currentTrack?.trackNumber || null;

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack: currentBeat,
        activePlaybackItem: engineState.currentTrack,
        playbackType,
        currentPackId,
        activeTrackNum,

        isPlaying: engineState.isPlaying,
        isBuffering: engineState.isBuffering,
        isLoading: engineState.isLoading,
        currentTime: engineState.currentTime,
        duration: engineState.duration,
        bufferedPercent: engineState.bufferedPercent,
        volume: engineState.volume,
        isMuted: engineState.isMuted,
        repeatMode: engineState.repeatMode,
        isShuffle: engineState.isShuffle,
        playbackError: engineState.error,
        waveformData,

        queue: engineState.queue,
        queueIndex: engineState.queueIndex,

        playTrack,
        playPack,
        playPackTrack,
        pauseTrack,
        resumeTrack,
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
        clearPlaybackError,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
