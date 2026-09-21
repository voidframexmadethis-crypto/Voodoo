import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BeatPack, PackTrack } from '../types';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  Package, 
  Play, 
  Pause, 
  Download, 
  ShoppingCart, 
  Music, 
  CheckCircle2, 
  ShieldCheck, 
  FileArchive, 
  Sparkles,
  Volume2,
  Search,
  Check,
  Disc,
  Flame,
  ListMusic
} from 'lucide-react';
import { downloadAudioFile } from '../lib/beatUtils';

interface BeatPackWhatsInsideModalProps {
  pack: BeatPack | null;
  onClose: () => void;
  onPurchase?: (pack: BeatPack) => void;
  isDarkMode?: boolean;
}

export default function BeatPackWhatsInsideModal({
  pack,
  onClose,
  onPurchase,
  isDarkMode = true
}: BeatPackWhatsInsideModalProps) {
  const { 
    currentPackId, 
    activeTrackNum, 
    isPlaying, 
    currentTime,
    duration,
    playPack, 
    playPackTrack, 
    togglePlay,
    seek 
  } = useAudioPlayer();

  const { cart, addToCart } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [playedTracks, setPlayedTracks] = useState<Set<number>>(new Set());
  const scrubberRef = useRef<HTMLDivElement | null>(null);

  if (!pack) return null;

  const tracks = pack.tracks || [];
  const isCurrentPackPlaying = isPlaying && currentPackId === pack.id;

  // Track session played history dynamically when playback occurs
  useEffect(() => {
    if (isPlaying && currentPackId === pack.id && activeTrackNum !== null) {
      setPlayedTracks(prev => new Set(prev).add(activeTrackNum));
    }
  }, [isPlaying, currentPackId, activeTrackNum, pack.id]);

  // Feature 24: Search Within Beat Pack
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const term = searchQuery.toLowerCase().trim();
    return tracks.filter(tr => 
      (tr.title && tr.title.toLowerCase().includes(term)) ||
      (tr.originalFilename && tr.originalFilename.toLowerCase().includes(term)) ||
      (tr.key && tr.key.toLowerCase().includes(term)) ||
      (tr.bpm && tr.bpm.toString().includes(term))
    );
  }, [tracks, searchQuery]);

  // Active track info
  const activeTrack = useMemo(() => {
    if (isCurrentPackPlaying && activeTrackNum !== null) {
      return tracks.find(t => t.trackNumber === activeTrackNum) || null;
    }
    return null;
  }, [isCurrentPackPlaying, activeTrackNum, tracks]);

  // Next track info in pack sequence
  const nextTrack = useMemo(() => {
    if (!activeTrack) return null;
    return tracks.find(t => t.trackNumber === activeTrack.trackNumber + 1) || null;
  }, [activeTrack, tracks]);

  const formatTime = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleScrub = (clientX: number) => {
    if (!scrubberRef.current || !duration) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const inCart = cart.some(item => item.beat?.id === pack.id);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all ${
          isDarkMode ? 'bg-[#0a0a0d] border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header / Artwork Banner */}
        <div className="relative p-5 sm:p-7 bg-gradient-to-br from-purple-950/90 via-neutral-950 to-neutral-950 border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-neutral-400 hover:text-white transition-all cursor-pointer z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-purple-500/40 shadow-xl shrink-0">
              <img 
                src={pack.coverArtUrl} 
                alt={pack.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => {
                  if (isCurrentPackPlaying) {
                    togglePlay();
                  } else {
                    playPack(pack, 1);
                  }
                }}
                className="absolute inset-0 bg-black/50 hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer group"
                title={isCurrentPackPlaying ? "Pause Pack" : "Play Entire Beat Pack"}
              >
                <div className="w-11 h-11 rounded-full bg-purple-600 group-hover:scale-110 flex items-center justify-center shadow-lg transition-transform text-white">
                  {isCurrentPackPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </div>
              </button>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <Package className="w-3 h-3" /> BEAT PACK
                </span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-400 font-mono text-[10px] font-bold">
                  {tracks.length} {tracks.length === 1 ? 'TRACK' : 'TRACKS'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase italic truncate">
                {pack.title}
              </h2>
              
              <p className="text-xs text-neutral-300 leading-relaxed max-w-md line-clamp-2">
                {pack.description || 'Full production bundle with royalty-free licenses and high-definition audio stems.'}
              </p>
            </div>
          </div>

          {/* Pricing & Play Entire CTA Header Box */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-800 gap-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-400 font-bold block sm:text-right">Full Bundle</span>
              <span className="text-2xl font-black font-mono text-purple-400">
                ${pack.price.toFixed(2)}
              </span>
            </div>

            {/* FEATURE 26: Play Entire Beat Pack Primary Button */}
            <button
              onClick={() => {
                if (isCurrentPackPlaying) {
                  togglePlay();
                } else {
                  playPack(pack, 1);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isCurrentPackPlaying 
                  ? 'bg-amber-500 text-black hover:bg-amber-400' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
              }`}
            >
              {isCurrentPackPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Pack</span>
                </>
              ) : (
                <>
                  <ListMusic className="w-4 h-4" />
                  <span>PLAY ENTIRE BEAT PACK</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature 25: BEAT PACK PLAYBACK PROGRESS BANNER */}
        {isCurrentPackPlaying && activeTrack && (
          <div className="px-5 py-3.5 bg-gradient-to-r from-purple-950/90 via-neutral-900 to-purple-950/90 border-b border-purple-800/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-[11px] font-mono font-bold uppercase text-purple-300 tracking-wider">NOW PLAYING:</span>
                <span className="font-bold text-white truncate">
                  #{String(activeTrack.trackNumber).padStart(2, '0')} — {activeTrack.title}
                </span>
              </div>
              
              <div className="flex items-center gap-2 font-mono text-[11px] text-purple-300 font-bold shrink-0">
                <span>{formatTime(currentTime)}</span>
                <span className="text-neutral-500">/</span>
                <span>{formatTime(duration || activeTrack.durationSeconds || 0)}</span>
              </div>
            </div>

            {/* Interactive Progress Scrubber */}
            <div 
              ref={scrubberRef}
              onClick={(e) => handleScrub(e.clientX)}
              className="w-full h-2 rounded-full bg-neutral-800 hover:bg-neutral-700 cursor-pointer relative overflow-hidden group transition-all"
            >
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-100"
                style={{ width: `${duration ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
              />
            </div>

            {/* Up Next indicator */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
              <span>
                {nextTrack ? (
                  <>Up Next: <strong className="text-white">#{String(nextTrack.trackNumber).padStart(2, '0')} — {nextTrack.title}</strong></>
                ) : (
                  <span className="text-purple-400">Final Track in Pack Sequence</span>
                )}
              </span>
              <span className="text-neutral-500">Auto-advancing active</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Feature 24: SEARCH WITHIN BEAT PACK */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search tracks in ${pack.title}...`}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-purple-500 text-xs text-white placeholder-neutral-500 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px]">
                {filteredTracks.length} / {tracks.length} Tracks
              </span>
            </div>
          </div>

          {/* Included Features Checklist */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col items-start gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold text-white">Full WAV + MP3</span>
              <span className="text-[9px] text-neutral-500">24-bit studio quality</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col items-start gap-1">
              <FileArchive className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] font-bold text-white">ZIP Master Stem</span>
              <span className="text-[9px] text-neutral-500">Original master package</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col items-start gap-1">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-bold text-white">Commercial Rights</span>
              <span className="text-[9px] text-neutral-500">Streaming & performance</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col items-start gap-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold text-white">100% Royalty Free</span>
              <span className="text-[9px] text-neutral-500">Keep all your royalties</span>
            </div>
          </div>

          {/* FEATURE 23: BEAT PACK TRACKLIST VIEW */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Tracklist Sequence
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                Tap any track to audition individually
              </span>
            </div>

            {filteredTracks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 text-xs font-mono">
                {searchQuery ? (
                  <div className="space-y-3">
                    <p className="text-neutral-400 font-sans text-sm">
                      No tracks matching "<strong className="text-white">{searchQuery}</strong>" found in this Beat Pack.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <p>This Beat Pack currently has no extracted tracks indexed.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredTracks.map((tr: PackTrack) => {
                  const isThisPlaying = isCurrentPackPlaying && activeTrackNum === tr.trackNumber;
                  const hasBeenPlayed = playedTracks.has(tr.trackNumber);

                  return (
                    <div
                      key={tr.trackNumber}
                      onClick={() => playPackTrack(pack, tr)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                        isThisPlaying
                          ? 'bg-purple-950/60 border-purple-500/80 shadow-lg shadow-purple-900/20'
                          : 'bg-neutral-900/40 border-neutral-800/80 hover:bg-neutral-900/80 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Play / Pause button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isThisPlaying) {
                              togglePlay();
                            } else {
                              playPackTrack(pack, tr);
                            }
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            isThisPlaying
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-neutral-800 hover:bg-purple-600 text-neutral-300 hover:text-white group-hover:scale-105'
                          }`}
                        >
                          {isThisPlaying ? (
                            <Pause className="w-4 h-4 fill-current text-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Feature 25 Track Status Indicator */}
                            {isThisPlaying ? (
                              <span className="text-[10px] font-mono font-bold text-purple-400 flex items-center gap-1">
                                ▶ PLAYING
                              </span>
                            ) : hasBeenPlayed ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-0.5" title="Listened in current session">
                                <Check className="w-3 h-3 text-emerald-400" /> #{String(tr.trackNumber).padStart(2, '0')}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-neutral-500">
                                #{String(tr.trackNumber).padStart(2, '0')}
                              </span>
                            )}

                            <span className={`text-xs font-black truncate ${
                              isThisPlaying ? 'text-purple-300' : 'text-white group-hover:text-purple-300'
                            }`}>
                              {tr.title}
                            </span>
                          </div>

                          {/* Real Metadata: BPM, Key, Original Filename */}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {tr.bpm && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-bold">
                                {tr.bpm} BPM
                              </span>
                            )}
                            {tr.key && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800/40 text-purple-300 font-bold">
                                {tr.key}
                              </span>
                            )}
                            {tr.originalFilename && (
                              <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[180px]">
                                {tr.originalFilename}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right metadata & duration */}
                      <div className="flex items-center gap-3 shrink-0">
                        {isThisPlaying ? (
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold uppercase animate-pulse flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Auditioning
                          </span>
                        ) : hasBeenPlayed ? (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            Played
                          </span>
                        ) : null}

                        <span className="text-[11px] font-mono text-neutral-400 font-bold">
                          {formatTime(tr.durationSeconds)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              if (isCurrentPackPlaying) {
                togglePlay();
              } else {
                playPack(pack, 1);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-bold transition-all border border-neutral-800 flex items-center gap-2 cursor-pointer"
          >
            {isCurrentPackPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isCurrentPackPlaying ? 'Pause Playback' : 'Play Entire Beat Pack'}</span>
          </button>

          <div className="flex items-center gap-2">
            {pack.zipFileUrl && (
              <button
                onClick={() => downloadAudioFile(pack.zipFileUrl!, `${pack.title}-Master-Pack`)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all border border-neutral-700 flex items-center gap-2 cursor-pointer"
                title="Download original master ZIP package"
              >
                <Download className="w-4 h-4" />
                <span>Master ZIP</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onPurchase) {
                  onPurchase(pack);
                } else {
                  addToCart(pack as any, 'Beat Pack Bundle', pack.price);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Get Beat Pack (${pack.price.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
