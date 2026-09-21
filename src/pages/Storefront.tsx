import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, DEFAULT_HOMEPAGE_LAYOUT } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat, BeatPack, HomepageSectionId } from '../types';
import CheckoutModal, { PurchaseOrderPayload } from '../components/CheckoutModal';
import CheckoutErrorBoundary from '../components/CheckoutErrorBoundary';
import SubscribeDownloadModal from '../components/SubscribeDownloadModal';
import BeatPackWhatsInsideModal from '../components/BeatPackWhatsInsideModal';
import { PurchaseConfirmationModal } from '../components/PurchaseConfirmationModal';

// Section components
import HeroSection from '../components/HeroSection';
import HighPerformanceSection from '../components/HighPerformanceSection';
import TopTracksSection from '../components/TopTracksSection';
import FeedSection from '../components/FeedSection';
import BeatPacksSection from '../components/BeatPacksSection';
import FeaturedCarouselSection from '../components/FeaturedCarouselSection';
import BeatCatalogSection from '../components/BeatCatalogSection';
import ProfileSection from '../components/ProfileSection';
import ServicesSection from '../components/ServicesSection';
import FeaturedBeatSection from '../components/FeaturedBeatSection';
import VaultSection from '../components/VaultSection';

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
    togglePlay: toggleGlobalPlay 
  } = useAudioPlayer();
  
  // State for checkouts, pack inspections, and downloads
  const [checkoutBeat, setCheckoutBeat] = useState<Beat | null>(null);
  const [downloadUnlockBeat, setDownloadUnlockBeat] = useState<Beat | null>(null);
  const [selectedPackForInspection, setSelectedPackForInspection] = useState<BeatPack | null>(null);
  const [copiedBeatId, setCopiedBeatId] = useState<string | null>(null);
  const [purchaseConfirmationOrder, setPurchaseConfirmationOrder] = useState<PurchaseOrderPayload | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedBpmRange, setSelectedBpmRange] = useState('ALL');
  const [customMinBpm, setCustomMinBpm] = useState<string>('');
  const [customMaxBpm, setCustomMaxBpm] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState('ALL');
  const [selectedKey, setSelectedKey] = useState('ALL');
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [selectedSort, setSelectedSort] = useState('newest');

  // Layout View & Theme preferences
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Dropdown open states
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isBpmOpen, setIsBpmOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isKeyOpen, setIsKeyOpen] = useState(false);

  // Sync URL search query parameters (e.g. ?filter=free)
  useEffect(() => {
    if (filterParam === 'free') {
      setSelectedGenre('ALL');
    }
  }, [filterParam]);

  // Handle direct hash navigation (#top-tracks, #feed)
  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []);

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

  const handlePurchaseSuccess = (beat: Beat, orderPayload?: PurchaseOrderPayload) => {
    updateBeat(beat.id, { purchases: (beat.purchases || 0) + 1, earnings: (beat.earnings || 0) + beat.price });
    incrementAnalytics('totalEarnings', beat.price);
    incrementAnalytics('platformFees', beat.price * 0.25);
    
    const payloadToUse: PurchaseOrderPayload = orderPayload || {
      orderId: `VB-ORD-${Date.now().toString().slice(-6)}`,
      items: [{ beat, licenseType: 'MP3 Lease', price: beat.price || 35.00 }],
      totalAmount: beat.price || 35.00,
      paymentMethod: 'PayPal Verified',
      transactionDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };

    setCheckoutBeat(null);
    setPurchaseConfirmationOrder(payloadToUse);

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
    incrementAnalytics('freeDownloads');
    if (beat.audioUrl) {
      downloadAudioFile(beat.audioUrl, beat.title);
    }
  };

  const copyShareLink = async (beatId: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?beat=${beatId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedBeatId(beatId);
      setTimeout(() => setCopiedBeatId(null), 2500);
    } catch (e) {
      console.error('Clipboard copy error', e);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedGenre('ALL');
    setSelectedBpmRange('ALL');
    setCustomMinBpm('');
    setCustomMaxBpm('');
    setSelectedMood('ALL');
    setSelectedKey('ALL');
    setShowLikedOnly(false);
    setSelectedSort('newest');
  };

  // Base human-crafted beats without AI placeholders or archived
  const baseBeats = useMemo(() => {
    return filterHumanBeats(state.beats || []);
  }, [state.beats]);

  // Features #15/16 — Beat Deep-Linking with URL Parameter ?beat=ID
  useEffect(() => {
    const beatId = searchParams.get('beat');
    if (beatId && baseBeats.length > 0) {
      const matchedBeat = baseBeats.find(b => b.id === beatId);
      if (matchedBeat) {
        // Initialize playback of that beat
        playTrack(matchedBeat);
        
        // Automatically scroll down to the marketplace storefront section
        const timer = setTimeout(() => {
          const el = document.getElementById('catalog-search-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, baseBeats, playTrack]);

  // Derived filter options
  const genreOptions = useMemo(() => {
    const list = new Set<string>();
    baseBeats.forEach(b => {
      b.tags?.forEach(t => {
        const clean = t.replace('#', '').toUpperCase();
        if (clean.length > 2) list.add(clean);
      });
    });
    return ['ALL', ...Array.from(list)];
  }, [baseBeats]);

  const bpmOptions = ['ALL', '80-110 (Slow)', '110-135 (Mid)', '135-160 (Fast Trap)', '160+ (Speed Drill)'];

  const moodOptions = useMemo(() => {
    const list = new Set<string>();
    baseBeats.forEach(b => {
      if (Array.isArray(b.mood)) {
        b.mood.forEach(m => {
          if (m && typeof m === 'string') list.add(m.toUpperCase());
        });
      } else if (typeof b.mood === 'string' && b.mood) {
        list.add(b.mood.toUpperCase());
      }
    });
    return ['ALL', ...Array.from(list)];
  }, [baseBeats]);

  const keyOptions = useMemo(() => {
    const list = new Set<string>();
    baseBeats.forEach(b => {
      if (b.key && typeof b.key === 'string') list.add(b.key.toUpperCase());
    });
    return ['ALL', ...Array.from(list)];
  }, [baseBeats]);

  // Filtered Beats for catalog
  const filteredBeats = useMemo(() => {
    const result = baseBeats.filter((beat) => {
      if (filterParam === 'free' && !beat.freeDownload?.enabled && !(beat as any).isFreeDownload) return false;
      if (showLikedOnly && !favorites.includes(beat.id)) return false;

      // Feature 7 — Advanced Beat Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = beat.title ? beat.title.toLowerCase().includes(q) : false;
        const matchesProducer = beat.producer ? beat.producer.toLowerCase().includes(q) : false;
        const matchesTags = Array.isArray(beat.tags) && beat.tags.some(t => t && t.toLowerCase().includes(q));
        const matchesKey = beat.key ? beat.key.toLowerCase().includes(q) : false;
        const matchesMood = Array.isArray(beat.mood) 
          ? beat.mood.some(m => m && typeof m === 'string' && m.toLowerCase().includes(q))
          : typeof beat.mood === 'string' && beat.mood.toLowerCase().includes(q);
        const matchesBpm = beat.bpm ? beat.bpm.toString().includes(q) : false;

        if (!matchesTitle && !matchesProducer && !matchesTags && !matchesKey && !matchesMood && !matchesBpm) {
          return false;
        }
      }

      if (selectedGenre !== 'ALL') {
        const hasGenre = Array.isArray(beat.tags) && beat.tags.some(t => t && t.replace('#', '').toUpperCase() === selectedGenre);
        if (!hasGenre) return false;
      }

      // Feature 8 — BPM Range Filter
      if (customMinBpm.trim() || customMaxBpm.trim()) {
        const bpm = beat.bpm || 0;
        const min = customMinBpm.trim() ? parseInt(customMinBpm) : 0;
        const max = customMaxBpm.trim() ? parseInt(customMaxBpm) : 999;
        if (bpm < min || bpm > max) return false;
      } else if (selectedBpmRange !== 'ALL') {
        const bpm = beat.bpm || 0;
        if (selectedBpmRange.startsWith('80') && (bpm < 80 || bpm > 110)) return false;
        if (selectedBpmRange.startsWith('110') && (bpm < 110 || bpm > 135)) return false;
        if (selectedBpmRange.startsWith('135') && (bpm < 135 || bpm > 160)) return false;
        if (selectedBpmRange.startsWith('160') && bpm < 160) return false;
      }

      if (selectedMood !== 'ALL') {
        if (Array.isArray(beat.mood)) {
          const hasMood = beat.mood.some(m => m && typeof m === 'string' && m.toUpperCase() === selectedMood);
          if (!hasMood) return false;
        } else if (typeof beat.mood === 'string') {
          if (beat.mood.toUpperCase() !== selectedMood) return false;
        } else {
          return false;
        }
      }

      // Feature 9 — Key Filter
      if (selectedKey !== 'ALL') {
        if (!beat.key || beat.key.toUpperCase() !== selectedKey) return false;
      }

      return true;
    });

    // Feature 10 — Sort Controls
    if (selectedSort === 'newest') {
      result.sort((a, b) => {
        const d1 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const d2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return d2 - d1;
      });
    } else if (selectedSort === 'oldest') {
      result.sort((a, b) => {
        const d1 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const d2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return d1 - d2;
      });
    } else if (selectedSort === 'most_played') {
      result.sort((a, b) => (b.plays || 0) - (a.plays || 0));
    } else if (selectedSort === 'most_downloaded') {
      result.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (selectedSort === 'most_purchased') {
      result.sort((a, b) => (b.purchases || 0) - (a.purchases || 0));
    } else if (selectedSort === 'price_low_high') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (selectedSort === 'price_high_low') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (selectedSort === 'alphabetical') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [baseBeats, filterParam, showLikedOnly, favorites, searchQuery, selectedGenre, selectedBpmRange, customMinBpm, customMaxBpm, selectedMood, selectedKey, selectedSort]);

  // Dynamic Homepage Layout configuration
  const homepageSections = useMemo(() => {
    const rawSections = state.homepageLayout && state.homepageLayout.length > 0
      ? state.homepageLayout
      : DEFAULT_HOMEPAGE_LAYOUT;
    
    // Sort sections strictly by the predefined DEFAULT_HOMEPAGE_LAYOUT sequence
    return [...rawSections].sort((a, b) => {
      const indexA = DEFAULT_HOMEPAGE_LAYOUT.findIndex(x => x.id === a.id);
      const indexB = DEFAULT_HOMEPAGE_LAYOUT.findIndex(x => x.id === b.id);
      return indexA - indexB;
    });
  }, [state.homepageLayout]);

  return (
    <div className={`p-4 md:p-8 w-full space-y-12 min-h-screen pb-32 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0a0a0c] text-white' : 'bg-[#fafafa] text-neutral-900'
    }`}>
      {/* Dynamically render sections according to Homepage Builder layout order & enabled state */}
      {homepageSections.map((section) => {
        if (!section.enabled) return null;

        const renderSectionContent = () => {
          switch (section.id) {
            case 'hero':
              return (
                <div className="space-y-6">
                  <HeroSection
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
                    onPurchaseBeat={handlePurchase}
                    onFreeDownloadBeat={handleFreeDownload}
                    onExploreCatalog={() => {
                      const el = document.getElementById('catalog-search-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onRequestCustom={() => {
                      const el = document.getElementById('contact-form-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                  {/* Feature 27: Featured Beat of the Week */}
                  <FeaturedBeatSection onPurchaseBeat={handlePurchase} />
                </div>
              );

            case 'high_performance':
              return (
                <HighPerformanceSection
                  isDarkMode={isDarkMode}
                  onPlayBeat={handleTogglePlay}
                  onPurchaseBeat={handlePurchase}
                />
              );

            case 'top_tracks':
              return (
                <TopTracksSection
                  isDarkMode={isDarkMode}
                  onPlayBeat={handleTogglePlay}
                  onPurchaseBeat={handlePurchase}
                />
              );

            case 'feed':
              return (
                <FeedSection
                  isDarkMode={isDarkMode}
                  onPlayBeat={handleTogglePlay}
                  onPurchaseBeat={handlePurchase}
                />
              );

            case 'beat_packs':
              return (
                <div className="space-y-12">
                  <BeatPacksSection
                    isDarkMode={isDarkMode}
                    onInspectPack={(pack) => setSelectedPackForInspection(pack)}
                    onPurchasePack={(pack) => {
                      const matchingBeat = baseBeats.find(b => b.title === pack.title || b.id === pack.id);
                      if (matchingBeat) {
                        handlePurchase(matchingBeat);
                      } else {
                        handlePurchase({
                          id: pack.id,
                          title: pack.title,
                          producer: 'Voodoo Boomin',
                          price: pack.price,
                          bpm: 140,
                          key: 'A Minor',
                          audioUrl: pack.zipFileUrl || '',
                          coverArtUrl: pack.coverArtUrl || '',
                          tags: ['#beatpack', '#bundle'],
                          trackType: 'Beat Pack',
                          visibility: 'Public',
                          licenses: {
                            mp3Lease: { enabled: true, price: pack.price },
                            wavLease: { enabled: true, price: pack.price },
                            premiumLease: { enabled: true, price: pack.price },
                            unlimitedLease: { enabled: true, price: pack.price },
                            exclusive: { enabled: true, price: pack.price }
                          },
                          freeDownload: { enabled: false, requirement: 'none', protection: 'tagged' },
                          plays: 0,
                          purchases: 0,
                          earnings: 0,
                          downloads: 0,
                          likes: 0,
                          createdAt: pack.createdAt || new Date().toISOString()
                        });
                      }
                    }}
                  />

                  {/* Feature 30: Voodoo Boomin Vault */}
                  <VaultSection 
                    onInspectPack={(pack) => setSelectedPackForInspection(pack)} 
                    onPurchaseBeat={handlePurchase} 
                  />
                </div>
              );

            case 'beats':
              return (
                <div className="space-y-12">
                  <FeaturedCarouselSection
                    isDarkMode={isDarkMode}
                    onPlayBeat={handleTogglePlay}
                    onPurchaseBeat={handlePurchase}
                    beats={baseBeats}
                  />
                  <BeatCatalogSection
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showLikedOnly={showLikedOnly}
                    setShowLikedOnly={setShowLikedOnly}
                    selectedGenre={selectedGenre}
                    setSelectedGenre={setSelectedGenre}
                    selectedBpmRange={selectedBpmRange}
                    setSelectedBpmRange={setSelectedBpmRange}
                    customMinBpm={customMinBpm}
                    setCustomMinBpm={setCustomMinBpm}
                    customMaxBpm={customMaxBpm}
                    setCustomMaxBpm={setCustomMaxBpm}
                    selectedMood={selectedMood}
                    setSelectedMood={setSelectedMood}
                    selectedKey={selectedKey}
                    setSelectedKey={setSelectedKey}
                    selectedSort={selectedSort}
                    setSelectedSort={setSelectedSort}
                    isGenreOpen={isGenreOpen}
                    setIsGenreOpen={setIsGenreOpen}
                    isBpmOpen={isBpmOpen}
                    setIsBpmOpen={setIsBpmOpen}
                    isMoodOpen={isMoodOpen}
                    setIsMoodOpen={setIsMoodOpen}
                    isKeyOpen={isKeyOpen}
                    setIsKeyOpen={setIsKeyOpen}
                    genreOptions={genreOptions}
                    bpmOptions={bpmOptions}
                    moodOptions={moodOptions}
                    keyOptions={keyOptions}
                    displayedBeats={filteredBeats}
                    baseBeats={baseBeats}
                    filteredCount={filteredBeats.length}
                    totalActiveCount={baseBeats.length}
                    copiedBeatId={copiedBeatId}
                    onCopyShare={copyShareLink}
                    onTogglePlay={handleTogglePlay}
                    onPurchase={handlePurchase}
                    onFreeDownload={handleFreeDownload}
                    onResetFilters={resetAllFilters}
                  />
                </div>
              );

            case 'profile':
              return (
                <ProfileSection
                  isDarkMode={isDarkMode}
                />
              );

            case 'services':
              return (
                <ServicesSection
                  isDarkMode={isDarkMode}
                />
              );

            default:
              return null;
          }
        };

        return (
          <div key={section.id}>
            {renderSectionContent()}
          </div>
        );
      })}

      {/* Checkout and Subscription Modals */}
      <CheckoutErrorBoundary>
        <CheckoutModal 
          onClose={() => setCheckoutBeat(null)} 
          beat={checkoutBeat} 
          onSuccess={handlePurchaseSuccess} 
        />
      </CheckoutErrorBoundary>

      {purchaseConfirmationOrder && (
        <PurchaseConfirmationModal 
          order={purchaseConfirmationOrder} 
          onClose={() => setPurchaseConfirmationOrder(null)} 
        />
      )}

      <SubscribeDownloadModal 
        isOpen={!!downloadUnlockBeat}
        onClose={() => setDownloadUnlockBeat(null)}
        beat={downloadUnlockBeat}
        onSuccess={triggerDownload}
      />

      {/* Advanced Beat Pack Preview "What's Inside" Modal */}
      <BeatPackWhatsInsideModal
        pack={selectedPackForInspection}
        onClose={() => setSelectedPackForInspection(null)}
        isDarkMode={isDarkMode}
        onPurchase={(pack) => {
          setSelectedPackForInspection(null);
          const matchingBeat = baseBeats.find(b => b.title === pack.title || b.id === pack.id);
          if (matchingBeat) {
            handlePurchase(matchingBeat);
          } else {
            handlePurchase({
              id: pack.id,
              title: pack.title,
              producer: 'Voodoo Boomin',
              price: pack.price,
              bpm: 140,
              key: 'A Minor',
              audioUrl: pack.zipFileUrl || '',
              coverArtUrl: pack.coverArtUrl || '',
              tags: ['#beatpack', '#bundle'],
              trackType: 'Beat Pack',
              visibility: 'Public',
              licenses: {
                mp3Lease: { enabled: true, price: pack.price },
                wavLease: { enabled: true, price: pack.price },
                premiumLease: { enabled: true, price: pack.price },
                unlimitedLease: { enabled: true, price: pack.price },
                exclusive: { enabled: true, price: pack.price }
              },
              freeDownload: { enabled: false, requirement: 'none', protection: 'tagged' },
              plays: 0,
              purchases: 0,
              earnings: 0,
              downloads: 0,
              likes: 0,
              createdAt: pack.createdAt || new Date().toISOString()
            });
          }
        }}
      />
    </div>
  );
}
