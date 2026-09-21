import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { FeedPost, FeedCategory, Beat, BeatPack } from '../types';
import { 
  Megaphone, 
  Pin, 
  Heart, 
  Share2, 
  Play, 
  Pause, 
  ShoppingCart, 
  Calendar, 
  Youtube, 
  Music, 
  Package, 
  Check, 
  Copy,
  Sparkles
} from 'lucide-react';

interface FeedSectionProps {
  isDarkMode: boolean;
  onPlayBeat: (beat: Beat) => void;
  onPurchaseBeat: (beat: Beat) => void;
}

export default function FeedSection({ isDarkMode, onPlayBeat, onPurchaseBeat }: FeedSectionProps) {
  const { state, likeFeedPost, addToCart } = useStore();
  const { currentTrack, isPlaying: isGlobalPlaying, playTrack, togglePlay } = useAudioPlayer();
  const [activeFilter, setActiveFilter] = useState<string>('ALL UPDATES');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [userLikedPosts, setUserLikedPosts] = useState<Record<string, boolean>>({});

  const allPosts = (state.feedPosts || []).filter((p) => p.isPublished !== false);

  // Sorting: Pinned first, then newest published date
  const sortedPosts = [...allPosts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
  });

  // Filter posts based on active category
  const filteredPosts = sortedPosts.filter((post) => {
    if (activeFilter === 'ALL UPDATES') return true;
    if (activeFilter === 'NEW BEATS') return post.category === 'NEW BEATS' || post.postType === 'BEAT' || !!post.featuredBeatId;
    if (activeFilter === 'BEAT PACKS') return post.category === 'BEAT PACKS' || post.postType === 'BEAT PACK' || !!post.featuredPackId;
    if (activeFilter === 'ANNOUNCEMENTS') return post.category === 'ANNOUNCEMENTS' || post.postType === 'ANNOUNCEMENT';
    if (activeFilter === 'MEDIA') return post.category === 'MEDIA' || post.postType === 'YOUTUBE VIDEO' || post.postType === 'IMAGE' || !!post.youtubeUrl || !!post.imageUrl;
    return post.category === activeFilter;
  });

  const getYoutubeVideoId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleLike = (postId: string) => {
    if (userLikedPosts[postId]) return; // prevent duplicate clicks per session
    likeFeedPost(postId);
    setUserLikedPosts(prev => ({ ...prev, [postId]: true }));
  };

  const handleShare = async (post: FeedPost) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#feed-post-${post.id}`;
    const shareTitle = post.title || 'Voodoo Boomin Feed Post';
    const shareText = post.content.slice(0, 100);

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2500);
    } catch (e) {
      console.error('Clipboard copy failed', e);
    }
  };

  const filterTabs = [
    { id: 'ALL UPDATES', label: 'All Updates' },
    { id: 'NEW BEATS', label: 'New Beats' },
    { id: 'BEAT PACKS', label: 'Beat Packs' },
    { id: 'ANNOUNCEMENTS', label: 'Announcements' },
    { id: 'MEDIA', label: 'Media' },
  ];

  return (
    <section id="feed" className={`rounded-3xl p-6 md:p-8 border shadow-xl relative scroll-mt-24 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0b0b0f] border-neutral-900' : 'bg-white border-neutral-200'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone size={22} className="text-indigo-400" />
            <h2 className={`text-xl md:text-2xl font-black tracking-tight uppercase italic ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>
              Voodoo Boomin Feed
            </h2>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 font-mono">
            Direct studio updates, beat drops, releases, and announcements.
          </p>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className={`p-1 rounded-xl flex flex-wrap gap-1 border ${
          isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
        }`}>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isDarkMode
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Stream */}
      {filteredPosts.length === 0 ? (
        <div className={`rounded-2xl p-12 text-center border ${
          isDarkMode ? 'bg-neutral-950/40 border-neutral-900' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <Megaphone className="w-10 h-10 text-neutral-600 mx-auto mb-3 opacity-60" />
          <p className={`text-base font-bold ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
            No updates yet.
          </p>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {allPosts.length === 0 
              ? 'Real posts published by the producer will appear here in the live store stream.'
              : 'No posts match this category filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const youtubeId = getYoutubeVideoId(post.youtubeUrl);
            const featuredBeat = state.beats.find((b) => b.id === post.featuredBeatId);
            const featuredPack = state.beatPacks.find((p) => p.id === post.featuredPackId);
            const isPlayingThisBeat = currentTrack?.id === featuredBeat?.id && isGlobalPlaying;

            return (
              <article
                key={post.id}
                id={`feed-post-${post.id}`}
                className={`rounded-2xl p-6 border transition-all duration-300 shadow-sm relative overflow-hidden ${
                  post.isPinned
                    ? isDarkMode
                      ? 'bg-neutral-950/80 border-amber-500/40 ring-1 ring-amber-500/20'
                      : 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/30'
                    : isDarkMode
                    ? 'bg-neutral-950/60 border-neutral-900 hover:border-neutral-800'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Pinned Accent Header */}
                {post.isPinned && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 bg-amber-500/10 px-3 py-1 rounded-full w-fit border border-amber-500/30">
                    <Pin className="w-3.5 h-3.5" /> Pinned Announcement
                  </div>
                )}

                {/* Metadata row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                      VB
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                          Voodoo Boomin
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20 uppercase tracking-wider">
                          {post.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Title */}
                {post.title && (
                  <h3 className={`text-lg md:text-xl font-black tracking-tight mb-2 ${
                    isDarkMode ? 'text-white' : 'text-neutral-900'
                  }`}>
                    {post.title}
                  </h3>
                )}

                {/* Post Body Content */}
                <p className={`text-sm md:text-base leading-relaxed whitespace-pre-line mb-4 ${
                  isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  {post.content}
                </p>

                {/* Attached Image (if provided) */}
                {post.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-neutral-800/80 bg-neutral-950/40 max-h-[420px] flex items-center justify-center">
                    <img
                      src={post.imageUrl}
                      alt={post.title || "Feed attached image"}
                      className="w-full h-full object-contain max-h-[420px] rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* YouTube Video Embed (ONLY if real youtubeUrl provided) */}
                {youtubeId && (
                  <div className="mb-4 aspect-video w-full rounded-xl overflow-hidden border border-neutral-800 shadow-lg bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                      title={post.title || "YouTube Video"}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Attached Featured Beat */}
                {featuredBeat && (
                  <div className={`mb-4 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative group/cover w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-950 border border-neutral-800">
                        <img 
                          src={featuredBeat.coverArtUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80"} 
                          alt={featuredBeat.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            if (currentTrack?.id === featuredBeat.id) {
                              togglePlay();
                            } else {
                              onPlayBeat(featuredBeat);
                            }
                          }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                        >
                          {isPlayingThisBeat ? <Pause size={20} className="text-purple-400" /> : <Play size={20} className="text-white fill-white ml-0.5" />}
                        </button>
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                          <Music className="w-3 h-3" /> Featured Beat
                        </span>
                        <h4 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                          {featuredBeat.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                          <span>{featuredBeat.bpm || 140} BPM</span>
                          <span>•</span>
                          <span>{featuredBeat.key || 'C Min'}</span>
                          {featuredBeat.plays ? (
                            <>
                              <span>•</span>
                              <span>{featuredBeat.plays.toLocaleString()} plays</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => addToCart(featuredBeat)}
                        className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ShoppingCart size={13} />
                        Cart
                      </button>
                      <button
                        onClick={() => onPurchaseBeat(featuredBeat)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                      >
                        Buy Beat • ${(featuredBeat.price || 35).toFixed(2)}
                      </button>
                    </div>
                  </div>
                )}

                {/* Attached Featured Beat Pack */}
                {featuredPack && (
                  <div className={`mb-4 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-950 border border-neutral-800">
                        <img 
                          src={featuredPack.coverArtUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80"} 
                          alt={featuredPack.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                          <Package className="w-3 h-3" /> Featured Beat Pack
                        </span>
                        <h4 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                          {featuredPack.title}
                        </h4>
                        <div className="text-xs text-neutral-500 font-mono mt-0.5">
                          {featuredPack.tracks?.length || 0} Complete Tracks Included
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          const syntheticBeat: Beat = {
                            id: featuredPack.id,
                            title: featuredPack.title,
                            producer: 'Voodoo Boomin',
                            bpm: 140,
                            key: 'Pack',
                            price: featuredPack.price,
                            coverArtUrl: featuredPack.coverArtUrl,
                            audioUrl: featuredPack.tracks?.[0]?.previewUrl || featuredPack.tracks?.[0]?.audioUrl || '',
                            visibility: 'Public',
                            trackType: 'Beat Pack',
                            directPriceOnly: true,
                            licenses: {
                              mp3Lease: { enabled: false, price: featuredPack.price },
                              wavLease: { enabled: false, price: featuredPack.price },
                              premiumLease: { enabled: false, price: featuredPack.price },
                              unlimitedLease: { enabled: false, price: featuredPack.price },
                              exclusive: { enabled: false, price: featuredPack.price }
                            }
                          };
                          onPurchaseBeat(syntheticBeat);
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all active:scale-95"
                      >
                        Buy Pack • ${featuredPack.price.toFixed(2)}
                      </button>
                    </div>
                  </div>
                )}

                {/* Social engagement footer */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 mt-2">
                  <div className="flex items-center gap-4">
                    {/* Real Like Button */}
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        userLikedPosts[post.id]
                          ? 'text-rose-500 bg-rose-500/10'
                          : 'text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/40'
                      }`}
                    >
                      <Heart 
                        size={15} 
                        className={userLikedPosts[post.id] ? 'fill-rose-500 text-rose-500' : ''} 
                      />
                      <span>{(post.likes || 0) + (userLikedPosts[post.id] ? 1 : 0)}</span>
                    </button>

                    {/* Share / Copy Link Button */}
                    <button
                      onClick={() => handleShare(post)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-neutral-800/40 transition-colors"
                    >
                      {copiedPostId === post.id ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span className="text-emerald-400">Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={14} />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>

                  <span className="text-[11px] text-neutral-500 font-mono">
                    #{post.id.replace('feed_', '')}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
