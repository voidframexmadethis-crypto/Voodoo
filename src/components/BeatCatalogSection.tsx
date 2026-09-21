import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat } from '../types';
import { 
  Search, 
  Heart, 
  ChevronDown, 
  Check, 
  Sun, 
  Moon, 
  Grid, 
  List, 
  Sparkles, 
  Volume2, 
  SlidersHorizontal, 
  Play, 
  Pause, 
  ShoppingCart, 
  Download, 
  Share2, 
  Music,
  TrendingUp,
  Award,
  Layers,
  X,
  Flame,
  ListMusic,
  Eye,
  Zap,
  ShoppingBag
} from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { isAIPlaceholderBeat } from '../lib/beatUtils';

export const getBeatDuration = (beat: Beat) => {
  const totalSeconds = 175 + (beat.bpm % 35) + (beat.title.charCodeAt(0) || 0) % 15;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface BeatCatalogSectionProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (val: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showLikedOnly: boolean;
  setShowLikedOnly: (val: boolean) => void;
  selectedGenre: string;
  setSelectedGenre: (val: string) => void;
  selectedBpmRange: string;
  setSelectedBpmRange: (val: string) => void;
  customMinBpm: string;
  setCustomMinBpm: (val: string) => void;
  customMaxBpm: string;
  setCustomMaxBpm: (val: string) => void;
  selectedMood: string;
  setSelectedMood: (val: string) => void;
  selectedKey: string;
  setSelectedKey: (val: string) => void;
  selectedSort: string;
  setSelectedSort: (val: string) => void;
  isGenreOpen: boolean;
  setIsGenreOpen: (val: boolean) => void;
  isBpmOpen: boolean;
  setIsBpmOpen: (val: boolean) => void;
  isMoodOpen: boolean;
  setIsMoodOpen: (val: boolean) => void;
  isKeyOpen: boolean;
  setIsKeyOpen: (val: boolean) => void;
  genreOptions: string[];
  bpmOptions: string[];
  moodOptions: string[];
  keyOptions: string[];
  displayedBeats: Beat[];
  baseBeats: Beat[];
  filteredCount: number;
  totalActiveCount: number;
  copiedBeatId: string | null;
  onCopyShare: (id: string) => void;
  onTogglePlay: (beat: Beat) => void;
  onPurchase: (beat: Beat) => void;
  onFreeDownload: (beat: Beat) => void;
  onResetFilters: () => void;
}

export default function BeatCatalogSection({
  isDarkMode,
  setIsDarkMode,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  showLikedOnly,
  setShowLikedOnly,
  selectedGenre,
  setSelectedGenre,
  selectedBpmRange,
  setSelectedBpmRange,
  customMinBpm,
  setCustomMinBpm,
  customMaxBpm,
  setCustomMaxBpm,
  selectedMood,
  setSelectedMood,
  selectedKey,
  setSelectedKey,
  selectedSort,
  setSelectedSort,
  isGenreOpen,
  setIsGenreOpen,
  isBpmOpen,
  setIsBpmOpen,
  isMoodOpen,
  setIsMoodOpen,
  isKeyOpen,
  setIsKeyOpen,
  genreOptions,
  bpmOptions,
  moodOptions,
  keyOptions,
  displayedBeats,
  baseBeats,
  filteredCount,
  totalActiveCount,
  copiedBeatId,
  onCopyShare,
  onTogglePlay,
  onPurchase,
  onFreeDownload,
  onResetFilters,
}: BeatCatalogSectionProps) {
  const { cart, favorites, toggleFavorite, recentlyViewed, trackBeatView, addToCart } = useStore();
  const { currentTrack, isPlaying: isGlobalPlaying, addToQueue, queue } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<'catalog' | 'recent' | 'viewed' | 'favorites' | 'newest' | 'trending' | 'downloads' | 'purchased'>('catalog');
  const [recentPlays, setRecentPlays] = useState<string[]>([]);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const loadRecent = () => {
      try {
        const historyStr = localStorage.getItem('voodooboomin_recently_played');
        setRecentPlays(historyStr ? JSON.parse(historyStr) : []);
      } catch (e) {
        console.error(e);
      }
    };
    loadRecent();
    window.addEventListener('voodooboomin_recently_played_updated', loadRecent);
    return () => window.removeEventListener('voodooboomin_recently_played_updated', loadRecent);
  }, []);

  // Curated Lists matching baseBeats
  const currentBeatsToDisplay = useMemo(() => {
    switch (activeTab) {
      case 'recent': {
        // Feature 1 — Recently Played
        const mapped = recentPlays
          .map(id => baseBeats.find(b => b.id === id))
          .filter((b): b is Beat => !!b);
        return mapped;
      }
      case 'viewed': {
        // Feature 20 — Recently Viewed Beats
        const mapped = (recentlyViewed || [])
          .map(id => baseBeats.find(b => b.id === id))
          .filter((b): b is Beat => !!b);
        return mapped;
      }
      case 'favorites': {
        // Feature 2 — Favorites / Wishlist
        return baseBeats.filter(b => favorites.includes(b.id));
      }
      case 'newest': {
        // Feature 3 — Recently Added
        return [...baseBeats].sort((a, b) => {
          const d1 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const d2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return d2 - d1;
        });
      }
      case 'trending': {
        // Feature 4 — Trending Now
        const active = baseBeats.filter(b => (b.plays || 0) > 0);
        return [...active].sort((a, b) => (b.plays || 0) - (a.plays || 0));
      }
      case 'downloads': {
        // Feature 5 — Most Downloaded
        const active = baseBeats.filter(b => (b.downloads || 0) > 0);
        return [...active].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      }
      case 'purchased': {
        // Feature 6 — Most Purchased
        const active = baseBeats.filter(b => (b.purchases || 0) > 0);
        return [...active].sort((a, b) => (b.purchases || 0) - (a.purchases || 0));
      }
      case 'catalog':
      default:
        return displayedBeats;
    }
  }, [activeTab, displayedBeats, baseBeats, recentPlays, favorites]);

  const renderEmptyState = () => {
    if (activeTab === 'recent') {
      return (
        <div className="text-center py-20 border border-neutral-850/60 rounded-xl mt-6 bg-neutral-900/10">
          <Volume2 className="w-12 h-12 text-neutral-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-bold uppercase tracking-wider text-neutral-300">Your Listening History is Empty</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            You haven't listened to any instrumentals yet. Play some tracks in the Marketplace to see them tracked here in real-time!
          </p>
          <button 
            onClick={() => setActiveTab('catalog')} 
            className="mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
          >
            Explore Marketplace
          </button>
        </div>
      );
    }
    if (activeTab === 'viewed') {
      return (
        <div className="text-center py-20 border border-neutral-850/60 rounded-xl mt-6 bg-neutral-900/10">
          <Eye className="w-12 h-12 text-neutral-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-bold uppercase tracking-wider text-neutral-300">No Recently Viewed Beats</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Browse beat details in the catalog to build your viewing history automatically without affecting play counts.
          </p>
          <button 
            onClick={() => setActiveTab('catalog')} 
            className="mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
          >
            Browse Beats
          </button>
        </div>
      );
    }
    if (activeTab === 'favorites') {
      return (
        <div className="text-center py-20 border border-neutral-850/60 rounded-xl mt-6 bg-neutral-900/10">
          <Heart className="w-12 h-12 text-neutral-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-bold uppercase tracking-wider text-neutral-300">Your Wishlist is Empty</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Tap the heart icon on any beat card in the storefront to save your favorites here for quick checkout later.
          </p>
          <button 
            onClick={() => setActiveTab('catalog')} 
            className="mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
          >
            Find Beats to Save
          </button>
        </div>
      );
    }
    if (activeTab === 'trending') {
      return (
        <div className="text-center py-20 border border-neutral-850/60 rounded-xl mt-6 bg-neutral-900/10">
          <Flame className="w-12 h-12 text-neutral-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-bold uppercase tracking-wider text-neutral-300">No Trending Tracks Yet</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Our real-time engine hasn't recorded enough playback activity to generate a trending curve. Support the community by streaming tracks below!
          </p>
          <button 
            onClick={() => setActiveTab('catalog')} 
            className="mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
          >
            Start Streaming
          </button>
        </div>
      );
    }
    if (activeTab === 'downloads') {
      return (
        <div className="text-center py-20 border border-neutral-850/60 rounded-xl mt-6 bg-neutral-900/10">
          <Download className="w-12 h-12 text-neutral-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-bold uppercase tracking-wider text-neutral-300">No Download Data</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            No completed free downloads have been recorded yet. Click download on free-tagged beats in the marketplace to unlock high-quality versions.
          </p>
          <button 
            onClick={() => setActiveTab('catalog')} 
            className="mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
          >
            Find Free Downloads
          </button>
        </div>
      );
    }
    if (activeTab === 'purchased') {
      return (
        <div className="text-center py-20 border border-neutral-850/60 rounded-xl mt-6 bg-neutral-900/10">
          <ShoppingCart className="w-12 h-12 text-neutral-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-bold uppercase tracking-wider text-neutral-300">No Store Purchases Recorded</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            No transactions have been completed yet. Once checkout purchases are made via PayPal, best-sellers will rank here instantly!
          </p>
          <button 
            onClick={() => setActiveTab('catalog')} 
            className="mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
          >
            Explore Beats
          </button>
        </div>
      );
    }
    return (
      <div className="text-center py-20 border border-neutral-850/60 rounded-xl mt-6 bg-neutral-900/10">
        <Music className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
        <h3 className="text-base font-bold uppercase tracking-wider text-neutral-300">No instrumentals match criteria</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">Try resetting active filters or searching for alternative BPM or mood categories.</p>
      </div>
    );
  };

  return (
    <section 
      id="catalog-search-section"
      className={`rounded-2xl p-6 border shadow-lg transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0d0d11] border-neutral-900' : 'bg-white border-neutral-200'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-850/50">
        <div>
          <h2 className="text-xl font-extrabold uppercase italic tracking-tight">Instrumental Catalog</h2>
          <p className={`text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>Filter custom stems, leases, and bpm parameters instantly.</p>
        </div>

        {/* Catalog Layout Toggles and Theme Options */}
        <div className="flex items-center gap-3">
          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg border transition-all active:scale-90 cursor-pointer ${
              isDarkMode 
                ? 'bg-neutral-900 border-neutral-800 text-amber-400 hover:text-amber-300' 
                : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:text-purple-600'
            }`}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <span className="w-px h-6 bg-neutral-800" />

          {/* Grid / List View Toggles */}
          <div className={`p-0.5 rounded-lg border flex items-center ${
            isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
          }`}>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Feature #1–#6 Dynamic Discovery Tabs with scroll indicator */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 border-b border-neutral-850/30 scrollbar-none text-xs">
        {[
          { id: 'catalog', label: '🔍 Marketplace', icon: Music },
          { id: 'recent', label: '⏱️ Recently Played', icon: Volume2 },
          { id: 'viewed', label: '👁️ Recently Viewed', icon: Eye },
          { id: 'favorites', label: '❤️ Wishlist', icon: Heart },
          { id: 'newest', label: '✨ New Releases', icon: Sparkles },
          { id: 'trending', label: '🔥 Trending Now', icon: Flame },
          { id: 'downloads', label: '📥 Top Downloads', icon: Download },
          { id: 'purchased', label: '💎 Best Sellers', icon: ShoppingCart },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsSortOpen(false);
                setIsGenreOpen(false);
                setIsBpmOpen(false);
                setIsMoodOpen(false);
                setIsKeyOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs border ${
                isActive
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-102 font-extrabold'
                  : isDarkMode
                    ? 'bg-[#121217] border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'catalog' ? (
        /* Filter Input & Dropdowns Grid */
        <div className="space-y-6 pt-6">
          {/* Search bar & Liked filter toggle */}
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative w-full flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search instrumentals by title, genre, tag, mood, tempo (Press / to search)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border pl-12 pr-12 py-3.5 rounded-xl text-sm font-semibold tracking-wide focus:outline-none transition-all shadow-inner ${
                  isDarkMode 
                    ? 'bg-[#121217] border-neutral-850/80 focus:border-purple-600 focus:bg-[#08080a] text-white' 
                    : 'bg-[#f4f4f5] border-neutral-300 focus:border-purple-500 focus:bg-white text-neutral-900'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Favorites filter badge toggler */}
            <button
              onClick={() => setShowLikedOnly(!showLikedOnly)}
              className={`flex items-center gap-2.5 px-5 py-3.5 border rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95 cursor-pointer shrink-0 ${
                showLikedOnly 
                  ? 'bg-red-500/10 border-red-500 text-red-500' 
                  : isDarkMode 
                    ? 'bg-[#121217] border-neutral-850/80 text-neutral-300 hover:text-white hover:border-neutral-700' 
                    : 'bg-[#f4f4f5] border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:border-neutral-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${showLikedOnly ? 'fill-current text-red-500' : ''}`} />
              <span>{showLikedOnly ? 'Showing Liked Beats' : 'Show Liked Beats'}</span>
              {favorites.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                  {favorites.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Filter Tag Bar (BeatStars Style) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              Quick Tags:
            </span>
            {['#Trap', '#Dark', '#Drill', '#Drake', '#Metro', '#Guitar', '#Melodic', '#R&B'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag.replace('#', ''))}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  searchQuery.toLowerCase() === tag.replace('#', '').toLowerCase()
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                    : isDarkMode
                      ? 'bg-[#121217] border-neutral-800 text-neutral-400 hover:text-white hover:border-purple-500/40'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tag}
              </button>
            ))}
            {(searchQuery || selectedGenre !== 'ALL' || selectedBpmRange !== 'ALL' || customMinBpm || customMaxBpm || selectedMood !== 'ALL' || selectedKey !== 'ALL' || showLikedOnly) && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-3 py-1 rounded-full text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 whitespace-nowrap ml-auto cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Reset All
              </button>
            )}
          </div>

          {/* Selector columns - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Genre Filter */}
            <div className="relative">
              <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 pl-1">Genre</span>
              <button 
                onClick={() => { setIsGenreOpen(!isGenreOpen); setIsBpmOpen(false); setIsMoodOpen(false); setIsKeyOpen(false); setIsSortOpen(false); }}
                className={`w-full border px-4 py-3 rounded-lg flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121217] border-neutral-850 text-neutral-200' : 'bg-[#f4f4f5] border-neutral-300 text-neutral-700'
                }`}
              >
                <span className="truncate">{selectedGenre === 'ALL' ? 'ALL GENRES' : selectedGenre}</span>
                <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
              </button>
              {isGenreOpen && (
                <div className={`absolute top-[68px] left-0 right-0 z-30 border rounded-lg shadow-2xl py-1.5 max-h-56 overflow-y-auto ${
                  isDarkMode ? 'bg-[#0d0d11] border-neutral-900' : 'bg-white border-neutral-200 text-neutral-800'
                }`}>
                  {genreOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSelectedGenre(opt); setIsGenreOpen(false); }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors flex items-center justify-between hover:bg-purple-900/10 hover:text-purple-400 cursor-pointer ${
                        isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      <span>{opt === 'ALL' ? 'ALL GENRES' : opt}</span>
                      {selectedGenre === opt && <Check className="w-3.5 h-3.5 text-purple-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BPM Filter & Custom Range Input */}
            <div className="relative">
              <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 pl-1">Tempo (BPM)</span>
              <button 
                onClick={() => { setIsBpmOpen(!isBpmOpen); setIsGenreOpen(false); setIsMoodOpen(false); setIsKeyOpen(false); setIsSortOpen(false); }}
                className={`w-full border px-4 py-3 rounded-lg flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121217] border-neutral-850 text-neutral-200' : 'bg-[#f4f4f5] border-neutral-300 text-neutral-700'
                }`}
              >
                <span className="truncate">
                  {customMinBpm || customMaxBpm 
                    ? `⏱️ ${customMinBpm || '0'}-${customMaxBpm || '999'} BPM` 
                    : selectedBpmRange === 'ALL' 
                      ? 'ALL TEMPOS' 
                      : selectedBpmRange}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
              </button>
              {isBpmOpen && (
                <div className={`absolute top-[68px] left-0 right-0 z-30 border rounded-lg shadow-2xl py-1.5 max-h-64 overflow-y-auto ${
                  isDarkMode ? 'bg-[#0d0d11] border-neutral-900' : 'bg-white border-neutral-200 text-neutral-800'
                }`}>
                  {/* Feature #8 - BPM Custom Range Inputs */}
                  <div className="px-3 py-2 border-b border-neutral-850/50 flex items-center gap-1.5 mb-1 bg-neutral-950/20">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={customMinBpm}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { 
                        setCustomMinBpm(e.target.value); 
                        setSelectedBpmRange('ALL'); 
                      }}
                      className={`w-1/2 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold ${
                        isDarkMode ? 'bg-[#111116] border border-neutral-800 text-white' : 'bg-neutral-100 border border-neutral-300 text-neutral-800'
                      }`}
                    />
                    <span className="text-neutral-500 text-[10px] font-bold">to</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={customMaxBpm}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { 
                        setCustomMaxBpm(e.target.value); 
                        setSelectedBpmRange('ALL'); 
                      }}
                      className={`w-1/2 px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold ${
                        isDarkMode ? 'bg-[#111116] border border-neutral-800 text-white' : 'bg-neutral-100 border border-neutral-300 text-neutral-800'
                      }`}
                    />
                  </div>
                  {bpmOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { 
                        setSelectedBpmRange(opt); 
                        setCustomMinBpm(''); 
                        setCustomMaxBpm(''); 
                        setIsBpmOpen(false); 
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors flex items-center justify-between hover:bg-purple-900/10 hover:text-purple-400 cursor-pointer ${
                        isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      <span>{opt === 'ALL' ? 'ALL TEMPOS' : opt}</span>
                      {selectedBpmRange === opt && !customMinBpm && !customMaxBpm && <Check className="w-3.5 h-3.5 text-purple-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mood Filter */}
            <div className="relative">
              <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 pl-1">Vibe / Mood</span>
              <button 
                onClick={() => { setIsMoodOpen(!isMoodOpen); setIsGenreOpen(false); setIsBpmOpen(false); setIsKeyOpen(false); setIsSortOpen(false); }}
                className={`w-full border px-4 py-3 rounded-lg flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121217] border-neutral-850 text-neutral-200' : 'bg-[#f4f4f5] border-neutral-300 text-neutral-700'
                }`}
              >
                <span className="truncate">{selectedMood === 'ALL' ? 'ALL MOODS' : selectedMood}</span>
                <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
              </button>
              {isMoodOpen && (
                <div className={`absolute top-[68px] left-0 right-0 z-30 border rounded-lg shadow-2xl py-1.5 max-h-56 overflow-y-auto ${
                  isDarkMode ? 'bg-[#0d0d11] border-neutral-900' : 'bg-white border-neutral-200 text-neutral-800'
                }`}>
                  {moodOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSelectedMood(opt); setIsMoodOpen(false); }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors flex items-center justify-between hover:bg-purple-900/10 hover:text-purple-400 cursor-pointer ${
                        isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      <span>{opt === 'ALL' ? 'ALL MOODS' : opt}</span>
                      {selectedMood === opt && <Check className="w-3.5 h-3.5 text-purple-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key Filter */}
            <div className="relative">
              <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 pl-1">Scale / Key</span>
              <button 
                onClick={() => { setIsKeyOpen(!isKeyOpen); setIsGenreOpen(false); setIsBpmOpen(false); setIsMoodOpen(false); setIsSortOpen(false); }}
                className={`w-full border px-4 py-3 rounded-lg flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121217] border-neutral-850 text-neutral-200' : 'bg-[#f4f4f5] border-neutral-300 text-neutral-700'
                }`}
              >
                <span className="truncate">{selectedKey === 'ALL' ? 'ALL KEYS' : selectedKey}</span>
                <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
              </button>
              {isKeyOpen && (
                <div className={`absolute top-[68px] left-0 right-0 z-30 border rounded-lg shadow-2xl py-1.5 max-h-56 overflow-y-auto ${
                  isDarkMode ? 'bg-[#0d0d11] border-neutral-900' : 'bg-white border-neutral-200 text-neutral-800'
                }`}>
                  {keyOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSelectedKey(opt); setIsKeyOpen(false); }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors flex items-center justify-between hover:bg-purple-900/10 hover:text-purple-400 cursor-pointer ${
                        isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      <span>{opt === 'ALL' ? 'ALL KEYS' : opt}</span>
                      {selectedKey === opt && <Check className="w-3.5 h-3.5 text-purple-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Feature #10 - Sorting Controls Column */}
            <div className="relative">
              <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 pl-1">Sort By</span>
              <button 
                onClick={() => { setIsSortOpen(!isSortOpen); setIsGenreOpen(false); setIsBpmOpen(false); setIsMoodOpen(false); setIsKeyOpen(false); }}
                className={`w-full border px-4 py-3 rounded-lg flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121217] border-neutral-850 text-neutral-200' : 'bg-[#f4f4f5] border-neutral-300 text-neutral-700'
                }`}
              >
                <span className="truncate">
                  {selectedSort === 'newest' && '📅 Newest'}
                  {selectedSort === 'oldest' && '⏳ Oldest'}
                  {selectedSort === 'most_played' && '🔥 Most Played'}
                  {selectedSort === 'most_downloaded' && '📥 Most Downloaded'}
                  {selectedSort === 'most_purchased' && '💎 Best Sellers'}
                  {selectedSort === 'price_low_high' && '💵 Price: Low-High'}
                  {selectedSort === 'price_high_low' && '💸 Price: High-Low'}
                  {selectedSort === 'alphabetical' && '🔤 Alphabetical'}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
              </button>
              {isSortOpen && (
                <div className={`absolute top-[68px] left-0 right-0 z-30 border rounded-lg shadow-2xl py-1.5 max-h-64 overflow-y-auto ${
                  isDarkMode ? 'bg-[#0d0d11] border-neutral-900' : 'bg-white border-neutral-200 text-neutral-800'
                }`}>
                  {[
                    { value: 'newest', label: '📅 Newest First' },
                    { value: 'oldest', label: '⏳ Oldest First' },
                    { value: 'most_played', label: '🔥 Most Streamed' },
                    { value: 'most_downloaded', label: '📥 Most Downloaded' },
                    { value: 'most_purchased', label: '💎 Best Sellers' },
                    { value: 'price_low_high', label: '💵 Price: Low to High' },
                    { value: 'price_high_low', label: '💸 Price: High to Low' },
                    { value: 'alphabetical', label: '🔤 Alphabetical' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedSort(opt.value); setIsSortOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors flex items-center justify-between hover:bg-purple-900/10 hover:text-purple-400 cursor-pointer ${
                        isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedSort === opt.value && <Check className="w-3.5 h-3.5 text-purple-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results count & Clear filters indicator */}
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-850/30 font-mono">
            <span>Showing <strong className="text-purple-400">{filteredCount}</strong> of {totalActiveCount} active releases</span>
            {(selectedGenre !== 'ALL' || selectedBpmRange !== 'ALL' || customMinBpm || customMaxBpm || selectedMood !== 'ALL' || selectedKey !== 'ALL' || searchQuery || showLikedOnly) && (
              <button 
                onClick={onResetFilters}
                className="text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Curated Section Header Indicator */
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-4 pb-1 border-b border-neutral-850/20 font-mono">
          <span>
            Curated playlist contains <strong className="text-purple-400">{currentBeatsToDisplay.length}</strong> releases
          </span>
          <button 
            onClick={() => setActiveTab('catalog')} 
            className="text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
          >
            &larr; Back to Catalog
          </button>
        </div>
      )}

      {/* Grid or List Catalog View */}
      {currentBeatsToDisplay.length === 0 ? (
        renderEmptyState()
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {currentBeatsToDisplay.map((beat) => {
            const isPlayingThis = isGlobalPlaying && currentTrack?.id === beat.id;
            const inCart = cart?.some(item => item.id === beat.id);
            const isLiked = favorites.includes(beat.id);
            const duration = getBeatDuration(beat);
            const inQueue = queue.some(qItem => qItem.id === beat.id);

            return (
              <div 
                key={beat.id}
                className={`group rounded-2xl p-4 border flex flex-col justify-between transition-all duration-300 relative ${
                  isPlayingThis 
                    ? 'bg-purple-950/20 border-purple-500/80 shadow-[0_4px_30px_rgba(147,51,234,0.15)]' 
                    : isDarkMode 
                      ? 'bg-[#111116] border-neutral-850 hover:border-neutral-700 hover:bg-[#15151c]' 
                      : 'bg-white border-neutral-200 hover:border-purple-300 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Artwork Container */}
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-neutral-800">
                    <img 
                      src={beat.coverArtUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop'} 
                      alt={beat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {/* Quick Wave Visualizer Overlay when playing */}
                    {isPlayingThis && (
                      <div className="absolute inset-x-0 bottom-0 top-0 bg-purple-950/70 flex items-center justify-center p-4">
                        <AudioVisualizer height={40} showControls={false} className="w-full" />
                      </div>
                    )}

                    {/* Play/Pause Button overlay */}
                    <button
                      onClick={() => {
                        trackBeatView(beat.id);
                        onTogglePlay(beat);
                      }}
                      className={`absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer ${
                        isPlayingThis ? 'opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label={isPlayingThis ? "Pause beat" : "Play beat"}
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        {isPlayingThis ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                      </div>
                    </button>

                    {/* Favorite Heart Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(beat.id); trackBeatView(beat.id); }}
                      className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-red-500 transition-colors border border-white/10 cursor-pointer"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                    </button>

                    {/* BPM & Key & Duration Pill */}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-white font-mono text-[9px] font-bold border border-white/10 tracking-tight">
                      {beat.bpm} BPM • {beat.key} • {duration}
                    </span>
                  </div>

                  {/* Feature 18: Buy Now Express CTA & + Cart Action Row */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => {
                        trackBeatView(beat.id);
                        onPurchase(beat);
                      }}
                      className="py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wide bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-purple-400/30"
                      title="Direct Buy Now without building cart"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Buy Now</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        trackBeatView(beat.id);
                        addToCart(beat, 'MP3 Lease', beat.price);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border ${
                        inCart 
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                          : isDarkMode
                            ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300'
                            : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      <ShoppingCart className="w-3 h-3 text-purple-400" />
                      <span>{inCart ? 'In Cart' : `+$${beat.price}`}</span>
                    </button>
                  </div>

                  {/* Title & Metadata */}
                  <div className="px-1">
                    <h3 className={`font-black text-sm uppercase italic tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                      {beat.title}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">{beat.producer || 'Voodoo Boomin'}</p>
                    
                    {/* Tags */}
                    {beat.tags && beat.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {beat.tags.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-850 text-neutral-400 font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Action Row - Free Downloads and Share */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-850/40 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
                    {(beat.freeDownload || (beat as any).isFreeDownload) ? 'Free Download' : 'Premium Only'}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Add to Queue Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); addToQueue(beat); }}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                        inQueue
                          ? 'bg-purple-950/40 border-purple-800 text-purple-400 font-bold'
                          : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                      title={inQueue ? "In Play Queue" : "Add to Queue"}
                    >
                      <ListMusic className="w-3.5 h-3.5" />
                    </button>

                    {/* Free Download option if enabled */}
                    {(beat.freeDownload || (beat as any).isFreeDownload) && (
                      <button
                        onClick={() => onFreeDownload(beat)}
                        className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                        title="Free tagged mp3 download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Share action */}
                    <button
                      onClick={() => onCopyShare(beat.id)}
                      className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors relative cursor-pointer flex items-center justify-center"
                      title="Share beat link"
                    >
                      {copiedBeatId === beat.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-850 text-[10px] uppercase font-mono text-neutral-500 tracking-wider">
                <th className="py-3 px-2 w-12">Play</th>
                <th className="py-3 px-3">Title / Producer</th>
                <th className="py-3 px-3 hidden md:table-cell">Tempo</th>
                <th className="py-3 px-3 hidden md:table-cell">Key</th>
                <th className="py-3 px-3 hidden md:table-cell">Duration</th>
                <th className="py-3 px-3 hidden lg:table-cell">Tags</th>
                <th className="py-3 px-3 text-right">Licensing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850/40">
              {currentBeatsToDisplay.map((beat) => {
                const isPlayingThis = isGlobalPlaying && currentTrack?.id === beat.id;
                const inCart = cart?.some(item => item.id === beat.id);
                const isLiked = favorites.includes(beat.id);
                const inQueue = queue.some(qItem => qItem.id === beat.id);

                return (
                  <tr 
                    key={beat.id}
                    className={`transition-colors group ${
                      isPlayingThis 
                        ? 'bg-purple-950/20' 
                        : isDarkMode ? 'hover:bg-neutral-900/40' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <td className="py-3 px-2">
                      <button
                        onClick={() => onTogglePlay(beat)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isPlayingThis ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {isPlayingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={beat.coverArtUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'} 
                          alt={beat.title}
                          className="w-10 h-10 rounded-lg object-cover bg-neutral-900 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className={`font-extrabold text-sm uppercase italic tracking-tight truncate ${isPlayingThis ? 'text-purple-400' : isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                             {beat.title}
                          </h4>
                          <span className="text-[11px] text-neutral-400 font-mono block truncate">{beat.producer || 'Voodoo Boomin'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 hidden md:table-cell font-mono text-xs text-neutral-400">
                      {beat.bpm} BPM
                    </td>

                    <td className="py-3 px-3 hidden md:table-cell font-mono text-xs text-neutral-400">
                      {beat.key}
                    </td>

                    <td className="py-3 px-3 hidden md:table-cell font-mono text-xs text-neutral-400">
                      {getBeatDuration(beat)}
                    </td>

                    <td className="py-3 px-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {beat.tags?.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-850 text-neutral-400 font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Add to Queue Button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToQueue(beat); }}
                          className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                            inQueue ? 'text-purple-400 hover:text-purple-300' : 'text-neutral-400 hover:text-white'
                          }`}
                          title={inQueue ? "In Play Queue" : "Add to Queue"}
                        >
                          <ListMusic className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => toggleFavorite(beat.id)}
                          className="p-2 text-neutral-400 hover:text-red-500 cursor-pointer"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                        </button>
                        
                        <button
                          onClick={() => {
                            trackBeatView(beat.id);
                            onPurchase(beat);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                          title="Direct Buy Now without building cart"
                        >
                          <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                          <span>Buy Now</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            trackBeatView(beat.id);
                            addToCart(beat, 'MP3 Lease', beat.price);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1 transition-all cursor-pointer shrink-0 border ${
                            inCart ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-750 text-neutral-300'
                          }`}
                        >
                          <ShoppingCart className="w-3 h-3 text-purple-400" />
                          <span>{inCart ? 'In Cart' : `+$${beat.price}`}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
