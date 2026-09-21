import React from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat } from '../types';
import { Flame, Play, Pause, ShoppingCart } from 'lucide-react';

interface HighPerformanceSectionProps {
  isDarkMode: boolean;
  onPlayBeat: (beat: Beat) => void;
  onPurchaseBeat: (beat: Beat) => void;
}

export default function HighPerformanceSection({
  isDarkMode,
  onPlayBeat,
  onPurchaseBeat,
}: HighPerformanceSectionProps) {
  const { state, cart } = useStore();
  const { currentTrack, isPlaying: isGlobalPlaying } = useAudioPlayer();

  const highPerformanceTracks = (state.beats || []).filter(
    (b) => !b.isArchived && (b.plays || 0) >= 1000
  );

  return (
    <section className={`rounded-3xl p-6 md:p-8 border shadow-2xl relative overflow-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-b from-[#16121f] via-[#0d0a14] to-[#07060a] border-amber-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.8)]' 
        : 'bg-gradient-to-b from-amber-50/60 via-white to-neutral-50 border-amber-200 shadow-xl'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-black shadow-lg">
              <Flame size={18} className="text-black" />
            </div>
            <h2 className={`text-xl md:text-2xl font-black tracking-tight uppercase italic flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>
              High-Performance Tracks
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
              1K+ Club
            </span>
          </div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono">
            Tracks with over 1,000 recorded streams in the Voodoo Boomin storefront vault.
          </p>
        </div>
      </div>

      {highPerformanceTracks.length === 0 ? (
        <div className={`text-center py-12 px-4 rounded-2xl border ${
          isDarkMode ? 'bg-neutral-900/30 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Flame size={24} />
          </div>
          <h3 className={`text-sm font-black uppercase tracking-tight mb-1 ${
            isDarkMode ? 'text-white' : 'text-neutral-900'
          }`}>
            No 1K+ Milestone Tracks Yet
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Instrumentals that cross 1,000 real plays on the store are automatically inducted into the High-Performance vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {highPerformanceTracks.map((beat) => {
            const isPlayingThis = isGlobalPlaying && currentTrack?.id === beat.id;
            const inCart = cart?.some(item => item.id === beat.id);

            return (
              <div
                key={beat.id}
                className={`p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
                  isPlayingThis
                    ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                    : isDarkMode 
                      ? 'bg-neutral-900/60 border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900' 
                      : 'bg-white border-neutral-200 hover:border-amber-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-neutral-800 cursor-pointer">
                    <img
                      src={beat.coverArtUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop'}
                      alt={beat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => onPlayBeat(beat)}
                      className={`absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer ${
                        isPlayingThis ? 'bg-amber-950/70 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isPlayingThis ? (
                        <Pause size={20} className="text-amber-400 fill-current" />
                      ) : (
                        <Play size={20} className="text-white fill-current translate-x-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className={`font-black text-sm tracking-tight truncate uppercase italic ${
                      isPlayingThis ? 'text-amber-400' : isDarkMode ? 'text-white' : 'text-neutral-900'
                    }`}>
                      {beat.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-400 font-mono">
                      <span>{beat.bpm} BPM</span>
                      <span>•</span>
                      <span>{beat.key}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase">
                      <Flame size={12} className="fill-current animate-pulse" />
                      <span>{(beat.plays || 0).toLocaleString()} Plays</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-black text-purple-400 font-mono">
                      ${beat.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onPurchaseBeat(beat)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-black text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-md hover:scale-105 cursor-pointer"
                    >
                      <ShoppingCart size={12} className="fill-current" />
                      <span>{inCart ? 'In Cart' : 'Lease'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
