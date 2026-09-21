import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { 
  ShoppingCart, 
  Download, 
  Share2, 
  Music, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  Search,
  ChevronDown,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Check,
  Grid,
  List,
  Heart,
  Sun,
  Moon,
  Star,
  Video,
  MessageSquare,
  Send,
  Volume2,
  Package,
  Layers,
  FileArchive
} from 'lucide-react';
import { Beat, BeatPack } from '../types';
import CheckoutModal from '../components/CheckoutModal';
import CheckoutErrorBoundary from '../components/CheckoutErrorBoundary';
import SubscribeDownloadModal from '../components/SubscribeDownloadModal';
import { filterHumanBeats, isAIPlaceholderBeat, downloadAudioFile } from '../lib/beatUtils';

export default function Storefront() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  
  const { state, updateBeat, incrementAnalytics, favorites, toggleFavorite, cart, addToCart } = useStore();
  const { 
    currentTrack, 
    isPlaying: isGlobalPlaying, 
    playTrack, 
    playPack, 
    playPackTrack, 
    togglePlay: toggleGlobalPlay,
    currentPackId,
    activeTrackNum 
  } = useAudioPlayer();
  
  // State for checkouts and downloads
  const [checkoutBeat, setCheckoutBeat] = useState<Beat | null>(null);
  const [downloadUnlockBeat, setDownloadUnlockBeat] = useState<Beat | null>(null);
  const [copiedBeatId, setCopiedBeatId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedBpmRange, setSelectedBpmRange] = useState('ALL');
  const [selectedMood, setSelectedMood] = useState('ALL');
  const [selectedKey, setSelectedKey] = useState('ALL');
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  // Layout View & Theme preferences
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Dropdown open states
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isBpmOpen, setIsBpmOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isKeyOpen, setIsKeyOpen] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Mailing List Signup State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const collectionScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollCollection = (direction: 'left' | 'right') => {
    if (collectionScrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      collectionScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleTogglePlay = (beat: Beat) => {
    const isCurrentTrack = currentTrack?.id === beat.id;
    if (isCurrentTrack) {
      toggleGlobalPlay();
    } else {
      playTrack(beat);
      updateBeat(beat.id, { plays: (beat.plays || 0) + 1 });
      incrementAnalytics('totalPlays');
    }
  };

  const handlePurchase = (beat: Beat) => {
    setCheckoutBeat(beat);
  };

  const handlePurchaseSuccess = (beat: Beat) => {
    updateBeat(beat.id, { purchases: (beat.purchases || 0) + 1, earnings: (beat.earnings || 0) + beat.price });
    incrementAnalytics('totalEarnings', beat.price);
    incrementAnalytics('platformFees', beat.price * 0.25);
    if (beat.audioUrl) {
      downloadAudioFile(beat.audioUrl, beat.title);
    }
  };

  const handleFreeDownload = (beat: Beat) => {
    handleTogglePlay(beat);
    const isSubscribed = localStorage.getItem('VOODOO_BOOMIN_SUBSCRIBED') === 'true' || localStorage.getItem('KRYPSIDE_SUBSCRIBED') === 'true';
    const isYTSubbed = localStorage.getItem('VOODOO_BOOMIN_YOUTUBE_SUBSCRIBED') === 'true' || localStorage.getItem('KRYPSIDE_YOUTUBE_SUBSCRIBED') === 'true';
    const isTikTokFollowed = localStorage.getItem('VOODOO_BOOMIN_TIKTOK_FOLLOWED') === 'true' || localStorage.getItem('KRYPSIDE_TIKTOK_FOLLOWED') === 'true';

    if (isSubscribed || isYTSubbed || isTikTokFollowed) {
      triggerDownload(beat);
    } else {
      setDownloadUnlockBeat(beat);
    }
  };

  const triggerDownload = (beat: Beat) => {
    if (isAIPlaceholderBeat(beat)) return;
    updateBeat(beat.id, { downloads: (beat.downloads || 0) + 1 });
    incrementAnalytics('downloads');
    if (beat.audioUrl) {
      downloadAudioFile(beat.audioUrl, beat.title);
    }
  };

  const handleShare = (beat: Beat, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/beat/${beat.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedBeatId(beat.id);
      setTimeout(() => setCopiedBeatId(null), 2500);
    });
  };

  // Human clean beats list
  const baseBeats = filterHumanBeats([...state.beats]).sort((a, b) => {
    const scoreA = (a.likes || 0) + (a.plays || 0);
    const scoreB = (b.likes || 0) + (b.plays || 0);
    return scoreB - scoreA;
  });

  // Unique options extraction for filters
  const genreOptions = useMemo(() => {
    const genres = new Set<string>();
    baseBeats.forEach(b => {
      if (b.primaryGenre) genres.add(b.primaryGenre);
      if (b.secondaryGenre) genres.add(b.secondaryGenre);
    });
    return ['ALL', ...Array.from(genres)];
  }, [baseBeats]);

  const keyOptions = useMemo(() => {
    const keys = new Set<string>();
    baseBeats.forEach(b => {
      if (b.key) keys.add(b.key);
    });
    return ['ALL', ...Array.from(keys)];
  }, [baseBeats]);

  const moodOptions = useMemo(() => {
    const moods = new Set<string>();
    baseBeats.forEach(b => {
      if (b.mood && Array.isArray(b.mood)) {
        b.mood.forEach(m => moods.add(m));
      }
      if (b.tags && Array.isArray(b.tags)) {
        b.tags.forEach(t => {
          const clean = t.replace('#', '');
          if (['dark', 'hype', 'chill', 'sad', 'energetic'].includes(clean.toLowerCase())) {
            moods.add(clean);
          }
        });
      }
    });
    return ['ALL', 'Dark', 'Hype', 'Chill', 'Sad', 'Energetic', ...Array.from(moods).slice(0, 4)];
  }, [baseBeats]);

  // Filtering Logic
  const displayBeats = useMemo(() => {
    return baseBeats.filter(beat => {
      // 0. Topbar Route Filters
      if (filterParam === 'packs') {
        if (beat.trackType !== 'Beat Pack') return false;
      } else if (filterParam === 'beats') {
        if (beat.trackType === 'Beat Pack') return false;
      }

      // 1. Liked Only Filter
      if (showLikedOnly && !favorites.includes(beat.id)) {
        return false;
      }

      // 2. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = beat.title.toLowerCase().includes(query);
        const matchesProducer = (beat.producer || '').toLowerCase().includes(query);
        const matchesGenre = (beat.primaryGenre || beat.secondaryGenre || '').toLowerCase().includes(query);
        const matchesTags = beat.tags && beat.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesProducer && !matchesGenre && !matchesTags) {
          return false;
        }
      }

      // 3. Genre filter
      if (selectedGenre !== 'ALL') {
        const bg = (beat.primaryGenre || beat.secondaryGenre || '').toUpperCase();
        if (bg !== selectedGenre.toUpperCase()) return false;
      }

      // 4. BPM Range filter
      if (selectedBpmRange !== 'ALL') {
        const bpm = Number(beat.bpm) || 120;
        if (selectedBpmRange === 'slow' && bpm >= 100) return false;
        if (selectedBpmRange === 'mid' && (bpm < 100 || bpm > 140)) return false;
        if (selectedBpmRange === 'fast' && bpm <= 140) return false;
      }

      // 5. Mood filter
      if (selectedMood !== 'ALL') {
        const matchesMoodVal = beat.mood && beat.mood.some(m => m.toLowerCase() === selectedMood.toLowerCase());
        const matchesTagVal = beat.tags && beat.tags.some(t => t.toLowerCase().includes(selectedMood.toLowerCase()));
        if (!matchesMoodVal && !matchesTagVal) return false;
      }

      // 6. Key filter
      if (selectedKey !== 'ALL') {
        if ((beat.key || '').toLowerCase() !== selectedKey.toLowerCase()) return false;
      }

      return true;
    });
  }, [baseBeats, searchQuery, selectedGenre, selectedBpmRange, selectedMood, selectedKey, showLikedOnly, favorites, filterParam]);

  useEffect(() => {
    const isContact = searchParams.get('contact') === 'true';
    if (isContact) {
      setTimeout(() => {
        const contactSec = document.getElementById('contact-form-section');
        if (contactSec) {
          contactSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [searchParams]);

  const isPlaying = (beatId: string) => isGlobalPlaying && currentTrack?.id === beatId;

  const totalPlays = state.analytics.totalPlays || 0;
  const isCelebrationMode = totalPlays >= 100;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSuccess(true);
    setContactName('');
    setContactEmail('');
    setContactSubject('');
    setContactMessage('');
    setTimeout(() => setContactSuccess(false), 5000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto space-y-12 min-h-screen pb-32 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0a0a0c] text-white' : 'bg-[#fafafa] text-neutral-900'
    }`}>
      
      {/* 2. PREMIUM HOMEPAGE HERO / BANNER SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-900 shadow-2xl">
        {/* Abstract Dark Layer Art Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/60 via-black/90 to-neutral-950 z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent z-0 pointer-events-none" />
        
        <div className="relative z-10 px-8 py-16 md:py-24 max-w-4xl flex flex-col items-start text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black tracking-widest uppercase">
            <Sparkles className="w-3 h-3 animate-pulse text-purple-400" />
            Voodoo Boomin Studio
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none text-white uppercase italic">
            Voodoo <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Boomin</span>
          </h1>
          
          <p className="text-neutral-300 text-base md:text-xl font-medium max-w-2xl leading-relaxed">
            Premium trap, drill, and hip-hop instrumentals produced with heavy sub-bass and crisp acoustic textures. Unlocking direct licensing packages tailored for independent artists globally.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => {
                const catalogEl = document.getElementById('catalog-search-section');
                if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_20px_rgba(168,85,247,0.4)] cursor-pointer"
            >
              Explore Instrumentals
            </button>
            <button 
              onClick={() => {
                const contactEl = document.getElementById('contact-form-section');
                if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-white font-extrabold text-sm uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Request Custom Arrangement
            </button>
          </div>
        </div>
      </section>

      {/* 🏆 3. FEATURED/PINNED SLIDING PLAYLIST CAROUSEL */}
      {baseBeats.length > 0 && (
        <section className={`rounded-2xl p-6 border shadow-xl relative transition-colors duration-300 ${
          isDarkMode ? 'bg-neutral-950/40 border-neutral-900' : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-purple-500" />
                <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic">Featured Releases</h2>
              </div>
              <p className={`text-xs mt-1 uppercase tracking-wider font-mono ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                Pin-point precision audio. Click cover to preview instant tag-free mixdown.
              </p>
            </div>

            {/* Carousel navigation controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scrollCollection('left')}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800' 
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200'
                }`}
                title="Scroll Left"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => scrollCollection('right')}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800' 
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200'
                }`}
                title="Scroll Right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div 
            ref={collectionScrollRef}
            className="flex overflow-x-auto gap-6 pb-4 pt-2 scrollbar-none scroll-smooth snap-x"
          >
            {baseBeats.slice(0, 6).map((beat, idx) => {
              const activeFav = favorites.includes(beat.id);
              const inCart = cart.some(item => item.beat.id === beat.id);
              return (
                <div 
                  key={`featured-${beat.id || idx}`}
                  className={`flex-shrink-0 snap-start flex flex-col w-64 p-4 rounded-xl border relative group transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-neutral-900/40 border-neutral-800 hover:border-purple-600/50' 
                      : 'bg-neutral-50 border-neutral-200 hover:border-purple-400'
                  }`}
                >
                  {/* Artwork disc cover art */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md mb-4 bg-neutral-950">
                    {beat.coverArtUrl ? (
                      <img 
                        src={beat.coverArtUrl} 
                        alt={beat.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <Music size={32} />
                      </div>
                    )}

                    {/* Hover controls overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleTogglePlay(beat)}
                        className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                        title={isPlaying(beat.id) ? "Pause Track" : "Play Track"}
                      >
                        {isPlaying(beat.id) ? (
                          <Pause size={20} className="fill-current text-white" />
                        ) : (
                          <Play size={20} className="fill-current text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Likes/Favorite float icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(beat.id);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all active:scale-75 ${
                        activeFav 
                          ? 'bg-red-500 text-white shadow-lg' 
                          : 'bg-black/55 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <Heart size={14} className={activeFav ? 'fill-current' : ''} />
                    </button>

                    {/* BPM badge */}
                    <span className="absolute bottom-2 left-2 text-[10px] font-black bg-black/75 backdrop-blur-md border border-neutral-800 text-purple-400 px-2 py-0.5 rounded-md">
                      {beat.bpm} BPM
                    </span>
                  </div>

                  {/* Metadata & title */}
                  <div className="space-y-1 mb-4 flex-1">
                    <h3 className={`font-black text-sm tracking-tight leading-snug truncate ${
                      isDarkMode ? 'text-white' : 'text-neutral-900'
                    }`}>
                      {beat.title}
                    </h3>
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      {beat.producer || 'Voodoo Boomin'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/10">
                        {beat.primaryGenre || 'TRAP'}
                      </span>
                      {beat.key && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                          {beat.key}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions purchase button footer */}
                  <div className="flex items-center justify-between border-t border-neutral-800/50 pt-3">
                    <span className="font-extrabold text-sm text-purple-400 font-mono">
                      ${beat.price.toFixed(2)}
                    </span>
                    <button 
                      onClick={() => inCart ? navigate('/storefront') : addToCart(beat)}
                      className={`font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all active:scale-95 ${
                        inCart 
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
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
      )}

      {/* 📦 3.5 BEAT PACKS SHOWCASE WITH CONTINUOUS STREAMING AUDIO */}
      {state.beatPacks && state.beatPacks.filter(p => p.visibility === 'Public').length > 0 && (
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
              <p className={`text-xs mt-1 uppercase tracking-wider font-mono ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                High-value collections with instant ZIP stems & continuous gapless previews.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.beatPacks.filter(p => p.visibility === 'Public').map((pack) => {
              const isCurrentPackPlaying = isGlobalPlaying && currentPackId === pack.id;
              return (
                <div 
                  key={pack.id}
                  className={`flex flex-col p-5 rounded-2xl border transition-all duration-300 group ${
                    isDarkMode 
                      ? 'bg-neutral-950/70 border-neutral-850 hover:border-purple-600/50' 
                      : 'bg-neutral-50 border-neutral-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-900 border border-purple-900/40 shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                      <img src={pack.coverArtUrl} alt={pack.title} className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          if (isCurrentPackPlaying) {
                            toggleGlobalPlay();
                          } else {
                            playPack(pack, 1);
                          }
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        title={isCurrentPackPlaying ? "Pause Pack" : "Play Pack"}
                      >
                        {isCurrentPackPlaying ? (
                          <Pause className="w-8 h-8 text-white fill-current" />
                        ) : (
                          <Play className="w-8 h-8 text-white fill-current ml-1" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          {pack.tracks?.length || 0} TRACKS
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {pack.id}
                        </span>
                      </div>
                      <h3 className="text-base font-black tracking-tight text-white truncate mt-1">
                        {pack.title}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                        {pack.description || 'Full master pack with stems and licenses.'}
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

                  {/* Pack Footer CTA */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-850">
                    <span className="text-lg font-black text-purple-400 font-mono">
                      ${pack.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isCurrentPackPlaying) {
                            toggleGlobalPlay();
                          } else {
                            playPack(pack, 1);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-colors border border-neutral-800"
                      >
                        {isCurrentPackPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{isCurrentPackPlaying ? 'Pause' : 'Audition'}</span>
                      </button>
                      {pack.zipFileUrl && (
                        <button
                          onClick={() => downloadAudioFile(pack.zipFileUrl!, `${pack.title}-Master-Pack`)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-colors shadow-md"
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
      )}

      {/* 🔍 FILTER & SEARCH SYSTEM (WordPress htmlwidget3 exact layout + visual views + theme controllers) */}
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
                className={`p-1.5 rounded-md transition-all ${
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
                className={`p-1.5 rounded-md transition-all ${
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

        {/* Filter Input & Dropdowns Grid */}
        <div className="space-y-6 pt-6">
          {/* Search bar & Liked filter toggle */}
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative w-full flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search instrumentals by title, genre, tag, mood, tempo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border text-white pl-12 pr-4 py-3.5 rounded-xl text-sm font-semibold tracking-wide focus:outline-none transition-all shadow-inner ${
                  isDarkMode 
                    ? 'bg-[#121217] border-neutral-850/80 focus:border-purple-600 focus:bg-[#08080a]' 
                    : 'bg-[#f4f4f5] border-neutral-300 focus:border-purple-500 focus:bg-white text-neutral-900'
                }`}
              />
            </div>

            {/* Favorites filter badge toggler */}
            <button
              onClick={() => setShowLikedOnly(!showLikedOnly)}
              className={`flex items-center gap-2.5 px-5 py-3.5 border rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95 cursor-pointer ${
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

          {/* Selector columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Genre Filter */}
            <div className="relative">
              <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 pl-1">Genre</span>
              <button 
                onClick={() => { setIsGenreOpen(!isGenreOpen); setIsBpmOpen(false); setIsMoodOpen(false); setIsKeyOpen(false); }}
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
                      className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors flex items-center justify-between hover:bg-purple-900/10 hover:text-purple-400 ${
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

            {/* BPM Selector */}
            <div className="relative">
              <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 pl-1">BPM Range</span>
              <button 
                onClick={() => { setIsBpmOpen(!isBpmOpen); setIsGenreOpen(false); setIsMoodOpen(false); setIsKeyOpen(false); }}
                className={`w-full border px-4 py-3 rounded-lg flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121217] border-neutral-850 text-neutral-200' : 'bg-[#f4f4f5] border-neutral-300 text-neutral-700'
                }`}
              >
                <span className="truncate">
                  {selectedBpmRange === 'ALL' ? 'ALL TEMPOS' : 
                   selectedBpmRange === 'slow' ? 'SLOW (< 100 BPM)' : 
                   selectedBpmRange === 'mid' ? 'MID (100-140)' : 'UPTEMPO (> 140)'}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
              </button>
              {isBpmOpen && (
                <div className={`absolute top-[68px] left-0 right-0 z-30 border rounded-lg shadow-2xl py-1.5 ${
                  isDarkMode ? 'bg-[#0d0d11] border-neutral-900' : 'bg-white border-neutral-200 text-neutral-800'
                }`}>
                  {[
                    { value: 'ALL', label: 'ALL TEMPOS' },
                    { value: 'slow', label: 'SLOW (< 100 BPM)' },
                    { value: 'mid', label: 'MID (100 - 140 BPM)' },
                    { value: 'fast', label: 'UPTEMPO (> 140 BPM)' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedBpmRange(opt.value); setIsBpmOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors flex items-center justify-between hover:bg-purple-900/10 hover:text-purple-400 ${
                        isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedBpmRange === opt.value && <Check className="w-3.5 h-3.5 text-purple-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key Filter */}
            <div className="relative">
              <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 pl-1">Musical Key</span>
              <button 
                onClick={() => { setIsKeyOpen(!isKeyOpen); setIsGenreOpen(false); setIsBpmOpen(false); setIsMoodOpen(false); }}
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
                      className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors flex items-center justify-between hover:bg-purple-900/10 hover:text-purple-400 ${
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

            {/* Mood selector */}
            <div className="relative">
              <span className="block text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 pl-1">Vibe/Mood</span>
              <button 
                onClick={() => { setIsMoodOpen(!isMoodOpen); setIsGenreOpen(false); setIsBpmOpen(false); setIsKeyOpen(false); }}
                className={`w-full border px-4 py-3 rounded-lg flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121217] border-neutral-850 text-neutral-200' : 'bg-[#f4f4f5] border-neutral-300 text-neutral-700'
                }`}
              >
                <span className="truncate">{selectedMood === 'ALL' ? 'ALL VIBES' : selectedMood}</span>
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
                      className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors flex items-center justify-between hover:bg-purple-900/10 hover:text-purple-400 ${
                        isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                    >
                      <span>{opt === 'ALL' ? 'ALL VIBES' : opt}</span>
                      {selectedMood === opt && <Check className="w-3.5 h-3.5 text-purple-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 🎧 BEATS LIST/GRID REPRESENTATION (Dynamic view toggled) */}
      <section className="space-y-4">
        {displayBeats.length === 0 ? (
          <div className={`border rounded-2xl p-16 text-center shadow-xl ${
            isDarkMode ? 'bg-[#0f0f13] border-neutral-900' : 'bg-white border-neutral-200'
          }`}>
            <SlidersHorizontal className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-1.5">No Matching Instrumentals Found</h3>
            <p className="text-neutral-400 text-xs max-w-sm mx-auto uppercase tracking-wider font-mono">
              Try adjusting your genre dropdowns, tags, BPM, or musical key filters.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ==================== 4. BENTO GRID CATALOG VIEW ==================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayBeats.map((beat, idx) => {
              const activeFav = favorites.includes(beat.id);
              const isCurrent = currentTrack?.id === beat.id;
              const activePlaying = isPlaying(beat.id);
              const inCart = cart.some(item => item.beat.id === beat.id);

              return (
                <div 
                  key={`grid-${beat.id || idx}`}
                  className={`border rounded-2xl p-5 relative group transition-all duration-300 hover:shadow-2xl ${
                    isCurrent 
                      ? 'border-purple-500 bg-purple-950/10 shadow-[0_10px_30px_rgba(168,85,247,0.15)]' 
                      : isDarkMode 
                        ? 'bg-neutral-900/50 border-neutral-850 hover:border-neutral-750' 
                        : 'bg-white border-neutral-200 hover:border-purple-300'
                  }`}
                >
                  {/* Card Cover Art */}
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-neutral-950 border border-neutral-800">
                    {beat.coverArtUrl ? (
                      <img 
                        src={beat.coverArtUrl} 
                        alt={beat.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-600">
                        <Music className="w-12 h-12" />
                      </div>
                    )}

                    {/* Dark gradient shadow inside cover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Left corner Play Button */}
                    <button
                      onClick={() => handleTogglePlay(beat)}
                      className={`absolute bottom-3 left-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        activePlaying 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-black/75 hover:bg-purple-600 text-white hover:scale-105'
                      }`}
                    >
                      {activePlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Top corner Favorite heart and Share buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(beat.id)}
                        className={`p-1.5 rounded-full backdrop-blur-md transition-all active:scale-75 ${
                          activeFav 
                            ? 'bg-red-500 text-white shadow' 
                            : 'bg-black/60 text-neutral-300 hover:text-white'
                        }`}
                        title="Favorite Track"
                      >
                        <Heart className={`w-3.5 h-3.5 ${activeFav ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => handleShare(beat, e)}
                        className="p-1.5 rounded-full backdrop-blur-md bg-black/60 text-neutral-300 hover:text-white transition-all relative"
                        title="Copy Share Link"
                      >
                        {copiedBeatId === beat.id && (
                          <span className="absolute -top-7 right-0 text-[9px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded shadow">COPIED</span>
                        )}
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Dur / Bpm Badge overlay */}
                    <span className="absolute top-3 left-3 text-[9px] font-black tracking-widest font-mono uppercase bg-purple-900/40 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded backdrop-blur-sm">
                      {beat.bpm} BPM
                    </span>
                  </div>

                  {/* Text details */}
                  <div className="space-y-1 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest uppercase text-purple-400 font-mono">
                        {beat.primaryGenre || 'TRAP'}
                      </span>
                      {beat.key && (
                        <span className="text-[10px] font-black text-neutral-500 font-mono">
                          {beat.key}
                        </span>
                      )}
                    </div>
                    
                    <h3 className={`font-black text-base tracking-tight truncate group-hover:text-purple-400 transition-colors ${
                      isDarkMode ? 'text-white' : 'text-neutral-900'
                    }`}>
                      {beat.title}
                    </h3>
                    
                    <p className="text-xs text-neutral-500 font-bold tracking-wider">
                      {beat.producer || 'Voodoo Boomin'}
                    </p>

                    {/* Mood & tag labels */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {beat.tags && beat.tags.slice(0, 3).map((tag, i) => (
                        <span 
                          key={i} 
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isDarkMode ? 'bg-neutral-950 text-neutral-500 border border-neutral-850' : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions purchase button */}
                  <div className="flex items-center justify-between border-t border-neutral-800/40 pt-4">
                    <div>
                      <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none mb-1">Standard License</span>
                      <span className="font-extrabold text-base text-purple-400 font-mono">${beat.price.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {(beat.freeDownload?.enabled || isCelebrationMode) && (
                        <button 
                          onClick={() => handleFreeDownload(beat)}
                          className={`p-2.5 rounded-xl border transition-all ${
                            isDarkMode 
                              ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:text-white text-neutral-400' 
                              : 'bg-neutral-100 border-neutral-200 hover:border-neutral-300 text-neutral-600'
                          }`}
                          title="Download Free Sample"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      <button 
                        onClick={() => isCelebrationMode ? handleFreeDownload(beat) : (inCart ? navigate('/storefront') : handlePurchase(beat))}
                        className={`font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-md ${
                          inCart 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{inCart ? 'Added' : 'Buy Now'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==================== TABLE LIST CATALOG VIEW ==================== */
          <div className={`w-full overflow-x-auto rounded-xl border shadow-2xl transition-all duration-300 ${
            isDarkMode ? 'bg-black border-neutral-900' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <table className="w-full min-w-[700px] border-collapse text-left text-sm select-none">
              
              <thead>
                <tr className={`border-b text-[11px] font-black uppercase tracking-wider h-11 ${
                  isDarkMode ? 'border-neutral-900/90 text-neutral-500 bg-[#09090c]/50' : 'border-neutral-200 text-neutral-500 bg-[#f4f4f5]'
                }`}>
                  <th className="pl-6 w-12 text-center">Play</th>
                  <th className="py-3 px-4 pl-1">Title</th>
                  <th className="py-3 px-4 w-28"><span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Duration</span></th>
                  <th className="py-3 px-4 w-28"><span className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Key</span></th>
                  <th className="py-3 px-4 w-24"><span className="flex items-center gap-1.5"><SlidersHorizontal className="w-3.5 h-3.5" /> BPM</span></th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 pr-6 text-right w-64">Action</th>
                </tr>
              </thead>

              <tbody>
                {displayBeats.map((beat, idx) => {
                  const activeFav = favorites.includes(beat.id);
                  const isCurrent = currentTrack?.id === beat.id;
                  const activePlaying = isPlaying(beat.id);
                  const inCart = cart.some(item => item.beat.id === beat.id);

                  return (
                    <tr 
                      key={`list-${beat.id || idx}`}
                      onClick={() => handleTogglePlay(beat)}
                      className={`h-[72px] transition-all cursor-pointer group border-b ${
                        isCurrent 
                          ? 'bg-purple-950/10 hover:bg-purple-950/15 border-l-2 border-l-purple-500 border-neutral-900' 
                          : isDarkMode 
                            ? 'hover:bg-neutral-900/35 border-neutral-900/60 text-neutral-300' 
                            : 'hover:bg-neutral-50 border-neutral-200 text-neutral-700'
                      }`}
                    >
                      {/* Play Action */}
                      <td className="pl-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleTogglePlay(beat)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            activePlaying 
                              ? 'bg-purple-600 text-white' 
                              : isDarkMode 
                                ? 'bg-neutral-900 hover:bg-purple-600 text-neutral-300 hover:text-white' 
                                : 'bg-neutral-100 hover:bg-purple-600 text-neutral-700 hover:text-white'
                          } cursor-pointer`}
                        >
                          {activePlaying ? (
                            <Pause className="w-4 h-4 fill-current text-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                      </td>

                      {/* Cover & Title Details */}
                      <td className="py-3 px-4 pl-1">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 bg-neutral-900 border border-neutral-800 rounded overflow-hidden shrink-0">
                            {beat.coverArtUrl ? (
                              <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-neutral-950 flex items-center justify-center text-neutral-700">
                                <Music className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <span className={`font-extrabold text-sm block tracking-tight truncate leading-tight group-hover:text-purple-500 transition-colors ${
                              isDarkMode ? 'text-white' : 'text-neutral-900'
                            }`}>
                              {beat.title}
                            </span>
                            <span className="text-xs text-neutral-500 font-bold tracking-wider mt-0.5 block truncate">
                              {beat.primaryGenre || 'TRAP'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 font-mono text-xs text-neutral-400">
                        {beat.duration || '3:05'}
                      </td>

                      {/* Key */}
                      <td className="py-3 px-4 font-mono text-xs text-purple-400 font-black">
                        {beat.key || 'A Minor'}
                      </td>

                      {/* BPM */}
                      <td className="py-3 px-4 font-mono text-xs text-neutral-300 font-black">
                        {beat.bpm || 120}
                      </td>

                      {/* Tags */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {beat.tags && Array.isArray(beat.tags) ? (
                            beat.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-xs text-neutral-500 hover:text-purple-400 font-semibold truncate max-w-[90px] cursor-pointer">
                                {tag.startsWith('#') ? tag : `#${tag}`}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-neutral-600 italic">#voodoo</span>
                          )}
                        </div>
                      </td>

                      {/* Action columns */}
                      <td className="py-3 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          {/* Heart Icon Toggle */}
                          <button 
                            onClick={() => toggleFavorite(beat.id)}
                            className={`p-1.5 rounded-md transition-all active:scale-75 ${
                              activeFav 
                                ? 'bg-red-500/10 text-red-500' 
                                : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
                            }`}
                            title="Favorite Track"
                          >
                            <Heart className={`w-4 h-4 ${activeFav ? 'fill-current' : ''}`} />
                          </button>

                          {/* Share button */}
                          <button 
                            onClick={(e) => handleShare(beat, e)}
                            className="p-1.5 hover:bg-neutral-900 rounded-md text-neutral-400 hover:text-white transition-all cursor-pointer relative"
                            title="Copy Track Share Link"
                          >
                            {copiedBeatId === beat.id && (
                              <span className="absolute -top-7 right-0 text-[10px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded shadow">COPIED!</span>
                            )}
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Free Download */}
                          {(beat.freeDownload?.enabled || isCelebrationMode) && (
                            <button 
                              onClick={() => handleFreeDownload(beat)}
                              className="p-1.5 hover:bg-neutral-900 rounded-md text-neutral-400 hover:text-white transition-all cursor-pointer"
                              title="Download Free Sample"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          {/* Add To Cart Price trigger */}
                          <button 
                            onClick={() => isCelebrationMode ? handleFreeDownload(beat) : (inCart ? navigate('/storefront') : handlePurchase(beat))} 
                            className={`font-black text-xs py-2 px-3.5 rounded flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                              inCart 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{inCart ? 'Added' : `$${beat.price}`}</span>
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

      {/* 📹 16. RESPONSIVE YOUTUBE/VIDEO SECTION */}
      {state.videos.length > 0 && (
        <section className={`rounded-2xl p-6 border shadow-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-neutral-950/40 border-neutral-900' : 'bg-white border-neutral-200'
        }`}>
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Video size={20} className="text-purple-500" />
              <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic">Featured Videos</h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
              Official video cookups and studio sessions from Voodoo Boomin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.videos.map((video) => (
              <div key={video.id} className="flex flex-col space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                  <iframe 
                    src={`https://www.youtube.com/embed/${video.videoId}`} 
                    title={video.title} 
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight text-white uppercase italic">{video.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 📥 18. CONTACT AND CUSTOM BEATS REQUEST FORM */}
      <section 
        id="contact-form-section"
        className={`rounded-2xl p-6 border shadow-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-neutral-950/40 border-neutral-900' : 'bg-white border-neutral-200'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Send size={20} className="text-purple-500" />
              <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic">Secure Booking & Collaboration</h2>
            </div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono">
              Inquire for exclusive arrangements, mastering sessions, or unique instrumental soundscapes.
            </p>
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDarkMode ? 'bg-neutral-900/30 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-xs font-extrabold text-white uppercase">Direct Studio Routing Active</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                All booking messages are piped securely to Voodoo Boomin's private email router. Typical turnaround for custom exclusive inquiries is 24-48 hours.
              </p>
            </div>
          </div>

          {/* Contact form controls */}
          <form onSubmit={handleContactSubmit} className="space-y-4">
            {contactSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-wider">
                ✓ Message sent successfully! Voodoo Boomin will contact you shortly.
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1.5">Artist/Legal Name</label>
                <input 
                  type="text" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Slim Kid" 
                  required
                  className={`w-full border px-3.5 py-3 rounded-lg text-xs font-semibold focus:outline-none transition-all ${
                    isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white focus:border-purple-600' : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="artist@gmail.com" 
                  required
                  className={`w-full border px-3.5 py-3 rounded-lg text-xs font-semibold focus:outline-none transition-all ${
                    isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white focus:border-purple-600' : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1.5">Subject Type</label>
              <input 
                type="text" 
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="e.g. Custom Exclusive Trap Beat Request" 
                className={`w-full border px-3.5 py-3 rounded-lg text-xs font-semibold focus:outline-none transition-all ${
                  isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white focus:border-purple-600' : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1.5">Your Message / Request details</label>
              <textarea 
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Include reference tracks, bpm targets, key structures, and license targets..."
                required
                className={`w-full border px-3.5 py-3 rounded-lg text-xs font-semibold focus:outline-none transition-all resize-none ${
                  isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white focus:border-purple-600' : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                }`}
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </form>
        </div>
      </section>

      {/* 📧 20. MAILING LIST SIGNUP CARD */}
      <section className="bg-gradient-to-r from-neutral-950 via-purple-950/20 to-neutral-950 border border-neutral-900 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] z-0" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[10px] font-black tracking-widest uppercase">
            ⚡ Voodoo Priority VIP Club
          </div>
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight text-white leading-none">
            Unlock 20% Off Your First Purchase
          </h2>
          <p className="text-neutral-400 text-xs md:text-sm font-medium leading-relaxed">
            Subscribe to receive premium release announcements, limited 1-of-1 loops, and exclusive coupons directly to your inbox. No spam. Unsubscribe at any time.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 pt-4 max-w-lg mx-auto">
            <input 
              type="email" 
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email to receive discount..." 
              required
              className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600"
            />
            <button 
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
            >
              Join VIP List
            </button>
          </form>

          {newsletterSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-wider mt-4">
              ✓ Subscribed! Check your inbox for your 20% off coupon code: "VOODOO20".
            </div>
          )}
        </div>
      </section>

      {/* Checkout and Subscription gated Modals */}
      <CheckoutErrorBoundary>
        <CheckoutModal 
          onClose={() => setCheckoutBeat(null)} 
          beat={checkoutBeat} 
          onSuccess={handlePurchaseSuccess} 
        />
      </CheckoutErrorBoundary>

      <SubscribeDownloadModal 
        isOpen={!!downloadUnlockBeat}
        onClose={() => setDownloadUnlockBeat(null)}
        beat={downloadUnlockBeat}
        onSuccess={triggerDownload}
      />
    </div>
  );
}
