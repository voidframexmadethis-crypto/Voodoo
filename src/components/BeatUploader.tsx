import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { 
  Upload, Image as ImageIcon, Music, CheckCircle2, ChevronRight, ChevronLeft, 
  Sparkles, AlertCircle, Trash2, Loader2, Play, Pause, Layers, Globe, 
  Shield, Info, FileAudio, FileImage, Tag, Sliders, DollarSign, HelpCircle, Eye, EyeOff,
  Save, Check, AlertTriangle
} from 'lucide-react';
import { Beat, License, Tier, SocialUnlock } from '../types';
import { analyzeAudioFile } from '../lib/audioAnalyzer';
import TrackPlayer from './TrackPlayer';

const steps = [
  { id: '01', label: 'FILES', title: 'Files & Artwork' },
  { id: '02', label: 'INFO', title: 'Basic Information' },
  { id: '03', label: 'METADATA', title: 'Music Metadata' },
  { id: '04', label: 'LICENSE', title: 'Pricing & Licenses' },
  { id: '05', label: 'SETTINGS', title: 'Advanced Settings' },
  { id: '06', label: 'MARKETING', title: 'Marketing & Promo' },
  { id: '07', label: 'REVIEW', title: 'Review & Publish' }
];

const WaveformVisualizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const [bars, setBars] = useState<number[]>(Array.from({ length: 40 }, () => Math.random() * 80 + 20));

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setBars(Array.from({ length: 40 }, () => Math.random() * 80 + 20));
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-[3px] h-12 w-full px-4 bg-neutral-950/60 border border-neutral-900 rounded-xl overflow-hidden justify-center">
      {bars.map((height, i) => (
        <div 
          key={i} 
          className={`w-[3px] rounded-full transition-all duration-150 ${isPlaying ? 'bg-indigo-500/80 animate-pulse' : 'bg-neutral-800'}`}
          style={{ height: isPlaying ? `${height}%` : '30%' }}
        />
      ))}
    </div>
  );
};

