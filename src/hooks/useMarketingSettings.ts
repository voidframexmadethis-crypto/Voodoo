import React from 'react';
import { useStore } from '../context/StoreContext';
import { MarketingConfig } from '../types';

export const useMarketingSettings = () => {
  const { state, updateProfile } = useStore();
  
  const defaultMarketingConfig = React.useMemo(() => ({
    autoPostVideo: false,
    youtubeVideoGen: false,
    tiktokVideoGen: false,
    youtubeTargetChannel: '',
    tiktokTargetChannel: '',
    youtubeCompanionUrl: '',
    soundcloudSyncLink: '',
    audiomackEmbedCode: '',
    tiktokTrendingAudioSync: '',
    dspDistributionOptIn: false,
    spotifyArtistLink: '',
    appleMusicArtistLink: '',
    upcCoreField: '',
    googleAnalyticsCode: '',
    metaPixelId: '',
    googleAdsTracker: '',
    pinterestTagId: '',
    tiktokPixelId: '',
    utmCampaignBuilder: '',
    smartLinkShortUrl: '',
    autoSocialCopy: '',
    directCheckoutShortcut: '',
    emailReceiptLayout: 'Standard',
    mailingListTrigger: false,
    socialShareArray: 'Twitter, Facebook, WhatsApp, Email',
    rssPodcastFeed: false,
    airbitFeaturedBid: '',
    localStorageBackupRegistry: true,
    tosComplianceMatrix: false,
  }), []);

  const marketingConfig = state.profile.marketingConfig || defaultMarketingConfig;
  
  const saveMarketingSettings = (newConfig: Partial<MarketingConfig>) => {
    updateProfile({ 
      marketingConfig: { 
        ...marketingConfig, 
        ...newConfig 
      } 
    });
  };
  
  return { marketingConfig, saveMarketingSettings };
};
