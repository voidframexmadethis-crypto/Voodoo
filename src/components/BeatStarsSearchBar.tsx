import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat } from '../types';
import { filterHumanBeats, isAIPlaceholderBeat } from '../lib/beatUtils';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  Sparkles, 
  Flame, 
  Download, 
  Play, 
  Pause, 
  ShoppingCart, 
  ArrowRight, 
  Music, 
  Clock, 
  TrendingUp,
  Tag,
  Check,
  ChevronDown
} from 'lucide-react';

interface BeatStarsSearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGenre?: string;
  setSelectedGenre?: (g: string) => void;
  selectedBpmRange?: string;
  setSelectedBpmRange?: (bpm: string) => void;
  selectedMood?: string;
  setSelectedMood?: (mood: string) => void;
  selectedKey?: string;
  setSelectedKey?: (key: string) => void;
  onPurchaseBeat?: (beat: Beat) => void;
  onFreeDownloadBeat?: (beat: Beat) => void;
  onSearchSubmit?: () => void;
  isCompact?: boolean;
}

const TRENDING_TAGS = [
  { label: '🔥 Top Hits', type: 'special', value: 'top' },
  { label: '💎 Free Downloads', type: 'special', value: 'free' },
  { label: '#Trap', type: 'genre', value: 'TRAP' },
  { label: '#Dark', type: 'mood', value: 'DARK' },
  { label: '#Drill', type: 'genre', value: 'DRILL' },
  { label: '#MetroBoomin', type: 'tag', value: 'Metro' },
  { label: '#Drake', type: 'tag', value: 'Drake' },
  { label: '#Guitar', type: 'tag', value: 'Guitar' },
  { label: '⚡ 140+ BPM', type: 'bpm', value: '135-160 (Fast Trap)' },
  { label: '#Melodic', type: 'mood', value: 'MELODIC' },
  { label: '#R&B', type: 'genre', value: 'R&B' },
];

