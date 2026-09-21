import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Flame, 
  Megaphone, 
  Lock, 
  CheckCircle2, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  Sparkles, 
  Music, 
  Package, 
  Check, 
  ArrowRight 
} from 'lucide-react';
import { Announcement } from '../../types';

export default function FeaturedVaultManagement() {
  const { 
    state, 
    setFeaturedBeatId, 
    setAnnouncement, 
    addBeatToVault, 
    removeBeatFromVault, 
    addPackToVault, 
    removePackFromVault 
  } = useStore();

  // Announcement Form state
  const [annTitle, setAnnTitle] = useState(state.announcement?.title || '');
  const [annMessage, setAnnMessage] = useState(state.announcement?.message || '');
  const [annActionText, setAnnActionText] = useState(state.announcement?.actionText || 'Listen Now');
  const [annActionType, setAnnActionType] = useState<Announcement['actionType']>(state.announcement?.actionType || 'BEATS');
  const [annActionUrl, setAnnActionUrl] = useState(state.announcement?.actionUrl || '');
  const [annActive, setAnnActive] = useState(state.announcement?.active ?? true);

  const featuredBeat = state.beats.find(b => b.id === state.featuredBeatId);
  const vaultConfig = state.vaultConfig || { beatIds: [], packIds: [] };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;

    const newAnnouncement: Announcement = {
      id: state.announcement?.id || `ann_${Date.now()}`,
      title: annTitle.trim(),
      message: annMessage.trim(),
      actionText: annActionText.trim(),
      actionType: annActionType,
      actionUrl: annActionUrl.trim(),
      active: annActive,
      createdAt: new Date().toISOString()
    };

    setAnnouncement(newAnnouncement);
  };

  const handleDeleteAnnouncement = () => {
    setAnnouncement(null);
    setAnnTitle('');
    setAnnMessage('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* SECTION 1: FEATURED BEAT OF THE WEEK (FEATURE 27) */}
      <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
              <Flame className="w-5 h-5 text-amber-400" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                Featured Beat of the Week (Feature #27)
              </h2>
              <p className="text-xs text-neutral-400">
                Manually select one published beat to spotlight at the top of the storefront.
              </p>
            </div>
          </div>

          {featuredBeat && (
            <button
              onClick={() => setFeaturedBeatId(null)}
              className="px-3 py-1.5 rounded-xl bg-red-950 border border-red-800 text-red-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Remove Featured Beat</span>
            </button>
          )}
        </div>

        {/* Current Selection Status */}
        {featuredBeat ? (
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img src={featuredBeat.coverArtUrl} alt={featuredBeat.title} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-purple-500/40" />
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400">Currently Active</span>
                <h3 className="text-base font-black text-white truncate">{featuredBeat.title}</h3>
                <p className="text-xs font-mono text-neutral-400">{featuredBeat.bpm} BPM • {featuredBeat.key || 'D Minor'} • ${featuredBeat.price.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-neutral-500 text-xs font-mono">
            No Featured Beat set. The section is currently hidden from the public storefront.
          </div>
        )}

        {/* Beat Selector */}
        <div className="space-y-3">
          <label className="text-xs font-mono font-bold uppercase text-neutral-300 block">
            Select Beat to Spotlight:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
            {state.beats.map((beat) => {
              const isSelected = beat.id === state.featuredBeatId;
              return (
                <div
                  key={beat.id}
                  onClick={() => setFeaturedBeatId(beat.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-950/80 border-purple-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={beat.coverArtUrl} alt={beat.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate">{beat.title}</h4>
                      <p className="text-[10px] font-mono text-neutral-500">${beat.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-neutral-500 hover:text-white uppercase">
                      Select
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: ANNOUNCEMENT BANNER (FEATURE 28) */}
      <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
              <Megaphone className="w-5 h-5 text-purple-400" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                Announcement Banner (Feature #28)
              </h2>
              <p className="text-xs text-neutral-400">
                Publish a compact, professional announcement banner across the public storefront.
              </p>
            </div>
          </div>

          {state.announcement && (
            <button
              onClick={handleDeleteAnnouncement}
              className="px-3 py-1.5 rounded-xl bg-red-950 border border-red-800 text-red-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Banner</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase block mb-1">
                Announcement Title / Headline
              </label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. NEW BEAT PACK DROP"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-purple-500 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase block mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={annActionText}
                onChange={(e) => setAnnActionText(e.target.value)}
                placeholder="e.g. Listen Now"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-purple-500 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-neutral-400 uppercase block mb-1">
              Message Body
            </label>
            <input
              type="text"
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
              placeholder="e.g. Dark Collection Vol. 1 is out now with WAV stems and commercial rights."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-purple-500 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono font-bold text-neutral-400 uppercase block mb-1">
                Target Section
              </label>
              <select
                value={annActionType}
                onChange={(e) => setAnnActionType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white outline-none"
              >
                <option value="BEATS">Beats Catalog (#beats)</option>
                <option value="BEAT_PACK">Beat Packs Collection (#beat-packs)</option>
                <option value="VAULT">The Vault (#vault)</option>
                <option value="SERVICES">Services Directory (#services)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 mt-5">
              <span className="text-xs font-mono font-bold text-neutral-300">Publicly Visible</span>
              <button
                type="button"
                onClick={() => setAnnActive(!annActive)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                  annActive ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {annActive ? 'Published' : 'Draft / Off'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
          >
            Save & Publish Announcement
          </button>
        </form>
      </div>

      {/* SECTION 3: VOODOO BOOMIN VAULT (FEATURE 30) */}
      <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
              <Lock className="w-5 h-5 text-purple-400" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                Voodoo Boomin Vault (Feature #30)
              </h2>
              <p className="text-xs text-neutral-400">
                Designate specific existing beats and beat packs as Vault content without duplicating records or audio files.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-purple-400 font-bold px-3 py-1 rounded-full bg-purple-950 border border-purple-800">
            {vaultConfig.beatIds.length} Beats • {vaultConfig.packIds.length} Packs in Vault
          </span>
        </div>

        {/* Beats Vault Toggle Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase text-neutral-300 flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" /> Designate Vault Beats:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
            {state.beats.map((beat) => {
              const inVault = vaultConfig.beatIds.includes(beat.id);
              return (
                <div
                  key={beat.id}
                  onClick={() => {
                    if (inVault) {
                      removeBeatFromVault(beat.id);
                    } else {
                      addBeatToVault(beat.id);
                    }
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    inVault
                      ? 'bg-purple-950/80 border-purple-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={beat.coverArtUrl} alt={beat.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    <span className="text-xs font-bold truncate">{beat.title}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    inVault ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {inVault ? 'In Vault' : '+ Add'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Packs Vault Toggle Selector */}
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <h3 className="text-xs font-mono font-bold uppercase text-neutral-300 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" /> Designate Vault Beat Packs:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
            {state.beatPacks.map((pack) => {
              const inVault = vaultConfig.packIds.includes(pack.id);
              return (
                <div
                  key={pack.id}
                  onClick={() => {
                    if (inVault) {
                      removePackFromVault(pack.id);
                    } else {
                      addPackToVault(pack.id);
                    }
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    inVault
                      ? 'bg-purple-950/80 border-purple-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={pack.coverArtUrl} alt={pack.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    <span className="text-xs font-bold truncate">{pack.title}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    inVault ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {inVault ? 'In Vault' : '+ Add'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
