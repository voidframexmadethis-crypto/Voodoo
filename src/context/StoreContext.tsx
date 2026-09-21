import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  Beat, 
  Profile, 
  StoreState, 
  YouTubeVideo, 
  Analytics, 
  CartItem, 
  BeatPack, 
  Promotion, 
  DetectedUse, 
  UsageNotification, 
  RightsRecord, 
  LivePerformanceRecord, 
  SyncCueRecord, 
  AuditLogEntry,
  FeedPost,
  HomepageLayout,
  HomepageSectionConfig,
  DistributorPartner,
  DistributorClickLog,
  MusicProfessional,
  ServicesConfig,
  Announcement,
  VaultConfig
} from '../types';
import { useAuth } from './AuthContext';
import { filterHumanBeats } from '../lib/beatUtils';

export const DEFAULT_HOMEPAGE_LAYOUT: HomepageLayout = [
  { id: 'hero', name: 'Hero / Featured Release', enabled: true },
  { id: 'beats', name: 'Beats Catalog & Filter', enabled: true },
  { id: 'beat_packs', name: 'Beat Packs Collection', enabled: true },
  { id: 'high_performance', name: 'High-Performance Tracks', enabled: true },
  { id: 'top_tracks', name: 'Top Tracks Ranking', enabled: true },
  { id: 'feed', name: 'Voodoo Boomin Feed', enabled: true },
  { id: 'services', name: 'Music Professionals Directory', enabled: true },
  { id: 'profile', name: 'Producer Profile & Socials', enabled: true },
];

interface StoreContextType {
  state: StoreState;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  addVideo: (video: YouTubeVideo) => void;
  removeVideo: (id: string) => void;
  addBeat: (beat: Beat) => Promise<void>;
  removeBeat: (id: string) => Promise<void>;
  restoreBeat: (id: string) => Promise<void>;
  updateBeat: (id: string, updates: Partial<Beat>) => Promise<void>;
  incrementAnalytics: (metric: keyof Analytics, amount?: number) => void;
  resetAnalytics: (metric: keyof Analytics) => void;
  
  // Feed Actions
  addFeedPost: (post: FeedPost) => void;
  updateFeedPost: (id: string, updates: Partial<FeedPost>) => void;
  deleteFeedPost: (id: string) => void;
  togglePinFeedPost: (id: string) => void;
  likeFeedPost: (id: string) => void;

  // Homepage Layout Actions
  updateHomepageLayout: (layout: HomepageLayout) => Promise<void>;
  resetHomepageLayout: () => Promise<void>;

  // Music Distribution & Services Actions
  addDistributorPartner: (distributor: DistributorPartner) => Promise<void>;
  updateDistributorPartner: (id: string, updates: Partial<DistributorPartner>) => Promise<void>;
  deleteDistributorPartner: (id: string) => Promise<void>;
  reorderDistributorPartners: (distributors: DistributorPartner[]) => Promise<void>;
  trackDistributorClick: (distributorId: string, distributorName: string, sourcePage?: string) => Promise<void>;

  // Professional Services Directory Actions
  addProfessional: (professional: MusicProfessional) => Promise<void>;
  updateProfessional: (id: string, updates: Partial<MusicProfessional>) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
  updateServicesConfig: (config: ServicesConfig) => Promise<void>;
  trackProfessionalClick: (id: string, action: 'view' | 'contact') => Promise<void>;

