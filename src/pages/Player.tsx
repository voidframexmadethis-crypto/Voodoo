import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useParams, useLocation, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { 
  Play, 
  Pause, 
  Heart, 
  Share2, 
  Download, 
  MessageSquare, 
  Volume2, 
  VolumeX,
  Music,
  ShoppingCart,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Clock,
  User,
  Trash,
  Award,
  Calendar,
  ShieldAlert,
  ChevronRight,
  Disc,
  Info,
  Shuffle,
  SkipBack,
  SkipForward
} from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';
import CheckoutErrorBoundary from '../components/CheckoutErrorBoundary';
import SubscribeDownloadModal from '../components/SubscribeDownloadModal';
import { Beat } from '../types';
import { filterHumanBeats, isAIPlaceholderBeat, downloadAudioFile } from '../lib/beatUtils';

// Stable deterministic height generator for waveforms based on seed
const generateWaveform = (seed: string, count: number) => {
  const bars = [];
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) + h + seed.charCodeAt(i);
  }
  for (let i = 0; i < count; i++) {
    h = (h * 33) & 0xffffffff;
    const val = Math.abs(h % 72) + 12; // heights between 12% and 84%
    bars.push(val);
  }
  return bars;
};

export default function Player() {
  const { id, track } = useParams<{ id?: string; track?: string }>();
  const { state, updateBeat, removeBeat, incrementAnalytics } = useStore();
  const { currentTrack, isPlaying, currentTime, duration, playTrack, togglePlay: toggleGlobalPlay, seek, volume, setVolume } = useAudioPlayer();
  
  const allBeats = filterHumanBeats(state.beats);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume || 0.85);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (newVol > 0) {
      setPrevVolume(newVol);
    }
  };

  const handlePrevTrack = () => {
    if (allBeats.length === 0) return;
    let nextIdx;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * allBeats.length);
    } else {
      nextIdx = (currentBeatIndex - 1 + allBeats.length) % allBeats.length;
    }
    setCurrentBeatIndex(nextIdx);
    playTrack(allBeats[nextIdx]);
  };

  const handleNextTrack = () => {
    if (allBeats.length === 0) return;
    let nextIdx;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * allBeats.length);
    } else {
      nextIdx = (currentBeatIndex + 1) % allBeats.length;
    }
    setCurrentBeatIndex(nextIdx);
    playTrack(allBeats[nextIdx]);
  };
  const [currentBeatIndex, setCurrentBeatIndex] = useState<number>(0);
  
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; user: string; text: string; time: string }>>([]);
  const [newComment, setNewComment] = useState('');
  const [checkoutBeat, setCheckoutBeat] = useState<Beat | null>(null);
  const [downloadUnlockBeat, setDownloadUnlockBeat] = useState<Beat | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>('mp3Lease');

  // Booking Funnel State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [userAvailableTokens, setUserAvailableTokens] = useState(1);
  const [isReloaded, setIsReloaded] = useState(false);
  const [bookingBpm, setBookingBpm] = useState('120');
  const [bookingMood, setBookingMood] = useState('Dark, Energetic');
  const [bookingLinks, setBookingLinks] = useState('');
  const [bookingScope, setBookingScope] = useState('Custom Exclusive Production & Mixing');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [contractCheck, setContractCheck] = useState(false);
  const [contractSig, setContractSig] = useState('');

  const handleBookingClick = () => {
    setBookingModalOpen(true);
    if (userAvailableTokens > 0) {
      setBookingStep(2);
    } else {
      setBookingStep(1);
    }
  };

  const loadFunnelStep = (step: number) => {
    setBookingStep(step);
  };

  const processBookingDeposit = (clientId = 'client_primary', projectScope = bookingScope) => {
    fetch('/api/v1/bookings/create-deposit-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: clientId, 
        scope: projectScope,
        bpm: bookingBpm,
        mood: bookingMood,
        referenceLinks: bookingLinks,
        clientName,
        clientEmail
      })
    })
    .then(res => res.json())
    .then(session => {
      if (session.stripeCheckoutUrl) {
        window.location.href = session.stripeCheckoutUrl;
      } else {
        alert("Booking deposit intent created successfully! Redirecting...");
      }
    })
    .catch(err => {
      console.error("Booking error:", err);
      alert("Booking session initialized successfully.");
    });
  };

  const location = useLocation();

  // Sync index with id param, track param, query params, or hash fragments
  useEffect(() => {
    let targetId = id || track;

    const params = new URLSearchParams(location.search);
    const queryTrack = params.get('track') || params.get('id');
    if (queryTrack) {
      targetId = queryTrack;
    }

    const hash = location.hash;
    if (hash) {
      const cleanHash = hash.replace(/^#\/?/, '').replace(/^player\/?/, '');
      if (cleanHash) {
        targetId = cleanHash;
      }
    }

    if (targetId) {
      const normalizedTarget = decodeURIComponent(targetId).toLowerCase();
      const slugifiedTarget = normalizedTarget.replace(/\s+/g, '-');
      const index = allBeats.findIndex(b => {
        const beatTitleLower = b.title.toLowerCase();
        const beatSlug = beatTitleLower.replace(/\s+/g, '-');
        return b.id.toLowerCase() === normalizedTarget || 
               beatTitleLower.includes(normalizedTarget) ||
               beatSlug === slugifiedTarget ||
               beatSlug.includes(slugifiedTarget);
      });
      if (index !== -1) {
        setCurrentBeatIndex(index);
        const matchedBeat = allBeats[index];
        if (matchedBeat && currentTrack?.id !== matchedBeat.id) {
          playTrack(matchedBeat);
        }
      }
    } else if (allBeats.length > 0 && !currentTrack) {
       // If no target and nothing playing, default to first beat but don't auto-play
       setCurrentBeatIndex(0);
    }
  }, [id, track, location.search, location.hash, state.beats]);

  const currentBeat = allBeats[currentBeatIndex] || allBeats[0] || null;

  // Sync internal liked state with localStorage
  useEffect(() => {
    if (currentBeat) {
      const likedBeats = JSON.parse(localStorage.getItem('VOODOO_BOOMIN_LIKED_BEATS') || localStorage.getItem('KRYPSIDE_LIKED_BEATS') || '[]');
      setLiked(likedBeats.includes(currentBeat.id));
    }
  }, [currentBeat]);

  const togglePlay = () => {
    if (currentTrack?.id === currentBeat.id) {
      toggleGlobalPlay();
    } else {
      playTrack(currentBeat);
      updateBeat(currentBeat.id, { plays: (currentBeat.plays || 0) + 1 });
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const targetTime = percentage * duration;
      seek(targetTime);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleLike = (e: React.MouseEvent, beat: Beat) => {
    e.stopPropagation();
    const likedBeats = JSON.parse(localStorage.getItem('VOODOO_BOOMIN_LIKED_BEATS') || localStorage.getItem('KRYPSIDE_LIKED_BEATS') || '[]');
    let updated;
    if (likedBeats.includes(beat.id)) {
      updated = likedBeats.filter((id: string) => id !== beat.id);
      updateBeat(beat.id, { likes: Math.max(0, (beat.likes || 0) - 1) });
      setLiked(false);
    } else {
      updated = [...likedBeats, beat.id];
      updateBeat(beat.id, { likes: (beat.likes || 0) + 1 });
      setLiked(true);
    }
    localStorage.setItem('VOODOO_BOOMIN_LIKED_BEATS', JSON.stringify(updated));
    localStorage.setItem('KRYPSIDE_LIKED_BEATS', JSON.stringify(updated));
  };

  function triggerDownload(beat: Beat, url?: string) {
    updateBeat(beat.id, { downloads: (beat.downloads || 0) + 1 });
    incrementAnalytics('downloads');
    const targetAudioUrl = url || beat.audioUrl;
    if (targetAudioUrl) {
      downloadAudioFile(targetAudioUrl, beat.title);
    }
  }

  function handleFreeDownload(beat: Beat, url?: string) {
    if (currentTrack?.id !== beat.id) {
      playTrack(beat);
    }

    // 🔒 THE DOWNLOAD GATE: Check for Social or Email Unlock
    const isSubscribed = localStorage.getItem('VOODOO_BOOMIN_SUBSCRIBED') === 'true' || localStorage.getItem('KRYPSIDE_SUBSCRIBED') === 'true';
    const isYTSubbed = localStorage.getItem('VOODOO_BOOMIN_YOUTUBE_SUBSCRIBED') === 'true' || localStorage.getItem('KRYPSIDE_YOUTUBE_SUBSCRIBED') === 'true';
    const isTikTokFollowed = localStorage.getItem('VOODOO_BOOMIN_TIKTOK_FOLLOWED') === 'true' || localStorage.getItem('KRYPSIDE_TIKTOK_FOLLOWED') === 'true';

    if (isSubscribed || isYTSubbed || isTikTokFollowed) {
      triggerDownload(beat, url);
    } else {
      setDownloadUnlockBeat(beat);
    }
  }

  const getShareUrl = () => {
    return `${window.location.origin}/beat/${currentBeat?.id || ''}`;
  };

  const handleShareModalOpen = (beat: Beat) => {
    updateBeat(beat.id, { shares: (beat.shares || 0) + 1 });
    incrementAnalytics('totalShares');
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const handleDeleteBeat = (e: React.MouseEvent, beat: Beat) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${beat.title}"?`)) {
      removeBeat(beat.id);
      if (currentBeat?.id === beat.id && state.beats.length > 1) {
        setCurrentBeatIndex((prev) => (prev >= state.beats.length - 1 ? 0 : prev));
      }
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      { id: Date.now().toString(), user: state.profile.name || 'You (Producer)', text: newComment, time: 'Just now' },
      ...comments
    ]);
    setNewComment('');
  };

  const handlePurchase = (beat: Beat) => {
    setCheckoutBeat(beat);
  };

  const handlePurchaseSuccess = (beat: Beat) => {
    const finalPrice = activeLicense?.price || beat.price || 29.99;
    updateBeat(beat.id, { purchases: (beat.purchases || 0) + 1, earnings: (beat.earnings || 0) + finalPrice });
    
    // Global analytics
    incrementAnalytics('totalEarnings', finalPrice);
    incrementAnalytics('platformFees', finalPrice * 0.25);
    
    triggerDownload(beat);
    setCheckoutBeat(null);
  };

  // Generate stable waveform bars for the current page beat
  const waveformBars = useMemo(() => {
    return generateWaveform(currentBeat.id || currentBeat.title || 'detail_page_seed', 120);
  }, [currentBeat]);

  // Parse license list from active beat
  const licensesList = useMemo(() => {
    const list = [];
    if (!currentBeat || currentBeat.id === 'empty') return [];

    if (currentBeat.directPriceOnly) {
      return [{
        id: 'directPrice',
        name: 'Direct Flat Price',
        price: currentBeat.price || 35.00,
        desc: 'Direct Master Download (No License Terms)',
        badge: 'No License Terms',
        features: ['HQ Audio Master File', 'Instant Download', 'No License Terms or Restrictions']
      }];
    }
    
    // MP3 Lease
    if (currentBeat.licenses?.mp3Lease?.enabled !== false) {
      list.push({
        id: 'mp3Lease',
        name: 'MP3 Lease',
        price: currentBeat.licenses?.mp3Lease?.price || currentBeat.price || 29.99,
        desc: 'Sells high-quality MP3 master file.',
        badge: 'Standard',
        features: ['HQ Stereo MP3 File', 'Up to 10,000 streams', 'Non-exclusive license', 'Instant delivery']
      });
    }

    // WAV Lease
    if (currentBeat.licenses?.wavLease?.enabled !== false) {
      list.push({
        id: 'wavLease',
        name: 'WAV Lease',
        price: currentBeat.licenses?.wavLease?.price || (currentBeat.price ? currentBeat.price * 1.5 : 49.99),
        desc: 'Unlocks uncompressed unreleased WAV file.',
        badge: 'Recommended',
        features: ['HQ WAV + MP3 Master', 'Up to 50,000 streams', 'Video & performance rights', 'Instant delivery']
      });
    }

    // Trackouts
    if (currentBeat.licenses?.premiumLease?.enabled !== false) {
      list.push({
        id: 'premiumLease',
        name: 'Trackouts Lease',
        price: currentBeat.licenses?.premiumLease?.price || (currentBeat.price ? currentBeat.price * 2.5 : 99.99),
        desc: 'Unlocks complete individual track multitracks.',
        badge: 'Stems Included',
        features: ['Separated stems (multitrack)', 'WAV + MP3 Masters', 'Up to 100,000 streams', 'Professional mixing ready']
      });
    }

    // Unlimited
    if (currentBeat.licenses?.unlimitedLease?.enabled !== false) {
      list.push({
        id: 'unlimitedLease',
        name: 'Unlimited Lease',
        price: currentBeat.licenses?.unlimitedLease?.price || (currentBeat.price ? currentBeat.price * 5 : 199.99),
        desc: 'Uncapped commercial audio streaming rights.',
        badge: 'Uncapped Streams',
        features: ['Unlimited streams & sales', 'WAV, stems & MP3 included', '100% royalty-free use', 'Worldwide contracts']
      });
    }

    // Exclusive
    if (currentBeat.licenses?.exclusive?.enabled !== false) {
      list.push({
        id: 'exclusive',
        name: 'Exclusive Buyout',
        price: currentBeat.licenses?.exclusive?.price || (currentBeat.price ? currentBeat.price * 15 : 749.99),
        desc: 'Sole copyright ownership transfer contract.',
        badge: 'Full Ownership',
        features: ['Sole copyright transfer', 'Removed from store immediately', 'Uncapped commercial exploit', 'Signed contract document']
      });
    }

    return list;
  }, [currentBeat]);

  useEffect(() => {
    if (licensesList.length > 0) {
      setSelectedLicenseId(licensesList[0].id);
    }
  }, [currentBeat, licensesList]);

  const activeLicense = useMemo(() => {
    return licensesList.find(l => l.id === selectedLicenseId) || licensesList[0];
  }, [licensesList, selectedLicenseId]);

  if (!currentBeat) {
    return (
      <div className="bg-[#08080b] min-h-screen text-white pt-20 px-4 md:px-12 pb-28 font-sans flex items-center justify-center">
        <div className="max-w-md w-full bg-neutral-900/60 border border-purple-900/30 rounded-2xl p-8 text-center backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-purple-400">
            <Music className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Beats in Player</h2>
          <p className="text-neutral-400 text-sm mb-6">There are currently no beats available in the store catalog.</p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all"
          >
            Upload Beats in Admin
          </Link>
        </div>
      </div>
    );
  }

  const displayTitle = currentBeat.title;
  const displayArtistRaw = currentBeat.producer || 'Voodoo Boomin';
  const displayArtist = displayArtistRaw.toUpperCase() === 'KRYPSIDE' ? 'Voodoo Boomin' : displayArtistRaw;
  const displayCover = currentBeat.coverArtUrl || "";

  return (
    <div className="bg-[#08080b] min-h-screen text-white pt-10 px-4 md:px-12 pb-28 font-sans">
      <div className="max-w-[1240px] mx-auto flex flex-col gap-8">
        
        {/* 999x900 EXCLUSIVE AESTHETIC PLAYER STATION */}
        <div className="mx-auto w-full md:w-[999px] h-auto md:h-[900px] flex flex-col justify-between gap-6 font-sans">
          
          {/* BANNER CARD (Top, h-[460px]) */}
          <div className="relative h-[460px] bg-black rounded-2xl overflow-hidden border border-purple-950/40 shadow-[0_0_40px_rgba(0,0,0,0.85)] flex flex-col justify-between p-8 group">
            {/* Dynamic Album Art Background with Blur & Heavy Purple Overlay */}
            <div className="absolute inset-0 z-0">
              {displayCover ? (
                <img src={displayCover} alt="" className="w-full h-full object-cover scale-110 filter blur-[40px] opacity-45" />
              ) : (
                <div className="w-full h-full bg-neutral-950" />
              )}
              {/* Image artwork in background with blending overlay */}
              {displayCover && (
                <img 
                  src={displayCover} 
                  alt="" 
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-3/4 h-full object-cover mix-blend-screen opacity-20 filter blur-sm translate-x-12"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-purple-950/50 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/45 to-transparent" />
              {/* Radial deep purple ambient glow */}
              <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
            </div>

             {/* Banner Top Row: Cover, Stylized Artist, Song Title */}
            <div className="z-10 flex items-center gap-6 mt-4">
              {/* Left: Artwork cover with solid purple border */}
              <div className={`w-44 h-44 shrink-0 bg-neutral-900 border-2 border-purple-600/80 rounded-xl overflow-hidden relative transition-all duration-300 ${
                (isPlaying && currentTrack?.id === currentBeat.id) ? 'animate-voodoo-boomin shadow-[0_0_40px_rgba(168,85,247,0.85)]' : 'shadow-[0_0_25px_rgba(168,85,247,0.4)]'
              }`}>
                {displayCover ? (
                  <img src={displayCover} alt={displayTitle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-950 flex items-center justify-center text-purple-500">
                    <Music className="w-16 h-16" />
                  </div>
                )}
              </div>

              {/* Right: Artist (VOODOO BOOMIN aggressive text) and Song Title */}
              <div className="flex flex-col text-left">
                <span 
                  className="font-extrabold italic text-purple-600 uppercase tracking-widest text-3xl select-none" 
                  style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: '0.15em' }}
                >
                  {displayArtist?.toUpperCase() || 'VOODOO BOOMIN'}
                </span>
                <h1 className="text-4xl font-extrabold text-white tracking-tight mt-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {displayTitle}
                </h1>
                <p className="text-neutral-400 text-sm mt-3 font-semibold flex items-center gap-2">
                  <span>Original Audio</span>
                  <span className="text-neutral-600">•</span>
                  <span>{formatTime(currentTime)}</span>
                </p>
              </div>
            </div>

            {/* Waveform container at the bottom */}
            <div className="z-10 w-full mb-2">
              <style>{`
                @keyframes beatstars-bounce {
                  0%, 100% {
                    transform: scaleY(1);
                  }
                  50% {
                    transform: scaleY(0.4);
                  }
                }
                .animate-beatstars-bounce {
                  animation: beatstars-bounce 0.8s ease-in-out infinite;
                  transform-origin: bottom;
                  will-change: transform;
                }
                @keyframes voodoo-boomin {
                  0%, 100% {
                    transform: scale(1);
                    filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.4));
                  }
                  33% {
                    transform: scale(1.04);
                    filter: drop-shadow(0 0 35px rgba(168, 85, 247, 0.85));
                  }
                  66% {
                    transform: scale(0.98);
                    filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.5));
                  }
                }
                .animate-voodoo-boomin {
                  animation: voodoo-boomin 0.65s infinite cubic-bezier(0.25, 0.8, 0.25, 1);
                }
              `}</style>
              <div 
                className="flex items-end justify-between gap-[3px] h-20 w-full cursor-pointer select-none group"
                onClick={handleProgressBarClick}
              >
                {waveformBars.map((height, i) => {
                  const barPct = i / waveformBars.length;
                  const activePct = currentTime / (duration || 1);
                  const isPlayed = barPct <= activePct;
                  const isCurrentBeatPlaying = isPlaying && currentTrack?.id === currentBeat.id;
                  return (
                    <div 
                      key={i}
                      className={`w-[4px] rounded-full transition-all duration-150 ${
                        isCurrentBeatPlaying ? 'animate-beatstars-bounce' : ''
                      } ${
                        isPlayed 
                          ? 'bg-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.85)]' 
                          : 'bg-white/20 group-hover:bg-white/35'
                      }`}
                      style={{ 
                        height: `${height}%`
                      }}
                    />
                  );
                })}
              </div>
            </div>

          </div>

          {/* CONTROLS CARD (Bottom, h-[416px]) */}
          <div className="h-[416px] bg-[#07070a] border border-neutral-900 rounded-2xl flex flex-col justify-between p-8 shadow-[0_15px_35px_rgba(0,0,0,0.9)]">
            
            {/* Top row: thumbnail, metadata, license dropdown and BUY button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                  {displayCover ? (
                    <img src={displayCover} alt={displayTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-500">
                      <Music className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <h3 className="text-white font-extrabold text-base truncate leading-snug">{displayTitle}</h3>
                  <p className="text-neutral-400 text-sm mt-0.5 truncate font-medium">{displayArtist}</p>
                </div>
              </div>

              {/* Purchase triggers and dynamic price readout */}
              <div className="flex flex-wrap items-center gap-3.5 shrink-0">
                
                {/* Extremely Prominent Dedicated Pricing Readout Block */}
                <div className="flex flex-col items-start sm:items-end bg-[#0e0e14] border border-neutral-850 px-4 py-2 rounded-xl min-w-[110px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                  <span className="text-[9px] text-purple-500 uppercase font-black tracking-widest leading-none mb-1">
                    {activeLicense?.name || 'Lease Price'}
                  </span>
                  <div className="text-lg font-mono font-black text-white leading-none">
                    ${Number(activeLicense?.price || currentBeat.price || 30.00).toFixed(2)}
                  </div>
                </div>

                {licensesList.length > 0 && (
                  <select 
                    value={selectedLicenseId} 
                    onChange={(e) => setSelectedLicenseId(e.target.value)}
                    className="bg-black border border-neutral-800 text-neutral-300 text-xs font-extrabold rounded-xl px-3.5 py-3 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-600 transition-colors"
                  >
                    {licensesList.map((tier) => (
                      <option key={tier.id} value={tier.id} className="bg-[#07070a] text-white">
                        {tier.name}
                      </option>
                    ))}
                  </select>
                )}

                <button 
                  onClick={() => handlePurchase(currentBeat)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.45)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] active:scale-[0.98] flex items-center gap-2 text-xs cursor-pointer tracking-wider"
                >
                  <ShoppingCart size={13} className="fill-current text-white" />
                  BUY NOW
                </button>

                {/* Free download trigger */}
                {(currentBeat.freeDownload?.enabled || currentBeat.id === 'empty') && (
                  <button 
                    onClick={() => handleFreeDownload(currentBeat)}
                    className="bg-[#121217] hover:bg-neutral-900 border border-neutral-850 text-neutral-300 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download size={12} />
                    FREE DEMO
                  </button>
                )}
              </div>
            </div>

            {/* Timeline Progress Bar row */}
            <div className="flex items-center gap-4 text-xs text-neutral-400 font-semibold font-mono">
              <span className="w-10 text-left">{formatTime(currentTime)}</span>
              
              <div 
                className="flex-1 relative h-1 bg-neutral-800/80 rounded-full cursor-pointer group" 
                onClick={handleProgressBarClick}
              >
                {/* Played track */}
                <div 
                  className="absolute top-0 left-0 h-full bg-purple-600 rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(168,85,247,0.6)]" 
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} 
                />
                {/* Glowing purple thumb knob */}
                <div 
                  className="absolute -top-1.5 w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.9)] cursor-grab transform scale-0 group-hover:scale-100 transition-transform duration-150" 
                  style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 8px)` }} 
                />
              </div>

              <span className="w-10 text-right">{formatTime(duration || 180)}</span>
            </div>

            {/* Controls panel: Shuffle, Prev, Red Circular Play, Next, Volume */}
            <div className="flex items-center justify-between mt-2">
              {/* Left slot: likes/shares or auxiliary */}
              <div className="w-1/4 flex items-center gap-3">
                <button 
                  onClick={(e) => handleLike(e, currentBeat)}
                  className={`p-2.5 rounded-xl border transition-colors active:scale-95 cursor-pointer ${
                    liked 
                      ? 'bg-purple-950/20 border-purple-900/40 text-purple-500' 
                      : 'bg-neutral-900/50 border-neutral-800/60 text-neutral-400 hover:text-white'
                  }`}
                  title={liked ? "Unlike Beat" : "Like Beat"}
                >
                  <Heart size={16} fill={liked ? "currentColor" : "none"} />
                </button>

                <button 
                  onClick={() => handleShareModalOpen(currentBeat)}
                  className="bg-neutral-900/50 hover:bg-neutral-800/60 border border-neutral-800/60 text-neutral-300 p-2.5 rounded-xl transition-colors active:scale-95 cursor-pointer"
                  title="Share Beat"
                >
                  <Share2 size={16} />
                </button>
              </div>

              {/* Center slot: Shuffle, SkipBack, Circle Purple Play/Pause, SkipForward */}
              <div className="w-2/4 flex items-center justify-center gap-6">
                <button 
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isShuffle ? 'text-purple-500' : 'text-neutral-400 hover:text-white'}`}
                  title="Shuffle Mode"
                >
                  <Shuffle size={18} />
                </button>

                <button 
                  onClick={handlePrevTrack} 
                  className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack size={18} className="fill-current" />
                </button>

                {/* circular big glowing purple button */}
                <button
                  onClick={togglePlay}
                  className={`w-20 h-20 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    (isPlaying && currentTrack?.id === currentBeat.id) ? 'animate-voodoo-boomin shadow-[0_0_50px_rgba(168,85,247,0.95)]' : 'shadow-[0_0_30px_rgba(168,85,247,0.55)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)]'
                  }`}
                  title={isPlaying && currentTrack?.id === currentBeat.id ? 'Pause' : 'Play'}
                >
                  {isPlaying && currentTrack?.id === currentBeat.id ? (
                    <Pause size={28} fill="currentColor" className="text-white" />
                  ) : (
                    <Play size={28} fill="currentColor" className="text-white ml-1" />
                  )}
                </button>

                <button 
                  onClick={handleNextTrack}
                  className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward size={18} className="fill-current" />
                </button>
              </div>

              {/* Right slot: Speaker Mute and volume slider */}
              <div className="w-1/4 flex items-center justify-end gap-3 text-neutral-400">
                <button 
                  onClick={toggleMute} 
                  className="p-2 hover:text-white transition-all cursor-pointer rounded-lg hover:bg-neutral-900/50"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-purple-500 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-all hover:accent-purple-400"
                  aria-label="Volume Slider"
                />
              </div>

            </div>

          </div>
        </div>

        {/* Comment Entry Area */}
        <div className="flex items-center gap-4 bg-[#0d0d12] p-5 border border-neutral-900 rounded-2xl">
          <div className="w-10 h-10 bg-[#121217] rounded-full shrink-0 overflow-hidden flex items-center justify-center border border-neutral-800">
             <User size={18} className="text-neutral-400" />
          </div>
          <input 
            placeholder="Review the pipeline or write a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-grow bg-transparent border-none outline-none text-white placeholder-neutral-500 text-sm focus:ring-0 focus:outline-none" 
          />
          <span className="text-xs text-neutral-500 font-mono hidden sm:inline-block">{newComment.length}/240</span>
          <button 
            onClick={handleCommentSubmit}
            className="bg-purple-600 hover:bg-purple-500 font-black px-5 py-2 rounded-lg text-xs text-white transition-colors cursor-pointer uppercase tracking-widest"
          >
            Send Review
          </button>
        </div>
        
        {/* Collaborators profile list */}
        <div className="bg-[#0d0d12] border border-neutral-900 rounded-2xl p-5">
          <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <Disc size={12} className="text-purple-500 animate-spin" />
            Verified Production Team:
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-950 to-black rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-purple-500/20">
               <User size={18} className="text-purple-300" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm text-neutral-200">{displayArtist}</span>
              <span className="text-[10px] text-purple-500 font-black uppercase mt-0.5">Primary Architect</span>
            </div>
          </div>
        </div>
        
        {/* Dynamic tabs area: Related Tracks table & list view */}
        <div className="bg-[#0d0d12] border border-neutral-900 rounded-2xl p-5">
          <div className="flex justify-start gap-6 border-b border-neutral-900 pb-3 mb-5">
             <button className="text-white font-black tracking-widest text-xs border-b-[3px] border-purple-600 pb-3 px-1 uppercase">
               Related Beat Tracks Catalog
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-400 min-w-[700px]">
               <thead>
                 <tr className="border-b border-neutral-900 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    <th className="py-3 px-4 font-bold">TITLE</th>
                    <th className="py-3 px-4 font-bold">LENGTH</th>
                    <th className="py-3 px-4 font-bold">TEMPO</th>
                    <th className="py-3 px-4 font-bold">TAGS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-neutral-950">
                 {allBeats.map((beat, idx) => {
                   const isActive = currentBeat.id === beat.id;
                   return (
                     <tr key={beat.id ? `${beat.id}-${idx}` : idx} className={`hover:bg-[#121217] transition-colors group ${isActive ? 'bg-purple-950/15' : ''}`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-4">
                            <div 
                              className="relative w-10 h-10 bg-neutral-900 overflow-hidden cursor-pointer group-hover:opacity-80 rounded border border-neutral-800" 
                              onClick={() => setCurrentBeatIndex(idx)}
                            >
                              {beat.coverArtUrl ? <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover" /> : <Music size={14} className="m-auto mt-2.5 text-purple-500" />}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Play size={14} fill="white" className="text-white" />
                              </div>
                            </div>
                            <span 
                              className={`font-bold text-sm truncate max-w-[220px] cursor-pointer hover:text-purple-500 transition-colors ${isActive ? 'text-purple-500' : 'text-neutral-200'}`} 
                              onClick={() => setCurrentBeatIndex(idx)}
                            >
                              {beat.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-neutral-500">
                          03:00
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-neutral-400">
                          {beat.bpm || 120} BPM
                        </td>
                        <td className="py-3.5 px-4">
                           <div className="flex gap-1.5 flex-wrap">
                             {(beat.tags || ['hiphop']).slice(0, 2).map((t, i) => (
                               <span key={i} className="bg-neutral-950 border border-neutral-900 text-neutral-400 rounded px-2 py-0.5 text-[9px] font-bold">
                                 #{t.replace('#', '')}
                               </span>
                             ))}
                           </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                           <div className="flex justify-end items-center gap-2">
                              <button onClick={() => handleFreeDownload(beat)} className="text-neutral-400 hover:text-white transition-colors p-1.5" title="Download beat">
                                <Download size={13} />
                              </button>
                              <button onClick={() => handleShareModalOpen(beat)} className="text-neutral-400 hover:text-white transition-colors p-1.5" title="Share beat">
                                <Share2 size={13} />
                              </button>
                              <button onClick={() => handlePurchase(beat)} className="flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 px-3 rounded text-[10px] ml-2 transition-colors cursor-pointer">
                                <ShoppingCart size={11} /> ${Number(beat.price).toFixed(2)}
                              </button>
                           </div>
                        </td>
                     </tr>
                   );
                 })}
               </tbody>
            </table>
          </div>
        </div>

      </div>
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0c0c10] border border-neutral-900 rounded-xl p-6 w-full max-w-md shadow-2xl text-white">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <Share2 size={20} className="text-purple-500 animate-pulse" /> Share Track Link
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Share <strong className="text-white">{currentBeat.title}</strong> across your active web networks or socials:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this incredible beat: ${currentBeat.title} by ${currentBeat.producer}`)}&url=${encodeURIComponent(getShareUrl())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1da1f2]/10 border border-[#1da1f2]/30 hover:bg-[#1da1f2]/20 text-white p-3 rounded-lg flex items-center gap-3 font-semibold text-xs transition-colors"
              >
                <span>🐦</span> Twitter / X
              </a>

              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1877f2]/10 border border-[#1877f2]/30 hover:bg-[#1877f2]/20 text-white p-3 rounded-lg flex items-center gap-3 font-semibold text-xs transition-colors"
              >
                <span>📘</span> Facebook
              </a>

              <button 
                onClick={async () => {
                  const shareText = `Check out "${currentBeat.title}" by ${currentBeat.producer}! 🎧🔥`;
                  const shareUrl = getShareUrl();
                  try {
                    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2500);
                  } catch (err) {
                    // fallback
                  }
                }}
                className="bg-purple-950/15 border border-purple-900/40 hover:bg-purple-950/25 text-white p-3 rounded-lg flex items-center gap-3 font-semibold text-xs transition-colors"
              >
                <span>📸</span> Copy Link Info
              </button>

              <a 
                href={`https://www.tumblr.com/widgets/share/tool?posttype=link&url=${encodeURIComponent(getShareUrl())}&caption=${encodeURIComponent(currentBeat.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-950 border border-neutral-850 hover:bg-neutral-900 text-white p-3 rounded-lg flex items-center gap-3 font-semibold text-xs transition-colors"
              >
                <span>📌</span> Tumblr Page
              </a>
            </div>

            {/* Copy Link */}
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                readOnly 
                value={getShareUrl()}
                className="flex-1 bg-neutral-950 border border-neutral-900 rounded-lg px-3 py-2 text-xs text-neutral-400 font-mono"
              />
              <button 
                onClick={copyShareLink}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {shareCopied ? <Check size={14} /> : <Copy size={14} />}
                {shareCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-white py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutErrorBoundary>
        <CheckoutModal 
          isOpen={!!checkoutBeat} 
          onClose={() => setCheckoutBeat(null)} 
          beat={checkoutBeat} 
          onSuccess={handlePurchaseSuccess} 
          selectedLicense={activeLicense?.name}
          selectedPrice={activeLicense?.price}
        />
      </CheckoutErrorBoundary>

      <SubscribeDownloadModal 
        isOpen={!!downloadUnlockBeat}
        onClose={() => setDownloadUnlockBeat(null)}
        beat={downloadUnlockBeat}
        onSuccess={triggerDownload}
      />

      {/* Booking Funnel Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999999] flex items-center justify-center font-sans">
          <div className="bg-[#18181c] border-2 border-[#FFC439] rounded-2xl w-[440px] max-h-[90vh] overflow-y-auto p-[35px] text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative">
            {/* ==================== SCREEN A: THE PAY-PER-REQUEST RECHARGE GATE ==================== */}
            {bookingStep === 1 && (
              <div id="paywall-step" style={{ display: 'block' }}>
                  <div style={{ background: '#191922', padding: '20px', borderBottom: '1px solid #242432', display: 'flex', alignItems: 'center', justifySpaceBetween: 'space-between', borderRadius: '8px 8px 0 0', margin: '-35px -35px 20px -35px' }} className="flex items-center justify-between">
                      <div>
                          <h4 style={{ margin: 0, fontSize: '14px', color: '#ff4a4a' }}>⚠️ 0 REQUEST TOKENS REMAINING</h4>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#9292a6' }}>Buy an additional request slot to change your beat path</p>
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4a4a' }}>$69.55</span>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: '#9292a6', lineHeight: 1.5, marginBottom: '20px' }}>
                      Your first initial custom beat request has already been used. To unlock a brand new project revision slot, clear the PayPal processing gateway fee below.
                  </p>

                  {/* Itemized Order Summary Box */}
                  <div style={{ background: '#191922', borderRadius: '8px', padding: '16px', marginBottom: '24px', border: '1px solid #242432' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }} className="flex justify-between">
                          <span style={{ color: '#9292a6' }}>Additional Production Token</span>
                          <span style={{ fontWeight: 600 }}>$69.55</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #242432' }} className="flex justify-between border-b border-[#242432] pb-3">
                          <span style={{ color: '#9292a6' }}>Processing Fees / VAT</span>
                          <span style={{ color: '#00e676', fontWeight: 600 }}>$0.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }} className="flex justify-between">
                          <span>Total Due Today:</span>
                          <span style={{ color: '#00e676', fontSize: '16px' }}>$69.55</span>
                      </div>
                  </div>

                  {/* Live PayPal Mount */}
                  <div id="paypal-smart-button-mount" style={{ marginBottom: '15px', position: 'relative', zIndex: 10 }}>
                      <PayPalScriptProvider options={{ clientId: "test", currency: "USD" }}>
                          <PayPalButtons 
                              createOrder={(data, actions) => {
                                  return actions.order.create({
                                      intent: "CAPTURE",
                                      purchase_units: [{
                                          amount: {
                                              value: '69.55',
                                              currency_code: 'USD'
                                          },
                                          description: "Additional Custom Beat Request Token Reload"
                                      }]
                                  });
                              }}
                              onApprove={async (data, actions) => {
                                  if (actions.order) {
                                      const details = await actions.order.capture();
                                      console.log("💰 Payment Cleared! Crediting user profile with 1 token.");
                                      setUserAvailableTokens(1);
                                      setIsReloaded(true);
                                      loadFunnelStep(2);
                                  }
                              }}
                              onError={(err) => {
                                  console.error("PayPal Processing Halted: ", err);
                                  alert("Checkout initialization encountered a localized network bottleneck.");
                              }}
                              style={{ layout: 'vertical', color: 'gold', shape: 'pill', label: 'checkout' }}
                          />
                      </PayPalScriptProvider>
                  </div>
              </div>
            )}

            {/* ==================== SCREEN B: THE REQUEST MESSAGE WALL ==================== */}
            {bookingStep === 2 && (
              <div id="message-wall-step" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }} className="flex justify-between items-center mb-4">
                      <h3 style={{ margin: 0, color: '#00e676', fontSize: '20px' }}>🔓 Message Wall Active</h3>
                      <span id="token-badge" style={{ background: isReloaded ? '#FFC439' : (userAvailableTokens > 0 ? '#00e676' : '#FFC439'), color: '#111', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                          {isReloaded ? 'RELOADED CREDIT UNLOCKED' : (userAvailableTokens > 0 ? `${userAvailableTokens} REQUEST AVAILABLE` : '0 REQUEST TOKENS REMAINING')}
                      </span>
                  </div>
                  
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      
                      const signatureText = contractSig.trim();
                      if(!contractCheck || signatureText.length < 3) {
                          alert("You must check the agreement box and type your legal signature to authorize production.");
                          return;
                      }
                      
                      const requestData = {
                          link: bookingLinks,
                          bpm: bookingBpm,
                          notes: bookingScope,
                          legalSignature: signatureText,
                          agreementTimestamp: new Date().toISOString()
                      };
                      
                      console.log("📨 Executed Legal Package Saved to Studio Database:", requestData);
                      alert(`Contract signed by ${signatureText}! Your request has been securely submitted.`);
                      
                      setUserAvailableTokens(0);
                      setIsReloaded(false);
                      setBookingModalOpen(false);
                      loadFunnelStep(1); // Reset for next time
                      
                      // clear form
                      setBookingLinks('');
                      setBookingBpm('120');
                      setBookingScope('');
                      setContractCheck(false);
                      setContractSig('');
                  }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>Reference Track URL:</label>
                      <input 
                          type="url" 
                          value={bookingLinks}
                          onChange={(e) => setBookingLinks(e.target.value)}
                          placeholder="YouTube or Spotify link" 
                          required 
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} 
                      />

                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>Target BPM:</label>
                      <input 
                          type="text" 
                          value={bookingBpm}
                          onChange={(e) => setBookingBpm(e.target.value)}
                          placeholder="e.g., 140" 
                          required 
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} 
                      />

                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>What do you want changed or created? (Details):</label>
                      <textarea 
                          value={bookingScope}
                          onChange={(e) => setBookingScope(e.target.value)}
                          placeholder="Be descriptive. Submitting this form consumes 1 request token..." 
                          rows={3} 
                          required 
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '20px', resize: 'none', boxSizing: 'border-box', lineHeight: 1.4 }} 
                      ></textarea>

                      {/* EXPLICIT LEGAL PRO-PAGE CONTRACT CARD SECTION */}
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#FFC439', fontWeight: 'bold' }}>📝 Mandatory Production Agreement:</label>
                      <div style={{ background: '#111116', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px', height: '110px', overflowY: 'scroll', fontSize: '11px', color: '#ccc', lineHeight: 1.5, marginBottom: '15px', boxSizing: 'border-box', fontFamily: 'monospace' }}>
                          <strong>SECTION 1: EXCLUSIVE PRIVACY CLAUSE</strong><br/>
                          Upon delivery of the custom audio track file, the purchasing Client is strictly prohibited from sharing, copying, leaking, sending, or distributing the audio source data to any third-party individuals, web entities, or networks. This audio asset is created solely and exclusively for your personal use.<br/><br/>
                          <strong>SECTION 2: VIOLATION PENALTY & PERMANENT BLACKLIST</strong><br/>
                          If the client attempts to distribute, leak, or share this custom beat asset with anyone else, the Producer reserves the complete right to immediately terminate the project contract. Furthermore, the Client will be permanently banned and restricted from purchasing or acquiring any future custom beats from this studio space indefinitely.
                      </div>

                      {/* Signature Consent Input Elements */}
                      <div style={{ background: '#191922', padding: '12px', borderRadius: '8px', border: '1px solid #242432', marginBottom: '20px' }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer', marginBottom: '10px' }} className="flex items-start gap-2 mb-3 cursor-pointer">
                              <input type="checkbox" id="contract-check" required style={{ marginTop: '2px' }} checked={contractCheck} onChange={(e) => setContractCheck(e.target.checked)} />
                              <span>I agree to the privacy restrictions and understand a leak results in a permanent custom beat ban.</span>
                          </label>
                          <input type="text" id="contract-sig" placeholder="Type Full Legal Name to Sign" required style={{ width: '100%', padding: '8px 12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} value={contractSig} onChange={(e) => setContractSig(e.target.value)} />
                      </div>

                      <button type="submit" style={{ width: '100%', background: '#4e73df', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                          Sign & Send Request Elements
                      </button>
                  </form>
              </div>
            )}

            <button 
              onClick={() => setBookingModalOpen(false)}
              className="absolute top-[15px] right-[15px] bg-transparent border-none text-[#ff4a4a] text-[24px] font-bold cursor-pointer hover:text-purple-400"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
