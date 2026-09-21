export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface MarketingConfig {
  autoPostVideo: boolean;
  youtubeVideoGen: boolean;
  tiktokVideoGen: boolean;
  youtubeTargetChannel: string;
  tiktokTargetChannel: string;
  youtubeCompanionUrl: string;
  soundcloudSyncLink: string;
  audiomackEmbedCode: string;
  tiktokTrendingAudioSync: string;
  dspDistributionOptIn: boolean;
  spotifyArtistLink: string;
  appleMusicArtistLink: string;
  upcCoreField: string;
  googleAnalyticsCode: string;
  metaPixelId: string;
  googleAdsTracker: string;
  pinterestTagId: string;
  tiktokPixelId: string;
  utmCampaignBuilder: string;
  smartLinkShortUrl: string;
  autoSocialCopy: string;
  directCheckoutShortcut: string;
  emailReceiptLayout: 'Standard' | 'Compact' | 'Custom';
  mailingListTrigger: boolean;
  socialShareArray: string;
  rssPodcastFeed: boolean;
  airbitFeaturedBid: string;
  localStorageBackupRegistry: boolean;
  tosComplianceMatrix: boolean;
}

export interface Profile {
  name: string;
  bio: string;
  avatarUrl: string;
  coverUrl?: string;
  tagline?: string;
  location?: string;
  websiteUrl?: string;
  genres?: string[];
  verified?: boolean;
  customLinks?: { id: string; title: string; url: string }[];
  voiceTagUrl?: string;
  paypalEmail?: string;
  socialLinks: SocialLink[];
  marketingConfig?: MarketingConfig;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  videoId: string;
}

export interface License {
  type: string;
  price: number;
  agreementUrl?: string;
}

export interface Tier {
  level: string;
  price: number;
}

export interface BulkDiscount {
  threshold: number;
  discountPercentage: number;
}

export interface SocialUnlock {
  id: string;
  requiredAction: 'SPOTIFY_FOLLOW' | 'YOUTUBE_SUBSCRIBE' | 'EMAIL_LIST';
  targetAccountId: string;
  freeDownloadFileType: 'MP3' | 'WAV';
}

export interface Beat {
  id: string;
  title: string;
  producer: string;
  bpm: number;
  key: string;
  mode?: string;
  price: number;
  coverArtUrl: string;
  audioUrl: string; // The URL to play (tagged MP3)
  untaggedWavUrl?: string; // High quality untagged WAV
  untaggedMp3Url?: string; // High quality untagged MP3
  stemsZipUrl?: string; // ZIP file with stems
  externalStemUrl?: string;
  externalStemPassword?: string;
  watermarkedAudioUrl?: string; // Watermarked version for preview
  visibility: 'Public' | 'Private' | 'Unlisted';
  trackType: 'Beat' | 'Chorus' | 'Song' | 'Top Line' | 'Vocals' | 'Beat Pack';
  trackTypeClassification?: 'Beat' | 'Vocal Topline' | 'Chorus' | 'Full Song';
  isFeatured?: boolean;
  linkedBeatId?: string;
  freeToSingTerms?: string;
  directPriceOnly?: boolean;
  releaseTime?: string;
  collaborators?: { name: string; splitPercent: number }[];
  publishingSplits?: { writerShare: number; publishingShare: number; mechanicalShare: number };
  charitySplit?: { charityName: string; percentage: number };
  licenses: {
    mp3Lease: { enabled: boolean; price: number };
    wavLease: { enabled: boolean; price: number };
    premiumLease: { enabled: boolean; price: number };
    unlimitedLease: { enabled: boolean; price: number };
    exclusive: { enabled: boolean; price: number };
  };
  customLicenses?: License[];
  tieredPricing?: Tier[];
  bulkDiscount?: BulkDiscount;
  freeDownload?: { 
    enabled: boolean; 
    requirement: 'email' | 'social' | 'none';
    protection: 'tagged' | 'untagged';
    socialGate?: 'youtube' | 'soundcloud' | 'profile';
    redirectUrl?: string;
  };
  socialUnlocks?: SocialUnlock[];
  redirectUrl?: string;
  isExclusive?: boolean;
  contentIdEnabled?: boolean;
  likes?: number;
  dislikes?: number;
  plays?: number;
  shares?: number;
  purchases?: number;
  earnings?: number;
  downloads?: number;
  mood?: string[];
  tags?: string[];
  isLocal?: boolean;
  isHumanUploaded?: boolean;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  releaseDate?: string;
  gear?: string;
  instruments?: string[];
  primaryGenre?: string;
  secondaryGenre?: string;
  isExplicit?: boolean;
  isInstrumental?: boolean;
  productionYear?: number;
  isrcCode?: string;
}

export interface PackTrack {
  trackNumber: number;
  title: string;
  originalFilename: string;
  durationSeconds: number;
  previewUrl?: string; // 40-45s preview blob/data url
  audioUrl?: string; // fallback
  bpm?: number;
  key?: string;
  status: 'Ready' | 'Processing' | 'Error';
  errorMessage?: string;
}

