import React, { useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat } from '../types';
import { Sparkles, ChevronLeft, ChevronRight, Play, Pause, ShoppingCart } from 'lucide-react';

interface FeaturedCarouselSectionProps {
  isDarkMode: boolean;
  onPlayBeat: (beat: Beat) => void;
  onPurchaseBeat: (beat: Beat) => void;
  beats: Beat[];
}

export default function FeaturedCarouselSection({
  isDarkMode,
  onPlayBeat,
  onPurchaseBeat,
  beats,
}: FeaturedCarouselSectionProps) {
  const { cart } = useStore();
  const { currentTrack, isPlaying: isGlobalPlaying } = useAudioPlayer();
  const collectionScrollRef = useRef<HTMLDivElement>(null);

  if (beats.length === 0) return null;

  const scrollCollection = (direction: 'left' | 'right') => {
    if (collectionScrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      collectionScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className={`rounded-2xl p-6 border shadow-xl relative transition-colors duration-300 ${
      isDarkMode ? 'bg-neutral-950/40 border-neutral-900' : 'bg-white border-neutral-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-500" />
            <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic">Featured Releases</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Hand-curated standout productions and chart-ready studio hits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scrollCollection('left')} 
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors border border-neutral-800 shadow-sm cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => scrollCollection('right')} 
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors border border-neutral-800 shadow-sm cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div 
        ref={collectionScrollRef} 
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {beats.map((beat) => {
          const isPlayingThis = isGlobalPlaying && currentTrack?.id === beat.id;
          const inCart = cart?.some(item => item.id === beat.id);

          return (
            <div 
              key={beat.id} 
              className={`min-w-[280px] md:min-w-[320px] rounded-2xl p-4 border flex flex-col justify-between transition-all duration-300 group snap-start ${
                isPlayingThis 
                  ? 'bg-purple-950/30 border-purple-500 shadow-[0_4px_30px_rgba(147,51,234,0.2)] scale-[1.01]' 
                  : isDarkMode 
                    ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700' 
                    : 'bg-white border-neutral-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div>
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-neutral-950 border border-neutral-800">
                  <img 
                    src={beat.coverArtUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop'} 
                    alt={beat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => onPlayBeat(beat)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {isPlayingThis ? <Pause className="w-8 h-8 text-purple-400 fill-current" /> : <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />}
                  </button>
                  <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md text-white font-mono text-[11px] font-bold border border-white/10">
                    {beat.bpm} BPM • {beat.key}
                  </span>
                </div>

                <h3 className="font-extrabold text-base tracking-tight uppercase italic truncate">{beat.title}</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">{beat.producer || 'Voodoo Boomin'}</p>
                
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {beat.tags?.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-850 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-850">
                <span className="text-lg font-black text-purple-400 font-mono">
                  ${beat.price.toFixed(2)}
                </span>
                <button
                  onClick={() => onPurchaseBeat(beat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                    inCart 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  }`}
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span>{inCart ? 'Added' : 'Add To Cart'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
