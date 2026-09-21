import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { 
  Search, 
  X, 
  Music, 
  Package, 
  Users, 
  Rss, 
  Play, 
  Pause, 
  ShoppingCart, 
  Tag, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { Beat, BeatPack, MusicProfessional, FeedPost } from '../types';

interface StorewideSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectPack?: (pack: BeatPack) => void;
  onSelectProfessional?: (prof: MusicProfessional) => void;
  onPurchaseBeat?: (beat: Beat) => void;
}

export default function StorewideSearchModal({
  isOpen,
  onClose,
  onInspectPack,
  onSelectProfessional,
  onPurchaseBeat
}: StorewideSearchModalProps) {
  const { state, addToCart } = useStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'BEATS' | 'PACKS' | 'SERVICES' | 'FEED'>('ALL');

  // Search logic filtering only public store items
  const results = useMemo(() => {
    if (!searchQuery.trim()) {
      return { beats: [], packs: [], professionals: [], feedPosts: [], totalCount: 0 };
    }

    const q = searchQuery.toLowerCase().trim();

    // 1. Beats (Only published beats, not archived)
    const matchedBeats = state.beats.filter(beat => 
      (beat.title && beat.title.toLowerCase().includes(q)) ||
      (beat.genre && beat.genre.toLowerCase().includes(q)) ||
      (beat.key && beat.key.toLowerCase().includes(q)) ||
      (beat.bpm && beat.bpm.toString().includes(q)) ||
      (beat.tags && beat.tags.some(t => t.toLowerCase().includes(q))) ||
      (beat.producer && beat.producer.toLowerCase().includes(q))
    );

    // 2. Beat Packs
    const matchedPacks = state.beatPacks.filter(pack =>
      (pack.title && pack.title.toLowerCase().includes(q)) ||
      (pack.description && pack.description.toLowerCase().includes(q)) ||
      (pack.tracks && pack.tracks.some(t => t.title && t.title.toLowerCase().includes(q)))
    );

    // 3. Approved Services / Professionals
    const matchedProfessionals = (state.professionals || [])
      .filter(p => p && p.approved)
      .filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.primaryRole && p.primaryRole.toLowerCase().includes(q)) ||
        (p.bio && p.bio.toLowerCase().includes(q)) ||
        (p.specialties && p.specialties.some(s => s.toLowerCase().includes(q)))
      );

    // 4. Public Feed Posts
    const matchedPosts = (state.feedPosts || [])
      .filter(post => post && post.visibility === 'Public')
      .filter(post => 
        (post.content && post.content.toLowerCase().includes(q)) ||
        (post.authorName && post.authorName.toLowerCase().includes(q)) ||
        (post.tags && post.tags.some(t => t.toLowerCase().includes(q)))
      );

    const totalCount = matchedBeats.length + matchedPacks.length + matchedProfessionals.length + matchedPosts.length;

    return {
      beats: matchedBeats,
      packs: matchedPacks,
      professionals: matchedProfessionals,
      feedPosts: matchedPosts,
      totalCount
    };
  }, [searchQuery, state.beats, state.beatPacks, state.professionals, state.feedPosts]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl rounded-3xl border border-neutral-800 bg-[#0c0c10] text-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-purple-950/80 via-neutral-950 to-neutral-950 border-b border-neutral-800 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-400">
                <Search className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white uppercase italic">
                  Storewide Search
                </h2>
                <p className="text-xs text-neutral-400">
                  Search across Voodoo Boomin beats, packs, professionals, and feed.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Field */}
          <div className="relative">
            <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search beats, BPM, key, packs, professionals..."
              autoFocus
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 focus:border-purple-500 text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          {searchQuery.trim() !== '' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ALL'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                All ({results.totalCount})
              </button>
              <button
                onClick={() => setActiveTab('BEATS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'BEATS'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                Beats ({results.beats.length})
              </button>
              <button
                onClick={() => setActiveTab('PACKS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'PACKS'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Beat Packs ({results.packs.length})
              </button>
              <button
                onClick={() => setActiveTab('SERVICES')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'SERVICES'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Services ({results.professionals.length})
              </button>
              <button
                onClick={() => setActiveTab('FEED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'FEED'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Rss className="w-3.5 h-3.5" />
                Feed ({results.feedPosts.length})
              </button>
            </div>
          )}
        </div>

        {/* Results Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {!searchQuery.trim() ? (
            <div className="p-12 text-center text-neutral-500 font-mono text-xs">
              Type keywords above to search beats, beat packs, services, or feed posts.
            </div>
          ) : results.totalCount === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-neutral-400 font-sans text-sm">
                No results found matching "<strong className="text-white">{searchQuery}</strong>".
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                Try searching for beat titles, genres, BPM (e.g. 140), key (e.g. D Minor), or professional roles.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Category 1: BEATS */}
              {(activeTab === 'ALL' || activeTab === 'BEATS') && results.beats.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Beats ({results.beats.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.beats.map((beat) => {
                      const isThisPlaying = isPlaying && currentTrack?.id === beat.id;
                      return (
                        <div
                          key={beat.id}
                          className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-purple-600/50 flex items-center justify-between gap-3 transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => {
                                if (isThisPlaying) {
                                  togglePlay();
                                } else {
                                  playTrack(beat);
                                }
                              }}
                              className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800 group-hover:border-purple-500 transition-colors"
                            >
                              <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                {isThisPlaying ? <Pause className="w-4 h-4 text-purple-400 fill-current" /> : <Play className="w-4 h-4 text-white fill-current ml-0.5" />}
                              </div>
                            </button>

                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-white truncate group-hover:text-purple-300">
                                {beat.title}
                              </h4>
                              <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400 mt-0.5">
                                <span>{beat.bpm} BPM</span>
                                <span>•</span>
                                <span>{beat.key || 'D Minor'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-black font-mono text-purple-400">
                              ${beat.price.toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                if (onPurchaseBeat) {
                                  onPurchaseBeat(beat);
                                } else {
                                  addToCart(beat, 'Standard MP3', beat.price);
                                }
                                onClose();
                              }}
                              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer"
                              title="Buy License"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category 2: BEAT PACKS */}
              {(activeTab === 'ALL' || activeTab === 'PACKS') && results.packs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Beat Packs ({results.packs.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.packs.map((pack) => (
                      <div
                        key={pack.id}
                        className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-purple-600/50 flex items-center justify-between gap-3 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={pack.coverArtUrl} alt={pack.title} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-neutral-800" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white truncate group-hover:text-purple-300">
                              {pack.title}
                            </h4>
                            <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                              {pack.tracks?.length || 0} Tracks Included
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (onInspectPack) {
                              onInspectPack(pack);
                            }
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-purple-600 text-neutral-200 hover:text-white font-bold text-xs uppercase flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>View Pack</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 3: SERVICES */}
              {(activeTab === 'ALL' || activeTab === 'SERVICES') && results.professionals.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Services & Professionals ({results.professionals.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.professionals.map((prof) => (
                      <div
                        key={prof.id}
                        className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-purple-600/50 flex items-center justify-between gap-3 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={prof.avatarUrl} alt={prof.name} className="w-11 h-11 rounded-full object-cover shrink-0 border border-purple-500/40" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white truncate group-hover:text-purple-300">
                              {prof.name}
                            </h4>
                            <p className="text-[10px] text-neutral-400 truncate">
                              {prof.primaryRole}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (onSelectProfessional) {
                              onSelectProfessional(prof);
                            }
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-950 border border-purple-800 text-purple-300 hover:text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 4: FEED */}
              {(activeTab === 'ALL' || activeTab === 'FEED') && results.feedPosts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <Rss className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Feed Updates ({results.feedPosts.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {results.feedPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-purple-400 block">
                            @{post.authorName || 'Voodoo Boomin'}
                          </span>
                          <p className="text-xs text-neutral-200 line-clamp-2">
                            {post.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
