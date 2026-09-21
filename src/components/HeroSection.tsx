import React from 'react';
import { Sparkles, Music, Disc3, ShieldCheck, Zap, MapPin, Award } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import BeatStarsSearchBar from './BeatStarsSearchBar';
import { Beat } from '../types';

interface HeroSectionProps {
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  selectedGenre?: string;
  setSelectedGenre?: (val: string) => void;
  selectedBpmRange?: string;
  setSelectedBpmRange?: (val: string) => void;
  selectedMood?: string;
  setSelectedMood?: (val: string) => void;
  selectedKey?: string;
  setSelectedKey?: (val: string) => void;
  onPurchaseBeat?: (beat: Beat) => void;
  onFreeDownloadBeat?: (beat: Beat) => void;
  onExploreCatalog: () => void;
  onRequestCustom: () => void;
}

export default function HeroSection({
  searchQuery = '',
  setSearchQuery = () => {},
  selectedGenre,
  setSelectedGenre,
  selectedBpmRange,
  setSelectedBpmRange,
  selectedMood,
  setSelectedMood,
  selectedKey,
  setSelectedKey,
  onPurchaseBeat,
  onFreeDownloadBeat,
  onExploreCatalog,
  onRequestCustom,
}: HeroSectionProps) {
  const { state } = useStore();
  const profile = state?.profile || {
    name: 'Voodoo Boomin',
    tagline: 'Multi-Platinum Trap & Dark 808 Architect',
    bio: 'Industry producer crafting heavy trap basslines, atmospheric synths, and dark melodic drills.',
    avatarUrl: '',
    coverUrl: '',
    location: 'Atlanta, GA / Global'
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-purple-900/40 shadow-2xl bg-[#07070a] min-h-[500px] flex flex-col justify-center">
      {/* Abstract Dark Layer Art Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-950/80 via-black/95 to-neutral-950/90 z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/40 via-[#0a0a0f]/80 to-transparent z-0 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]" />
      
      {/* Decorative vertical visual stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-purple-600 via-indigo-500 to-transparent z-10" />

      <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 w-full flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12">
        
        {/* Brand Information / Left Column */}
        <div className="flex-1 space-y-6 text-left">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-400" />
              {profile.tagline || 'Multi-Platinum Trap & Dark 808 Architect'}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-850 text-neutral-400 text-[10px] font-semibold font-mono uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Royalty Free
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none text-white uppercase italic">
              {profile.name || 'Voodoo Boomin'}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-white text-3xl sm:text-4xl md:text-5xl font-extrabold normal-case not-italic mt-1">
                Trap Production Network
              </span>
            </h1>
          </div>
          
          <p className="text-neutral-300 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
            {profile.bio || 'Search hundreds of custom trap, drill, and melodic hip-hop instrumentals. Download free tagged MP3s or license studio-grade WAV tracked stems instantly.'}
          </p>

          {/* BEATSTARS HOMEPAGE SEARCH BAR */}
          <div className="w-full pt-2">
            <BeatStarsSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
              selectedBpmRange={selectedBpmRange}
              setSelectedBpmRange={setSelectedBpmRange}
              selectedMood={selectedMood}
              setSelectedMood={setSelectedMood}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
              onPurchaseBeat={onPurchaseBeat}
              onFreeDownloadBeat={onFreeDownloadBeat}
              onSearchSubmit={onExploreCatalog}
            />
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button 
              onClick={onExploreCatalog}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_24px_rgba(147,51,234,0.35)] cursor-pointer flex items-center gap-2"
            >
              <Disc3 className="w-4 h-4 animate-spin-slow" />
              <span>Explore Beats Catalog</span>
            </button>
            <button 
              onClick={onRequestCustom}
              className="px-6 py-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Request Custom Beat</span>
            </button>
          </div>
        </div>

        {/* Profile Avatar Frame / Right Column */}
        <div className="shrink-0 flex flex-col items-center justify-center space-y-3 md:mt-2">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden border-2 border-purple-500/40 bg-neutral-950 p-1">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name} 
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-neutral-900 to-purple-950/80 flex flex-col items-center justify-center text-center p-3">
                  <Music className="w-10 h-10 text-purple-400 mb-2 animate-bounce" />
                  <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">VOODOO</span>
                  <span className="text-[9px] font-mono text-purple-500 font-bold tracking-tight">STUDIO</span>
                </div>
              )}
            </div>
          </div>

          {profile.location && (
            <div className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 font-bold uppercase tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span>{profile.location}</span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
