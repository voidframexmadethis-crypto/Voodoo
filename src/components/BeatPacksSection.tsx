import React from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { BeatPack } from '../types';
import { Package, Layers, Play, Pause, Download } from 'lucide-react';
import { downloadAudioFile } from '../lib/beatUtils';

interface BeatPacksSectionProps {
  isDarkMode: boolean;
  onInspectPack: (pack: BeatPack) => void;
  onPurchasePack: (pack: BeatPack) => void;
}

export default function BeatPacksSection({
  isDarkMode,
  onInspectPack,
  onPurchasePack,
}: BeatPacksSectionProps) {
  const { state } = useStore();
  const { 
    isPlaying: isGlobalPlaying, 
    playPack, 
    playPackTrack, 
    togglePlay: toggleGlobalPlay, 
    currentPackId, 
    activeTrackNum 
  } = useAudioPlayer();

  const publicPacks = (state.beatPacks || []).filter(p => p.visibility === 'Public');

  if (publicPacks.length === 0) {
    return (
      <section className={`rounded-2xl p-8 border shadow-xl relative text-center transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0b0b0e] border-neutral-900' : 'bg-white border-neutral-200'
      }`}>
        <Package className="w-12 h-12 text-purple-500/60 mx-auto mb-3 animate-pulse" />
        <h3 className="text-lg font-black uppercase italic tracking-tight text-neutral-200">No Beat Packs Published Yet</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
          The studio hasn't released any bundled Beat Packs yet. Explore individual instrumentals in the catalog below or upload new packs via the Producer Hub.
        </p>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl p-6 border shadow-xl relative transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0b0b0e] border-neutral-900' : 'bg-white border-neutral-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Package size={20} className="text-purple-400" />
            <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic">Curated Beat Packs</h2>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
              Continuous Playback
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Full thematic instrumental collections, uncompressed WAVs, and trackout stems.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publicPacks.map((pack) => {
          const isCurrentPackPlaying = isGlobalPlaying && currentPackId === pack.id;
          const totalTracks = pack.totalTracks || pack.tracks?.length || 0;

          return (
            <div 
              key={pack.id} 
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 ${
                isCurrentPackPlaying 
                  ? 'bg-purple-950/20 border-purple-600/60 shadow-[0_4px_25px_rgba(147,51,234,0.15)]' 
                  : isDarkMode 
                    ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700' 
                    : 'bg-white border-neutral-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-start gap-4">
                  {/* Pack Cover Artwork */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-neutral-950 border border-neutral-800 group/art">
                    <img 
                      src={pack.coverArtUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&h=300&fit=crop'} 
                      alt={pack.title}
                      className="w-full h-full object-cover group-hover/art:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => {
                        if (isCurrentPackPlaying) {
                          toggleGlobalPlay();
                        } else {
                          playPack(pack, 1);
                        }
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/art:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      {isCurrentPackPlaying ? <Pause className="w-6 h-6 text-purple-400 fill-current" /> : <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />}
                    </button>
                  </div>

                  {/* Pack Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-black uppercase text-purple-400">
                        {totalTracks} Tracks Included
                      </span>
                      {pack.genres && pack.genres[0] && (
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-[9px] font-bold uppercase text-neutral-400">
                          {pack.genres[0]}
                        </span>
                      )}
                    </div>
                    <h3 className={`font-black text-base tracking-tight uppercase italic truncate mt-1 ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                      {pack.title}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-0.5">
                      {pack.description || 'Exclusive bundle curated with matching keys and tempo progressions.'}
                    </p>
                  </div>
                </div>

                {/* Tracklist preview items */}
                {pack.tracks && pack.tracks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-neutral-850 space-y-1 max-h-36 overflow-y-auto pr-1">
                    {pack.tracks.slice(0, 4).map((tr) => {
                      const isThisTrackPlaying = isGlobalPlaying && currentPackId === pack.id && activeTrackNum === tr.trackNumber;
                      return (
                        <div 
                          key={tr.trackNumber}
                          onClick={() => playPackTrack(pack, tr)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                            isThisTrackPlaying 
                              ? 'bg-purple-950/60 text-purple-300 font-bold border border-purple-800/40' 
                              : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-[10px] text-neutral-500">#{tr.trackNumber}</span>
                            <span className="truncate">{tr.title}</span>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            {isThisTrackPlaying ? (
                              <span className="text-[9px] text-purple-400 animate-pulse font-bold">PLAYING</span>
                            ) : (
                              <Play className="w-3 h-3 text-neutral-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {pack.tracks.length > 4 && (
                      <p className="text-[10px] text-neutral-500 font-mono text-center pt-1">
                        + {pack.tracks.length - 4} more tracks in master pack
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Pack Footer CTA */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-neutral-850">
                <span className="text-lg font-black text-purple-400 font-mono">
                  ${pack.price.toFixed(2)}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onInspectPack(pack)}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 text-purple-300 hover:text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    title="View all included tracks and details"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>What's Inside</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isCurrentPackPlaying) {
                        toggleGlobalPlay();
                      } else {
                        playPack(pack, 1);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-colors border border-neutral-800 cursor-pointer"
                  >
                    {isCurrentPackPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isCurrentPackPlaying ? 'Pause' : 'Play Pack'}</span>
                  </button>
                  {pack.zipFileUrl && (
                    <button
                      onClick={() => downloadAudioFile(pack.zipFileUrl!, `${pack.title}-Master-Pack`)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ZIP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
