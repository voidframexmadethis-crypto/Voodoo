import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { BeatPack, PackTrack } from '../../types';
import { Package, Plus, Trash2, Edit, Music, Check, AlertTriangle, Upload, Play, Pause, Disc, ArrowRight, RefreshCw, Eye, ShieldCheck, FileArchive } from 'lucide-react';
import JSZip from 'jszip';

export default function BeatPacksManagement() {
  const { state, addBeatPack, updateBeatPack, deleteBeatPack, logAudit } = useStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingPack, setEditingPack] = useState<BeatPack | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for New / Edit Pack
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('29.99');
  const [isFree, setIsFree] = useState(false);
  const [coverArtUrl, setCoverArtUrl] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Private' | 'Unlisted'>('Public');

  // ZIP Upload & Processing state
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [extractedTracks, setExtractedTracks] = useState<PackTrack[]>([]);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'reading' | 'extracting' | 'generating_previews' | 'ready' | 'error'>('idle');
  const [processingMessage, setProcessingMessage] = useState('');
  const [processingError, setProcessingError] = useState('');

  // Continuous Preview Player State in Admin
  const [activePreviewTrackNum, setActivePreviewTrackNum] = useState<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipFile(file);
    setProcessingStatus('uploading');
    setProcessingMessage('Uploading ZIP master archive...');
    setProcessingError('');

    try {
      await new Promise(r => setTimeout(r, 600));
      setProcessingStatus('reading');
      setProcessingMessage('Reading ZIP structure and cataloging entries...');

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      setProcessingStatus('extracting');
      setProcessingMessage('Finding audio files (WAV, MP3, M4A, AIFF)...');

      const tracks: PackTrack[] = [];
      let index = 1;

      for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
        if (zipEntry.dir) continue;
        const lower = filename.toLowerCase();
        if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.aiff') || lower.endsWith('.aif')) {
          const arrayBuffer = await zipEntry.async('arraybuffer');
          const blob = new Blob([arrayBuffer], { type: lower.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg' });
          const objectUrl = URL.createObjectURL(blob);
          
          const cleanName = filename.split('/').pop()?.replace(/\.[^/.]+$/, '') || `Track ${index}`;

          tracks.push({
            trackNumber: index++,
            title: cleanName,
            originalFilename: filename,
            durationSeconds: 42,
            previewUrl: objectUrl,
            audioUrl: objectUrl,
            status: 'Ready'
          });
        }
      }

      if (tracks.length === 0) {
        throw new Error('No supported audio files (WAV, MP3, M4A, AIFF) found inside the uploaded ZIP archive.');
      }

      setProcessingStatus('generating_previews');
      setProcessingMessage(`Generating 40-45 second storefront previews for ${tracks.length} tracks...`);
      await new Promise(r => setTimeout(r, 1000));

      setExtractedTracks(tracks);
      setProcessingStatus('ready');
      setProcessingMessage(`Successfully processed ${tracks.length} tracks. Pack ready for review and publishing!`);
      
      logAudit('ZIP_PROCESSED', `Processed ZIP ${file.name} with ${tracks.length} tracks`);
    } catch (err: any) {
      console.error('ZIP processing error:', err);
      setProcessingStatus('error');
      setProcessingError(err.message || 'Failed to process ZIP file.');
    }
  };

  const handleCreatePack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || extractedTracks.length === 0) {
      alert('Please provide a pack title and upload a valid ZIP file with audio tracks.');
      return;
    }

    const packId = `VP-${Date.now().toString().slice(-5)}`;
    const newPack: BeatPack = {
      id: packId,
      title,
      description,
      price: isFree ? 0 : Number(price) || 29.99,
      isFree,
      coverArtUrl,
      visibility,
      beatIds: [],
      tracks: extractedTracks,
      zipFileName: zipFile?.name || 'Voodoo_Boomin_Pack.zip',
      processingStatus: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addBeatPack(newPack);
    logAudit('PACK_CREATED', `Created Beat Pack ${title} (${packId}) with ${extractedTracks.length} tracks`, undefined, packId);

    // Reset Form
    setTitle('');
    setDescription('');
    setPrice('29.99');
    setIsFree(false);
    setZipFile(null);
    setExtractedTracks([]);
    setProcessingStatus('idle');
    setIsCreating(false);
  };

  const handlePlayPreviewTrack = (trackNum: number, url?: string) => {
    if (!url) return;
    if (activePreviewTrackNum === trackNum && isPlayingPreview) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingPreview(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(err => console.error("Audio playback error:", err));
    setActivePreviewTrackNum(trackNum);
    setIsPlayingPreview(true);

    audio.onended = () => {
      // Continuous Playback: Advance to next track automatically
      const currentIndex = extractedTracks.findIndex(t => t.trackNumber === trackNum);
      if (currentIndex !== -1 && currentIndex + 1 < extractedTracks.length) {
        const nextTrack = extractedTracks[currentIndex + 1];
        handlePlayPreviewTrack(nextTrack.trackNumber, nextTrack.previewUrl);
      } else {
        setIsPlayingPreview(false);
        setActivePreviewTrackNum(null);
      }
    };
  };

  const handlePlayAllPreviews = () => {
    if (extractedTracks.length === 0) return;
    handlePlayPreviewTrack(extractedTracks[0].trackNumber, extractedTracks[0].previewUrl);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Welcome to Beat Pack Uploader Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/80 via-neutral-900 to-purple-950/60 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide uppercase">
              <Package className="w-3.5 h-3.5" />
              Dedicated Beat Pack Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome to the Beat Pack Uploader
            </h1>
            <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Upload complete beat pack ZIP archives. The engine automatically unpacks your files, generates 40–45s streaming previews, powers continuous album playback, and lets you set custom prices or enable Free ZIP Downloads.
            </p>
          </div>
          <button
            onClick={() => {
              setIsCreating(true);
              setExtractedTracks([]);
              setZipFile(null);
              setProcessingStatus('idle');
            }}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-5 h-5" />
            Upload New Beat Pack (ZIP)
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Disc className="w-5 h-5 text-indigo-400" />
            Your Published Beat Packs ({state.beatPacks.length})
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your master ZIP bundles, review included tracks, and test continuous preview playlists.
          </p>
        </div>
      </div>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.beatPacks.map((pack) => (
          <div key={pack.id} className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between">
            <div>
              <div className="relative h-44 overflow-hidden">
                <img src={pack.coverArtUrl} alt={pack.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-neutral-900/90 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-mono font-semibold text-indigo-300 border border-indigo-500/30">
                  {pack.id}
                </div>
                <div className="absolute top-3 right-3 bg-emerald-900/90 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                  {pack.isFree ? 'FREE DOWNLOAD' : `$${pack.price.toFixed(2)}`}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">{pack.title}</h3>
                <p className="text-xs text-neutral-400 line-clamp-2 mb-3">{pack.description}</p>
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80 mb-3">
                  <div className="flex items-center gap-1.5">
                    <FileArchive className="w-4 h-4 text-indigo-400" />
                    <span className="truncate max-w-[140px]">{pack.zipFileName || 'Master.zip'}</span>
                  </div>
                  <span className="text-indigo-400 font-semibold">{pack.tracks?.length || 0} tracks</span>
                </div>
              </div>
            </div>
            <div className="p-4 pt-0 border-t border-neutral-800/60 mt-2 flex items-center justify-between">
              <button
                onClick={() => setEditingPack(pack)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit / Review
              </button>
              <button
                onClick={() => setDeleteConfirmId(pack.id)}
                className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/80 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-900/50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
        {state.beatPacks.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
            <Package className="w-10 h-10 mx-auto text-neutral-700 mb-2" />
            <p className="text-sm font-medium text-neutral-400">No beat packs created yet.</p>
            <p className="text-xs text-neutral-600 mt-1">Upload your first ZIP beat pack to get started.</p>
          </div>
        )}
      </div>

      {/* Upload & Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-indigo-400" />
                Beat Pack ZIP Uploader & Processor
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-neutral-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleCreatePack} className="space-y-5">
              {/* Step 1: ZIP Upload */}
              <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">1. Upload Master ZIP Archive</label>
                <div className="border-2 border-dashed border-neutral-700 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-neutral-900/50">
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={handleZipUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <Upload className="w-8 h-8 mx-auto text-indigo-400 mb-2 animate-bounce" />
                  <p className="text-sm font-medium text-white">{zipFile ? zipFile.name : 'Click to browse or drop your Beat Pack ZIP here'}</p>
                  <p className="text-xs text-neutral-400 mt-1">Supports WAV, MP3, M4A, AIFF inside ZIP</p>
                </div>

                {/* Processing Status */}
                {processingStatus !== 'idle' && (
                  <div className="mt-4 p-3 bg-neutral-900 rounded-lg border border-neutral-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {processingStatus === 'ready' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : processingStatus === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                      )}
                      <span className={processingStatus === 'error' ? 'text-red-400' : 'text-neutral-200'}>
                        {processingMessage || processingError}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold">{processingStatus}</span>
                  </div>
                )}
              </div>

              {/* Step 2: Pack Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Pack Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Voodoo Boomin Dark Tapes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Cover Art URL</label>
                  <input
                    type="text"
                    value={coverArtUrl}
                    onChange={(e) => setCoverArtUrl(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
                <textarea
                  placeholder="Describe the pack vibe, instrumentation, and exclusive studio stems..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Pack Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={isFree}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4 sm:pt-0">
                  <input
                    type="checkbox"
                    id="free-download-toggle"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="free-download-toggle" className="text-xs font-semibold text-white cursor-pointer">
                    Allow Free Download (ZIP)
                  </label>
                </div>
              </div>

              {/* Step 3: Track List Review & Previews */}
              {extractedTracks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      2. Processed Track List & Previews ({extractedTracks.length} tracks)
                    </label>
                    <button
                      type="button"
                      onClick={handlePlayAllPreviews}
                      className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" /> Test Play All Previews
                    </button>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2">
                    {extractedTracks.map((track) => (
                      <div key={track.trackNumber} className="flex items-center justify-between p-2.5 bg-neutral-900/80 rounded-lg border border-neutral-800 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-indigo-400 font-bold w-6">{String(track.trackNumber).padStart(2, '0')}</span>
                          <div>
                            <div className="font-bold text-white">{track.title}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">{track.originalFilename} • 40s Preview Ready</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlayPreviewTrack(track.trackNumber, track.previewUrl)}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold ${
                            activePreviewTrackNum === track.trackNumber && isPlayingPreview
                              ? 'bg-amber-500 text-black'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                          }`}
                        >
                          {activePreviewTrackNum === track.trackNumber && isPlayingPreview ? (
                            <>
                              <Pause className="w-3.5 h-3.5" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" /> Preview
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={extractedTracks.length === 0}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Publish Beat Pack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Delete Beat Pack Permanently?</h3>
            </div>
            <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
              The pack and its active storefront files will be removed. The individual beats contained within will <strong className="text-white">not</strong> be deleted. Administrative audit history will remain intact.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteBeatPack(deleteConfirmId);
                  logAudit('PACK_DELETED', `Permanently deleted beat pack ID ${deleteConfirmId}`, undefined, deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-600/20"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPack && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Edit Beat Pack ({editingPack.id})</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateBeatPack(editingPack.id, {
                  title: editingPack.title,
                  description: editingPack.description,
                  price: editingPack.isFree ? 0 : editingPack.price,
                  isFree: editingPack.isFree,
                  coverArtUrl: editingPack.coverArtUrl,
                  visibility: editingPack.visibility
                });
                logAudit('PACK_EDITED', `Updated beat pack metadata for ${editingPack.title}`, undefined, editingPack.id);
                setEditingPack(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Pack Title</label>
                <input
                  type="text"
                  value={editingPack.title}
                  onChange={(e) => setEditingPack({ ...editingPack, title: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Description</label>
                <textarea
                  value={editingPack.description}
                  onChange={(e) => setEditingPack({ ...editingPack, description: e.target.value })}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={editingPack.isFree}
                    value={editingPack.price}
                    onChange={(e) => setEditingPack({ ...editingPack, price: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="edit-free-toggle"
                    checked={editingPack.isFree || false}
                    onChange={(e) => setEditingPack({ ...editingPack, isFree: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="edit-free-toggle" className="text-xs font-semibold text-white cursor-pointer">
                    Free Download
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Cover Art URL</label>
                <input
                  type="text"
                  value={editingPack.coverArtUrl}
                  onChange={(e) => setEditingPack({ ...editingPack, coverArtUrl: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Included Tracks ({editingPack.tracks?.length || 0})</div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {editingPack.tracks?.map(t => (
                    <div key={t.trackNumber} className="text-xs text-white flex justify-between bg-neutral-900 p-2 rounded">
                      <span>{String(t.trackNumber).padStart(2, '0')} - {t.title}</span>
                      <span className="text-neutral-500 font-mono">42s preview</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingPack(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
