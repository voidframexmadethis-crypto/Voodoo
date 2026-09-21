import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Disc, 
  Globe, 
  MapPin, 
  Music, 
  Package, 
  Share2, 
  Edit3, 
  Play, 
  Pause, 
  ExternalLink, 
  ShoppingCart, 
  Sparkles, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Sliders, 
  Volume2, 
  Flame, 
  ShieldCheck, 
  Send, 
  FileText,
  Copy,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Zap,
  Gauge,
  Camera,
  Upload,
  Radio,
  Layers,
  Crown,
  Link as LinkIcon,
  RefreshCw,
  Eye,
  Award,
  User as UserIcon
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat, BeatPack, SocialLink } from '../types';
import CheckoutModal from '../components/CheckoutModal';
import CheckoutErrorBoundary from '../components/CheckoutErrorBoundary';
import SubscribeDownloadModal from '../components/SubscribeDownloadModal';



// Available Social Platforms for Easy Adding
const AVAILABLE_PLATFORMS = [
  { id: 'Instagram', label: 'Instagram', icon: Instagram, color: '#E4405F', placeholder: 'https://instagram.com/voodooboomin' },
  { id: 'YouTube', label: 'YouTube', icon: Youtube, color: '#FF0000', placeholder: 'https://youtube.com/@voodooboomin' },
  { id: 'TikTok', label: 'TikTok', icon: Music, color: '#00F2FE', placeholder: 'https://tiktok.com/@voodooboomin' },
  { id: 'Twitter / X', label: 'Twitter / X', icon: Twitter, color: '#1DA1F2', placeholder: 'https://twitter.com/voodooboomin' },
  { id: 'Spotify', label: 'Spotify', icon: Disc, color: '#1DB954', placeholder: 'https://open.spotify.com/artist/voodooboomin' },
  { id: 'SoundCloud', label: 'SoundCloud', icon: Radio, color: '#FF5500', placeholder: 'https://soundcloud.com/voodooboomin' },
  { id: 'Apple Music', label: 'Apple Music', icon: Music, color: '#FC3C44', placeholder: 'https://music.apple.com/artist/voodooboomin' },
  { id: 'Facebook', label: 'Facebook', icon: Facebook, color: '#1877F2', placeholder: 'https://facebook.com/voodooboomin' },
  { id: 'BeatStars', label: 'BeatStars', icon: Award, color: '#E8243A', placeholder: 'https://beatstars.com/voodooboomin' },
  { id: 'Discord', label: 'Discord', icon: Globe, color: '#5865F2', placeholder: 'https://discord.gg/voodooboomin' },
  { id: 'Twitch', label: 'Twitch', icon: Radio, color: '#9146FF', placeholder: 'https://twitch.tv/voodooboomin' },
  { id: 'Website', label: 'Official Website', icon: Globe, color: '#EAB308', placeholder: 'https://voodooboomin.com' }
];

// Social platform icon helper
const getSocialIcon = (platform: string, size = 18) => {
  const p = platform.toLowerCase();
  if (p.includes('instagram')) return <Instagram size={size} className="text-[#E4405F]" />;
  if (p.includes('youtube')) return <Youtube size={size} className="text-[#FF0000]" />;
  if (p.includes('twitter') || p.includes('x')) return <Twitter size={size} className="text-[#1DA1F2]" />;
  if (p.includes('facebook')) return <Facebook size={size} className="text-[#1877F2]" />;
  if (p.includes('spotify')) return <Disc size={size} className="text-[#1DB954]" />;
  if (p.includes('sound')) return <Radio size={size} className="text-[#FF5500]" />;
  if (p.includes('apple')) return <Music size={size} className="text-[#FC3C44]" />;
  if (p.includes('beatstars')) return <Award size={size} className="text-[#E8243A]" />;
  if (p.includes('tiktok')) return <Music size={size} className="text-[#00F2FE]" />;
  if (p.includes('discord') || p.includes('twitch')) return <Radio size={size} className="text-purple-400" />;
  return <Globe size={size} className="text-yellow-400" />;
};

const getCleanHref = (url: string) => {
  if (!url) return '#';
  return url.startsWith('http') ? url : `https://${url}`;
};