export default function BeatStarsSearchBar({
  searchQuery,
  setSearchQuery,
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
  onSearchSubmit,
  isCompact = false,
}: BeatStarsSearchBarProps) {
  const navigate = useNavigate();
  const { state, cart, addToCart } = useStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('VOODOO_RECENT_SEARCHES');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Keyboard shortcut: Pressing "/" or "Cmd+K" / "Ctrl+K" focuses search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape' && isFocused) {
          setIsFocused(false);
          inputRef.current?.blur();
        }
        return;
      }

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const beats = filterHumanBeats(state.beats || []);

  // Matching beats for live search preview
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return beats.filter(b => {
      const titleMatch = Boolean(b.title && b.title.toLowerCase().includes(q));
      const prodMatch = Boolean(b.producer && b.producer.toLowerCase().includes(q));
      const tagMatch = Boolean(Array.isArray(b.tags) && b.tags.some(t => t && t.toLowerCase().includes(q)));
      const keyMatch = Boolean(b.key && b.key.toLowerCase().includes(q));
      const moodMatch = Boolean(
        Array.isArray(b.mood) 
          ? b.mood.some(m => m && typeof m === 'string' && m.toLowerCase().includes(q))
          : typeof b.mood === 'string' ? (b.mood as string).toLowerCase().includes(q) : false
      );
      const bpmMatch = Boolean(b.bpm && b.bpm.toString().includes(q));
      return titleMatch || prodMatch || tagMatch || keyMatch || moodMatch || bpmMatch;
    }).slice(0, 5);
  }, [beats, searchQuery]);

  const saveSearchToRecents = (query: string) => {
    if (!query.trim()) return;
    const clean = query.trim();
    const updated = [clean, ...recentSearches.filter((s: string) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('VOODOO_RECENT_SEARCHES', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      saveSearchToRecents(searchQuery);
    }
    setIsFocused(false);
    if (onSearchSubmit) {
      onSearchSubmit();
    } else {
      const el = document.getElementById('catalog-search-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleTagClick = (tag: typeof TRENDING_TAGS[0]) => {
    if (tag.type === 'genre' && setSelectedGenre) {
      setSelectedGenre(tag.value);
    } else if (tag.type === 'mood' && setSelectedMood) {
      setSelectedMood(tag.value);
    } else if (tag.type === 'bpm' && setSelectedBpmRange) {
      setSelectedBpmRange(tag.value);
    } else if (tag.type === 'special') {
      if (tag.value === 'free') {
        setSearchQuery('free');
      } else if (tag.value === 'top') {
        const el = document.getElementById('top-tracks');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
    } else {
      setSearchQuery(tag.value);
      saveSearchToRecents(tag.value);
    }

    const el = document.getElementById('catalog-search-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsFocused(false);
  };

  const handleTrackPlay = (beat: Beat, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTrack?.id === beat.id) {
      togglePlay();
    } else {
      playTrack(beat);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const removeRecent = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== item);
    setRecentSearches(updated);
    try {
      localStorage.setItem('VOODOO_RECENT_SEARCHES', JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <div ref={containerRef} className="w-full relative z-30">
      {/* Main BeatStars Search Bar Box */}
      <div 
        className={`w-full rounded-2xl transition-all duration-300 ${
          isFocused 
            ? 'shadow-[0_0_35px_rgba(168,85,247,0.35)] ring-2 ring-purple-500/80 bg-neutral-900/95' 
            : 'shadow-2xl bg-neutral-900/80 hover:bg-neutral-900/90'
        } backdrop-blur-xl border border-neutral-750/90`}
      >
        <form onSubmit={handleSearchSubmit} className="relative flex items-center p-1.5 sm:p-2">
          {/* BeatStars Search Icon with Pulse Effect */}
          <div className="pl-3 sm:pl-4 pr-2 sm:pr-3 flex items-center pointer-events-none text-purple-400">
            <Search className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isFocused ? 'scale-110 text-purple-400 animate-pulse' : 'text-neutral-400'}`} />
          </div>

          {/* Search Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="What type of track are you looking for? (Title, Genre, Mood, BPM, Key...)"
            className="w-full bg-transparent text-white placeholder-neutral-400 text-sm sm:text-base font-semibold focus:outline-none py-2.5 sm:py-3.5 pr-2"
          />

          {/* Quick Clear Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors mr-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Keyboard Shortcut Hint (Desktop) */}
          {!searchQuery && !isFocused && (
            <div className="hidden lg:flex items-center gap-1 mr-2 px-2 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-[11px] font-mono text-neutral-400 select-none">
              <span className="text-[10px]">Press</span>
              <kbd className="text-purple-300 font-bold">/</kbd>
            </div>
          )}

          {/* Quick Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all mr-1.5 sm:mr-2 flex items-center gap-1.5 cursor-pointer ${
              showFilters 
                ? 'bg-purple-600/20 border-purple-500 text-purple-300' 
                : 'bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700/80 text-neutral-300'
            }`}
            title="Toggle quick filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Filters</span>
          </button>

          {/* Search CTA Button */}
          <button
            type="submit"
            className="px-5 sm:px-7 py-2.5 sm:py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4 hidden sm:inline" />
          </button>
        </form>

        {/* Quick Filter Row (Dropdown accordian) */}
        {showFilters && (
          <div className="px-4 pb-4 pt-2 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-200">
            {/* Genre */}
            {setSelectedGenre && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Genre</label>
                <select
                  value={selectedGenre || 'ALL'}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Genres</option>
                  <option value="TRAP">Trap</option>
                  <option value="DRILL">Drill</option>
                  <option value="HIP HOP">Hip Hop</option>
                  <option value="R&B">R&B</option>
                  <option value="BOOM BAP">Boom Bap</option>
                </select>
              </div>
            )}

            {/* BPM */}
            {setSelectedBpmRange && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Tempo / BPM</label>
                <select
                  value={selectedBpmRange || 'ALL'}
                  onChange={(e) => setSelectedBpmRange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Tempos</option>
                  <option value="80-110 (Slow)">80-110 (Slow)</option>
                  <option value="110-135 (Mid)">110-135 (Mid)</option>
                  <option value="135-160 (Fast Trap)">135-160 (Fast Trap)</option>
                  <option value="160+ (Speed Drill)">160+ (Speed Drill)</option>
                </select>
              </div>
            )}

            {/* Mood */}
            {setSelectedMood && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Mood</label>
                <select
                  value={selectedMood || 'ALL'}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Moods</option>
                  <option value="DARK">Dark / Menacing</option>
                  <option value="AGGRESSIVE">Aggressive</option>
                  <option value="MELODIC">Melodic</option>
                  <option value="ENERGETIC">Energetic</option>
                  <option value="CHILL">Chill / Atmospheric</option>
                </select>
              </div>
            )}

            {/* Key */}
            {setSelectedKey && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Musical Key</label>
                <select
                  value={selectedKey || 'ALL'}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Keys</option>
                  <option value="A MINOR">A Minor</option>
                  <option value="C MINOR">C Minor</option>
                  <option value="D MINOR">D Minor</option>
                  <option value="E MINOR">E Minor</option>
                  <option value="F# MINOR">F# Minor</option>
                  <option value="G MINOR">G Minor</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BeatStars Trending Quick Filter Tags */}
      {!isCompact && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 flex-shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            Trending:
          </span>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {TRENDING_TAGS.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1 rounded-full bg-neutral-900/90 hover:bg-purple-600/30 border border-neutral-800 hover:border-purple-500/50 text-neutral-300 hover:text-white text-xs font-semibold whitespace-nowrap transition-all active:scale-95 shadow-sm"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Auto-Suggest Instant Dropdown (BeatStars Style) */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-[#0f0f14] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-200 divide-y divide-neutral-800/80">
          {/* Query Match Results */}
          {searchQuery.trim() ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  Instant Track Matches ({searchResults.length})
                </span>
                <span className="text-purple-400 text-[11px] lowercase">Live beat lookup</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-6 text-center text-neutral-400 text-xs">
                  <p className="font-semibold text-neutral-300">No exact matches found for "{searchQuery}"</p>
                  <p className="mt-1 text-neutral-500">Press Enter or click Search to explore related tags in catalog.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((beat) => {
                    const isTrackPlaying = currentTrack?.id === beat.id && isPlaying;
                    const inCart = cart.some(item => item.beat.id === beat.id);

                    return (
                      <div
                        key={beat.id}
                        onClick={() => {
                          const el = document.getElementById('catalog-search-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                          setIsFocused(false);
                        }}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800/80 hover:border-purple-500/40 transition-all cursor-pointer group"
                      >
                        {/* Play button + Cover Art */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-950 border border-neutral-800">
                            {beat.coverArtUrl ? (
                              <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-purple-400 bg-neutral-900 font-bold text-xs">
                                VB
                              </div>
                            )}

                            {/* Hover / Active Play Button Overlay */}
                            <button
                              onClick={(e) => handleTrackPlay(beat, e)}
                              className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity ${
                                isTrackPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              {isTrackPlaying ? (
                                <Pause className="w-5 h-5 text-purple-400 fill-current" />
                              ) : (
                                <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                              )}
                            </button>
                          </div>

                          {/* Track Details */}
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 truncate">
                              {beat.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                              <span>{beat.bpm} BPM</span>
                              {beat.key && <span>• {beat.key}</span>}
                              {beat.tags && beat.tags[0] && (
                                <span className="text-purple-400 font-medium truncate">{beat.tags[0]}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {beat.freeDownload?.enabled && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onFreeDownloadBeat) onFreeDownloadBeat(beat);
                              }}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Free
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onPurchaseBeat) {
                                onPurchaseBeat(beat);
                              } else {
                                addToCart(beat, 'mp3Lease', beat.price);
                              }
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            ${beat.price}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom "View all results" button */}
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full py-2.5 bg-neutral-900 hover:bg-purple-600/20 border border-neutral-800 hover:border-purple-500/40 text-purple-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>View all search results in catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* If search box is empty, show recent searches & trending */
            <div className="p-4 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      Recent Searches
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item, idx) => (
                      <span
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item);
                          handleSearchSubmit();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={(e) => removeRecent(item, e)}
                          className="hover:text-red-400 text-neutral-500 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  Popular Categories & Moods
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {['🔥 Heavy Dark Trap', '⚡ 140 BPM Drill', '🎸 Guitar Instrumentals', '💎 Free Download Beats', '🎹 Melodic R&B', '👑 Metro Boomin Style'].map((cat, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const clean = cat.replace(/[🔥⚡🎸💎🎹👑]/g, '').trim();
                        setSearchQuery(clean);
                        saveSearchToRecents(clean);
                        handleSearchSubmit();
                      }}
                      className="p-2.5 bg-neutral-900/70 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left text-neutral-300 hover:text-white font-medium transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
