import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  AuditLogEntry 
} from '../types';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { filterHumanBeats, isAIPlaceholderBeat } from '../lib/beatUtils';

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
  
  // Round 3 Dashboard Actions
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
  
  // Upgraded E-commerce States
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

      // Legacy fallback keys
      const legacyName = localStorage.getItem('VOODOO_BOOMIN_DISPLAY_NAME') || localStorage.getItem('KRYPSIDE_DISPLAY_NAME');
      const legacyBio = localStorage.getItem('VOODOO_BOOMIN_BIO') || localStorage.getItem('KRYPSIDE_BIO');
      const legacyImg = localStorage.getItem('VOODOO_BOOMIN_IMAGE_URL') || localStorage.getItem('KRYPSIDE_IMAGE_URL');

      let parsedProfile = defaultState.profile;
      if (savedProfile) {
        try {
          parsedProfile = { ...defaultState.profile, ...JSON.parse(savedProfile) };
        } catch {
          parsedProfile = defaultState.profile;
        }
      } else if (legacyName || legacyBio || legacyImg) {
        parsedProfile = {
          ...defaultState.profile,
          ...(legacyName ? { name: legacyName } : {}),
          ...(legacyBio ? { bio: legacyBio } : {}),
          ...(legacyImg ? { avatarUrl: legacyImg } : {}),
        };
      }

      const parsedBeats = savedBeats ? JSON.parse(savedBeats) : [];
      const validBeats = filterHumanBeats(parsedBeats);
      const parsedPacks = savedPacks ? JSON.parse(savedPacks) : [];
      const validPacks = parsedPacks.filter((p: any) => p && p.id !== 'VP-001' && !p.id.toLowerCase().includes('demo') && !p.id.toLowerCase().includes('sample'));
      const parsedPromos = savedPromos ? JSON.parse(savedPromos) : [];
      const validPromos = parsedPromos.filter((p: any) => p && p.id !== 'promo_holiday30' && p.id !== 'promo_bulk2v1');
      const parsedAudit = savedAudit ? JSON.parse(savedAudit) : [];
      const validAudit = parsedAudit.filter((a: any) => a && a.id !== 'audit_init');

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
        auditLog: validAudit,
        analytics: defaultState.analytics,
      };
    } catch (e) {
      return {
        ...defaultState,
        beats: [],
        beatPacks: [],
        promotions: [],
        auditLog: [],
      };
    }
  });

  // Upgraded E-commerce States
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

  const [promoCode, setPromoCode] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'JPY'>('USD');

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

  // Sync Beats from Firestore
  useEffect(() => {
    // Public beats listener
    const publicQ = query(
      collection(db, 'beats'),
      where('visibility', '==', 'Public'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePublic = onSnapshot(publicQ, (snapshot) => {
      const publicBeats: Beat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const b = { id: doc.id, ...data } as Beat;
        if (!isAIPlaceholderBeat(b)) {
          publicBeats.push(b);
        }
      });
      
      setState(prev => {
        const combined = [...publicBeats, ...prev.beats];
        const uniqueBeats = Array.from(new Map(combined.map(item => [item.id, item])).values());
        
        // Deduplicate by title + producer to prevent duplicates
        const seen = new Set<string>();
        const filtered = uniqueBeats.filter(b => {
          const key = `${(b.title || '').toLowerCase().trim()}_${(b.producer || '').toLowerCase().trim()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          ...prev,
          beats: filtered.length > 0 ? filtered : filterHumanBeats(prev.beats)
        };
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'beats');
    });

    // User-specific beats listener (for private/unlisted)
    let unsubscribeUser = () => {};
    if (user) {
      const userQ = query(
        collection(db, 'beats'),
        where('userId', '==', user.uid),
        where('visibility', 'in', ['Private', 'Unlisted'])
      );

      unsubscribeUser = onSnapshot(userQ, (snapshot) => {
        const privateBeats: Beat[] = [];
        snapshot.forEach((doc) => {
          privateBeats.push({ id: doc.id, ...doc.data() } as Beat);
        });

        setState(prev => ({
          ...prev,
          archivedBeats: privateBeats
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'beats');
      });
    }

    return () => {
      unsubscribePublic();
      unsubscribeUser();
    };
  }, [user]);

  // Sync Profile from Firestore
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'profiles', user.uid);
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setState(prev => ({
          ...prev,
          profile: { ...prev.profile, ...docSnap.data() } as Profile
        }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  const updateProfile = async (profileUpdate: Partial<Profile>) => {
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, ...profileUpdate }
    }));
    if (!user) return;
    const profileRef = doc(db, 'profiles', user.uid);
    try {
      await setDoc(profileRef, { 
        ...profileUpdate, 
        userId: user.uid,
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `profiles/${user.uid}`);
    }
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

  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  };

  const addBeat = async (beat: Beat) => {
    const beatId = beat.id || `human_beat_${Date.now()}`;
    const formattedBeat: Beat = {
      ...beat,
      id: beatId,
      isHumanUploaded: true,
      isLocal: true,
      userId: user?.uid || 'local_user',
      createdAt: (beat.createdAt || new Date().toISOString()) as any,
      updatedAt: new Date().toISOString() as any,
    };

    // 1. Instantly update React local state so the beat appears everywhere immediately
    setState(prev => ({
      ...prev,
      beats: [formattedBeat, ...prev.beats.filter(b => b.id !== formattedBeat.id)]
    }));

    // 2. Persist to Firestore if user is authenticated
    if (user) {
      try {
        const beatRef = doc(db, 'beats', formattedBeat.id);
        const firestoreBeat = sanitizeForFirestore({
          ...formattedBeat,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        await setDoc(beatRef, firestoreBeat);

        // 3. Save Licenses to subcollection
        if (formattedBeat.licenses) {
          const licenseTypes = ['mp3Lease', 'wavLease', 'premiumLease', 'unlimitedLease', 'exclusive'];
          for (const type of licenseTypes) {
            const licenseData = (formattedBeat.licenses as any)[type];
            if (licenseData && licenseData.enabled) {
              const licenseRef = doc(db, 'beats', formattedBeat.id, 'licenses', type);
              await setDoc(licenseRef, {
                licenseType: type,
                price: Number(licenseData.price),
                isActive: true
              });
            }
          }
        }

        // 4. Save Social Unlocks to subcollection
        if (formattedBeat.socialUnlocks && formattedBeat.socialUnlocks.length > 0) {
          for (const unlock of formattedBeat.socialUnlocks) {
            const unlockRef = doc(db, 'beats', formattedBeat.id, 'social_unlocks', unlock.id);
            await setDoc(unlockRef, sanitizeForFirestore(unlock));
          }
        }
      } catch (error) {
        console.warn("Firestore save fallback to local state:", error);
      }
    }
  };

  const removeBeat = async (id: string) => {
    const targetBeat = state.beats.find(b => b.id === id) || state.archivedBeats.find(b => b.id === id);
    setState(prev => ({
      ...prev,
      beats: prev.beats.filter(b => b.id !== id),
      archivedBeats: prev.archivedBeats.filter(b => b.id !== id)
    }));
    logAudit('BEAT_DELETED', `Permanent deletion of beat: ${targetBeat?.title || id} (ID: ${id}). Storefront listing and associated active files removed. Audit history retained.`, id);

    if (user && !id.startsWith('local_') && !id.startsWith('default_')) {
      const beatRef = doc(db, 'beats', id);
      try {
        await deleteDoc(beatRef);
      } catch (error) {
        try {
          await updateDoc(beatRef, { 
            visibility: 'Private',
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          handleFirestoreError(error, OperationType.UPDATE, `beats/${id}`);
        }
      }
    }
  };

  const restoreBeat = async (id: string) => {
    if (!user || id.startsWith('local_')) return;
    const beatRef = doc(db, 'beats', id);
    try {
      await updateDoc(beatRef, { 
        visibility: 'Public',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `beats/${id}`);
    }
  };

  const updateBeat = async (id: string, updates: Partial<Beat>) => {
    if (!user || id.startsWith('local_')) {
      setState(prev => ({
        ...prev,
        beats: prev.beats.map(b => b.id === id ? { ...b, ...updates } : b),
        archivedBeats: prev.archivedBeats.map(b => b.id === id ? { ...b, ...updates } : b)
      }));
      return;
    }
    const beatRef = doc(db, 'beats', id);
    try {
      await updateDoc(beatRef, { 
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `beats/${id}`);
    }
  };

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
        
        // Round 3 Dashboard Actions
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
        
        // E-commerce states and actions
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