export default function Profile() {
  const { 
    state, 
    updateProfile, 
    incrementAnalytics, 
    addToCart, 
  } = useStore();
  
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlay, 
    playPack, 
    playPackTrack, 
    currentPackId, 
  } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<'beats' | 'packs' | 'booking' | 'specs'>('beats');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [voiceTagPlaying, setVoiceTagPlaying] = useState(false);
  const [rpmGauge, setRpmGauge] = useState(8500);

  // E-commerce checkout state
  const [checkoutBeat, setCheckoutBeat] = useState<Beat | null>(null);
  const [downloadModalBeat, setDownloadModalBeat] = useState<Beat | null>(null);

  // Booking funnel state
  const [userAvailableTokens, setUserAvailableTokens] = useState(1);
  const [contractCheck, setContractCheck] = useState(false);
  const [contractSig, setContractSig] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [refLink, setRefLink] = useState('');
  const [targetBpm, setTargetBpm] = useState('');
  const [isBookingSubmitted, setIsBookingSubmitted] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(state.profile.name || 'Voodoo Boomin');
  const [editBio, setEditBio] = useState(state.profile.bio || '');
  const [editTagline, setEditTagline] = useState(state.profile.tagline || 'Multi-Platinum Trap & Dark 808 Architect');
  const [editAvatarUrl, setEditAvatarUrl] = useState(state.profile.avatarUrl || '');
  const [editCoverUrl, setEditCoverUrl] = useState(state.profile.coverUrl || '');
  const [editLocation, setEditLocation] = useState(state.profile.location || 'Atlanta, GA / Global');
  const [editWebsite, setEditWebsite] = useState(state.profile.websiteUrl || 'https://voodooboomin.com');
  const [editPaypal, setEditPaypal] = useState(state.profile.paypalEmail || '');
  const [editSocialLinks, setEditSocialLinks] = useState<SocialLink[]>(state.profile.socialLinks || []);
  const [newPlatform, setNewPlatform] = useState('Instagram');
  const [newUrl, setNewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeEditorSection, setActiveEditorSection] = useState<'identity' | 'media' | 'socials'>('identity');

  // Device file upload refs
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when profile loads or updates
  useEffect(() => {
    setEditName(state.profile.name || 'Voodoo Boomin');
    setEditBio(state.profile.bio || '');
    setEditTagline(state.profile.tagline || 'Multi-Platinum Trap & Dark 808 Architect');
    setEditAvatarUrl(state.profile.avatarUrl || '');
    setEditCoverUrl(state.profile.coverUrl || '');
    setEditLocation(state.profile.location || 'Atlanta, GA / Global');
    setEditWebsite(state.profile.websiteUrl || 'https://voodooboomin.com');
    setEditPaypal(state.profile.paypalEmail || '');
    setEditSocialLinks(state.profile.socialLinks || []);
  }, [state.profile]);

  // Subtle telemetry pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setRpmGauge(prev => 8200 + Math.floor(Math.random() * 800));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleShareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }).catch(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    });
  };

  const handlePlayVoiceTag = () => {
    if (state.profile.voiceTagUrl) {
      const audio = new Audio(state.profile.voiceTagUrl);
      setVoiceTagPlaying(true);
      audio.onended = () => setVoiceTagPlaying(false);
      audio.onerror = () => setVoiceTagPlaying(false);
      audio.play().catch(() => setVoiceTagPlaying(false));
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Voodoo Boomin on the track. Official Ferrari Hypercar Producer Profile.");
        utterance.rate = 1.05;
        utterance.pitch = 0.85;
        utterance.onstart = () => setVoiceTagPlaying(true);
        utterance.onend = () => setVoiceTagPlaying(false);
        utterance.onerror = () => setVoiceTagPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Device File Upload Handlers (Avatar & Cover)
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditCoverUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Social link editor actions
  const handleAddSocialLink = (platformToAdd = newPlatform, urlToAdd = newUrl) => {
    if (!urlToAdd.trim()) return;
    const newLink: SocialLink = {
      id: `social_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      platform: platformToAdd,
      url: urlToAdd.trim()
    };
    setEditSocialLinks(prev => [...prev, newLink]);
    setNewUrl('');
  };

  const handleQuickAddPlatform = (platform: typeof AVAILABLE_PLATFORMS[0]) => {
    // Check if platform already exists
    const exists = editSocialLinks.some(l => l.platform.toLowerCase() === platform.label.toLowerCase());
    if (exists) {
      alert(`${platform.label} is already in your channels list.`);
      return;
    }
    const newLink: SocialLink = {
      id: `social_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      platform: platform.label,
      url: platform.placeholder
    };
    setEditSocialLinks(prev => [...prev, newLink]);
  };

  const handleRemoveSocialLink = (id: string) => {
    setEditSocialLinks(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdateSocialUrl = (id: string, url: string) => {
    setEditSocialLinks(prev => prev.map(l => l.id === id ? { ...l, url } : l));
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const updatedProfile = {
        name: editName.trim() || 'Voodoo Boomin',
        bio: editBio.trim(),
        tagline: editTagline.trim(),
        avatarUrl: editAvatarUrl.trim(),
        coverUrl: editCoverUrl.trim(),
        location: editLocation.trim(),
        websiteUrl: editWebsite.trim(),
        paypalEmail: editPaypal.trim(),
        socialLinks: editSocialLinks,
        verified: true
      };

      await updateProfile(updatedProfile);

      // Save to localStorage backups
      localStorage.setItem('VOODOO_BOOMIN_DISPLAY_NAME', updatedProfile.name);
      localStorage.setItem('VOODOO_BOOMIN_BIO', updatedProfile.bio);
      localStorage.setItem('VOODOO_BOOMIN_IMAGE_URL', updatedProfile.avatarUrl);
      localStorage.setItem('VOODOO_BOOMIN_PERSONAL_PAYPAL', updatedProfile.paypalEmail);

      localStorage.setItem('KRYPSIDE_DISPLAY_NAME', updatedProfile.name);
      localStorage.setItem('KRYPSIDE_BIO', updatedProfile.bio);
      localStorage.setItem('KRYPSIDE_IMAGE_URL', updatedProfile.avatarUrl);
      localStorage.setItem('KRYPSIDE_PERSONAL_PAYPAL', updatedProfile.paypalEmail);

      window.dispatchEvent(new Event('VOODOO_BOOMIN_PROFILE_UPDATE'));
      window.dispatchEvent(new Event('KRYPSIDE_PROFILE_UPDATE'));

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditModalOpen(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectBookingSubmit = () => {
    const signatureText = contractSig.trim();
    if (!contractCheck || signatureText.length < 3) {
      alert("Please accept the agreement checkbox and provide your signature.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clientEmail || !emailRegex.test(clientEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    incrementAnalytics('totalShares');
    setIsBookingSubmitted(true);
    setUserAvailableTokens(0);
  };

  const publicBeats = state.beats.filter(b => b.visibility === 'Public');
  const publicPacks = state.beatPacks.filter(p => p.visibility === 'Public');

  const totalPlays = state.beats.reduce((acc, b) => acc + (b.plays || 0), 0);
  const totalDownloads = state.beats.reduce((acc, b) => acc + (b.downloads || 0), 0);

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-red-600 selection:text-white pb-28 font-sans overflow-x-hidden">
      
      {/* 🏎️ SUPERCAR SHINE & CARBON FIBER TEXTURE OVERLAYS */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(#262630_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-red-600/10 via-purple-600/10 to-transparent blur-[160px] pointer-events-none -z-0" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-yellow-500/10 via-amber-600/5 to-transparent blur-[160px] pointer-events-none -z-0" />

      {/* 🚀 TOAST NOTIFICATION */}
      {copiedToast && (
        <div className="fixed bottom-24 right-6 z-50 bg-gradient-to-r from-red-600 to-amber-500 text-black px-6 py-3.5 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center gap-2.5 text-xs font-black tracking-widest uppercase animate-in fade-in slide-in-from-bottom-4 duration-200 border border-yellow-300">
          <Check size={18} className="stroke-[3]" />
          <span>Official Hypercar Profile Copied!</span>
        </div>
      )}

      {/* 🏁 1. HYPERCAR COCKPIT BANNER / COVER AREA (FERRARI x LAMBORGHINI HIGH-GLOSS FINISH) */}
      <div className="relative w-full overflow-hidden bg-neutral-950 z-10">
        
        {/* Aerodynamic Chamfered Frame */}
        <div className="relative h-72 sm:h-88 md:h-[440px] lg:h-[480px] w-full bg-[#0a0a0f] overflow-hidden border-b-2 border-red-600/30">
          
          {/* Main Hero Cover Image with Specular Glint */}
          {state.profile.coverUrl ? (
            <img 
              src={state.profile.coverUrl} 
              alt="Voodoo Boomin Banner" 
              className="w-full h-full object-cover object-center filter brightness-95 transform scale-100 hover:scale-105 transition-transform duration-1000"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-neutral-950 via-red-950/40 to-neutral-950 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />
              <div className="text-center space-y-2 opacity-60">
                <Disc className="w-16 h-16 text-red-500 animate-spin mx-auto" style={{ animationDuration: '12s' }} />
                <span className="font-mono text-xs tracking-widest uppercase text-red-400">VOODOO HYPERCAR AUDIO SYSTEMS</span>
              </div>
            </div>
          )}

          {/* Supercar Multi-Layer Reflections & Carbon Fiber Grille */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-transparent to-black/90 pointer-events-none" />
          
          {/* Top Chrome Lightbar Reflection */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-amber-400 opacity-80" />

          {/* Top-Right Cockpit Control Actions */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-8 flex items-center gap-3 z-20">
            
            {/* Quick Upload from Device Shortcut in Banner */}
            <button
              onClick={() => coverFileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-black/70 hover:bg-neutral-900 text-yellow-400 hover:text-yellow-300 backdrop-blur-md border border-yellow-500/30 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xl hover:scale-105 active:scale-95"
              title="Upload New Banner Image From Device"
            >
              <Camera size={14} />
              <span className="hidden sm:inline">Change Cover</span>
            </button>
            <input 
              type="file" 
              ref={coverFileInputRef} 
              onChange={handleCoverFileUpload} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Extravagant Edit Profile Modal Trigger */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:shadow-[0_0_35px_rgba(245,158,11,0.8)] transition-all hover:scale-105 active:scale-95 border border-yellow-200"
              title="Launch Extravagant Profile Editor"
            >
              <Sparkles size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
              <span>Edit Profile</span>
            </button>

            {/* Share Profile */}
            <button
              onClick={handleShareProfile}
              className="p-2.5 rounded-xl bg-black/70 hover:bg-neutral-900 text-white backdrop-blur-md border border-white/10 transition-all shadow-xl hover:scale-105 active:scale-95"
              title="Share Official Producer Link"
            >
              <Share2 size={16} />
            </button>
          </div>

          {/* Hypercar Telemetry HUD Badge in Banner */}
          <div className="absolute bottom-6 right-8 hidden lg:flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-black/80 border border-red-500/40 backdrop-blur-xl shadow-2xl text-xs font-mono">
            <div className="flex items-center gap-2 text-red-400">
              <Zap size={14} className="text-yellow-400 animate-pulse" />
              <span className="font-bold">LAUNCH CONTROL: ACTIVE</span>
            </div>
            <div className="w-[1px] h-4 bg-neutral-700" />
            <div className="flex items-center gap-2 text-yellow-400">
              <Gauge size={14} />
              <span>RPM: {rpmGauge.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* 🏎️ 2. EXTAVAGANT CENTERPIECE AVATAR & PRODUCER COCKPIT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-24 sm:-mt-32 md:-mt-36 pb-10 border-b border-neutral-800">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              
              {/* Left Column: Centerpiece Supercar Avatar + Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 text-center sm:text-left">
                
                {/* 🏎️ High-Gloss Carbon & Gold Chamfered Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-[28px] p-2 bg-gradient-to-br from-red-600 via-amber-500 to-purple-600 shadow-[0_10px_50px_rgba(239,68,68,0.4)] overflow-hidden relative border-2 border-yellow-400/80">
                    
                    {/* Glass Glint Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none z-10" />
                    
                    <div className="w-full h-full rounded-[20px] overflow-hidden bg-black flex items-center justify-center relative">
                      {state.profile.avatarUrl ? (
                        <img 
                          src={state.profile.avatarUrl} 
                          alt={state.profile.name || "Voodoo Boomin"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-red-950 flex flex-col items-center justify-center">
                          <Crown className="w-10 h-10 text-yellow-400 mb-1" />
                          <span className="text-3xl font-black text-white italic">
                            {(state.profile.name || 'VB').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Device Avatar Upload Overlay on Hover/Tap */}
                      <button
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity duration-300 z-20 text-yellow-400"
                        title="Upload New Profile Picture from Device"
                      >
                        <Camera size={24} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">Upload Photo</span>
                      </button>
                      <input 
                        type="file" 
                        ref={avatarFileInputRef} 
                        onChange={handleAvatarFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                  </div>

                  {/* Holographic Verified Hypercar Badge */}
                  <div className="absolute -bottom-2 -right-2 p-2.5 bg-gradient-to-br from-black to-neutral-900 rounded-2xl border-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)] flex items-center justify-center" title="Ferrari x Lamborghini Class Master Producer">
                    <Crown size={20} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                  </div>
                </div>

                {/* Name, Verified Status & Location */}
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-red-400 drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)]">
                      {state.profile.name || "Voodoo Boomin"}
                    </h1>
                    <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-600/20 to-amber-500/20 border border-yellow-400/50 text-yellow-300 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      <Flame size={14} className="text-red-500 animate-bounce" />
                      V12 Certified Producer
                    </span>
                  </div>

                  <p className="text-base sm:text-lg font-bold text-neutral-200 tracking-wide">
                    {state.profile.tagline || "Multi-Platinum Trap & Dark 808 Architect"}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-mono pt-1">
                    {state.profile.location && (
                      <span className="flex items-center gap-1.5 text-neutral-300 font-bold">
                        <MapPin size={14} className="text-red-500" />
                        {state.profile.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      24/7 INSTANT WAV / STEM DISPATCH
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Column: Key Action Controls */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start md:justify-end gap-3 shrink-0">
                <button
                  onClick={handlePlayVoiceTag}
                  className={`px-5 py-3.5 rounded-2xl border text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-xl ${
                    voiceTagPlaying 
                      ? 'bg-gradient-to-r from-red-600 to-amber-500 border-yellow-300 text-black animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.7)]' 
                      : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-neutral-200 hover:border-red-500/50 hover:text-white'
                  }`}
                  title="Rev Engine / Audition Voice Tag"
                >
                  <Volume2 size={16} className={voiceTagPlaying ? "text-black" : "text-red-500"} />
                  <span>{voiceTagPlaying ? "REV ENGINE ACTIVE..." : "REV VOICE TAG"}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('booking');
                    const bookingSection = document.getElementById('producer-content-section');
                    bookingSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.8)] transition-all hover:scale-105 active:scale-95 border border-yellow-200"
                >
                  <Send size={15} className="stroke-[3]" />
                  <span>Book Custom Beat</span>
                </button>
              </div>

            </div>

            {/* Producer Bio Narrative */}
            <div className="mt-6 max-w-4xl bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800/80 backdrop-blur-sm">
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-normal">
                {state.profile.bio || "Multi-platinum certified trap, drill & cinematic music producer. Architect behind the hardest dark 808s, hypnotic melodies, and custom sound design."}
              </p>
            </div>

            {/* 🌐 3. GLOSS-CHROME SOCIAL MEDIA MATRIX */}
            <div className="mt-8 pt-6 border-t border-neutral-800/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-yellow-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-300">
                    Official Channels & Social Matrix ({state.profile.socialLinks?.length || 0})
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveEditorSection('socials');
                    setIsEditModalOpen(true);
                  }}
                  className="text-xs font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                  <Edit3 size={13} />
                  <span>Manage Channels</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {state.profile.socialLinks && state.profile.socialLinks.length > 0 ? (
                  state.profile.socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={getCleanHref(link.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-neutral-900 to-neutral-950 hover:from-neutral-850 hover:to-neutral-900 border border-neutral-800 hover:border-yellow-400/60 text-xs font-bold text-neutral-200 hover:text-white flex items-center gap-2.5 transition-all group shadow-md hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                    >
                      {getSocialIcon(link.platform, 16)}
                      <span className="tracking-wide">{link.platform}</span>
                      <ExternalLink size={12} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
                    </a>
                  ))
                ) : (
                  <div className="w-full py-4 text-center bg-neutral-900/40 rounded-xl border border-dashed border-neutral-800 text-xs text-neutral-400 flex items-center justify-center gap-2">
                    <span>No social channels connected yet.</span>
                    <button
                      onClick={() => {
                        setActiveEditorSection('socials');
                        setIsEditModalOpen(true);
                      }}
                      className="text-yellow-400 font-bold underline"
                    >
                      Add Links Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 📊 4. HYPERCAR TELEMETRY STATS DISPLAY */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              
              <div className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-5 rounded-2xl border border-red-500/30 text-center relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 inset-x-0 h-1 bg-red-500 group-hover:h-1.5 transition-all" />
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-red-400 block mb-1">Catalog Beats</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">{publicBeats.length}</span>
                <span className="text-[9px] font-mono text-neutral-500 block mt-1">PRO-CLEARED</span>
              </div>

              <div className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-5 rounded-2xl border border-yellow-500/30 text-center relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 inset-x-0 h-1 bg-yellow-400 group-hover:h-1.5 transition-all" />
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-yellow-400 block mb-1">Master Packs</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">{publicPacks.length}</span>
                <span className="text-[9px] font-mono text-neutral-500 block mt-1">FULL STEM VAULTS</span>
              </div>

              <div className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-5 rounded-2xl border border-purple-500/30 text-center relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 inset-x-0 h-1 bg-purple-500 group-hover:h-1.5 transition-all" />
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-purple-400 block mb-1">Global Plays</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">{totalPlays.toLocaleString()}</span>
                <span className="text-[9px] font-mono text-neutral-500 block mt-1">CERTIFIED STREAMS</span>
              </div>

              <div className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-5 rounded-2xl border border-emerald-500/30 text-center relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 group-hover:h-1.5 transition-all" />
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 block mb-1">Licenses Sold</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">{totalDownloads.toLocaleString()}</span>
                <span className="text-[9px] font-mono text-neutral-500 block mt-1">EXCLUSIVE UNLOCKS</span>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* 🏁 5. PRODUCER CONTENT TABS & SHOWCASE */}
      <div id="producer-content-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Supercar Cockpit Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-5 overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-2 p-1.5 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-xl">
            <button
              onClick={() => setActiveTab('beats')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'beats'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Disc size={15} />
              <span>Beats Catalog ({publicBeats.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('packs')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'packs'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Package size={15} />
              <span>Beat Packs ({publicPacks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'booking'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={15} />
              <span>Custom Arrangement</span>
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'specs'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders size={15} />
              <span>Cockpit Specs</span>
            </button>
          </div>
        </div>

        {/* TAB 1: BEATS SHOWCASE */}
        {activeTab === 'beats' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-2.5">
                <Flame className="text-red-500 animate-pulse" size={24} />
                <span>Featured Instrumentals & Leases</span>
              </h2>
              <span className="text-xs font-mono text-yellow-400 font-bold uppercase">
                {publicBeats.length} Master Audio Tracks Ready
              </span>
            </div>

            {publicBeats.length === 0 ? (
              <div className="text-center py-16 px-4 bg-neutral-900/40 rounded-2xl border border-dashed border-neutral-800">
                <Disc className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">No Beats in Catalog</h3>
                <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">
                  New instrumentals and master audio tracks will appear here once uploaded.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicBeats.map((beat) => {
                  const isCurrentPlaying = isPlaying && currentTrack?.id === beat.id;
                  return (
                    <div
                      key={beat.id}
                      className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800 hover:border-red-500/50 rounded-2xl p-5 transition-all duration-300 group flex flex-col justify-between shadow-xl hover:shadow-[0_10px_30px_rgba(239,68,68,0.2)]"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="relative w-22 h-22 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800 group-hover:border-red-500/40 transition-colors">
                          <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <button
                            onClick={() => {
                              if (isCurrentPlaying) {
                                togglePlay();
                              } else {
                                playTrack(beat);
                              }
                            }}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10"
                          >
                            {isCurrentPlaying ? (
                              <Pause size={28} className="text-yellow-400 fill-current" />
                            ) : (
                              <Play size={28} className="text-yellow-400 fill-current ml-1" />
                            )}
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-black text-white truncate tracking-tight group-hover:text-yellow-300 transition-colors">
                            {beat.title}
                          </h3>
                          <p className="text-xs text-red-400 font-mono font-bold mt-1">
                            {beat.bpm} BPM • {beat.key}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {beat.tags?.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="text-[9px] uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono font-bold">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-lg font-black text-white font-mono">
                          ${(beat.price || 29.99).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => addToCart(beat)}
                            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-black uppercase flex items-center gap-1.5 transition-colors"
                          >
                            <ShoppingCart size={14} />
                            <span>Cart</span>
                          </button>
                          <button
                            onClick={() => setCheckoutBeat(beat)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-black text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-md hover:scale-105"
                          >
                            <span>Lease</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BEAT PACKS SHOWCASE */}
        {activeTab === 'packs' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-2.5">
                <Package className="text-yellow-400" size={24} />
                <span>Curated Producer Beat Packs & Stems</span>
              </h2>
            </div>

            {publicPacks.length === 0 ? (
              <div className="text-center py-16 px-4 bg-neutral-900/40 rounded-2xl border border-dashed border-neutral-800">
                <Package className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">No Beat Packs Available</h3>
                <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">
                  Curated sound packs and stem vaults will appear here once published.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicPacks.map((pack) => {
                  const isCurrentPackPlaying = isPlaying && currentPackId === pack.id;
                  return (
                    <div 
                      key={pack.id}
                      className="p-6 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800 hover:border-yellow-400/50 transition-all flex flex-col justify-between shadow-xl"
                    >
                      <div>
                        <div className="flex gap-4 items-start">
                          <div className="relative w-26 h-26 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-yellow-500/40">
                            <img src={pack.coverArtUrl} alt={pack.title} className="w-full h-full object-cover" />
                            <button
                              onClick={() => {
                                if (isCurrentPackPlaying) {
                                  togglePlay();
                                } else {
                                  playPack(pack, 1);
                                }
                              }}
                              className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                            >
                              {isCurrentPackPlaying ? <Pause size={28} className="text-yellow-400 fill-current" /> : <Play size={28} className="text-yellow-400 fill-current ml-1" />}
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-mono">
                              {pack.tracks?.length || 0} TRACK VAULT
                            </span>
                            <h3 className="text-base font-black text-white truncate mt-1.5">
                              {pack.title}
                            </h3>
                            <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                              {pack.description || 'Full master pack with stems, midis, and unlimited license clearance.'}
                            </p>
                          </div>
                        </div>

                        {/* Track preview list */}
                        {pack.tracks && (
                          <div className="mt-4 pt-3 border-t border-neutral-800 space-y-1.5">
                            {pack.tracks.slice(0, 3).map((tr) => (
                              <div 
                                key={tr.trackNumber}
                                onClick={() => playPackTrack(pack, tr)}
                                className="flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors font-mono"
                              >
                                <span className="truncate">#{tr.trackNumber} {tr.title}</span>
                                <Play size={12} className="text-yellow-400" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between">
                        <span className="text-xl font-black text-yellow-400 font-mono">
                          ${pack.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => playPack(pack, 1)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-black font-black text-xs uppercase tracking-wider hover:scale-105 transition-transform"
                        >
                          Audition Pack
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOM BOOKING & COLLAB FUNNEL */}
        {activeTab === 'booking' && (
          <div className="mt-8 max-w-3xl mx-auto bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-black uppercase tracking-widest">
                Direct Master Producer Pipeline
              </span>
              <h2 className="text-3xl font-black uppercase italic tracking-tight text-white mt-3">
                Book Custom Production
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2">
                Secure bespoke beats, tailored melody loops, or audio stems directly from Voodoo Boomin.
              </p>
            </div>

            {isBookingSubmitted ? (
              <div className="text-center py-10 bg-black/60 rounded-2xl border border-emerald-500/40 p-8 shadow-2xl">
                <CheckCircle2 size={56} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white uppercase italic">Custom Request Cleared!</h3>
                <p className="text-xs text-neutral-300 mt-2 max-w-md mx-auto">
                  Your project specifications and legal agreement have been logged. Voodoo Boomin will reach out directly via your email.
                </p>
                <button
                  onClick={() => setIsBookingSubmitted(false)}
                  className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-black font-black text-xs uppercase tracking-wider"
                >
                  Submit Another Project
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-300 mb-2">
                    Your Direct Contact Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="artist@example.com"
                    className="w-full px-4 py-3.5 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-300 mb-2">
                      Target BPM
                    </label>
                    <input
                      type="number"
                      value={targetBpm}
                      onChange={(e) => setTargetBpm(e.target.value)}
                      placeholder="e.g. 140"
                      className="w-full px-4 py-3.5 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-yellow-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-300 mb-2">
                      Reference Track URL
                    </label>
                    <input
                      type="url"
                      value={refLink}
                      onChange={(e) => setRefLink(e.target.value)}
                      placeholder="YouTube / Spotify link"
                      className="w-full px-4 py-3.5 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-300 mb-2">
                    Production Direction & Details
                  </label>
                  <textarea
                    rows={4}
                    value={projectNotes}
                    onChange={(e) => setProjectNotes(e.target.value)}
                    placeholder="Describe your 808 glide style, tempo changes, vocal drops, and mood..."
                    className="w-full px-4 py-3.5 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-yellow-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Mandatory Agreement Box */}
                <div className="p-5 rounded-2xl bg-black border border-neutral-800">
                  <div className="text-[11px] font-mono text-neutral-400 space-y-2 mb-4 max-h-24 overflow-y-auto">
                    <p><strong>PRODUCTION CONFIDENTIALITY CLAUSE:</strong> Delivered custom audio tracks remain exclusive to client licensing agreements. Leaking or distributing source files is strictly prohibited.</p>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-neutral-200">
                    <input
                      type="checkbox"
                      checked={contractCheck}
                      onChange={(e) => setContractCheck(e.target.checked)}
                      className="mt-0.5 accent-red-600"
                    />
                    <span>I agree to project confidentiality terms and authorize production review.</span>
                  </label>
                  <input
                    type="text"
                    value={contractSig}
                    onChange={(e) => setContractSig(e.target.value)}
                    placeholder="Type Full Legal Name as Electronic Signature"
                    className="mt-3.5 w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDirectBookingSubmit}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 hover:from-red-500 hover:to-yellow-300 text-black font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all hover:scale-[1.01]"
                >
                  Submit Production Order
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SPECS & HARDWARE */}
        {activeTab === 'specs' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2.5">
                <Sliders size={20} className="text-red-500" />
                <span>Ferrari-Spec Audio Cockpit</span>
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Tuned for surgical high-end clarity, seismic 808 sub-bass, and pristine translation across club sound systems and streaming apps.
              </p>
              <ul className="space-y-3 text-xs text-neutral-300 font-mono">
                <li className="flex items-center justify-between p-3 rounded-xl bg-black border border-neutral-850">
                  <span className="text-neutral-500">Main Engine:</span>
                  <span className="text-yellow-400 font-bold">FL Studio 24 / Pro Tools HD</span>
                </li>
                <li className="flex items-center justify-between p-3 rounded-xl bg-black border border-neutral-850">
                  <span className="text-neutral-500">Analog Gear:</span>
                  <span className="text-yellow-400 font-bold">Moog Sub 37, Roland Juno-106</span>
                </li>
                <li className="flex items-center justify-between p-3 rounded-xl bg-black border border-neutral-850">
                  <span className="text-neutral-500">Monitors:</span>
                  <span className="text-yellow-400 font-bold">Genelec 8351B & Yamaha NS-10M</span>
                </li>
                <li className="flex items-center justify-between p-3 rounded-xl bg-black border border-neutral-850">
                  <span className="text-neutral-500">Mastering Chain:</span>
                  <span className="text-yellow-400 font-bold">FabFilter Pro-L2, UAD Manley, Soundtoys</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2.5">
                <ShieldCheck size={20} className="text-emerald-400" />
                <span>Publishing & Master Clearances</span>
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                All production tracks include verified PRO registration credentials, 32-bit floating WAV master stems, and worldwide sync licensing clearance.
              </p>
              <div className="p-5 rounded-2xl bg-black border border-yellow-500/30 text-xs text-neutral-300 space-y-2.5">
                <p className="font-bold text-yellow-300">✓ 100% Royalty-Free on All Lease Tiers</p>
                <p className="font-bold text-yellow-300">✓ Instant Untagged Stem Delivery</p>
                <p className="font-bold text-yellow-300">✓ Global ASCAP & BMI Songwriter Credits Cleared</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 🏁 6. HYPERCAR EXTRAVAGANT "EDIT PROFILE" COCKPIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#111116] to-[#0a0a0f] border-2 border-yellow-400/80 rounded-3xl shadow-[0_0_60px_rgba(239,68,68,0.4)] p-6 sm:p-8 my-8 text-white max-h-[92vh] overflow-y-auto">
            
            {/* Modal Ambient Glow Top */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-yellow-400 to-amber-500 rounded-t-3xl" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500 text-[10px] font-black uppercase tracking-widest text-red-300">
                    V12 Hypercar Suite
                  </span>
                  <Crown size={16} className="text-yellow-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-white mt-1">
                  Extravagant Profile Cockpit
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Customize your supercar profile photos from your device and configure all your social media links.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2.5 rounded-2xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border border-neutral-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Sections */}
            <div className="flex items-center gap-2 my-5 p-1 bg-black rounded-2xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveEditorSection('identity')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeEditorSection === 'identity'
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Crown size={14} />
                <span>1. Artist Identity</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorSection('media')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeEditorSection === 'media'
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Camera size={14} />
                <span>2. Photos & Artwork</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorSection('socials')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeEditorSection === 'socials'
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Globe size={14} />
                <span>3. Social Channels ({editSocialLinks.length})</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* SECTION 1: ARTIST IDENTITY */}
              {activeEditorSection === 'identity' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-neutral-300 mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                        placeholder="Voodoo Boomin"
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-neutral-300 mb-1.5">
                        Tagline / Title
                      </label>
                      <input
                        type="text"
                        value={editTagline}
                        onChange={(e) => setEditTagline(e.target.value)}
                        placeholder="Multi-Platinum Trap & Dark 808 Architect"
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-300 mb-1.5">
                      Bio Narrative & Producer Ethos
                    </label>
                    <textarea
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell artists and fans about your sound design, track records, and studio vibe..."
                      className="w-full px-4 py-3.5 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-yellow-400 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-neutral-300 mb-1.5">
                        Location / Studio Base
                      </label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="Atlanta, GA / Global"
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-neutral-300 mb-1.5">
                        Merchant PayPal Email (For Instant Payouts)
                      </label>
                      <input
                        type="email"
                        value={editPaypal}
                        onChange={(e) => setEditPaypal(e.target.value)}
                        placeholder="voodooboomin@gmail.com"
                        className="w-full px-4 py-3.5 rounded-xl bg-black border border-neutral-800 text-white text-sm focus:border-yellow-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: PHOTOS & ARTWORK (UPLOAD FROM DEVICE & URLS) */}
              {activeEditorSection === 'media' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  
                  {/* Avatar Upload Block */}
                  <div className="p-5 rounded-2xl bg-black/90 border border-neutral-800 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center gap-2">
                        <Camera size={15} />
                        <span>Profile Picture (Avatar)</span>
                      </label>
                      <span className="text-[10px] text-neutral-500 uppercase font-mono">Direct Device Upload</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* Avatar Live Preview */}
                      <div className="relative group">
                        <div className="w-28 h-28 rounded-2xl p-1 bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 shrink-0 overflow-hidden shadow-2xl border border-yellow-300">
                          <div className="w-full h-full rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center">
                            {editAvatarUrl ? (
                              <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center p-2">
                                <UserIcon className="w-8 h-8 text-neutral-600 mx-auto mb-1" />
                                <span className="text-[10px] font-black text-neutral-500 uppercase">No Photo</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {editAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => setEditAvatarUrl('')}
                            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                            title="Remove Profile Picture"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 w-full space-y-3">
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => avatarFileInputRef.current?.click()}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 transition-all border border-yellow-300"
                          >
                            <Upload size={14} className="stroke-[2.5]" />
                            <span>Select Photo From Device</span>
                          </button>
                          <input
                            type="file"
                            ref={avatarFileInputRef}
                            onChange={handleAvatarFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>

                        {/* Or Paste URL */}
                        <div>
                          <input
                            type="url"
                            value={editAvatarUrl}
                            onChange={(e) => setEditAvatarUrl(e.target.value)}
                            placeholder="Or enter direct photo URL..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-yellow-400 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cover Banner Upload Block */}
                  <div className="p-5 rounded-2xl bg-black/90 border border-neutral-800 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center gap-2">
                        <Layers size={15} />
                        <span>Hero Banner / Cover Photo</span>
                      </label>
                      <span className="text-[10px] text-neutral-500 uppercase font-mono">16:9 Supercar Header</span>
                    </div>

                    {/* Cover Live Preview */}
                    <div className="w-full h-36 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 relative shadow-inner">
                      {editCoverUrl ? (
                        <img src={editCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-xs text-neutral-500 gap-1">
                          <Layers className="w-6 h-6 text-neutral-700" />
                          <span>No cover banner loaded</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      {editCoverUrl && (
                        <button
                          type="button"
                          onClick={() => setEditCoverUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                          title="Remove Banner Photo"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Cover Upload Controls */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 transition-all border border-yellow-300"
                        >
                          <Upload size={14} className="stroke-[2.5]" />
                          <span>Select Banner From Device</span>
                        </button>
                        <input
                          type="file"
                          ref={coverFileInputRef}
                          onChange={handleCoverFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      <input
                        type="url"
                        value={editCoverUrl}
                        onChange={(e) => setEditCoverUrl(e.target.value)}
                        placeholder="Or enter direct banner image URL..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-yellow-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* SECTION 3: SOCIAL MEDIA CHANNELS STUDIO (ADD / EDIT / DELETE) */}
              {activeEditorSection === 'socials' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  
                  {/* Quick One-Click Add Presets */}
                  <div className="p-4 rounded-2xl bg-black border border-neutral-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2.5">
                      ⚡ Quick-Add Platform Shortcuts:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_PLATFORMS.map((platform) => (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => handleQuickAddPlatform(platform)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-yellow-400/50 text-xs font-bold text-neutral-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Plus size={12} className="text-yellow-400" />
                          <span>{platform.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Social Media Channels List */}
                  <div className="p-5 rounded-2xl bg-black border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
                      <span className="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center gap-2">
                        <Globe size={14} />
                        <span>Active Channels ({editSocialLinks.length})</span>
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Edit URLs or delete below
                      </span>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {editSocialLinks.map((link) => (
                        <div 
                          key={link.id} 
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
                        >
                          {/* Platform Badge */}
                          <div className="flex items-center gap-2 sm:w-36 shrink-0 font-black text-xs text-neutral-200">
                            {getSocialIcon(link.platform, 16)}
                            <span className="truncate">{link.platform}</span>
                          </div>

                          {/* Editable URL Input */}
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => handleUpdateSocialUrl(link.id, e.target.value)}
                            placeholder="https://..."
                            className="flex-1 px-3 py-2 rounded-lg bg-black border border-neutral-800 text-xs text-white focus:border-yellow-400 focus:outline-none font-mono"
                          />

                          {/* Actions: Test & Delete */}
                          <div className="flex items-center gap-1 shrink-0 justify-end">
                            <a
                              href={getCleanHref(link.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-yellow-400 transition-colors"
                              title="Test Link in New Tab"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialLink(link.id)}
                              className="p-2 rounded-lg bg-neutral-800 hover:bg-red-950/80 text-neutral-400 hover:text-red-400 transition-colors"
                              title="Delete Link"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {editSocialLinks.length === 0 && (
                        <div className="text-center py-6 text-xs text-neutral-500 italic">
                          No social channels added yet. Tap any platform shortcut above or add a custom link below!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Custom Social Link Box */}
                  <div className="p-4 rounded-2xl bg-black border border-neutral-800 space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-300 block">
                      + Add New Channel Link:
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={newPlatform}
                        onChange={(e) => setNewPlatform(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-white focus:border-yellow-400 focus:outline-none shrink-0"
                      >
                        {AVAILABLE_PLATFORMS.map(p => (
                          <option key={p.id} value={p.label}>{p.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:border-yellow-400 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSocialLink()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 shadow-md hover:scale-105 transition-transform"
                      >
                        <Plus size={14} className="stroke-[3]" />
                        <span>Add Link</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Bottom Sticky Action Bar */}
              <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Sparkles size={14} className="text-yellow-400" />
                  <span>Changes automatically synchronize with all pages & store headers.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveProfile()}
                    disabled={isSaving}
                    className={`flex-1 sm:flex-initial px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all ${
                      saveSuccess
                        ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                        : 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-black hover:scale-105'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <Check size={18} className="stroke-[3]" />
                        <span>Profile Saved Live!</span>
                      </>
                    ) : (
                      <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 💳 CHECKOUT & DOWNLOAD MODALS */}
      {checkoutBeat && (
        <CheckoutErrorBoundary
          componentName="ProfileCheckoutModal"
          onDismiss={() => setCheckoutBeat(null)}
        >
          <CheckoutModal
            beat={checkoutBeat}
            onClose={() => setCheckoutBeat(null)}
          />
        </CheckoutErrorBoundary>
      )}

      {downloadModalBeat && (
        <SubscribeDownloadModal
          isOpen={true}
          onClose={() => setDownloadModalBeat(null)}
          beat={downloadModalBeat}
          onSuccess={(beat) => {
            if (beat.audioUrl) {
              const a = document.createElement('a');
              a.href = beat.audioUrl;
              a.download = `${beat.title || 'beat'}.mp3`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            setDownloadModalBeat(null);
          }}
        />
      )}

    </div>
  );
}