  // Dashboard Actions
  addBeatPack: (pack: BeatPack) => void;
  updateBeatPack: (id: string, updates: Partial<BeatPack>) => void;
  deleteBeatPack: (id: string) => void;
  addPromotion: (promo: Promotion) => void;
  updatePromotion: (id: string, updates: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  addDetectedUse: (use: DetectedUse) => void;
  updateDetectedUse: (id: string, updates: Partial<DetectedUse>) => void;
  addUsageNotification: (notif: UsageNotification) => void;
  updateUsageNotification: (id: string, status: UsageNotification['status']) => void;
  addRightsRecord: (rec: RightsRecord) => void;
  updateRightsRecord: (id: string, updates: Partial<RightsRecord>) => void;
  addLivePerformance: (rec: LivePerformanceRecord) => void;
  addSyncCue: (rec: SyncCueRecord) => void;
  logAudit: (eventType: string, description: string, beatId?: string, packId?: string, previousValue?: string, newValue?: string) => void;
  
  // Upgraded E-commerce States (PayPal Powered)
  cart: CartItem[];
  addToCart: (beat: Beat, licenseType?: string) => void;
  removeFromCart: (beatId: string) => void;
  clearCart: () => void;
  updateCartItemLicense: (beatId: string, licenseType: string) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY';
  setCurrency: (currency: 'USD' | 'EUR' | 'GBP' | 'JPY') => void;
  favorites: string[];
  toggleFavorite: (beatId: string) => void;
  recentlyViewed: string[];
  trackBeatView: (beatId: string) => void;

  // Features 27, 28, 30 Actions
  setFeaturedBeatId: (beatId: string | null) => void;
  setAnnouncement: (announcement: Announcement | null) => void;
  addBeatToVault: (beatId: string) => void;
  removeBeatFromVault: (beatId: string) => void;
  addPackToVault: (packId: string) => void;
  removePackFromVault: (packId: string) => void;
  setVaultFeaturedItem: (itemId?: string) => void;
}

const defaultState: StoreState = {
  profile: {
    name: 'Voodoo Boomin',
    bio: '',
    tagline: '',
    location: '',
    websiteUrl: '',
    avatarUrl: '',
    coverUrl: '',
    genres: [],
    verified: false,
    paypalEmail: 'voodooboomin@gmail.com',
    socialLinks: [],
  },
  videos: [],
  beats: [],
  archivedBeats: [],
  beatPacks: [],
  promotions: [],
  detectedUses: [],
  usageNotifications: [],
  rightsRecords: [],
  livePerformances: [],
  syncCueRecords: [],
  auditLog: [],
  analytics: {
    siteVisits: 0,
    uniqueVisitors: 0,
    totalPlays: 0,
    totalShares: 0,
    downloads: 0,
    totalEarnings: 0,
    platformFees: 0,
  },
  feedPosts: [],
  professionals: [],
  servicesConfig: {
    enableMusicDistribution: false,
    enableProfessionalApplications: true
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<StoreState>(() => {
    try {
      const savedBeats = localStorage.getItem('voodooboomin_beats_backup');
      const savedArchived = localStorage.getItem('voodooboomin_archived_backup');
      const savedProfile = localStorage.getItem('voodooboomin_profile_backup');
      const savedPacks = localStorage.getItem('voodooboomin_beat_packs');
      const savedPromos = localStorage.getItem('voodooboomin_promotions');
      const savedUses = localStorage.getItem('voodooboomin_detected_uses');
      const savedNotifs = localStorage.getItem('voodooboomin_usage_notifications');
      const savedRights = localStorage.getItem('voodooboomin_rights_records');
      const savedPerf = localStorage.getItem('voodooboomin_live_performances');
      const savedSync = localStorage.getItem('voodooboomin_sync_cue');
      const savedAudit = localStorage.getItem('voodooboomin_audit_log');
      const savedFeed = localStorage.getItem('voodooboomin_feed_posts');
      const savedDistributors = localStorage.getItem('voodooboomin_distributors');
      const savedClicks = localStorage.getItem('voodooboomin_distributor_clicks');
      const savedProfessionals = localStorage.getItem('voodooboomin_professionals');
      const savedServicesConfig = localStorage.getItem('voodooboomin_services_config');
      const savedFeaturedBeatId = localStorage.getItem('voodooboomin_featured_beat_id');
      const savedAnnouncement = localStorage.getItem('voodooboomin_announcement');
      const savedVaultConfig = localStorage.getItem('voodooboomin_vault_config');

      let parsedAnnouncement: Announcement | null = null;
      if (savedAnnouncement) {
        try { parsedAnnouncement = JSON.parse(savedAnnouncement); } catch {}
      }

      let parsedVaultConfig: VaultConfig = { beatIds: [], packIds: [] };
      if (savedVaultConfig) {
        try { parsedVaultConfig = JSON.parse(savedVaultConfig); } catch {}
      }

      let parsedProfile = defaultState.profile;
      if (savedProfile) {
        try {
          parsedProfile = { ...defaultState.profile, ...JSON.parse(savedProfile) };
        } catch {
          parsedProfile = defaultState.profile;
        }
      }

      const parsedBeats = savedBeats ? JSON.parse(savedBeats) : [];
      const validBeats = filterHumanBeats(parsedBeats);
      const parsedPacks = savedPacks ? JSON.parse(savedPacks) : [];
      const validPacks = parsedPacks.filter((p: any) => p && p.id !== 'VP-001' && !p.id.toLowerCase().includes('demo') && !p.id.toLowerCase().includes('sample'));
      const parsedPromos = savedPromos ? JSON.parse(savedPromos) : [];
      const validPromos = parsedPromos.filter((p: any) => p && p.id !== 'promo_holiday30' && p.id !== 'promo_bulk2v1');
      const parsedAudit = savedAudit ? JSON.parse(savedAudit) : [];
      const parsedFeed = savedFeed ? JSON.parse(savedFeed) : [];
      const parsedDistributors = savedDistributors ? JSON.parse(savedDistributors) : [];
      const parsedClicks = savedClicks ? JSON.parse(savedClicks) : [];
      const parsedProfessionals = savedProfessionals ? JSON.parse(savedProfessionals) : [];
      let parsedServicesConfig = {
        enableMusicDistribution: false,
        enableProfessionalApplications: true
      };
      if (savedServicesConfig) {
        try {
          parsedServicesConfig = { ...parsedServicesConfig, ...JSON.parse(savedServicesConfig) };
        } catch {}
      }

      const savedLayout = localStorage.getItem('voodooboomin_layout');
      let parsedLayout: HomepageLayout = DEFAULT_HOMEPAGE_LAYOUT;
      if (savedLayout) {
        try {
          const loaded = JSON.parse(savedLayout) as HomepageLayout;
          const existingIds = loaded.map((x: any) => x.id);
          const missing = DEFAULT_HOMEPAGE_LAYOUT.filter(x => !existingIds.includes(x.id));
          parsedLayout = [...loaded, ...missing];
        } catch {
          parsedLayout = DEFAULT_HOMEPAGE_LAYOUT;
        }
      }

      return {
        profile: parsedProfile,
        videos: [],
        beats: validBeats,
        archivedBeats: savedArchived ? JSON.parse(savedArchived) : [],
        beatPacks: validPacks,
        promotions: validPromos,
        detectedUses: savedUses ? JSON.parse(savedUses) : [],
        usageNotifications: savedNotifs ? JSON.parse(savedNotifs) : [],
        rightsRecords: savedRights ? JSON.parse(savedRights) : [],
        livePerformances: savedPerf ? JSON.parse(savedPerf) : [],
        syncCueRecords: savedSync ? JSON.parse(savedSync) : [],
        auditLog: parsedAudit,
        analytics: defaultState.analytics,
        feedPosts: Array.isArray(parsedFeed) ? parsedFeed : [],
        homepageLayout: parsedLayout,
        distributorPartners: Array.isArray(parsedDistributors) ? parsedDistributors : [],
        distributorClicks: Array.isArray(parsedClicks) ? parsedClicks : [],
        professionals: Array.isArray(parsedProfessionals) ? parsedProfessionals : [],
        servicesConfig: parsedServicesConfig,
        featuredBeatId: savedFeaturedBeatId || null,
        announcement: parsedAnnouncement,
        vaultConfig: parsedVaultConfig,
      };
    } catch (e) {
      return {
        ...defaultState,
        beats: [],
        beatPacks: [],
        promotions: [],
        auditLog: [],
        feedPosts: [],
        homepageLayout: DEFAULT_HOMEPAGE_LAYOUT,
        distributorPartners: [],
        distributorClicks: [],
        professionals: [],
        servicesConfig: {
          enableMusicDistribution: false,
          enableProfessionalApplications: true
        }
      };
    }
  });

  // E-commerce Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('voodooboomin_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('voodooboomin_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Feature 20: Persistent Recently Viewed Beats State
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('voodooboomin_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const trackBeatView = (beatId: string) => {
    if (!beatId) return;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== beatId);
      const updated = [beatId, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('voodooboomin_recently_viewed', JSON.stringify(updated));
      } catch (e) {
        console.error("Recently viewed save error", e);
      }
      return updated;
    });
  };

  const [promoCode, setPromoCode] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'JPY'>('USD');

  // Feature 19: Cart Revalidation and Price Synchronization with Server/Database Authoritative Catalog
  useEffect(() => {
    if (state.beats && state.beats.length > 0 && cart.length > 0) {
      let cartChanged = false;
      const updatedCart = cart.map(cartItem => {
        // Find the authoritative beat record from the live catalog
        const liveBeat = state.beats.find(b => b.id === cartItem.beat.id);
        if (!liveBeat) {
          // Beat no longer exists in authoritative catalog, remove from cart
          cartChanged = true;
          return null;
        }

        // Retrieve authoritative live price for the selected license
        let livePrice = liveBeat.price || 35.00;
        if (liveBeat.directPriceOnly) {
          livePrice = liveBeat.price || 35.00;
        } else if (liveBeat.licenses && (liveBeat.licenses as any)[cartItem.licenseType]) {
          const lic = (liveBeat.licenses as any)[cartItem.licenseType];
          if (lic.enabled && lic.price !== undefined) {
            livePrice = Number(lic.price);
          }
        }

        // If authoritative price or beat details changed, update cart item
        if (livePrice !== cartItem.price || liveBeat.title !== cartItem.beat.title) {
          cartChanged = true;
          return { ...cartItem, beat: liveBeat, price: livePrice };
        }

        return cartItem;
      }).filter((item): item is CartItem => item !== null);

      if (cartChanged) {
        setCart(updatedCart);
        try {
          localStorage.setItem('voodooboomin_cart', JSON.stringify(updatedCart));
        } catch (e) {
          console.error("Cart sync error", e);
        }
      }
    }
  }, [state.beats]);

  // Sync beats and analytics from server backend on initial load
  useEffect(() => {
    fetch('/api/beats')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch beats');
      })
      .then(data => {
        if (Array.isArray(data)) {
          const validBeats = filterHumanBeats(data);
          setState(prev => {
            const combined = [...validBeats, ...prev.beats];
            const uniqueBeats = Array.from(new Map(combined.map(item => [item.id, item])).values());
            return {
              ...prev,
              beats: uniqueBeats
            };
          });
        }
      })
      .catch(err => console.log('Loaded local beats cache.'));

    fetch('/api/analytics')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch analytics');
      })
      .then(analyticsData => {
        if (analyticsData && typeof analyticsData === 'object') {
          setState(prev => ({
            ...prev,
            analytics: {
              ...prev.analytics,
              ...analyticsData
            }
          }));
        }
      })
      .catch(() => {});

    // Sync real feed posts from server backend
    fetch('/api/feed')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch feed');
      })
      .then(feedData => {
        if (Array.isArray(feedData)) {
          setState(prev => {
            const combined = [...feedData, ...prev.feedPosts];
            const uniqueFeed = Array.from(new Map(combined.map(item => [item.id, item])).values());
            return {
              ...prev,
              feedPosts: uniqueFeed
            };
          });
        }
      })
      .catch(() => {});

    // Sync homepage layout configuration from server backend
    fetch('/api/layout')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch layout');
      })
      .then(layoutData => {
        if (Array.isArray(layoutData) && layoutData.length > 0) {
          setState(prev => ({
            ...prev,
            homepageLayout: layoutData
          }));
          localStorage.setItem('voodooboomin_layout', JSON.stringify(layoutData));
        }
      })
      .catch(() => {});

    // Sync music distribution partners from server backend
    fetch('/api/distributors')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch distributors');
      })
      .then(distData => {
        if (Array.isArray(distData)) {
          setState(prev => {
            const combined = [...distData, ...(prev.distributorPartners || [])];
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
            unique.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            return {
              ...prev,
              distributorPartners: unique
            };
          });
        }
      })
      .catch(() => {});

    // Sync distributor click logs
    fetch('/api/distributors/clicks')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch distributor clicks');
      })
      .then(clicksData => {
        if (Array.isArray(clicksData)) {
          setState(prev => ({
            ...prev,
            distributorClicks: clicksData
          }));
        }
      })
      .catch(() => {});

    // Sync professionals from server backend
    fetch('/api/professionals')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch professionals');
      })
      .then(data => {
        if (Array.isArray(data)) {
          setState(prev => {
            const combined = [...data, ...(prev.professionals || [])];
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
            return {
              ...prev,
              professionals: unique
            };
          });
        }
      })
      .catch(() => {});

    // Sync services config from server backend
    fetch('/api/services/config')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch services config');
      })
      .then(configData => {
        if (configData && typeof configData === 'object') {
          setState(prev => ({
            ...prev,
            servicesConfig: {
              ...prev.servicesConfig,
              ...configData
            }
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Sync professionals to localStorage
  useEffect(() => {
    if (state.professionals) {
      try {
        localStorage.setItem('voodooboomin_professionals', JSON.stringify(state.professionals));
      } catch (e) {
        console.error("Professionals save error", e);
      }
    }
  }, [state.professionals]);

  // Sync services config to localStorage
  useEffect(() => {
    if (state.servicesConfig) {
      try {
        localStorage.setItem('voodooboomin_services_config', JSON.stringify(state.servicesConfig));
      } catch (e) {
        console.error("Services config save error", e);
      }
    }
  }, [state.servicesConfig]);

  // Sync distributor partners to localStorage
  useEffect(() => {
    if (state.distributorPartners) {
      try {
        localStorage.setItem('voodooboomin_distributors', JSON.stringify(state.distributorPartners));
      } catch (e) {
        console.error("Distributors save error", e);
      }
    }
  }, [state.distributorPartners]);

  // Sync distributor click tracking to localStorage
  useEffect(() => {
    if (state.distributorClicks) {
      try {
        localStorage.setItem('voodooboomin_distributor_clicks', JSON.stringify(state.distributorClicks));
      } catch (e) {
        console.error("Clicks save error", e);
      }
    }
  }, [state.distributorClicks]);

  // Sync feed posts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voodooboomin_feed_posts', JSON.stringify(state.feedPosts));
    } catch (e) {
      console.error("Feed save error", e);
    }
  }, [state.feedPosts]);

  // Sync homepage layout to localStorage
  useEffect(() => {
    if (state.homepageLayout) {
      try {
        localStorage.setItem('voodooboomin_layout', JSON.stringify(state.homepageLayout));
      } catch (e) {
        console.error("Layout save error", e);
      }
    }
  }, [state.homepageLayout]);

  // Local storage synchronization
  useEffect(() => {
    try {
      localStorage.setItem('voodooboomin_cart', JSON.stringify(cart));
    } catch (e) {
      console.error("Cart save error", e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('voodooboomin_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Favorites save error", e);
    }
  }, [favorites]);

  const addToCart = (beat: Beat, licenseType: string = 'mp3Lease') => {
    let price = beat.price || 35.00;
    if (beat.directPriceOnly) {
      licenseType = 'directPrice';
      price = beat.price || 35.00;
    } else if (beat.licenses && (beat.licenses as any)[licenseType]) {
      const lic = (beat.licenses as any)[licenseType];
      if (lic.enabled && lic.price !== undefined) {
        price = Number(lic.price);
      }
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.beat.id === beat.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = { beat, licenseType, price };
        return updated;
      } else {
        return [...prev, { beat, licenseType, price }];
      }
    });
  };

  const removeFromCart = (beatId: string) => {
    setCart(prev => prev.filter(item => item.beat.id !== beatId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateCartItemLicense = (beatId: string, licenseType: string) => {
    setCart(prev => prev.map(item => {
      if (item.beat.id === beatId) {
        let price = item.beat.price || 29.99;
        if (item.beat.licenses && (item.beat.licenses as any)[licenseType]) {
          const lic = (item.beat.licenses as any)[licenseType];
          if (lic.enabled && lic.price !== undefined) {
            price = Number(lic.price);
          }
        }
        return { ...item, licenseType, price };
      }
      return item;
    }));
  };

  const toggleFavorite = (beatId: string) => {
    setFavorites(prev => {
      if (prev.includes(beatId)) {
        return prev.filter(id => id !== beatId);
      } else {
        return [...prev, beatId];
      }
    });
  };

  const incrementAnalytics = (metric: keyof Analytics, amount: number = 1) => {
    setState(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        [metric]: (prev.analytics[metric] || 0) + amount
      }
    }));

    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, amount })
    }).catch(() => {});
  };

  const resetAnalytics = (metric: keyof Analytics) => {
    setState(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        [metric]: 0
      }
    }));
  };

  // Save to localStorage whenever store state changes
  useEffect(() => {
    try {
      const validBeats = filterHumanBeats(state.beats);
      localStorage.setItem('voodooboomin_beats_backup', JSON.stringify(validBeats));
      localStorage.setItem('voodooboomin_archived_backup', JSON.stringify(state.archivedBeats));
      localStorage.setItem('voodooboomin_profile_backup', JSON.stringify(state.profile));
      localStorage.setItem('voodooboomin_beat_packs', JSON.stringify(state.beatPacks));
      localStorage.setItem('voodooboomin_promotions', JSON.stringify(state.promotions));
      localStorage.setItem('voodooboomin_detected_uses', JSON.stringify(state.detectedUses));
      localStorage.setItem('voodooboomin_usage_notifications', JSON.stringify(state.usageNotifications));
      localStorage.setItem('voodooboomin_rights_records', JSON.stringify(state.rightsRecords));
      localStorage.setItem('voodooboomin_live_performances', JSON.stringify(state.livePerformances));
      localStorage.setItem('voodooboomin_sync_cue', JSON.stringify(state.syncCueRecords));
      localStorage.setItem('voodooboomin_audit_log', JSON.stringify(state.auditLog));
    } catch (e) {
      console.error("Failed to save local backup", e);
    }
  }, [
    state.beats, 
    state.archivedBeats, 
    state.profile, 
    state.beatPacks, 
    state.promotions, 
    state.detectedUses, 
    state.usageNotifications, 
    state.rightsRecords, 
    state.livePerformances, 
    state.syncCueRecords, 
    state.auditLog
  ]);

  const logAudit = (eventType: string, description: string, beatId?: string, packId?: string, previousValue?: string, newValue?: string) => {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventType,
      description,
      beatId,
      packId,
      previousValue,
      newValue
    };
    setState(prev => ({
      ...prev,
      auditLog: [entry, ...prev.auditLog]
    }));
  };

  const addBeatPack = (pack: BeatPack) => {
    setState(prev => ({
      ...prev,
      beatPacks: [pack, ...prev.beatPacks]
    }));
    logAudit('PACK_CREATED', `Created beat pack: ${pack.title} (ID: ${pack.id})`, undefined, pack.id);
  };

  const updateBeatPack = (id: string, updates: Partial<BeatPack>) => {
    setState(prev => ({
      ...prev,
      beatPacks: prev.beatPacks.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    }));
    logAudit('PACK_EDITED', `Updated beat pack ID: ${id}`, undefined, id);
  };

  const deleteBeatPack = (id: string) => {
    const target = state.beatPacks.find(p => p.id === id);
    setState(prev => ({
      ...prev,
      beatPacks: prev.beatPacks.filter(p => p.id !== id)
    }));
    logAudit('PACK_DELETED', `Permanently deleted beat pack: ${target?.title || id} (ID: ${id}). Underlying individual beats preserved.`, undefined, id);
  };

  const addPromotion = (promo: Promotion) => {
    setState(prev => ({
      ...prev,
      promotions: [promo, ...prev.promotions]
    }));
    logAudit('PROMO_CREATED', `Created promotion/coupon: ${promo.name} (${promo.code || promo.type})`);
  };

  const updatePromotion = (id: string, updates: Partial<Promotion>) => {
    setState(prev => ({
      ...prev,
      promotions: prev.promotions.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    logAudit('PROMO_EDITED', `Updated promotion ID: ${id}`);
  };

  const deletePromotion = (id: string) => {
    setState(prev => ({
      ...prev,
      promotions: prev.promotions.filter(p => p.id !== id)
    }));
    logAudit('PROMO_DELETED', `Deleted promotion ID: ${id}`);
  };

  const addDetectedUse = (use: DetectedUse) => {
    setState(prev => ({
      ...prev,
      detectedUses: [use, ...prev.detectedUses]
    }));
  };

  const updateDetectedUse = (id: string, updates: Partial<DetectedUse>) => {
    setState(prev => ({
      ...prev,
      detectedUses: prev.detectedUses.map(u => u.id === id ? { ...u, ...updates } : u)
    }));
  };

  const addUsageNotification = (notif: UsageNotification) => {
    setState(prev => ({
      ...prev,
      usageNotifications: [notif, ...prev.usageNotifications]
    }));
  };

  const updateUsageNotification = (id: string, status: UsageNotification['status']) => {
    setState(prev => ({
      ...prev,
      usageNotifications: prev.usageNotifications.map(n => n.id === id ? { ...n, status } : n)
    }));
  };

  const addRightsRecord = (rec: RightsRecord) => {
    setState(prev => ({
      ...prev,
      rightsRecords: [rec, ...prev.rightsRecords]
    }));
    logAudit('RIGHTS_CREATED', `Created rights/publishing record for beat ID: ${rec.beatId}`, rec.beatId);
  };

  const updateRightsRecord = (id: string, updates: Partial<RightsRecord>) => {
    setState(prev => ({
      ...prev,
      rightsRecords: prev.rightsRecords.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const addLivePerformance = (rec: LivePerformanceRecord) => {
    setState(prev => ({
      ...prev,
      livePerformances: [rec, ...prev.livePerformances]
    }));
    logAudit('PERFORMANCE_RECORD_ADDED', `Added live performance record for ${rec.songTitle} at ${rec.venue}`, rec.beatId);
  };

  const addSyncCue = (rec: SyncCueRecord) => {
    setState(prev => ({
      ...prev,
      syncCueRecords: [rec, ...prev.syncCueRecords]
    }));
    logAudit('SYNC_CUE_ADDED', `Added sync/cue sheet record for ${rec.finalSongTitle} (${rec.showProject})`, rec.beatId);
  };

  const updateProfile = async (profileUpdate: Partial<Profile>) => {
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, ...profileUpdate }
    }));
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...state.profile, ...profileUpdate })
    }).catch(err => console.error("Profile save error:", err));
  };

  const addVideo = (video: YouTubeVideo) => {
    setState((prev) => ({
      ...prev,
      videos: [...prev.videos, video],
    }));
  };

  const removeVideo = (id: string) => {
    setState((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== id),
    }));
  };

  const addBeat = async (beat: Beat) => {
    const beatId = beat.id || `beat_${Date.now()}`;
    const formattedBeat: Beat = {
      ...beat,
      id: beatId,
      isHumanUploaded: true,
      isLocal: true,
      userId: user?.uid || 'producer',
      createdAt: (beat.createdAt || new Date().toISOString()) as any,
      updatedAt: new Date().toISOString() as any,
    };

    // 1. Instantly update React local state so the beat appears everywhere immediately
    setState(prev => ({
      ...prev,
      beats: [formattedBeat, ...prev.beats.filter(b => b.id !== formattedBeat.id)]
    }));

    // 2. Persist to server backend
    fetch('/api/beats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedBeat)
    }).catch(err => console.error("Server save error:", err));
  };

  const removeBeat = async (id: string) => {
    const targetBeat = state.beats.find(b => b.id === id) || state.archivedBeats.find(b => b.id === id);
    setState(prev => ({
      ...prev,
      beats: prev.beats.filter(b => b.id !== id),
      archivedBeats: prev.archivedBeats.filter(b => b.id !== id)
    }));
    logAudit('BEAT_DELETED', `Permanent deletion of beat: ${targetBeat?.title || id} (ID: ${id}).`, id);

    fetch(`/api/beats/${id}`, {
      method: 'DELETE'
    }).catch(err => console.error("Delete beat error:", err));
  };

  const restoreBeat = async (id: string) => {
    setState(prev => ({
      ...prev,
      beats: prev.archivedBeats.filter(b => b.id === id).concat(prev.beats),
      archivedBeats: prev.archivedBeats.filter(b => b.id !== id)
    }));
  };

  const updateBeat = async (id: string, updates: Partial<Beat>) => {
    setState(prev => ({
      ...prev,
      beats: prev.beats.map(b => b.id === id ? { ...b, ...updates } : b),
      archivedBeats: prev.archivedBeats.map(b => b.id === id ? { ...b, ...updates } : b)
    }));

    fetch(`/api/beats/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.error("Update beat error:", err));
  };

  // 📰 Real Feed Post Actions
  const addFeedPost = (post: FeedPost) => {
    setState(prev => {
      let updatedPosts = prev.feedPosts.filter(p => p.id !== post.id);
      if (post.isPinned) {
        updatedPosts = updatedPosts.map(p => ({ ...p, isPinned: false }));
      }
      return {
        ...prev,
        feedPosts: [post, ...updatedPosts]
      };
    });

    logAudit('FEED_POST_CREATED', `Published real feed post: ${post.title || post.content.slice(0, 30)}`, post.featuredBeatId, post.featuredPackId);

    fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    }).catch(err => console.error("Save feed post error:", err));
  };

  const updateFeedPost = (id: string, updates: Partial<FeedPost>) => {
    setState(prev => {
      let updatedPosts = prev.feedPosts.map(p => {
        if (p.id === id) {
          return { ...p, ...updates, updatedAt: new Date().toISOString() };
        }
        if (updates.isPinned) {
          return { ...p, isPinned: false };
        }
        return p;
      });

      const updatedPost = updatedPosts.find(p => p.id === id);
      if (updatedPost) {
        fetch('/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPost)
        }).catch(err => console.error("Update feed post error:", err));
      }

      return {
        ...prev,
        feedPosts: updatedPosts
      };
    });
  };

  const deleteFeedPost = (id: string) => {
    setState(prev => ({
      ...prev,
      feedPosts: prev.feedPosts.filter(p => p.id !== id)
    }));

    logAudit('FEED_POST_DELETED', `Deleted feed post ID: ${id}`);

    fetch(`/api/feed/${id}`, {
      method: 'DELETE'
    }).catch(err => console.error("Delete feed post error:", err));
  };

  const togglePinFeedPost = (id: string) => {
    setState(prev => {
      const target = prev.feedPosts.find(p => p.id === id);
      if (!target) return prev;

      const nextPinnedState = !target.isPinned;
      const updatedPosts = prev.feedPosts.map(p => {
        if (p.id === id) {
          return { ...p, isPinned: nextPinnedState };
        }
        // If pinning this post, unpin any other post so only 1 post is pinned
        if (nextPinnedState) {
          return { ...p, isPinned: false };
        }
        return p;
      });

      const updatedPost = updatedPosts.find(p => p.id === id);
      if (updatedPost) {
        fetch('/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPost)
        }).catch(err => console.error("Pin feed post error:", err));
      }

      return {
        ...prev,
        feedPosts: updatedPosts
      };
    });
  };

  const likeFeedPost = (id: string) => {
    setState(prev => ({
      ...prev,
      feedPosts: prev.feedPosts.map(p => {
        if (p.id === id) {
          return { ...p, likes: (p.likes || 0) + 1 };
        }
        return p;
      })
    }));

    fetch(`/api/feed/${id}/like`, {
      method: 'POST'
    }).catch(err => console.error("Like feed post error:", err));
  };

  const updateHomepageLayout = async (newLayout: HomepageLayout) => {
    setState(prev => ({
      ...prev,
      homepageLayout: newLayout
    }));
    try {
      localStorage.setItem('voodooboomin_layout', JSON.stringify(newLayout));
      await fetch('/api/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLayout)
      });
      logAudit('LAYOUT_UPDATED', `Updated storefront layout configuration (${newLayout.filter(s => s.enabled).length} sections active)`);
    } catch (err) {
      console.error("Save layout error:", err);
    }
  };

  const resetHomepageLayout = async () => {
    setState(prev => ({
      ...prev,
      homepageLayout: DEFAULT_HOMEPAGE_LAYOUT
    }));
    try {
      localStorage.setItem('voodooboomin_layout', JSON.stringify(DEFAULT_HOMEPAGE_LAYOUT));
      await fetch('/api/layout/reset', {
        method: 'POST'
      });
      logAudit('LAYOUT_RESET', 'Reset storefront layout configuration to default ordering');
    } catch (err) {
      console.error("Reset layout error:", err);
    }
  };

  // 🌐 Music Distribution & Services Actions
  const addDistributorPartner = async (distributor: DistributorPartner) => {
    setState(prev => {
      const currentList = prev.distributorPartners || [];
      const updated = [...currentList, distributor];
      updated.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      return {
        ...prev,
        distributorPartners: updated
      };
    });

    logAudit('DISTRIBUTOR_ADDED', `Added music distributor partner: ${distributor.name}`);

    try {
      await fetch('/api/distributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(distributor)
      });
    } catch (err) {
      console.error("Save distributor error:", err);
    }
  };

  const updateDistributorPartner = async (id: string, updates: Partial<DistributorPartner>) => {
    setState(prev => {
      const currentList = prev.distributorPartners || [];
      const updated = currentList.map(d => {
        if (d.id === id) {
          return { ...d, ...updates, updatedAt: new Date().toISOString() };
        }
        return d;
      });
      updated.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      return {
        ...prev,
        distributorPartners: updated
      };
    });

    logAudit('DISTRIBUTOR_UPDATED', `Updated music distributor partner: ID ${id}`);

    try {
      await fetch(`/api/distributors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error("Update distributor error:", err);
    }
  };

  const deleteDistributorPartner = async (id: string) => {
    const target = (state.distributorPartners || []).find(d => d.id === id);
    setState(prev => ({
      ...prev,
      distributorPartners: (prev.distributorPartners || []).filter(d => d.id !== id)
    }));

    logAudit('DISTRIBUTOR_DELETED', `Deleted music distributor partner: ${target?.name || id}`);

    try {
      await fetch(`/api/distributors/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("Delete distributor error:", err);
    }
  };

  const reorderDistributorPartners = async (distributors: DistributorPartner[]) => {
    const updated = distributors.map((d, idx) => ({ ...d, sortOrder: idx + 1 }));
    setState(prev => ({
      ...prev,
      distributorPartners: updated
    }));

    logAudit('DISTRIBUTORS_REORDERED', `Reordered ${updated.length} music distributor partners`);

    try {
      await fetch('/api/distributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error("Reorder distributors error:", err);
    }
  };

  const trackDistributorClick = async (distributorId: string, distributorName: string, sourcePage: string = 'Services') => {
    // Optimistically update distributor clickCount and click log
    setState(prev => {
      const currentPartners = prev.distributorPartners || [];
      const updatedPartners = currentPartners.map(d => {
        if (d.id === distributorId) {
          return { ...d, clickCount: (d.clickCount || 0) + 1 };
        }
        return d;
      });

      const newClick: DistributorClickLog = {
        id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        distributorId,
        distributorName,
        timestamp: new Date().toISOString(),
        sourcePage
      };

      const updatedClicks = [newClick, ...(prev.distributorClicks || [])].slice(0, 1000);

      return {
        ...prev,
        distributorPartners: updatedPartners,
        distributorClicks: updatedClicks
      };
    });

    logAudit('DISTRIBUTOR_CLICKED', `Outbound referral link clicked: ${distributorName}`);

    try {
      await fetch(`/api/distributors/${distributorId}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorName, sourcePage })
      });
    } catch (err) {
      console.error("Track click error:", err);
    }
  };

  const addProfessional = async (professional: MusicProfessional) => {
    setState(prev => {
      const current = prev.professionals || [];
      const updated = [...current, professional];
      return { ...prev, professionals: updated };
    });

    logAudit('PROFESSIONAL_APPLIED', `New music professional joined: ${professional.name}`);

    try {
      await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(professional)
      });
    } catch (err) {
      console.error("Add professional error:", err);
    }
  };

  const updateProfessional = async (id: string, updates: Partial<MusicProfessional>) => {
    setState(prev => {
      const current = prev.professionals || [];
      const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);
      return { ...prev, professionals: updated };
    });

    if (updates.status) {
      logAudit('PROFESSIONAL_STATUS_UPDATED', `Updated professional ${id} status to ${updates.status}`);
    } else {
      logAudit('PROFESSIONAL_UPDATED', `Updated professional profile details for ${id}`);
    }

    try {
      await fetch(`/api/professionals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error("Update professional error:", err);
    }
  };

  const deleteProfessional = async (id: string) => {
    const target = (state.professionals || []).find(p => p.id === id);
    setState(prev => ({
      ...prev,
      professionals: (prev.professionals || []).filter(p => p.id !== id)
    }));

    logAudit('PROFESSIONAL_DELETED', `Deleted professional profile: ${target?.name || id}`);

    try {
      await fetch(`/api/professionals/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("Delete professional error:", err);
    }
  };

  const updateServicesConfig = async (config: ServicesConfig) => {
    setState(prev => ({
      ...prev,
      servicesConfig: config
    }));

    logAudit('SERVICES_CONFIG_UPDATED', `Updated Services configuration`);

    try {
      await fetch('/api/services/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch (err) {
      console.error("Update services config error:", err);
    }
  };

  const trackProfessionalClick = async (id: string, action: 'view' | 'contact') => {
    setState(prev => {
      const current = prev.professionals || [];
      const updated = current.map(p => {
        if (p.id === id) {
          if (action === 'contact') {
            return { ...p, contactClicks: (p.contactClicks || 0) + 1 };
          } else {
            return { ...p, profileViews: (p.profileViews || 0) + 1 };
          }
        }
        return p;
      });
      return { ...prev, professionals: updated };
    });

    try {
      await fetch(`/api/professionals/${id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (err) {
      console.error("Track professional click error:", err);
    }
  };

  const setFeaturedBeatId = useCallback((beatId: string | null) => {
    setState(prev => ({ ...prev, featuredBeatId: beatId }));
    if (beatId) {
      localStorage.setItem('voodooboomin_featured_beat_id', beatId);
    } else {
      localStorage.removeItem('voodooboomin_featured_beat_id');
    }
  }, []);

  const setAnnouncement = useCallback((announcement: Announcement | null) => {
    setState(prev => ({ ...prev, announcement }));
    if (announcement) {
      localStorage.setItem('voodooboomin_announcement', JSON.stringify(announcement));
    } else {
      localStorage.removeItem('voodooboomin_announcement');
    }
  }, []);

  const addBeatToVault = useCallback((beatId: string) => {
    setState(prev => {
      const currentVault = prev.vaultConfig || { beatIds: [], packIds: [] };
      if (currentVault.beatIds.includes(beatId)) return prev;
      const updatedVault = {
        ...currentVault,
        beatIds: [...currentVault.beatIds, beatId]
      };
      localStorage.setItem('voodooboomin_vault_config', JSON.stringify(updatedVault));
      return { ...prev, vaultConfig: updatedVault };
    });
  }, []);

  const removeBeatFromVault = useCallback((beatId: string) => {
    setState(prev => {
      const currentVault = prev.vaultConfig || { beatIds: [], packIds: [] };
      const updatedVault = {
        ...currentVault,
        beatIds: currentVault.beatIds.filter(id => id !== beatId)
      };
      localStorage.setItem('voodooboomin_vault_config', JSON.stringify(updatedVault));
      return { ...prev, vaultConfig: updatedVault };
    });
  }, []);

  const addPackToVault = useCallback((packId: string) => {
    setState(prev => {
      const currentVault = prev.vaultConfig || { beatIds: [], packIds: [] };
      if (currentVault.packIds.includes(packId)) return prev;
      const updatedVault = {
        ...currentVault,
        packIds: [...currentVault.packIds, packId]
      };
      localStorage.setItem('voodooboomin_vault_config', JSON.stringify(updatedVault));
      return { ...prev, vaultConfig: updatedVault };
    });
  }, []);

  const removePackFromVault = useCallback((packId: string) => {
    setState(prev => {
      const currentVault = prev.vaultConfig || { beatIds: [], packIds: [] };
      const updatedVault = {
        ...currentVault,
        packIds: currentVault.packIds.filter(id => id !== packId)
      };
      localStorage.setItem('voodooboomin_vault_config', JSON.stringify(updatedVault));
      return { ...prev, vaultConfig: updatedVault };
    });
  }, []);

  const setVaultFeaturedItem = useCallback((itemId?: string) => {
    setState(prev => {
      const currentVault = prev.vaultConfig || { beatIds: [], packIds: [] };
      const updatedVault = {
        ...currentVault,
        featuredItemId: itemId
      };
      localStorage.setItem('voodooboomin_vault_config', JSON.stringify(updatedVault));
      return { ...prev, vaultConfig: updatedVault };
    });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        state,
        updateProfile,
        addVideo,
        removeVideo,
        addBeat,
        removeBeat,
        restoreBeat,
        updateBeat,
        incrementAnalytics,
        resetAnalytics,
        
        // Feed Actions
        addFeedPost,
        updateFeedPost,
        deleteFeedPost,
        togglePinFeedPost,
        likeFeedPost,

        // Homepage Layout Actions
        updateHomepageLayout,
        resetHomepageLayout,

        // Music Distribution & Services Actions
        addDistributorPartner,
        updateDistributorPartner,
        deleteDistributorPartner,
        reorderDistributorPartners,
        trackDistributorClick,

        // Professional Services Actions
        addProfessional,
        updateProfessional,
        deleteProfessional,
        updateServicesConfig,
        trackProfessionalClick,

        // Features 27, 28, 30 Actions
        setFeaturedBeatId,
        setAnnouncement,
        addBeatToVault,
        removeBeatFromVault,
        addPackToVault,
        removePackFromVault,
        setVaultFeaturedItem,

        // Dashboard Actions
        addBeatPack,
        updateBeatPack,
        deleteBeatPack,
        addPromotion,
        updatePromotion,
        deletePromotion,
        addDetectedUse,
        updateDetectedUse,
        addUsageNotification,
        updateUsageNotification,
        addRightsRecord,
        updateRightsRecord,
        addLivePerformance,
        addSyncCue,
        logAudit,
        
        // E-commerce states and actions (PayPal)
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateCartItemLicense,
        promoCode,
        setPromoCode,
        currency,
        setCurrency,
        favorites,
        toggleFavorite,
        recentlyViewed,
        trackBeatView,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
