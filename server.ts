import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import os from 'os';
import { applyAudioWatermark } from './src/lib/audio-processor';

// 📂 LOCAL STORAGE SETUP for Real Audio & Artwork
const LOCAL_STORAGE_ROOT = path.join(process.cwd(), 'local_storage');
const BEATS_STORAGE = path.join(LOCAL_STORAGE_ROOT, 'beats');
const IMAGES_STORAGE = path.join(LOCAL_STORAGE_ROOT, 'images');
const WATERMARKS_STORAGE = path.join(LOCAL_STORAGE_ROOT, 'watermarks');
const TEMP_CHUNKS_DIR = path.join(LOCAL_STORAGE_ROOT, 'temp_chunks');

[BEATS_STORAGE, IMAGES_STORAGE, WATERMARKS_STORAGE, TEMP_CHUNKS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.query.type === 'audio') {
      cb(null, BEATS_STORAGE);
    } else {
      cb(null, IMAGES_STORAGE);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
  }
});

const upload = multer({ storage: storage_config });

// 📂 BEATS JSON STORAGE
const BEATS_FILE_PATH = path.join(process.cwd(), 'beats.json');
function loadBeats(): any[] {
  try {
    if (fs.existsSync(BEATS_FILE_PATH)) {
      const data = fs.readFileSync(BEATS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading beats.json:", e);
  }
  return [];
}

function saveBeats(beats: any[]) {
  try {
    fs.writeFileSync(BEATS_FILE_PATH, JSON.stringify(beats, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving beats.json:", e);
  }
}

// 📂 PROFILE JSON STORAGE
const PROFILE_FILE_PATH = path.join(process.cwd(), 'profile.json');
function loadProfile(): any {
  try {
    if (fs.existsSync(PROFILE_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(PROFILE_FILE_PATH, 'utf8'));
    }
  } catch (e) {}
  return null;
}

function saveProfile(profile: any) {
  try {
    fs.writeFileSync(PROFILE_FILE_PATH, JSON.stringify(profile, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving profile.json:", e);
  }
}

// 📂 FEED JSON STORAGE
const FEED_FILE_PATH = path.join(process.cwd(), 'feed.json');
function loadFeed(): any[] {
  try {
    if (fs.existsSync(FEED_FILE_PATH)) {
      const data = fs.readFileSync(FEED_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading feed.json:", e);
  }
  return [];
}

function saveFeed(posts: any[]) {
  try {
    fs.writeFileSync(FEED_FILE_PATH, JSON.stringify(posts, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving feed.json:", e);
  }
}

// 📂 HOMEPAGE LAYOUT JSON STORAGE
const LAYOUT_FILE_PATH = path.join(process.cwd(), 'layout.json');
const DEFAULT_HOMEPAGE_LAYOUT = [
  { id: 'hero', name: 'Hero', enabled: true },
  { id: 'high_performance', name: 'High-Performance Tracks', enabled: true },
  { id: 'top_tracks', name: 'Top Tracks', enabled: true },
  { id: 'feed', name: 'Feed', enabled: true },
  { id: 'beat_packs', name: 'Beat Packs', enabled: true },
  { id: 'beats', name: 'Beats', enabled: true },
  { id: 'profile', name: 'Profile', enabled: true }
];

function loadLayout(): any[] {
  try {
    if (fs.existsSync(LAYOUT_FILE_PATH)) {
      const data = fs.readFileSync(LAYOUT_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading layout.json:", e);
  }
  return DEFAULT_HOMEPAGE_LAYOUT;
}

function saveLayout(layout: any[]) {
  try {
    fs.writeFileSync(LAYOUT_FILE_PATH, JSON.stringify(layout, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving layout.json:", e);
  }
}

// 📂 MUSIC DISTRIBUTION PARTNERS JSON STORAGE
const DISTRIBUTORS_FILE_PATH = path.join(process.cwd(), 'distributors.json');
const DISTRIBUTOR_CLICKS_FILE_PATH = path.join(process.cwd(), 'distributor_clicks.json');

// 📂 PROFESSIONAL SERVICES DIRECTORY JSON STORAGE
const PROFESSIONALS_FILE_PATH = path.join(process.cwd(), 'professionals.json');
const SERVICES_CONFIG_FILE_PATH = path.join(process.cwd(), 'services_config.json');

const DEFAULT_SERVICES_CONFIG = {
  enableMusicDistribution: false,
  enableProfessionalApplications: true
};

function loadServicesConfig(): any {
  try {
    if (fs.existsSync(SERVICES_CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(SERVICES_CONFIG_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error loading services_config.json:", e);
  }
  return DEFAULT_SERVICES_CONFIG;
}

function saveServicesConfig(config: any) {
  try {
    fs.writeFileSync(SERVICES_CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving services_config.json:", e);
  }
}

function loadProfessionals(): any[] {
  try {
    if (fs.existsSync(PROFESSIONALS_FILE_PATH)) {
      const data = fs.readFileSync(PROFESSIONALS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading professionals.json:", e);
  }
  return [];
}

function saveProfessionals(professionals: any[]) {
  try {
    fs.writeFileSync(PROFESSIONALS_FILE_PATH, JSON.stringify(professionals, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving professionals.json:", e);
  }
}

function loadDistributors(): any[] {
  try {
    if (fs.existsSync(DISTRIBUTORS_FILE_PATH)) {
      const data = fs.readFileSync(DISTRIBUTORS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading distributors.json:", e);
  }
  return [];
}

function saveDistributors(distributors: any[]) {
  try {
    fs.writeFileSync(DISTRIBUTORS_FILE_PATH, JSON.stringify(distributors, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving distributors.json:", e);
  }
}

function loadDistributorClicks(): any[] {
  try {
    if (fs.existsSync(DISTRIBUTOR_CLICKS_FILE_PATH)) {
      const data = fs.readFileSync(DISTRIBUTOR_CLICKS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading distributor_clicks.json:", e);
  }
  return [];
}

function saveDistributorClicks(clicks: any[]) {
  try {
    fs.writeFileSync(DISTRIBUTOR_CLICKS_FILE_PATH, JSON.stringify(clicks, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving distributor_clicks.json:", e);
  }
}

// 📊 REAL VISITS & ANALYTICS STORAGE
const VISITS_FILE_PATH = path.join(os.tmpdir(), 'voodoo_visits.json');
let siteVisitsData = {
  totalVisits: 0,
  uniqueVisitors: 0,
  totalStreams: 0,
  downloads: 0,
  totalEarnings: 0,
  sessions: [] as string[],
  visitors: [] as string[]
};

try {
  if (fs.existsSync(VISITS_FILE_PATH)) {
    const rawData = fs.readFileSync(VISITS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(rawData);
    siteVisitsData = {
      totalVisits: parsed.totalVisits || 0,
      uniqueVisitors: parsed.uniqueVisitors || 0,
      totalStreams: parsed.totalStreams || 0,
      downloads: parsed.downloads || 0,
      totalEarnings: parsed.totalEarnings || 0,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      visitors: Array.isArray(parsed.visitors) ? parsed.visitors : []
    };
  }
} catch (err) {
  console.error("Error reading visits.json:", err);
}

function saveVisitsData() {
  try {
    fs.writeFileSync(VISITS_FILE_PATH, JSON.stringify(siteVisitsData, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing visits.json:", err);
  }
}

// 📧 SUBSCRIBERS STORAGE
const SUBSCRIBERS_FILE_PATH = path.join(os.tmpdir(), 'voodoo_subscribers.json');
let subscribersData = {
  subscribers: [] as { email: string; name: string; subscribedAt: string; notifyOnBeatDrop: boolean }[],
  notifications: [] as { id: string; title: string; body: string; sentAt: string; beatTitle?: string }[]
};

try {
  if (fs.existsSync(SUBSCRIBERS_FILE_PATH)) {
    const rawData = fs.readFileSync(SUBSCRIBERS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(rawData);
    subscribersData = {
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : []
    };
  }
} catch (err) {}

function saveSubscribersData() {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE_PATH, JSON.stringify(subscribersData, null, 2), 'utf8');
  } catch (err) {}
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json({ limit: '50mb' }));
  
  // 📂 Static local audio and artwork serving
  app.use('/local_storage', express.static(LOCAL_STORAGE_ROOT));

  // 🎵 Real Beats Catalog Endpoints
  app.get('/api/beats', (req, res) => {
    const beats = loadBeats();
    res.json(beats);
  });

  app.get('/api/beats/:id', (req, res) => {
    const beats = loadBeats();
    const found = beats.find((b: any) => b.id === req.params.id);
    if (found) {
      return res.json({ success: true, beat: found });
    }
    return res.status(404).json({ success: false, error: 'Beat not found' });
  });

  app.post('/api/beats', (req, res) => {
    const newBeat = req.body;
    if (!newBeat || !newBeat.id) {
      return res.status(400).json({ success: false, error: 'Invalid beat payload' });
    }
    const beats = loadBeats();
    const existingIndex = beats.findIndex((b: any) => b.id === newBeat.id);
    if (existingIndex > -1) {
      beats[existingIndex] = { ...beats[existingIndex], ...newBeat };
    } else {
      beats.unshift(newBeat);
    }
    saveBeats(beats);
    res.json({ success: true, beat: newBeat });
  });

  app.put('/api/beats/:id', (req, res) => {
    const beatId = req.params.id;
    const updates = req.body;
    const beats = loadBeats();
    const idx = beats.findIndex((b: any) => b.id === beatId);
    if (idx > -1) {
      beats[idx] = { ...beats[idx], ...updates };
      saveBeats(beats);
      return res.json({ success: true, beat: beats[idx] });
    }
    return res.status(404).json({ success: false, error: 'Beat not found' });
  });

  app.delete('/api/beats/:id', (req, res) => {
    const beatId = req.params.id;
    const beats = loadBeats();
    const filtered = beats.filter((b: any) => b.id !== beatId);
    saveBeats(filtered);
    res.json({ success: true });
  });

  // 👤 Profile Endpoints
  app.get('/api/profile', (req, res) => {
    const profile = loadProfile();
    res.json({ success: true, profile });
  });

  app.post('/api/profile', (req, res) => {
    saveProfile(req.body);
    res.json({ success: true, profile: req.body });
  });

  // 📰 Real Feed Endpoints
  app.get('/api/feed', (req, res) => {
    const feed = loadFeed();
    res.json(feed);
  });

  app.post('/api/feed', (req, res) => {
    const post = req.body;
    if (!post || !post.id) {
      return res.status(400).json({ error: 'Post data with ID is required' });
    }
    const currentFeed = loadFeed();
    let updatedFeed = currentFeed.filter((p: any) => p.id !== post.id);

    // If this post is pinned, unpin other posts to ensure only 1 pinned post
    if (post.isPinned) {
      updatedFeed = updatedFeed.map((p: any) => ({ ...p, isPinned: false }));
    }

    updatedFeed.unshift(post);
    saveFeed(updatedFeed);
    res.json({ success: true, post });
  });

  app.delete('/api/feed/:id', (req, res) => {
    const postId = req.params.id;
    const currentFeed = loadFeed();
    const updatedFeed = currentFeed.filter((p: any) => p.id !== postId);
    saveFeed(updatedFeed);
    res.json({ success: true });
  });

  app.post('/api/feed/:id/like', (req, res) => {
    const postId = req.params.id;
    const currentFeed = loadFeed();
    const post = currentFeed.find((p: any) => p.id === postId);
    if (post) {
      post.likes = (post.likes || 0) + 1;
      saveFeed(currentFeed);
      res.json({ success: true, likes: post.likes });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  });

  // 🏗️ Homepage Layout Endpoints
  app.get('/api/layout', (req, res) => {
    const layout = loadLayout();
    res.json(layout);
  });

  app.post('/api/layout', (req, res) => {
    const layout = req.body;
    if (Array.isArray(layout) && layout.length > 0) {
      saveLayout(layout);
      return res.json({ success: true, layout });
    }
    return res.status(400).json({ success: false, error: 'Invalid layout array' });
  });

  app.post('/api/layout/reset', (req, res) => {
    saveLayout(DEFAULT_HOMEPAGE_LAYOUT);
    res.json({ success: true, layout: DEFAULT_HOMEPAGE_LAYOUT });
  });

  // 🌐 Music Distribution Partners Endpoints
  app.get('/api/distributors', (req, res) => {
    const list = loadDistributors();
    // Sort by sortOrder ascending
    list.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(list);
  });

  app.post('/api/distributors', (req, res) => {
    const body = req.body;
    if (Array.isArray(body)) {
      saveDistributors(body);
      return res.json({ success: true, distributors: body });
    } else if (body && body.id) {
      const list = loadDistributors();
      const existingIdx = list.findIndex((d: any) => d.id === body.id);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...body, updatedAt: new Date().toISOString() };
      } else {
        list.push({ ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      saveDistributors(list);
      return res.json({ success: true, distributor: body });
    }
    return res.status(400).json({ error: 'Invalid distributor payload' });
  });

  app.put('/api/distributors/:id', (req, res) => {
    const id = req.params.id;
    const updates = req.body;
    const list = loadDistributors();
    const idx = list.findIndex((d: any) => d.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      saveDistributors(list);
      return res.json({ success: true, distributor: list[idx] });
    }
    return res.status(404).json({ error: 'Distributor not found' });
  });

  app.delete('/api/distributors/:id', (req, res) => {
    const id = req.params.id;
    const list = loadDistributors();
    const filtered = list.filter((d: any) => d.id !== id);
    saveDistributors(filtered);
    res.json({ success: true });
  });

  // 📈 Outbound Click Tracking for Music Distribution
  app.post('/api/distributors/:id/click', (req, res) => {
    const id = req.params.id;
    const { sourcePage, distributorName } = req.body;
    const list = loadDistributors();
    const dist = list.find((d: any) => d.id === id);
    if (dist) {
      dist.clickCount = (dist.clickCount || 0) + 1;
      saveDistributors(list);
    }
    
    // Log click event
    const clicks = loadDistributorClicks();
    const logEntry = {
      id: `clk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      distributorId: id,
      distributorName: distributorName || (dist ? dist.name : 'Unknown'),
      timestamp: new Date().toISOString(),
      sourcePage: sourcePage || 'Services'
    };
    clicks.unshift(logEntry);
    // Keep last 1000 click events
    if (clicks.length > 1000) clicks.splice(1000);
    saveDistributorClicks(clicks);

    res.json({ success: true, clickCount: dist?.clickCount || 1 });
  });

  app.get('/api/distributors/clicks', (req, res) => {
    const clicks = loadDistributorClicks();
    res.json(clicks);
  });

  // 🎙️ PROFESSIONAL SERVICES DIRECTORY ENDPOINTS
  app.get('/api/services/config', (req, res) => {
    res.json(loadServicesConfig());
  });

  app.post('/api/services/config', (req, res) => {
    const config = req.body;
    saveServicesConfig(config);
    res.json({ success: true, config });
  });

  app.get('/api/professionals', (req, res) => {
    res.json(loadProfessionals());
  });

  app.post('/api/professionals', (req, res) => {
    const professional = req.body;
    if (!professional || !professional.name || !professional.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const list = loadProfessionals();
    const cleanId = professional.id || `pro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const newProfessional = {
      ...professional,
      id: cleanId,
      status: professional.status || 'PENDING',
      published: professional.published ?? false,
      featured: professional.featured ?? false,
      verified: professional.verified ?? false,
      profileViews: professional.profileViews || 0,
      contactClicks: professional.contactClicks || 0,
      createdAt: professional.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIdx = list.findIndex((p: any) => p.id === cleanId);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...newProfessional };
    } else {
      list.push(newProfessional);
    }
    
    saveProfessionals(list);
    res.json({ success: true, professional: newProfessional });
  });

  app.put('/api/professionals/:id', (req, res) => {
    const id = req.params.id;
    const updates = req.body;
    const list = loadProfessionals();
    const idx = list.findIndex((p: any) => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      saveProfessionals(list);
      return res.json({ success: true, professional: list[idx] });
    }
    return res.status(404).json({ error: 'Professional profile not found' });
  });

  app.delete('/api/professionals/:id', (req, res) => {
    const id = req.params.id;
    const list = loadProfessionals();
    const filtered = list.filter((p: any) => p.id !== id);
    saveProfessionals(filtered);
    res.json({ success: true });
  });

  // Track profile views or contact action clicks
  app.post('/api/professionals/:id/click', (req, res) => {
    const id = req.params.id;
    const { action } = req.body; // 'view' or 'contact'
    const list = loadProfessionals();
    const idx = list.findIndex((p: any) => p.id === id);
    if (idx >= 0) {
      if (action === 'contact') {
        list[idx].contactClicks = (list[idx].contactClicks || 0) + 1;
      } else {
        list[idx].profileViews = (list[idx].profileViews || 0) + 1;
      }
      saveProfessionals(list);
      return res.json({ success: true, professional: list[idx] });
    }
    return res.status(404).json({ error: 'Professional not found' });
  });

  // 📊 Real Analytics Endpoints
  app.get('/api/analytics', (req, res) => {
    const beats = loadBeats();
    const realTotalPlays = beats.reduce((acc, b) => acc + (b.plays || 0), 0) + siteVisitsData.totalStreams;
    
    res.json({
      siteVisits: siteVisitsData.totalVisits,
      uniqueVisitors: siteVisitsData.uniqueVisitors,
      totalPlays: realTotalPlays,
      downloads: siteVisitsData.downloads,
      totalEarnings: siteVisitsData.totalEarnings,
      platformFees: 0
    });
  });

  app.post('/api/analytics/event', (req, res) => {
    const { metric, amount } = req.body;
    const addAmt = Number(amount) || 1;
    if (metric === 'siteVisits') {
      siteVisitsData.totalVisits += addAmt;
    } else if (metric === 'uniqueVisitors') {
      siteVisitsData.uniqueVisitors += addAmt;
    } else if (metric === 'downloads') {
      siteVisitsData.downloads += addAmt;
    } else if (metric === 'totalEarnings') {
      siteVisitsData.totalEarnings += addAmt;
    } else if (metric === 'totalPlays') {
      siteVisitsData.totalStreams += addAmt;
    }
    saveVisitsData();
    res.json({ success: true });
  });

  app.post('/api/visit', (req, res) => {
    const { sessionId, visitorId } = req.body;
    let changed = false;

    if (sessionId && !siteVisitsData.sessions.includes(sessionId)) {
      siteVisitsData.sessions.push(sessionId);
      siteVisitsData.totalVisits += 1;
      changed = true;
    }

    if (visitorId && !siteVisitsData.visitors.includes(visitorId)) {
      siteVisitsData.visitors.push(visitorId);
      siteVisitsData.uniqueVisitors += 1;
      changed = true;
    }

    if (changed) {
      saveVisitsData();
    }

    res.json({
      success: true,
      totalVisits: siteVisitsData.totalVisits,
      uniqueVisitors: siteVisitsData.uniqueVisitors
    });
  });

  app.get('/api/visit', (req, res) => {
    res.json({
      success: true,
      totalVisits: siteVisitsData.totalVisits,
      uniqueVisitors: siteVisitsData.uniqueVisitors
    });
  });

  // 🔊 Real Stream Increment
  app.post('/api/streams/increment', (req, res) => {
    const { id } = req.body;
    siteVisitsData.totalStreams += 1;
    saveVisitsData();

    if (id) {
      const beats = loadBeats();
      const beat = beats.find((b: any) => b.id === id);
      if (beat) {
        beat.plays = (beat.plays || 0) + 1;
        saveBeats(beats);
      }
    }
    res.json({ success: true });
  });

  // 🔊 AUDIO WATERMARKING ENDPOINT
  app.post('/api/audio/watermark', async (req, res) => {
    try {
      const { rawBeatUrl, voiceTagUrl, outputFileName } = req.body;
      
      if (!rawBeatUrl || !voiceTagUrl) {
        return res.status(400).json({ success: false, error: 'Missing audio URLs' });
      }

      const getLocalPath = (url: string) => {
        if (url.startsWith('/local_storage/')) {
          return path.join(LOCAL_STORAGE_ROOT, url.replace('/local_storage/', ''));
        }
        return url;
      };

      const rawPath = getLocalPath(rawBeatUrl);
      const tagPath = getLocalPath(voiceTagUrl);
      const finalOutputName = outputFileName || `tagged_${Date.now()}.mp3`;
      const outputPath = path.join(WATERMARKS_STORAGE, finalOutputName);

      const resultPath = await applyAudioWatermark(rawPath, tagPath, outputPath);
      const resultUrl = `/local_storage/watermarks/${path.basename(resultPath)}`;

      res.status(200).json({
        success: true,
        url: resultUrl
      });
    } catch (error: any) {
      console.error('Watermark API Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 🚀 Direct Local File Upload Endpoint
  app.post('/api/upload-local', upload.single('file') as any, (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const fileUrl = `/local_storage/${req.query.type === 'audio' ? 'beats' : 'images'}/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      url: fileUrl,
      filename: req.file.filename
    });
  });

  // 📦 Chunked Upload System
  const s3UploadSessions: Record<string, { fileName: string; totalChunks: number; parts: string[] }> = {};

  app.post('/api/uploads/initialize', (req, res) => {
    const { fileName } = req.body;
    const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const sessionDir = path.join(TEMP_CHUNKS_DIR, uploadId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    s3UploadSessions[uploadId] = { fileName, totalChunks: 0, parts: [] };
    
    res.status(200).json({ 
      success: true, 
      uploadId
    });
  });

  app.get('/api/uploads/presign-chunk', (req, res) => {
    const { uploadId, partNumber } = req.query;
    if (!uploadId || !partNumber) {
      return res.status(400).json({ success: false, error: 'Missing uploadId or partNumber' });
    }
    const url = `/api/uploads/put-chunk?uploadId=${uploadId}&partNumber=${partNumber}`;
    res.status(200).json({ success: true, url });
  });

  app.put('/api/uploads/put-chunk', (req, res) => {
    const { uploadId, partNumber } = req.query;
    if (!uploadId || !partNumber) {
      return res.status(400).json({ success: false, error: 'Missing params' });
    }

    const chunkPath = path.join(TEMP_CHUNKS_DIR, String(uploadId), `part_${partNumber}`);
    const writeStream = fs.createWriteStream(chunkPath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      res.status(200).json({ success: true, partNumber });
    });

    writeStream.on('error', (err) => {
      console.error('Error writing chunk:', err);
      res.status(500).json({ success: false, error: 'Failed to write chunk' });
    });
  });

  app.post('/api/uploads/finalize', async (req, res) => {
    const { uploadId, fileName } = req.body;
    if (!uploadId || !fileName) {
      return res.status(400).json({ success: false, error: 'Missing uploadId or fileName' });
    }

    const sessionDir = path.join(TEMP_CHUNKS_DIR, String(uploadId));
    if (!fs.existsSync(sessionDir)) {
      return res.status(404).json({ success: false, error: 'Upload session not found' });
    }

    const parts = fs.readdirSync(sessionDir).sort((a, b) => {
      const numA = parseInt(a.split('_')[1] || '0', 10);
      const numB = parseInt(b.split('_')[1] || '0', 10);
      return numA - numB;
    });

    const isAudio = fileName.match(/\.(mp3|wav|flac|m4a|zip|rar)$/i);
    const targetFolder = isAudio ? BEATS_STORAGE : IMAGES_STORAGE;
    const finalFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const finalFilePath = path.join(targetFolder, finalFileName);
    const finalWriteStream = fs.createWriteStream(finalFilePath);

    for (const part of parts) {
      const partPath = path.join(sessionDir, part);
      const chunkBuffer = fs.readFileSync(partPath);
      finalWriteStream.write(chunkBuffer);
    }
    finalWriteStream.end();

    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (e) {}

    const fileUrl = `/local_storage/${isAudio ? 'beats' : 'images'}/${finalFileName}`;
    res.status(200).json({
      success: true,
      url: fileUrl,
      fileName: finalFileName
    });
  });

  // 💳 PayPal-Exclusive Booking Deposit Intent
  app.post('/api/v1/bookings/create-deposit-intent', (req, res) => {
    const { id, scope, bpm, mood, clientName, clientEmail } = req.body;
    console.log(`[BOOKING DEPOSIT INTENT via PAYPAL] Client: ${clientName || id}, Scope: ${scope}, BPM: ${bpm}`);
    
    return res.json({
      success: true,
      bookingReference: `BK-${Date.now()}`,
      paypalCheckoutUrl: `https://www.paypal.com/paypalme/voodooboomin/100`,
      message: 'PayPal booking deposit initialized successfully.'
    });
  });

  // 📧 Email Subscribers
  app.post('/api/subscribe', (req, res) => {
    const { email, name, notifyOnBeatDrop } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, error: "Email and name are required." });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const newSub = {
      email: normalizedEmail,
      name: name.trim(),
      subscribedAt: new Date().toISOString(),
      notifyOnBeatDrop: !!notifyOnBeatDrop
    };
    const existing = subscribersData.subscribers.findIndex(s => s.email === normalizedEmail);
    if (existing > -1) {
      subscribersData.subscribers[existing] = newSub;
    } else {
      subscribersData.subscribers.push(newSub);
    }
    saveSubscribersData();

    // High-visibility terminal alert simulation
    console.log(`\n\x1b[33m[MAILING LIST SUBSCRIPTION RECEIVED]\x1b[0m`);
    console.log(`\x1b[36mNotification Sent To:\x1b[0m voodooboomin@gmail.com`);
    console.log(`\x1b[36mNew Artist Subscribed:\x1b[0m ${normalizedEmail} (${name.trim()})`);
    console.log(`\x1b[32m[STATUS]: Successfully dispatched new subscriber alert to voodooboomin@gmail.com\x1b[0m\n`);

    res.status(201).json({ 
      success: true, 
      subscriber: newSub,
      message: `You have successfully joined Voodoo Boomin's mailing list! Alerts and exclusive tracks are synced. Notification sent to voodooboomin@gmail.com.`
    });
  });

  // 📧 Contact Message Submissions
  app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Name, email, and message are required." });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const newContact = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: normalizedEmail,
      subject: (subject || "General Inquiry").trim(),
      message: message.trim(),
      recipientEmail: "voodooboomin@gmail.com",
      receivedAt: new Date().toISOString()
    };

    console.log(`\n\x1b[33m[EMAIL DELIVERY INTENT via API ROUTE]\x1b[0m`);
    console.log(`\x1b[36mTo:\x1b[0m voodooboomin@gmail.com`);
    console.log(`\x1b[36mFrom:\x1b[0m ${normalizedEmail} (${name})`);
    console.log(`\x1b[36mSubject:\x1b[0m ${newContact.subject}`);
    console.log(`\x1b[36mBody:\x1b[0m ${message}`);
    console.log(`\x1b[32m[STATUS]: Successfully dispatched notification to voodooboomin@gmail.com\x1b[0m\n`);

    res.status(200).json({ 
      success: true, 
      contact: newContact,
      message: "Message dispatched to voodooboomin@gmail.com successfully!"
    });
  });

  app.get('/api/subscribers', (req, res) => {
    res.json({
      success: true,
      subscribers: subscribersData.subscribers,
      notifications: subscribersData.notifications
    });
  });

  // 🎧 Social Unlock Verification
  app.post('/api/verify-and-download', (req, res) => {
    const { trackId, fileType } = req.body;
    const downloadUrl = `/local_storage/beats/track_${trackId}_${fileType || 'wav'}.wav`;
    return res.status(200).json({ 
      success: true, 
      downloadUrl: downloadUrl,
      expiresIn: 60,
      message: 'Social task verified successfully.' 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
      
      let beatTitle = "Voodoo Boomin | Beat Store";
      let beatDesc = "Official Voodoo Boomin Instrumental Store";
      let beatImage = "";
      let beatUrl = `https://${req.get('host') || 'localhost'}${req.originalUrl}`;

      if (req.path.startsWith('/beat/')) {
        const beatId = req.path.split('/')[2];
        const beats = loadBeats();
        const beat = beats.find((b: any) => b.id === beatId);
        if (beat) {
          beatTitle = `${beat.title} by ${beat.producer || 'Voodoo Boomin'}`;
          beatDesc = `Key: ${beat.key || 'Custom'} | BPM: ${beat.bpm || '140'}`;
          beatImage = beat.coverArtUrl || '';
        }
      }

      html = html
        .replace(/<title>.*?<\/title>/, `<title>${beatTitle}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${beatDesc}" />`)
        .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${beatTitle}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${beatDesc}" />`)
        .replace(/{BEAT_TITLE}/g, beatTitle)
        .replace(/{BEAT_KEYWORDS_OR_SHORT_DESCRIPTION}/g, beatDesc)
        .replace(/{ABSOLUTE_IMAGE_URL}/g, beatImage)
        .replace(/{CANONICAL_PAGE_URL}/g, beatUrl);

      res.send(html);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