export interface BeatPack {
  id: string; // e.g. VP-00001
  title: string;
  coverArtUrl: string;
  description: string;
  beatIds: string[];
  tracks: PackTrack[];
  zipFileName?: string;
  zipFileUrl?: string; // Master ZIP data URL / storage URL
  price: number;
  isFree?: boolean; // Allow Free Download option
  visibility: 'Public' | 'Private' | 'Unlisted';
  processingStatus?: 'idle' | 'uploading' | 'reading' | 'extracting' | 'generating_previews' | 'ready' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'bulk_deal' | 'coupon_code';
  discountType: 'percentage' | 'fixed' | 'free_item';
  discountValue: number; // percentage or fixed amount
  buyQty?: number;
  getQty?: number;
  code?: string; // for coupons like HOLIDAY30
  status: 'Active' | 'Scheduled' | 'Expired' | 'Disabled';
  startDate: string;
  endDate: string;
  noExpiration?: boolean;
  applicableProductIds?: string[]; // beatIds or packIds
  applicableLicenses?: string[]; // 'mp3Lease', 'wavLease', etc.
  excludedProductIds?: string[];
  excludeExclusive?: boolean;
  createdAt: string;
}

export interface DetectedUse {
  id: string;
  beatId: string;
  platform: 'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Twitch' | 'Reddit' | 'Other';
  url: string;
  location: string;
  dateDetected: string;
  artistAccount?: string;
  matchInfo?: string;
  status: 'New' | 'Reviewing' | 'Licensed' | 'Unlicensed' | 'Resolved' | 'Disputed' | 'Archived';
  notes?: string;
}

export interface UsageNotification {
  id: string;
  beatId: string;
  platform: string;
  title: string;
  body: string;
  dateDetected: string;
  status: 'Unread' | 'Read' | 'Reviewed' | 'Resolved';
  directUrl?: string;
}

export interface RightsRecord {
  id: string;
  beatId: string;
  originalTitle: string;
  artist: string;
  finalSongTitle: string;
  producerName: string;
  producerIpi: string;
  pro: 'ASCAP' | 'BMI' | 'SESAC' | 'GEMA' | 'PRS' | 'Other';
  registrationStatus: 'Pending' | 'Registered' | 'Submitted';
  iswc?: string;
  rightsIdentifiers?: string;
  registrationDate?: string;
  trackingStartDate?: string;
  notes?: string;
  supportingDocs?: string[];
}

export interface LivePerformanceRecord {
  id: string;
  beatId: string;
  songTitle: string;
  artist: string;
  venue: string;
  city: string;
  performanceDate: string;
  setlistInfo?: string;
  pro: string;
  submissionStatus: 'Draft' | 'Submitted' | 'Confirmed' | 'Paid';
  submissionDate?: string;
  paymentInfo?: string;
  notes?: string;
}

export interface SyncCueRecord {
  id: string;
  beatId: string;
  finalSongTitle: string;
  artist: string;
  productionCompany: string;
  showProject: string;
  episode?: string;
  releaseAirDate: string;
  cueSheetStatus: 'Draft' | 'Submitted' | 'Approved' | 'Paid';
  pro: string;
  ipi: string;
  iswc?: string;
  licenseContractInfo?: string;
  paymentInfo?: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string; // e.g. 'BEAT_CREATED', 'BEAT_EDITED', 'BEAT_DELETED', 'PACK_CREATED', 'PROMO_CREATED', etc.
  beatId?: string;
  packId?: string;
  previousValue?: string;
  newValue?: string;
  description: string;
  reference?: string;
}

export interface CartItem {
  beat: Beat;
  licenseType: string; // 'mp3Lease' | 'wavLease' | 'premiumLease' | 'unlimitedLease' | 'exclusive' | 'directPrice'
  price: number;
}

export type MarketingErrorCode = 
  | 'AD_BLOCKER_DETECTED' 
  | 'API_RATE_LIMIT_EXCEEDED' 
  | 'OAUTH_POPUP_BLOCKED' 
  | 'UNKNOWN_MARKETING_ERROR';

export interface MarketingErrorContext {
  componentName: string;
  context?: Record<string, any>;
  onEmailCaptureFallback?: () => void;
  onBypassSocialCheck?: () => void;
  onCheckoutFallback?: () => void;
}

export interface Analytics {
  siteVisits: number;
  uniqueVisitors: number;
  totalPlays: number;
  totalShares: number;
  downloads: number;
  totalEarnings?: number;
  platformFees?: number;
}

export interface StoreState {
  profile: Profile;
  videos: YouTubeVideo[];
  beats: Beat[];
  archivedBeats: Beat[];
  beatPacks: BeatPack[];
  promotions: Promotion[];
  detectedUses: DetectedUse[];
  usageNotifications: UsageNotification[];
  rightsRecords: RightsRecord[];
  livePerformances: LivePerformanceRecord[];
  syncCueRecords: SyncCueRecord[];
  auditLog: AuditLogEntry[];
  analytics: Analytics;
}