export default function BeatUploader() {
  const { addBeat } = useStore();
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isDevMode = !user;

  // Navigation steps state
  const [currentStep, setCurrentStep] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [instrumentInput, setInstrumentInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const [showAdvancedMetadata, setShowAdvancedMetadata] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    producer: 'Voodoo Boomin',
    bpm: 130,
    key: 'C Minor',
    mode: 'Minor',
    price: 35.00,
    coverArtUrl: '',
    audioUrl: '',
    untaggedWavUrl: '',
    untaggedMp3Url: '',
    stemsZipUrl: '',
    externalStemUrl: '',
    externalStemPassword: '',
    voiceTagUrl: '',
    description: '',
    credits: '',
    mood: [] as string[],
    tags: [] as string[],
    primaryGenre: 'Hip Hop',
    secondaryGenre: '',
    releaseDate: new Date().toISOString().split('T')[0],
    gear: '',
    instruments: [] as string[],
    sampledContent: false,
    sampleDetails: '',
    isHumanOriginal: true,
    isExplicit: false,
    isInstrumental: true,
    vocalPresence: false,
    productionYear: new Date().getFullYear(),
    isrcCode: '',
    iswcCode: '',
    typeBeat: '',
    energyLevel: 'Moderate',
    trackTypeClassification: 'Beat' as 'Beat' | 'Vocal Topline' | 'Chorus' | 'Full Song',
    isFeatured: false,
    linkedBeatId: '',
    freeToSingTerms: '',
    
    // Licenses
    directPriceOnly: false,
    basicMp3LeaseEnabled: true,
    basicMp3LeasePrice: 29.99,
    premiumWavLeaseEnabled: true,
    premiumWavLeasePrice: 49.99,
    trackoutsLeaseEnabled: true,
    trackoutsLeasePrice: 99.99,
    unlimitedLeaseEnabled: false,
    unlimitedLeasePrice: 199.99,
    exclusiveRightsEnabled: false,
    exclusiveRightsPrice: 500.00,
    
    // Free Download Settings
    freeDownloadEnabled: false,
    freeDeliveryVariant: 'Watermarked Preview',
    requireEmail: true,
    socialUnlockModule: 'None',
    youtubeChannelId: '',
    
    // Advanced Settings
    visibilityPlacement: 'Public',
    youtubeContentIdEnrollment: 'Opt-out',
    coProducers: '',
    revSplitPercent: 100,
    contractTermsLink: '',
    redirectUrl: '',

    // Marketing Setup
    socialPostTitle: '',
    socialPostCaption: '',
    autoMailingNotification: true,
    shortVideoPrompt: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    }
  };

  const handleInstrumentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newInst = instrumentInput.trim();
      if (newInst && !formData.instruments.includes(newInst)) {
        setFormData(prev => ({ ...prev, instruments: [...prev.instruments, newInst] }));
      }
      setInstrumentInput('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== indexToRemove)
    }));
  };

  const removeInstrument = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      instruments: prev.instruments.filter((_, i) => i !== indexToRemove)
    }));
  };

  const toggleMood = (moodName: string) => {
    setFormData(prev => {
      const activeMoods = prev.mood.includes(moodName)
        ? prev.mood.filter(m => m !== moodName)
        : [...prev.mood, moodName];
      return { ...prev, mood: activeMoods };
    });
  };

  const applyPresetTemplate = (preset: 'trap' | 'drill' | 'rb') => {
    if (preset === 'trap') {
      setFormData(prev => ({
        ...prev,
        primaryGenre: 'Trap',
        bpm: 140,
        key: 'E Minor',
        mood: ['Aggressive', 'Bouncy', 'Dark'],
        tags: ['trap', '808', 'hard', 'atlanta']
      }));
    } else if (preset === 'drill') {
      setFormData(prev => ({
        ...prev,
        primaryGenre: 'Drill',
        bpm: 142,
        key: 'F Minor',
        mood: ['Dark', 'Aggressive', 'Energetic'],
        tags: ['drill', 'uk', 'ny', 'sliding808']
      }));
    } else if (preset === 'rb') {
      setFormData(prev => ({
        ...prev,
        primaryGenre: 'R&B',
        bpm: 95,
        key: 'Ab Major',
        mood: ['Chill', 'Smooth', 'Emotional'],
        tags: ['rb', 'smooth', 'guitar', 'vibe']
      }));
    }
  };

  // Safe chunked uploading support
  const handleFileUpload = async (files: FileList | null, type: 'audio' | 'image', role: 'tagged' | 'untagged' | 'untaggedMp3' | 'stems' | 'tag' = 'tagged') => {
    if (!files || files.length === 0) return;
    
    // Validation check: Prevent uploading full ZIP packs into single beat audio slot
    if (type === 'audio' && role !== 'stems') {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.name.toLowerCase().endsWith('.zip') || f.type === 'application/zip') {
          alert('Notice: You selected a ZIP file for a single beat audio track. To upload a complete Beat Pack containing multiple tracks, please switch to the [BEAT PACK] tab. If this is a stems ZIP, please attach it to the Stems ZIP field.');
          return;
        }
      }
    }
    
    setIsUploading(true);
    const fileArray = Array.from(files);
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

    for (const file of fileArray) {
      const fileId = Math.random().toString(36).substring(7);
      let instantObjectUrl = '';
      try {
        instantObjectUrl = URL.createObjectURL(file);
      } catch (e) {}

      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const bpmMatch = file.name.match(/(\d{2,3})\s*bpm/i);
      const extractedBpm = bpmMatch ? Number(bpmMatch[1]) : 130;

      if (type === 'audio') {
        setFormData(prev => ({
          ...prev, 
          audioUrl: (role === 'tagged' && !prev.audioUrl) ? instantObjectUrl : prev.audioUrl,
          untaggedWavUrl: (role === 'untagged' && !prev.untaggedWavUrl) ? instantObjectUrl : prev.untaggedWavUrl,
          untaggedMp3Url: (role === 'untaggedMp3' && !prev.untaggedMp3Url) ? instantObjectUrl : prev.untaggedMp3Url,
          stemsZipUrl: (role === 'stems' && !prev.stemsZipUrl) ? instantObjectUrl : prev.stemsZipUrl,
          voiceTagUrl: (role === 'tag' && !prev.voiceTagUrl) ? instantObjectUrl : prev.voiceTagUrl,
          title: prev.title || cleanTitle,
          bpm: prev.bpm || extractedBpm
        }));
        setUploadedFiles(prev => [...prev, file]);
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      } else {
        setFormData(prev => ({ ...prev, coverArtUrl: prev.coverArtUrl || instantObjectUrl }));
      }

      if (isDevMode) {
        if (type === 'audio') {
          try {
            const sessionResponse = await fetch('/api/uploads/initialize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileName: file.name, fileSize: file.size })
            });
            const { uploadId } = await sessionResponse.json();

            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            for (let i = 0; i < totalChunks; i++) {
              const start = i * CHUNK_SIZE;
              const end = Math.min(start + CHUNK_SIZE, file.size);
              const chunk = file.slice(start, end);

              const presignedUrlResp = await fetch(`/api/uploads/presign-chunk?uploadId=${uploadId}&partNumber=${i+1}`);
              const { url } = await presignedUrlResp.json();

              await fetch(url, { method: 'PUT', body: chunk });
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: Math.round(((i + 1) / totalChunks) * 100)
              }));
            }

            const finalizeRes = await fetch('/api/uploads/finalize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uploadId, fileName: file.name })
            });
            const finalData = await finalizeRes.json();
            
            if (finalData.success) {
              setFormData(prev => {
                if (role === 'tagged') return { ...prev, audioUrl: finalData.url };
                if (role === 'untagged') return { ...prev, untaggedWavUrl: finalData.url };
                if (role === 'stems') return { ...prev, stemsZipUrl: finalData.url };
                if (role === 'tag') return { ...prev, voiceTagUrl: finalData.url };
                return prev;
              });
            }
          } catch (err) {
            console.error("Chunked upload session error:", err);
          } finally {
            setIsUploading(false);
          }
        } else {
          const formDataPayload = new FormData();
          formDataPayload.append('file', file);
          fetch(`/api/upload-local?type=${type}`, {
            method: 'POST',
            body: formDataPayload,
          })
            .then(res => res.json())
            .then(result => {
              if (result.success) {
                setFormData(prev => ({ ...prev, coverArtUrl: result.url }));
              }
            })
            .catch(err => console.error("Cover Art upload error:", err))
            .finally(() => setIsUploading(false));
        }
      } else if (user) {
        const storagePath = type === 'audio' ? `beats/${user.uid}/${fileId}_${file.name}` : `artworks/${user.uid}/${fileId}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({ ...prev, [file.name]: Math.round(progress) }));
          }, 
          (error) => { console.error('Firebase upload failed:', error); setIsUploading(false); }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData(prev => {
              if (type === 'image') return { ...prev, coverArtUrl: downloadURL };
              if (role === 'tagged') return { ...prev, audioUrl: downloadURL };
              if (role === 'untagged') return { ...prev, untaggedWavUrl: downloadURL };
              if (role === 'stems') return { ...prev, stemsZipUrl: downloadURL };
              if (role === 'tag') return { ...prev, voiceTagUrl: downloadURL };
              return prev;
            });
            setIsUploading(false);
          }
        );
      }
    }
  };

  const triggerAudioAnalysis = async () => {
    if (uploadedFiles.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisNotice("Extracting transients, root key scale, and tempo...");
    try {
      const result = await analyzeAudioFile(uploadedFiles[0]);
      setFormData(prev => ({
        ...prev,
        bpm: result.bpm,
        key: result.key,
        mode: result.mode
      }));
      setAnalysisNotice(`Acoustic Profile Detected! BPM: ${result.bpm} | Key: ${result.key} (${result.mode})`);
    } catch (e) {
      setAnalysisNotice("Standard sonic calibration model loaded.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateWatermark = async () => {
    if (!formData.untaggedWavUrl || !formData.voiceTagUrl) return;
    setIsUploading(true);
    setAnalysisNotice("Rendering final tagged stream with watermarked audio protection overlays...");
    try {
      const res = await fetch('/api/audio/watermark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawBeatUrl: formData.untaggedWavUrl,
          voiceTagUrl: formData.voiceTagUrl,
          outputFileName: `tagged_${formData.title.replace(/\s+/g, '_')}_${Date.now()}.mp3`
        })
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, audioUrl: data.url }));
        setAnalysisNotice("✓ Dynamic watermark overlay rendered successfully!");
      }
    } catch (err) {
      console.error("Watermarking error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    const finalTitle = (formData.title || 'New Beat').trim();
    const finalAudioUrl = formData.audioUrl || formData.untaggedWavUrl || '';
    const finalRedirectUrl = formData.redirectUrl || `/player?track=${encodeURIComponent(finalTitle)}`;

    const newBeat: Beat = {
      id: 'beat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: finalTitle,
      producer: formData.producer || 'Voodoo Boomin',
      bpm: Number(formData.bpm) || 130,
      key: formData.key || 'C Minor',
      mode: formData.mode || 'Minor',
      price: Number(formData.price) || 35.00,
      coverArtUrl: formData.coverArtUrl || '',
      audioUrl: finalAudioUrl,
      untaggedWavUrl: formData.untaggedWavUrl,
      untaggedMp3Url: formData.untaggedMp3Url,
      stemsZipUrl: formData.stemsZipUrl,
      externalStemUrl: formData.externalStemUrl,
      externalStemPassword: formData.externalStemPassword,
      redirectUrl: finalRedirectUrl,
      visibility: (formData.visibilityPlacement as any) || 'Public',
      trackType: 'Beat',
      trackTypeClassification: formData.trackTypeClassification,
      isFeatured: formData.isFeatured,
      isHumanUploaded: true,
      isLocal: true,
      directPriceOnly: formData.directPriceOnly,
      licenses: {
        mp3Lease: { enabled: !formData.directPriceOnly && formData.basicMp3LeaseEnabled, price: Number(formData.basicMp3LeasePrice) || 29.99 },
        wavLease: { enabled: !formData.directPriceOnly && formData.premiumWavLeaseEnabled, price: Number(formData.premiumWavLeasePrice) || 49.99 },
        premiumLease: { enabled: !formData.directPriceOnly && formData.trackoutsLeaseEnabled, price: Number(formData.trackoutsLeasePrice) || 99.99 },
        unlimitedLease: { enabled: !formData.directPriceOnly && formData.unlimitedLeaseEnabled, price: Number(formData.unlimitedLeasePrice) || 199.99 },
        exclusive: { enabled: !formData.directPriceOnly && formData.exclusiveRightsEnabled, price: Number(formData.exclusiveRightsPrice) || 500.00 },
      },
      socialUnlocks: formData.socialUnlockModule !== 'None' ? [{
        id: 'su_' + Date.now(),
        requiredAction: formData.socialUnlockModule as any,
        targetAccountId: formData.youtubeChannelId,
        freeDownloadFileType: formData.freeDeliveryVariant as any || 'MP3'
      }] : [],
      freeDownload: {
        enabled: formData.freeDownloadEnabled || formData.socialUnlockModule !== 'None',
        requirement: formData.requireEmail ? 'email' : 'none',
        protection: formData.freeDeliveryVariant === 'Clean File (Untagged)' ? 'untagged' : 'tagged',
        redirectUrl: finalRedirectUrl,
      },
      isExclusive: formData.exclusiveRightsEnabled,
      contentIdEnabled: formData.youtubeContentIdEnrollment === 'Opt-in',
      mood: formData.mood.length > 0 ? formData.mood : ['Dark'],
      tags: formData.tags,
      releaseDate: formData.releaseDate || new Date().toISOString(),
      gear: formData.gear,
      instruments: formData.instruments,
      primaryGenre: formData.primaryGenre,
      secondaryGenre: formData.secondaryGenre,
      isExplicit: formData.isExplicit,
      isInstrumental: formData.isInstrumental,
      productionYear: Number(formData.productionYear) || new Date().getFullYear(),
      isrcCode: formData.isrcCode,
    };

    try {
      await addBeat(newBeat);
    } catch (err) {
      console.warn("addBeat callback warn:", err);
    }

    try {
      playTrack(newBeat);
    } catch (e) {}

    try {
      await fetch('/api/notify-beat-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatTitle: newBeat.title,
          producer: newBeat.producer,
          bpm: newBeat.bpm,
          key: newBeat.key,
          coverArtUrl: newBeat.coverArtUrl
        })
      });
    } catch (e) {}

    navigate('/');
  };

  // Input verification list for review step
  const getValidationErrors = () => {
    const errors: string[] = [];
    if (!formData.title.trim()) errors.push("Beat title is a required property.");
    if (!formData.audioUrl && !formData.untaggedWavUrl) errors.push("Either a Tagged MP3 or Untagged WAV master file must be uploaded.");
    if (!formData.coverArtUrl) errors.push("Cover artwork has not been uploaded.");
    return errors;
  };

  const validationErrors = getValidationErrors();

  return (
    <div className="w-full max-w-6xl mx-auto pb-24 px-4 sm:px-6 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-extrabold font-mono">VOODOO LABS</span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1 text-white">Vamp Studio</h1>
          <p className="text-neutral-400 text-sm mt-1">High fidelity workflow to upload stems, configure smart pricing contracts, and schedule drops.</p>
        </div>
        
        {isDevMode && (
          <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl flex items-center gap-2 self-start md:self-auto shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-neutral-300 tracking-wider">DEV ENVIRONMENT ACTIVE</span>
          </div>
        )}
      </div>

      {/* 7-Step Navigation System */}
      <div className="mb-10 overflow-x-auto select-none no-scrollbar pb-2">
        <div className="flex justify-between items-center min-w-[760px] gap-2 px-1">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            const isUpcoming = idx > currentStep;
            const hasStepErrors = idx === 6 && validationErrors.length > 0;

            return (
              <button
                key={step.id}
                onClick={() => idx <= currentStep && setCurrentStep(idx)}
                disabled={idx > currentStep}
                className={`flex-1 text-left p-3.5 rounded-xl border transition-all relative ${
                  isActive 
                    ? 'bg-neutral-900 border-indigo-500/80 shadow-lg shadow-indigo-500/5' 
                    : isCompleted 
                      ? 'bg-neutral-950 hover:bg-neutral-900 border-neutral-800' 
                      : 'bg-neutral-950/40 border-neutral-900/60 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-black border transition-colors ${
                    isActive 
                      ? 'bg-indigo-500 border-indigo-400 text-white' 
                      : isCompleted 
                        ? 'bg-neutral-900 border-neutral-800 text-indigo-400' 
                        : 'bg-neutral-950 border-neutral-900 text-neutral-600'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-black tracking-widest leading-none ${
                      isActive ? 'text-indigo-400' : isCompleted ? 'text-neutral-400' : 'text-neutral-600'
                    }`}>{step.label}</p>
                    <p className={`text-[12px] font-bold truncate mt-0.5 ${
                      isActive ? 'text-white' : isCompleted ? 'text-neutral-300' : 'text-neutral-500'
                    }`}>{step.title}</p>
                  </div>
                </div>

                {hasStepErrors && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form container */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 md:p-10 shadow-2xl relative mb-8">
        
        {/* STEP 1: FILES & ARTWORK */}
        {currentStep === 0 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Audio & Artwork Workspace</h2>
                  <p className="text-neutral-400 text-xs mt-1">Upload high-res audio stems and visual covers to trigger AI acoustic models.</p>
                </div>
                <span className="text-xs font-mono text-neutral-500">Step 1 of 7</span>
              </div>

              {/* Sonic analyzer warning alert if present */}
              {analysisNotice && (
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3 text-indigo-300 text-xs mb-6">
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400 flex-shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  )}
                  <p className="font-bold">{analysisNotice}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Audio Master Files Box (7 columns) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Track Preference Templates */}
                  <div className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">Track Preference Templates</p>
                      <p className="text-[11px] text-neutral-400">Apply saved genre, BPM, and mood presets instantly</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => applyPresetTemplate('trap')} className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Trap Preset</button>
                      <button type="button" onClick={() => applyPresetTemplate('drill')} className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">Drill Preset</button>
                      <button type="button" onClick={() => applyPresetTemplate('rb')} className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">R&B Preset</button>
                    </div>
                  </div>

                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-neutral-400">Audio Deliverables</h3>

                  {/* Primary drag-drop area */}
                  <div 
                    className="border border-dashed border-neutral-800 rounded-2xl p-8 text-center bg-neutral-900/10 hover:border-indigo-500/40 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('mp3-upload-input')?.click()}
                  >
                    <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-neutral-200">Drag & drop raw audio file here</p>
                    <p className="text-[11px] text-neutral-500 mt-1">Accepts MP3 and WAV lossless formats</p>
                    <input id="mp3-upload-input" type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'audio', 'tagged')} />
                  </div>

                  {/* Files Lists inside sleek cards */}
                  <div className="space-y-4">
                    
                    {/* MP3 TAGGED */}
                    <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/5 flex items-center justify-center border border-indigo-500/15">
                          <Music className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-neutral-300">Tagged Audio Preview (MP3)</p>
                          <p className="text-[11px] text-neutral-500">Watermarked preview track shared publicly for stream pools</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {formData.audioUrl ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-400 font-extrabold">✓ Loaded</span>
                            <button type="button" onClick={() => setFormData(p => ({ ...p, audioUrl: '' }))} className="text-neutral-500 hover:text-red-400 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => document.getElementById('raw-mp3-upload')?.click()}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-[11px] font-bold py-2 px-3.5 rounded-lg transition-colors"
                          >
                            Upload MP3
                          </button>
                        )}
                        <input id="raw-mp3-upload" type="file" accept="audio/mpeg,audio/mp3" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'audio', 'tagged')} />
                      </div>
                    </div>

                    {/* WAV UNTAGGED */}
                    <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/5 flex items-center justify-center border border-emerald-500/15">
                          <FileAudio className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-neutral-300">Untagged Master (WAV)</p>
                          <p className="text-[11px] text-neutral-500">Lossless primary file packed with WAV purchase tiers</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {formData.untaggedWavUrl ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-400 font-extrabold">✓ Loaded</span>
                            <button type="button" onClick={() => setFormData(p => ({ ...p, untaggedWavUrl: '' }))} className="text-neutral-500 hover:text-red-400 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => document.getElementById('raw-wav-upload')?.click()}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-[11px] font-bold py-2 px-3.5 rounded-lg transition-colors"
                          >
                            Upload WAV
                          </button>
                        )}
                        <input id="raw-wav-upload" type="file" accept="audio/wav,audio/x-wav" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'audio', 'untagged')} />
                      </div>
                    </div>

                    {/* MP3 UNTAGGED MASTER */}
                    <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/5 flex items-center justify-center border border-indigo-500/15">
                          <Music className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-neutral-300">Untagged Master (MP3)</p>
                          <p className="text-[11px] text-neutral-500">High-bitrate clean MP3 for standard MP3 lease delivery</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {formData.untaggedMp3Url ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-400 font-extrabold">✓ Loaded</span>
                            <button type="button" onClick={() => setFormData(p => ({ ...p, untaggedMp3Url: '' }))} className="text-neutral-500 hover:text-red-400 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => document.getElementById('raw-untagged-mp3-upload')?.click()}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-[11px] font-bold py-2 px-3.5 rounded-lg transition-colors"
                          >
                            Upload MP3 Master
                          </button>
                        )}
                        <input id="raw-untagged-mp3-upload" type="file" accept="audio/mpeg,audio/mp3" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'audio', 'untaggedMp3')} />
                      </div>
                    </div>

                    {/* EXTERNAL STEM HOSTING & PASSWORD */}
                    <div className="bg-neutral-900/30 border border-neutral-900 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-extrabold text-white">External Stem Hosting Link (Optional)</p>
                          <p className="text-[11px] text-neutral-500">Dropbox / Google Drive secure link for large multi-gigabyte stem archives</p>
                        </div>
                        <Globe className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="url"
                          name="externalStemUrl"
                          value={formData.externalStemUrl}
                          onChange={handleChange}
                          placeholder="https://dropbox.com/s/..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="password"
                          name="externalStemPassword"
                          value={formData.externalStemPassword}
                          onChange={handleChange}
                          placeholder="Password protection key (optional)"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* STEMS ZIP */}
                    <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/15">
                          <Layers className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-neutral-300">Trackout Stems (ZIP Archive)</p>
                          <p className="text-[11px] text-neutral-500">Separated master tracks (drums, synths, bass, vocals)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {formData.stemsZipUrl ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-400 font-extrabold">✓ Loaded</span>
                            <button type="button" onClick={() => setFormData(p => ({ ...p, stemsZipUrl: '' }))} className="text-neutral-500 hover:text-red-400 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => document.getElementById('raw-zip-upload')?.click()}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-[11px] font-bold py-2 px-3.5 rounded-lg transition-colors"
                          >
                            Upload ZIP
                          </button>
                        )}
                        <input id="raw-zip-upload" type="file" accept=".zip,.rar,.7z" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'audio', 'stems')} />
                      </div>
                    </div>

                    {/* PROMOTIONAL WATERMARK TAG */}
                    <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/5 flex items-center justify-center border border-purple-500/15">
                          <Shield className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-neutral-300">Protection Voice Tag (Optional)</p>
                          <p className="text-[11px] text-neutral-500">Audio watermarks mixed with preview streams automatically</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {formData.voiceTagUrl ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-400 font-extrabold">✓ Loaded</span>
                            <button type="button" onClick={() => setFormData(p => ({ ...p, voiceTagUrl: '' }))} className="text-neutral-500 hover:text-red-400 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => document.getElementById('raw-tag-upload')?.click()}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-[11px] font-bold py-2 px-3.5 rounded-lg transition-colors"
                          >
                            Upload Tag
                          </button>
                        )}
                        <input id="raw-tag-upload" type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'audio', 'tag')} />
                      </div>
                    </div>

                  </div>

                  {/* Waveform Visualization section */}
                  {formData.audioUrl && (
                    <div className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">Audio Waveform Analysis Preview</span>
                        <button
                          type="button"
                          onClick={() => setPreviewPlaying(!previewPlaying)}
                          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
                        >
                          {previewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          {previewPlaying ? 'Pause Stream' : 'Play Preview'}
                        </button>
                      </div>
                      <WaveformVisualizer isPlaying={previewPlaying} />
                    </div>
                  )}

                  {/* Queue progress metrics */}
                  {Object.keys(uploadProgress).some(k => uploadProgress[k] < 100) && (
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Cloud Processing Session Status</span>
                      {Object.keys(uploadProgress).map(fName => (
                        <div key={fName} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono text-neutral-400">
                            <span className="truncate max-w-[200px]">{fName}</span>
                            <span className="font-extrabold text-indigo-400">{uploadProgress[fName]}%</span>
                          </div>
                          <div className="w-full h-1 bg-neutral-950 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress[fName]}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cover Art Box (5 columns) */}
                <div className="lg:col-span-5 space-y-6">
                  <h3 className="text-xs uppercase font-extrabold tracking-widest text-neutral-400">Artwork Cover</h3>

                  <div 
                    className="aspect-square w-full max-w-[320px] mx-auto bg-neutral-900/20 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-indigo-500/40 transition-colors"
                    onClick={() => document.getElementById('cover-art-input-trigger')?.click()}
                  >
                    {formData.coverArtUrl ? (
                      <>
                        <img src={formData.coverArtUrl} alt="Artwork Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                          <Upload className="w-8 h-8 text-white mb-2" />
                          <span className="text-xs font-bold text-white">Replace Cover Art</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                        <p className="text-xs font-extrabold text-neutral-300">Upload Cover Artwork</p>
                        <p className="text-[10px] text-neutral-500 mt-1">Recommended size: 1000 x 1000px</p>
                      </div>
                    )}
                    <input id="cover-art-input-trigger" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'image')} />
                  </div>

                  {formData.coverArtUrl && (
                    <div className="flex justify-center">
                      <button 
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, coverArtUrl: '' }))}
                        className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-red-400 text-xs font-bold py-1.5 px-4 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Artwork
                      </button>
                    </div>
                  )}

                  {/* Render Watermark overlay actions if criteria matches */}
                  {formData.untaggedWavUrl && formData.voiceTagUrl && !formData.audioUrl && (
                    <div className="bg-indigo-950/25 border border-indigo-500/20 rounded-2xl p-4 text-center space-y-3">
                      <p className="text-xs text-indigo-300 font-bold">Untagged WAV & Voice Watermark present</p>
                      <button
                        type="button"
                        onClick={handleGenerateWatermark}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> AI Render Tagged Preview
                      </button>
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={triggerAudioAnalysis}
                        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Run Voodoo Sonar BPM Analyzer
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BASIC INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Basic Information</h2>
                  <p className="text-neutral-400 text-xs mt-1">Specify your track title, story, and co-producer properties.</p>
                </div>
                <span className="text-xs font-mono text-neutral-500">Step 2 of 7</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Beat Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Midnight Voodoo, Eclipse"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold placeholder-neutral-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Producer / Brand Credit</label>
                  <input
                    type="text"
                    name="producer"
                    value={formData.producer}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Track Classification Type</label>
                  <select
                    name="trackTypeClassification"
                    value={formData.trackTypeClassification}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                  >
                    <option value="Beat">Instrumental Beat</option>
                    <option value="Vocal Topline">Vocal Topline</option>
                    <option value="Chorus">Chorus Hook</option>
                    <option value="Full Song">Full Finished Song</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 bg-neutral-900/30 border border-neutral-900 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    id="isFeaturedToggle"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="w-4 h-4 accent-indigo-500 rounded bg-neutral-900 border-neutral-800"
                  />
                  <label htmlFor="isFeaturedToggle" className="text-xs font-bold text-white cursor-pointer">
                    Pin & Feature this track at the top of the Voodoo Boomin storefront showcase
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Composer Credits & Splits</label>
                  <input
                    type="text"
                    name="credits"
                    value={formData.credits}
                    onChange={handleChange}
                    placeholder="e.g. Voodoo Boomin (50%), Co-composer (50%)"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-semibold placeholder-neutral-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Description / Bio Story</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell the story about how you composed this beat, the analog synths used, or artist references..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder-neutral-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: METADATA */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Music Metadata</h2>
                  <p className="text-neutral-400 text-xs mt-1">Configure acoustic properties, genre, instruments, and content flags.</p>
                </div>
                <span className="text-xs font-mono text-neutral-500">Step 3 of 7</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BPM & KEY */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Beats Per Minute (BPM)</label>
                  <input
                    type="number"
                    name="bpm"
                    value={formData.bpm}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Root Key & Scale</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="key"
                      value={formData.key}
                      onChange={handleChange}
                      placeholder="e.g. G# Minor"
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold"
                    />
                    <select
                      name="mode"
                      value={formData.mode}
                      onChange={handleChange}
                      className="w-28 bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-3 text-xs text-neutral-300 font-bold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Minor">Minor</option>
                      <option value="Major">Major</option>
                    </select>
                  </div>
                </div>

                {/* GENRES */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Primary Genre (Trap Only)</label>
                  <select
                    name="primaryGenre"
                    value="Trap"
                    disabled
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-300 font-bold focus:outline-none opacity-80 cursor-not-allowed"
                  >
                    <option value="Trap">Trap (Platform Exclusive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Secondary Genre</label>
                  <input
                    type="text"
                    name="secondaryGenre"
                    value={formData.secondaryGenre}
                    onChange={handleChange}
                    placeholder="e.g. Soul, Neo-Classical"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                {/* CHIPS FOR MOODS */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Select Mood Vibes (Choose Multiple)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Dark', 'Aggressive', 'Chill', 'Happy', 'Epic', 'Bouncy', 'Emotional', 'Energetic', 'Smooth', 'Spooky'].map(m => {
                      const isSelected = formData.mood.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => toggleMood(m)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            isSelected 
                              ? 'bg-indigo-600 border-indigo-500 text-white' 
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SEARCH TAGS */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Search Keywords / Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((t, idx) => (
                      <span key={t} className="bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-lg text-[11px] font-bold text-indigo-400 flex items-center gap-1.5 animate-in scale-in duration-100">
                        #{t}
                        <button type="button" onClick={() => removeTag(idx)} className="text-neutral-500 hover:text-red-400 font-bold font-mono">×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Type keyword and press Enter or Comma (e.g. trap, guitar)..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* INSTRUMENTS */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Instruments Used</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.instruments.map((i, idx) => (
                      <span key={i} className="bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-lg text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 animate-in scale-in duration-100">
                        {i}
                        <button type="button" onClick={() => removeInstrument(idx)} className="text-neutral-500 hover:text-red-400 font-bold font-mono">×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={instrumentInput}
                    onChange={(e) => setInstrumentInput(e.target.value)}
                    onKeyDown={handleInstrumentKeyDown}
                    placeholder="Type instrument and press Enter or Comma (e.g. Piano, Analog Lead)..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* SAMPLES */}
                <div className="md:col-span-2 bg-neutral-900/20 border border-neutral-900 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-neutral-300">Contains Sampled Content / Loops</p>
                      <p className="text-[11px] text-neutral-500">Enable if your track borrows audio from pre-recorded samples</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="sampledContent" 
                        checked={formData.sampledContent}
                        onChange={handleChange}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {formData.sampledContent && (
                    <input
                      type="text"
                      name="sampleDetails"
                      value={formData.sampleDetails}
                      onChange={handleChange}
                      placeholder="Specify samples/clearance details (e.g. Loop from Splice)..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                    />
                  )}
                </div>

                {/* TOGGLES FOR EXPLICIT / INSTRUMENTAL */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-900/60">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isExplicit"
                      checked={formData.isExplicit}
                      onChange={handleChange}
                      className="rounded border-neutral-800 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs text-neutral-300 font-bold">Explicit Warning</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isInstrumental"
                      checked={formData.isInstrumental}
                      onChange={handleChange}
                      className="rounded border-neutral-800 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs text-neutral-300 font-bold">Instrumental Track</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="vocalPresence"
                      checked={formData.vocalPresence}
                      onChange={handleChange}
                      className="rounded border-neutral-800 bg-neutral-900 text-indigo-500 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs text-neutral-300 font-bold">Vocal Accents / Hooks</span>
                  </label>
                </div>

                {/* TOGGLE FOR ORIGINAL AUTHENTICITY */}
                <div className="md:col-span-2 bg-indigo-950/10 border border-indigo-500/10 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> 100% Original Compositions Verification
                    </p>
                    <p className="text-[11px] text-neutral-500">Verify that the instrumental stems were fully synthesized/crafted by Voodoo Boomin.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="isHumanOriginal" 
                      checked={formData.isHumanOriginal}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PRICING & LICENSES */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Pricing & Licenses</h2>
                  <p className="text-neutral-400 text-xs mt-1">Configure active commercial lease templates, prices, and promotional free downloads.</p>
                </div>
                <span className="text-xs font-mono text-neutral-500">Step 4 of 7</span>
              </div>

              {/* Custom Direct Price & No License Terms */}
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 mb-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-white">Custom Direct Price & No License Terms</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Set your own custom base price and optionally bypass standard license tiers for a direct flat-rate purchase.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-300">Direct Price Only (No License Terms)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="directPriceOnly" 
                        checked={formData.directPriceOnly}
                        onChange={handleChange}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800/60 flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Custom Base Price ($)</label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-32 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {formData.directPriceOnly && (
                    <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 rounded-xl">
                      ✓ Standard license terms & conditions are bypassed. Customers pay your custom flat price with no contract lease terms.
                    </div>
                  )}
                </div>
              </div>

              {/* Grid of Lease product cards */}
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${formData.directPriceOnly ? 'opacity-40 pointer-events-none' : ''}`}>
                
                {/* BASIC MP3 */}
                <div className={`bg-neutral-900/30 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                  formData.basicMp3LeaseEnabled ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/5' : 'border-neutral-900 opacity-60'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-400">MP3 Lease</span>
                        <h4 className="text-sm font-black text-white mt-0.5">Basic Lease</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="basicMp3LeaseEnabled" 
                          checked={formData.basicMp3LeaseEnabled}
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-400">Provides watermarked or tagged audio formats under primary distribution lease limits.</p>
                  </div>

                  {formData.basicMp3LeaseEnabled && (
                    <div className="mt-4 pt-4 border-t border-neutral-900/60 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-neutral-500" />
                      <input
                        type="number"
                        name="basicMp3LeasePrice"
                        value={formData.basicMp3LeasePrice}
                        onChange={handleChange}
                        className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* PREMIUM WAV */}
                <div className={`bg-neutral-900/30 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                  formData.premiumWavLeaseEnabled ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'border-neutral-900 opacity-60'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400">WAV Lease</span>
                        <h4 className="text-sm font-black text-white mt-0.5">Premium Lease</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="premiumWavLeaseEnabled" 
                          checked={formData.premiumWavLeaseEnabled}
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-400">Includes lossless raw WAV format for premium recording workflows and higher play counts.</p>
                  </div>

                  {formData.premiumWavLeaseEnabled && (
                    <div className="mt-4 pt-4 border-t border-neutral-900/60 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-neutral-500" />
                      <input
                        type="number"
                        name="premiumWavLeasePrice"
                        value={formData.premiumWavLeasePrice}
                        onChange={handleChange}
                        className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* TRACKOUTS STEMS */}
                <div className={`bg-neutral-900/30 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                  formData.trackoutsLeaseEnabled ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-neutral-900 opacity-60'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-500">ZIP Stems</span>
                        <h4 className="text-sm font-black text-white mt-0.5">Trackout Lease</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="trackoutsLeaseEnabled" 
                          checked={formData.trackoutsLeaseEnabled}
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-400">Includes full track splits in ZIP archive. Best format for thorough mixing / mastering.</p>
                  </div>

                  {formData.trackoutsLeaseEnabled && (
                    <div className="mt-4 pt-4 border-t border-neutral-900/60 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-neutral-500" />
                      <input
                        type="number"
                        name="trackoutsLeasePrice"
                        value={formData.trackoutsLeasePrice}
                        onChange={handleChange}
                        className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* UNLIMITED */}
                <div className={`bg-neutral-900/30 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                  formData.unlimitedLeaseEnabled ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/5' : 'border-neutral-900 opacity-60'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-400">Unlimited Cap</span>
                        <h4 className="text-sm font-black text-white mt-0.5">Unlimited Lease</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="unlimitedLeaseEnabled" 
                          checked={formData.unlimitedLeaseEnabled}
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-400">Allows unlimited play counts, distributions, and theatrical radio syncing models.</p>
                  </div>

                  {formData.unlimitedLeaseEnabled && (
                    <div className="mt-4 pt-4 border-t border-neutral-900/60 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-neutral-500" />
                      <input
                        type="number"
                        name="unlimitedLeasePrice"
                        value={formData.unlimitedLeasePrice}
                        onChange={handleChange}
                        className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* EXCLUSIVE RIGHTS */}
                <div className={`bg-neutral-900/30 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                  formData.exclusiveRightsEnabled ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-neutral-900 opacity-60'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-extrabold text-red-400 font-mono">Exclusive Acquisition</span>
                        <h4 className="text-sm font-black text-white mt-0.5">Exclusive Rights</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="exclusiveRightsEnabled" 
                          checked={formData.exclusiveRightsEnabled}
                          onChange={handleChange}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-400">Transfers complete ownership rights to the buyer. Destroys lease catalogs upon publish.</p>
                  </div>

                  {formData.exclusiveRightsEnabled && (
                    <div className="mt-4 pt-4 border-t border-neutral-900/60 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-neutral-500" />
                      <input
                        type="number"
                        name="exclusiveRightsPrice"
                        value={formData.exclusiveRightsPrice}
                        onChange={handleChange}
                        className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* FREE DOWNLOADS & LEAD GENERATION */}
              <div className="mt-10 bg-neutral-900/20 border border-neutral-900 p-6 sm:p-8 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">Free Promotional Download Gating</h3>
                    <p className="text-neutral-500 text-[11px] mt-0.5">Capture email subscribers or social followers before sharing download access.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="freeDownloadEnabled" 
                      checked={formData.freeDownloadEnabled}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {formData.freeDownloadEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-900/60 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-2">Social Lock Module</label>
                      <select
                        name="socialUnlockModule"
                        value={formData.socialUnlockModule}
                        onChange={handleChange}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 font-bold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="None">Email Subscriber List Only</option>
                        <option value="YOUTUBE_SUBSCRIBE">YouTube Subscribe Gate</option>
                        <option value="SPOTIFY_FOLLOW">Spotify Follower Gate</option>
                      </select>
                    </div>

                    {formData.socialUnlockModule !== 'None' && (
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-2">Target Social Account ID/URL</label>
                        <input
                          type="text"
                          name="youtubeChannelId"
                          value={formData.youtubeChannelId}
                          onChange={handleChange}
                          placeholder="e.g. UC_xxxx..."
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-2">Download File Variant</label>
                      <select
                        name="freeDeliveryVariant"
                        value={formData.freeDeliveryVariant}
                        onChange={handleChange}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-300 font-bold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Watermarked Preview">Watermarked Preview (MP3)</option>
                        <option value="Clean File (Untagged)">Clean File (Untagged WAV)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* STEP 5: ADVANCED SETTINGS */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Advanced Settings</h2>
                  <p className="text-neutral-400 text-xs mt-1">Configure publishing catalogs, scheduled releases, splits, and Content ID parameters.</p>
                </div>
                <span className="text-xs font-mono text-neutral-500">Step 5 of 7</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* STATUS & PLACEMENT */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Catalog Placement Visibility</label>
                  <select
                    name="visibilityPlacement"
                    value={formData.visibilityPlacement}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-300 font-bold focus:outline-none"
                  >
                    <option value="Public">Public (Displayed on Marketplace Store)</option>
                    <option value="Private">Private (Hidden from feed list)</option>
                    <option value="Unlisted">Unlisted (Shareable URL link only)</option>
                  </select>
                </div>

                {/* SCHEDULE RELEASE DATE */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Scheduled Release Date</label>
                  <input
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                {/* CO-PRODUCER SPLITS */}
                <div className="md:col-span-2 bg-neutral-900/20 border border-neutral-900 p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-extrabold text-neutral-300">Co-producer Revenue Splits & Royalties</p>
                      <p className="text-[11px] text-neutral-500">Enable smart payout splits for co-authored beats</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Co-Producer Accounts</label>
                      <input
                        type="text"
                        name="coProducers"
                        value={formData.coProducers}
                        onChange={handleChange}
                        placeholder="e.g. PayPal email / wallet Address..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Your Split Percentage ({formData.revSplitPercent}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        name="revSplitPercent"
                        value={formData.revSplitPercent}
                        onChange={handleChange}
                        className="w-full accent-indigo-500 bg-neutral-900 rounded-lg h-2 cursor-pointer mt-3"
                      />
                    </div>
                  </div>
                </div>

                {/* CONTENT ID SETTINGS */}
                <div className="md:col-span-2 bg-neutral-900/20 border border-neutral-900 p-5 rounded-xl flex items-center justify-between">
                  <div className="max-w-md">
                    <p className="text-xs font-extrabold text-neutral-300">YouTube Content ID Syndication</p>
                    <p className="text-[11px] text-neutral-500 mt-1">Enroll this beat in automated scan systems. We strongly advise opting out if using third-party loops/samples to prevent copyright disputes.</p>
                  </div>
                  <select
                    name="youtubeContentIdEnrollment"
                    value={formData.youtubeContentIdEnrollment}
                    onChange={handleChange}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 font-bold focus:outline-none"
                  >
                    <option value="Opt-out">Opt-out (Recommended)</option>
                    <option value="Opt-in">Opt-in (Standard splits)</option>
                  </select>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* STEP 6: MARKETING */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Marketing & Promo Setup</h2>
                  <p className="text-neutral-400 text-xs mt-1">Configure drop announcement newsletters, social media post templates, and short prompts.</p>
                </div>
                <span className="text-xs font-mono text-neutral-500">Step 6 of 7</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SOCIAL POST TITLE */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Social Post Title</label>
                  <input
                    type="text"
                    name="socialPostTitle"
                    value={formData.socialPostTitle}
                    onChange={handleChange}
                    placeholder="e.g. ⚡️ NEW HEAT ALIVE: [Beat Title] out now!"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-semibold placeholder-neutral-600"
                  />
                </div>

                {/* SOCIAL POST CAPTION */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">Social Description / Tweet Caption</label>
                  <textarea
                    name="socialPostCaption"
                    value={formData.socialPostCaption}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Provide hashtags or purchase shortcuts (e.g. #typebeat #voodoo)..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder-neutral-600"
                  />
                </div>

                {/* AUTOMATED NEWSLETTER NOTIFICATION */}
                <div className="md:col-span-2 bg-neutral-900/20 border border-neutral-900 p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-neutral-300">Launch Drop Mail Announcement</p>
                    <p className="text-[11px] text-neutral-500">Dispatch mail alerts to your captured subscriber list immediately upon publishing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="autoMailingNotification" 
                      checked={formData.autoMailingNotification}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* SHORTS VIDEO PROMPT WRAPPER */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-2">TikTok & Reels Short-Video Prompt</label>
                  <input
                    type="text"
                    name="shortVideoPrompt"
                    value={formData.shortVideoPrompt}
                    onChange={handleChange}
                    placeholder="e.g. Dark industrial bass visualizer with neon strobe lights..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-semibold placeholder-neutral-600"
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW & PUBLISH */}
        {currentStep === 6 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">Review & Publish</h2>
                  <p className="text-neutral-400 text-xs mt-1">Carefully evaluate your catalog profile, files, splits, and pricing before publishing.</p>
                </div>
                <span className="text-xs font-mono text-neutral-500">Step 7 of 7</span>
              </div>

              {/* Validation errors alerts list */}
              {validationErrors.length > 0 ? (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-8">
                  <h4 className="text-xs uppercase tracking-widest font-black text-red-400 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4" /> Required Property Missing
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-red-300 space-y-2">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 flex items-center gap-3 text-emerald-300 text-xs mb-8 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="font-bold">✓ Catalog ready to launch! No validation errors detected.</p>
                </div>
              )}

              {/* Split Dual Column summary card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Preview card */}
                <div className="lg:col-span-5 bg-neutral-900/30 border border-neutral-900 p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                  <div className="w-48 h-48 rounded-xl overflow-hidden shadow-lg border border-neutral-800 mb-4 bg-neutral-950 flex items-center justify-center">
                    {formData.coverArtUrl ? (
                      <img src={formData.coverArtUrl} alt="Review Artwork" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-neutral-700" />
                    )}
                  </div>

                  <h3 className="text-lg font-black text-white">{formData.title || 'Untitled Beat Track'}</h3>
                  <p className="text-xs text-indigo-400 font-extrabold mt-0.5">by {formData.producer || 'Voodoo Boomin'}</p>

                  <div className="flex gap-4 mt-4 text-xs font-mono font-bold text-neutral-400">
                    <span className="bg-neutral-900/60 border border-neutral-800 px-2.5 py-1 rounded-md">{formData.bpm || '130'} BPM</span>
                    <span className="bg-neutral-900/60 border border-neutral-800 px-2.5 py-1 rounded-md">{formData.key || 'C Minor'}</span>
                  </div>

                  {formData.audioUrl && (
                    <div className="w-full mt-6 space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Acoustic Spectrum Visualizer</span>
                        <button
                          type="button"
                          onClick={() => setPreviewPlaying(!previewPlaying)}
                          className="text-[10px] text-indigo-400 font-extrabold flex items-center gap-1"
                        >
                          {previewPlaying ? 'Pause' : 'Play'}
                        </button>
                      </div>
                      <WaveformVisualizer isPlaying={previewPlaying} />
                    </div>
                  )}

                  {/* Edit shortcut */}
                  <button 
                    onClick={() => setCurrentStep(0)} 
                    className="absolute top-4 right-4 text-[10px] font-bold text-neutral-500 hover:text-indigo-400 transition-colors"
                  >
                    Edit Files
                  </button>
                </div>

                {/* Right Specs summary lists */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* File card indicators */}
                  <div className="bg-neutral-900/20 border border-neutral-900 p-5 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs uppercase font-extrabold tracking-widest text-neutral-400">Loaded Assets Checklist</h4>
                      <button onClick={() => setCurrentStep(0)} className="text-[10px] font-bold text-indigo-400">Edit</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        {formData.audioUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 bg-neutral-900 rounded-full" />}
                        <span className="text-neutral-400">Tagged Preview (MP3)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.untaggedWavUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 bg-neutral-900 rounded-full" />}
                        <span className="text-neutral-400">Untagged WAV master</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.stemsZipUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 bg-neutral-900 rounded-full" />}
                        <span className="text-neutral-400">Stems ZIP Archive</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.voiceTagUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <span className="w-4 h-4 bg-neutral-900 rounded-full" />}
                        <span className="text-neutral-400">Watermark Voice Tag</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata and split specs */}
                  <div className="bg-neutral-900/20 border border-neutral-900 p-5 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs uppercase font-extrabold tracking-widest text-neutral-400">Metadata & Compositions</h4>
                      <button onClick={() => setCurrentStep(2)} className="text-[10px] font-bold text-indigo-400">Edit</button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="text-neutral-500">Genres:</span> <span className="text-neutral-300 font-bold">{formData.primaryGenre} {formData.secondaryGenre ? `/ ${formData.secondaryGenre}` : ''}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Splits Split:</span> <span className="text-neutral-300 font-bold">{formData.revSplitPercent}% You</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Explicit Warning:</span> <span className="text-neutral-300 font-bold">{formData.isExplicit ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Original Compositions:</span> <span className="text-neutral-300 font-bold">{formData.isHumanOriginal ? '100% Original' : 'Contains loops'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Licenses list */}
                  <div className="bg-neutral-900/20 border border-neutral-900 p-5 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs uppercase font-extrabold tracking-widest text-neutral-400">Active Licensing contracts</h4>
                      <button onClick={() => setCurrentStep(3)} className="text-[10px] font-bold text-indigo-400">Edit</button>
                    </div>
                    <div className="space-y-2 text-xs">
                      {formData.basicMp3LeaseEnabled && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Basic MP3 Lease Contract</span>
                          <span className="text-white font-mono font-bold">${formData.basicMp3LeasePrice}</span>
                        </div>
                      )}
                      {formData.premiumWavLeaseEnabled && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Premium WAV Lease Contract</span>
                          <span className="text-white font-mono font-bold">${formData.premiumWavLeasePrice}</span>
                        </div>
                      )}
                      {formData.trackoutsLeaseEnabled && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">ZIP Trackouts stems Contract</span>
                          <span className="text-white font-mono font-bold">${formData.trackoutsLeasePrice}</span>
                        </div>
                      )}
                      {formData.unlimitedLeaseEnabled && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Unlimited lease distribution Contract</span>
                          <span className="text-white font-mono font-bold">${formData.unlimitedLeasePrice}</span>
                        </div>
                      )}
                      {formData.exclusiveRightsEnabled && (
                        <div className="flex justify-between text-red-400">
                          <span className="font-bold">Exclusive Ownership Transfer</span>
                          <span className="font-mono font-bold">${formData.exclusiveRightsPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

      </div>

      {/* Persistent Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 border border-neutral-900 p-5 rounded-2xl">
        <button
          type="button"
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed border border-neutral-800 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-neutral-400 hover:text-white font-bold text-xs py-3 px-6 rounded-xl transition-all"
          >
            Save Draft
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(6, prev + 1))}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/10"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={validationErrors.length > 0}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-900 disabled:text-neutral-500 disabled:border-neutral-800 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-500/10 border border-emerald-500/20"
            >
              Publish Beat <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
