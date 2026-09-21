import React from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Play, Pause, Flame, Sparkles, ShoppingCart, Download, Tag, Music, Zap } from 'lucide-react';
import { Beat } from '../types';

interface FeaturedBeatSectionProps {
  onPurchaseBeat?: (beat: Beat) => void;
}

export default function FeaturedBeatSection({ onPurchaseBeat }: FeaturedBeatSectionProps) {
  const { state, addToCart } = useStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  const featuredBeatId = state.featuredBeatId;
  if (!featuredBeatId) return null;

  const featuredBeat = state.beats.find(b => b.id === featuredBeatId);
  if (!featuredBeat) return null;

  const isThisPlaying = isPlaying && currentTrack?.id === featuredBeat.id;

  const formatTime = (seconds?: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '3:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <section className="w-full my-8 animate-in fade-in duration-300">
      <div className="relative rounded-3xl overflow-hidden border-2 border-purple-600/50 bg-gradient-to-br from-purple-950/80 via-neutral-950 to-neutral-950 p-6 sm:p-8 shadow-2xl shadow-purple-950/40">
        
        {/* Glowing Background FX */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section Tag Banner */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-purple-900/50">
              <Flame className="w-3.5 h-3.5 fill-current text-amber-300" />
              FEATURED BEAT OF THE WEEK
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> Hand-Picked Spotlight
            </span>
          </div>

          <span className="text-xs font-mono text-neutral-400 font-bold">
            Curated by Voodoo Boomin
          </span>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative z-10">
          
          {/* Artwork & Play Action */}
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-purple-500/50 shadow-2xl shrink-0 group">
            <img 
              src={featuredBeat.coverArtUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop'} 
              alt={featuredBeat.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => {
                if (isThisPlaying) {
                  togglePlay();
                } else {
                  playTrack(featuredBeat);
                }
              }}
              className="absolute inset-0 bg-black/50 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"
              title={isThisPlaying ? "Pause" : "Play Featured Beat"}
            >
              <div className="w-14 h-14 rounded-full bg-purple-600 group-hover:scale-110 flex items-center justify-center shadow-xl text-white transition-transform">
                {isThisPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </div>
            </button>
          </div>

          {/* Beat Details & Metadata */}
          <div className="flex-1 space-y-3 min-w-0 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-950 border border-purple-800/60 text-purple-300 font-mono text-xs font-bold">
                {featuredBeat.bpm} BPM
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs font-bold">
                {featuredBeat.key || 'D Minor'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-xs">
                {formatTime(featuredBeat.durationSeconds)}
              </span>
              {featuredBeat.genre && (
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 border border-indigo-800/50 text-indigo-300 font-mono text-xs uppercase font-bold">
                  {featuredBeat.genre}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight italic uppercase truncate">
              {featuredBeat.title}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
              {featuredBeat.description || 'Premium Voodoo Boomin production release with studio WAV stems, lossless master quality, and instant commercial licensing authorization.'}
            </p>

            {/* Tags */}
            {featuredBeat.tags && featuredBeat.tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
                {featuredBeat.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-mono text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-800 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5 text-purple-400" /> #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Checkout Controls */}
          <div className="flex flex-col items-center md:items-end justify-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-800 w-full md:w-auto">
            <div className="text-center md:text-right">
              <span className="text-[10px] uppercase font-mono text-neutral-400 font-bold block">Exclusive License From</span>
              <span className="text-3xl font-black font-mono text-purple-400">
                ${featuredBeat.price.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
              <button
                onClick={() => {
                  if (onPurchaseBeat) {
                    onPurchaseBeat(featuredBeat);
                  } else {
                    addToCart(featuredBeat, 'Standard MP3', featuredBeat.price);
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Buy Now</span>
              </button>

              {featuredBeat.freeDownloadEnabled && (
                <button
                  onClick={() => {
                    if (featuredBeat.audioUrl) {
                      const link = document.createElement('a');
                      link.href = featuredBeat.audioUrl;
                      link.download = `${featuredBeat.title}-Free-Tagged.mp3`;
                      link.click();
                    }
                  }}
                  className="px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs transition-all border border-neutral-800 flex items-center gap-2 cursor-pointer"
                  title="Download Free Tagged Demo"
                >
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Free DL</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
