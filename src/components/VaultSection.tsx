import React from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat, BeatPack } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Play, 
  Pause, 
  ShoppingCart, 
  Download, 
  Package, 
  Layers, 
  Flame,
  Zap,
  Tag
} from 'lucide-react';

interface VaultSectionProps {
  onInspectPack?: (pack: BeatPack) => void;
  onPurchaseBeat?: (beat: Beat) => void;
}

export default function VaultSection({ onInspectPack, onPurchaseBeat }: VaultSectionProps) {
  const { state, addToCart } = useStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  const vaultConfig = state.vaultConfig || { beatIds: [], packIds: [] };
  const vaultBeatIds = vaultConfig.beatIds || [];
  const vaultPackIds = vaultConfig.packIds || [];

  // Lookup real referenced beats and packs from store state
  const vaultBeats = state.beats.filter(b => vaultBeatIds.includes(b.id));
  const vaultPacks = state.beatPacks.filter(p => vaultPackIds.includes(p.id));

  // If no items designated for Vault, don't display empty cards on public storefront
  if (vaultBeats.length === 0 && vaultPacks.length === 0) {
    return null;
  }

  const formatTime = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '3:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <section id="vault" className="w-full my-12 animate-in fade-in duration-500">
      {/* Vault Container with Exclusive Dark Trap Aesthetic */}
      <div className="relative rounded-3xl border border-purple-800/80 bg-[#08070d] p-6 sm:p-10 overflow-hidden shadow-2xl shadow-purple-950/60">
        
        {/* Visual FX background accents */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Section */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-purple-900/60 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-950 border border-purple-500/50 text-purple-300 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                LIMITED ARCHIVE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-400 font-mono text-[10px] font-bold">
                {vaultBeats.length + vaultPacks.length} CURATED RELEASES
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase italic flex items-center gap-3">
              <span>VOODOO BOOMIN — THE VAULT</span>
            </h2>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
              {vaultConfig.customDescription || 'Hand-selected master archive featuring rare production stems, exclusive beat packs, and limited sonic editions.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-purple-400 font-bold px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Owner-Curated Collection
            </span>
          </div>
        </div>

        {/* Content Showcase */}
        <div className="relative z-10 space-y-8">
          
          {/* 1. Vault Beats */}
          {vaultBeats.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-purple-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-purple-400" /> Vault Beats
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vaultBeats.map((beat) => {
                  const isThisPlaying = isPlaying && currentTrack?.id === beat.id;
                  return (
                    <div
                      key={beat.id}
                      className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/60 transition-all duration-300 flex flex-col justify-between gap-4 group shadow-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-purple-500/30 group-hover:border-purple-400 transition-colors">
                          <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <button
                            onClick={() => {
                              if (isThisPlaying) {
                                togglePlay();
                              } else {
                                playTrack(beat);
                              }
                            }}
                            className="absolute inset-0 bg-black/50 group-hover:bg-black/30 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                              {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                            </div>
                          </button>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-[9px] font-mono font-bold text-purple-300 uppercase">
                            Vault Beat
                          </span>
                          <h4 className="text-sm font-black text-white truncate group-hover:text-purple-300 transition-colors">
                            {beat.title}
                          </h4>
                          <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
                            <span>{beat.bpm} BPM</span>
                            <span>•</span>
                            <span>{beat.key || 'D Minor'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-800">
                        <span className="text-sm font-mono font-black text-purple-400">
                          ${beat.price.toFixed(2)}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (onPurchaseBeat) {
                                onPurchaseBeat(beat);
                              } else {
                                addToCart(beat, 'Standard MP3', beat.price);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Buy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Vault Beat Packs */}
          {vaultPacks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-black uppercase tracking-widest text-purple-300 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" /> Vault Collections & Packs
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaultPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/60 transition-all duration-300 flex items-center justify-between gap-4 group shadow-lg"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={pack.coverArtUrl} alt={pack.title} className="w-20 h-20 rounded-xl object-cover shrink-0 border border-purple-500/40" />
                      <div className="min-w-0 space-y-1">
                        <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-[9px] font-mono font-bold text-purple-300 uppercase">
                          Vault Pack
                        </span>
                        <h4 className="text-base font-black text-white truncate group-hover:text-purple-300 transition-colors">
                          {pack.title}
                        </h4>
                        <p className="text-xs text-neutral-400 line-clamp-1">
                          {pack.tracks?.length || 0} Stems & Master Tracks Included
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-base font-mono font-black text-purple-400">
                        ${pack.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          if (onInspectPack) {
                            onInspectPack(pack);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
