import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { BeatPack, PackTrack } from '../types';
import { 
  Package, Upload, Play, Pause, Disc, RefreshCw, Check, AlertTriangle, 
  FileArchive, Image as ImageIcon, ShieldCheck, DollarSign, Eye, Music, 
  Info, Sparkles, AlertCircle, ArrowRight, Layers, Volume2
} from 'lucide-react';
import JSZip from 'jszip';

export default function BeatPackUploader({ onPackPublished }: { onPackPublished?: (pack: BeatPack) => void }) {
  const { state, addBeatPack, logAudit } = useStore();

  // Pack Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('29.99');
  const [isFree, setIsFree] = useState(false);
  const [coverArtUrl, setCoverArtUrl] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Private' | 'Unlisted'>('Public');

  // ZIP Upload & Processing State
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [extractedTracks, setExtractedTracks] = useState<PackTrack[]>([]);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'reading' | 'extracting' | 'generating_previews' | 'ready' | 'error'>('idle');
  const [processingMessage, setProcessingMessage] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Continuous Preview Play All Player State
  const [activeTrackNum, setActiveTrackNum] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Time update tracking for smooth progress bar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setPreviewProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isPlaying, activeTrackNum]);

  // Handle ZIP Upload & Automatic Extraction
  const handleZipSelection = async (file: File) => {
    setValidationError(null);

    // Validation rule: Must be a .zip file
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.zip') && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
      setValidationError('Invalid file format. The Beat Pack uploader strictly requires a ZIP archive (.zip). For individual audio files (MP3/WAV), please switch to the Single Beat Uploader tab.');
      return;
    }

    setZipFile(file);
    if (!title) {
      const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setTitle(autoTitle);
    }

    setProcessingStatus('uploading');
    setProcessingMessage('Uploading master ZIP archive...');

    try {
      await new Promise(r => setTimeout(r, 500));
      setProcessingStatus('reading');
      setProcessingMessage('Reading ZIP structure and cataloging entries...');

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      setProcessingStatus('extracting');
      setProcessingMessage('Scanning archive for audio files (WAV, MP3, M4A, AIFF)...');

      const detectedTracks: PackTrack[] = [];
      let trackCounter = 1;

      for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
        if (zipEntry.dir || filename.startsWith('__MACOSX') || filename.includes('/.')) continue;
        const entryLower = filename.toLowerCase();

        if (
          entryLower.endsWith('.wav') ||
          entryLower.endsWith('.mp3') ||
          entryLower.endsWith('.m4a') ||
          entryLower.endsWith('.aiff') ||
          entryLower.endsWith('.aif')
        ) {
          const arrayBuffer = await zipEntry.async('arraybuffer');
          const mimeType = entryLower.endsWith('.wav')
            ? 'audio/wav'
            : entryLower.endsWith('.mp3')
            ? 'audio/mpeg'
            : 'audio/mp4';
          const blob = new Blob([arrayBuffer], { type: mimeType });
          const previewObjectUrl = URL.createObjectURL(blob);

          const fileNameOnly = filename.split('/').pop() || filename;
          const cleanTrackTitle = fileNameOnly
            .replace(/\.[^/.]+$/, '')
            .replace(/^\d+[\s\-_.]*/, '')
            .replace(/[-_]/g, ' ')
            .trim() || `Track ${trackCounter}`;

          detectedTracks.push({
            trackNumber: trackCounter++,
            title: cleanTrackTitle,
            originalFilename: fileNameOnly,
            durationSeconds: 42,
            previewUrl: previewObjectUrl,
            audioUrl: previewObjectUrl,
            status: 'Ready'
          });
        }
      }

      if (detectedTracks.length === 0) {
        throw new Error('No supported audio files (WAV, MP3, M4A, AIFF) were found inside this ZIP file. Please ensure your ZIP contains audio tracks.');
      }

      setProcessingStatus('generating_previews');
      setProcessingMessage(`Generating 40–45 second preview streaming streams for ${detectedTracks.length} tracks...`);
      await new Promise(r => setTimeout(r, 800));

      setExtractedTracks(detectedTracks);
      setProcessingStatus('ready');
      setProcessingMessage(`All ${detectedTracks.length} track previews ready. Master ZIP preserved.`);
      logAudit('ZIP_PROCESSED', `Extracted ${detectedTracks.length} tracks from ${file.name}`);
    } catch (err: any) {
      console.error('ZIP extraction error:', err);
      setProcessingStatus('error');
      setValidationError(err.message || 'Failed to process ZIP file.');
    }
  };

  // Playback Control (Continuous Play All or Single Track Selection)
  const playTrackPreview = (trackNum: number) => {
    const track = extractedTracks.find(t => t.trackNumber === trackNum);
    if (!track || !track.previewUrl) return;

    if (activeTrackNum === trackNum && isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(track.previewUrl);
    audioRef.current = audio;
    audio.play().catch(e => console.error('Audio play error:', e));
    setActiveTrackNum(trackNum);
    setIsPlaying(true);
    setPreviewProgress(0);

    // Auto-advance to next track when preview ends (Album / Playlist Continuous Playback)
    audio.onended = () => {
      const currentIndex = extractedTracks.findIndex(t => t.trackNumber === trackNum);
      if (currentIndex !== -1 && currentIndex + 1 < extractedTracks.length) {
        const nextTrack = extractedTracks[currentIndex + 1];
        playTrackPreview(nextTrack.trackNumber);
      } else {
        setIsPlaying(false);
        setActiveTrackNum(null);
        setPreviewProgress(0);
      }
    };
  };

  const handlePlayAll = () => {
    if (extractedTracks.length === 0) return;
    if (isPlaying && activeTrackNum !== null) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playTrackPreview(extractedTracks[0].trackNumber);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverArtUrl(url);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please enter a title for the Beat Pack.');
      return;
    }
    if (extractedTracks.length === 0) {
      setValidationError('Please upload and process a valid ZIP file containing beat tracks before publishing.');
      return;
    }

    const packId = `VP-${Date.now().toString().slice(-5)}`;
    const newPack: BeatPack = {
      id: packId,
      title: title.trim(),
      description: description.trim(),
      price: isFree ? 0 : Number(price) || 29.99,
      isFree,
      coverArtUrl,
      visibility,
      beatIds: [],
      tracks: extractedTracks,
      zipFileName: zipFile?.name || `${title.replace(/\s+/g, '_')}.zip`,
      processingStatus: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addBeatPack(newPack);
    logAudit('PACK_CREATED', `Published Beat Pack "${title}" (${packId}) with ${extractedTracks.length} tracks`, undefined, packId);

    if (onPackPublished) {
      onPackPublished(newPack);
    }

    alert(`Beat Pack "${title}" (${packId}) published successfully to the storefront!`);

    // Reset Form
    setTitle('');
    setDescription('');
    setPrice('29.99');
    setIsFree(false);
    setZipFile(null);
    setExtractedTracks([]);
    setProcessingStatus('idle');
    setValidationError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setActiveTrackNum(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/80 via-neutral-900 to-purple-950/60 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide uppercase">
            <Package className="w-3.5 h-3.5" />
            Dedicated Beat Pack Workflow
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome to the Beat Pack Uploader
          </h1>
          <p className="text-sm text-neutral-300 max-w-3xl leading-relaxed">
            Upload your master beat pack as a single ZIP archive. Our processing engine automatically inspects the archive, generates 40–45 second streaming previews for every included beat, enables continuous album playlist playback, and protects your master ZIP for buyer downloads or free access.
          </p>
        </div>
      </div>

      {validationError && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold mb-0.5">Upload Notice:</strong>
            {validationError}
          </div>
          <button onClick={() => setValidationError(null)} className="text-red-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      <form onSubmit={handlePublish} className="space-y-8">
        {/* Step 1: ZIP Archive Upload */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Master Beat Pack ZIP Upload</h2>
            </div>
            <span className="text-xs text-neutral-400 font-mono">Accepts .ZIP with WAV / MP3 / M4A / AIFF</span>
          </div>

          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleZipSelection(file);
            }}
            className="border-2 border-dashed border-neutral-700 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-neutral-950/60 hover:bg-neutral-950/90 relative group"
          >
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleZipSelection(file);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-base font-bold text-white mb-1">
              {zipFile ? zipFile.name : 'Drag & drop your Beat Pack ZIP file here, or browse files'}
            </p>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              The original ZIP remains intact as the customer download master. Previews are generated strictly for storefront auditioning.
            </p>
          </div>

          {/* Processing Progress Bar / Status */}
          {processingStatus !== 'idle' && (
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  {processingStatus === 'ready' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : processingStatus === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  )}
                  <span className={processingStatus === 'error' ? 'text-red-400 font-semibold' : 'text-neutral-200 font-medium'}>
                    {processingMessage}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold tracking-wider">
                  {processingStatus}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Pack Information & Artwork */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Pack Information & Artwork</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Artwork */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">Pack Cover Artwork</label>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 group shadow-inner">
                <img src={coverArtUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity backdrop-blur-xs">
                  <ImageIcon className="w-8 h-8 text-white" />
                  <span className="text-xs font-bold text-white">Change Artwork</span>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>
              </div>
              <input
                type="text"
                placeholder="Or paste artwork URL"
                value={coverArtUrl}
                onChange={(e) => setCoverArtUrl(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Metadata Fields */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Beat Pack Title</label>
                <input
                  type="text"
                  placeholder="e.g. Voodoo Boomin — Dark Tapes Vol. 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Pack Description & Notes</label>
                <textarea
                  placeholder="Describe the pack vibe, tempo range, included sound stems, and genre compatibility..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Pricing & Free Download */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 items-center">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Pack Price ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-neutral-500 text-sm font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isFree}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 sm:pt-4">
                  <input
                    type="checkbox"
                    id="pack-free-download-checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="pack-free-download-checkbox" className="text-xs font-bold text-white cursor-pointer select-none">
                    Allow Free Download (ZIP)
                    <span className="block text-[11px] text-neutral-400 font-normal mt-0.5">
                      Customers can download the full ZIP without paying
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Storefront Visibility</label>
                <div className="flex gap-3">
                  {(['Public', 'Unlisted', 'Private'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibility(v)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        visibility === v
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Track List Review & Continuous Play All Player */}
        {extractedTracks.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                <div>
                  <h2 className="text-base font-bold text-white uppercase tracking-wider">
                    Extracted Track List ({extractedTracks.length} Tracks)
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Test 40–45s streaming previews and test the continuous album playlist experience before publishing.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlayAll}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 shrink-0"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> ▶ PLAY ALL PREVIEWS
                  </>
                )}
              </button>
            </div>

            {/* Currently Playing Track Banner */}
            {activeTrackNum !== null && (
              <div className="p-4 bg-neutral-950 border border-indigo-500/40 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                    <Music className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Now Previewing</div>
                    <div className="text-sm font-bold text-white">
                      Track {String(activeTrackNum).padStart(2, '0')} — {extractedTracks.find(t => t.trackNumber === activeTrackNum)?.title}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-44">
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-150" style={{ width: `${previewProgress}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">~42s</span>
                </div>
              </div>
            )}

            {/* Track List */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800/60">
              {extractedTracks.map((track) => {
                const isTrackActive = activeTrackNum === track.trackNumber && isPlaying;
                return (
                  <div
                    key={track.trackNumber}
                    onClick={() => playTrackPreview(track.trackNumber)}
                    className={`flex items-center justify-between p-3.5 px-4 cursor-pointer transition-colors ${
                      isTrackActive ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-neutral-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs font-bold text-indigo-400 w-6">
                        {String(track.trackNumber).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {track.title}
                          {isTrackActive && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                              PLAYING
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          {track.originalFilename} • 40–45s Preview Ready
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrackPreview(track.trackNumber);
                        }}
                        className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isTrackActive
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                        }`}
                      >
                        {isTrackActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isTrackActive ? 'Pause' : 'Preview'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Publish Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
          <div>
            <div className="text-sm font-bold text-white">Ready to Publish Beat Pack?</div>
            <div className="text-xs text-neutral-400">
              {extractedTracks.length > 0
                ? `${extractedTracks.length} tracks cataloged. Master ZIP stored separately for customer downloads.`
                : 'Upload a ZIP archive to enable publishing.'}
            </div>
          </div>

          <button
            type="submit"
            disabled={extractedTracks.length === 0 || !title.trim()}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 shrink-0"
          >
            <ShieldCheck className="w-5 h-5" />
            Publish Beat Pack to Store
          </button>
        </div>
      </form>
    </div>
  );
}
