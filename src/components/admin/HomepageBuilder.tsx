import React, { useState } from 'react';
import { useStore, DEFAULT_HOMEPAGE_LAYOUT } from '../../context/StoreContext';
import { HomepageLayout, HomepageSectionId, HomepageSectionConfig } from '../../types';
import { 
  LayoutTemplate, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Flame, 
  Music, 
  Package, 
  Megaphone, 
  UserCircle,
  Briefcase,
  HelpCircle
} from 'lucide-react';

const SECTION_METADATA: Record<HomepageSectionId, { title: string; description: string; icon: React.ReactNode; tag: string }> = {
  hero: {
    title: 'Hero / Featured Release Showcase',
    description: 'Prominently display the latest or top-selling beat with direct stream playback and high-impact licensing CTA.',
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    tag: 'Storefront Header',
  },
  beats: {
    title: 'Beats Catalog & Filter Matrix',
    description: 'The core beats discography with real-time audio players, BPM/Key filters, licensing modals, and cart actions.',
    icon: <Music className="w-5 h-5 text-indigo-400" />,
    tag: 'Catalog Core',
  },
  beat_packs: {
    title: 'Beat Packs Collection',
    description: 'High-value multi-beat ZIP bundles with interactive "What\'s Inside" track preview drawers and discount pricing.',
    icon: <Package className="w-5 h-5 text-amber-400" />,
    tag: 'Bundle E-Commerce',
  },
  high_performance: {
    title: 'High-Performance Tracks',
    description: 'Showcase authentic best-selling and high-engagement tracks with play counters and licensing highlights.',
    icon: <Flame className="w-5 h-5 text-orange-400" />,
    tag: 'Performance Analytics',
  },
  top_tracks: {
    title: 'Top Tracks Ranking',
    description: 'Dynamic leaderboards ranked purely by verified store interactions across Today, This Week, This Month, and All Time.',
    icon: <Layers className="w-5 h-5 text-emerald-400" />,
    tag: 'Dynamic Ranking',
  },
  feed: {
    title: 'Voodoo Boomin Feed',
    description: 'Producer announcements, beat drops, studio logs, and video highlights with real-time fan interactions.',
    icon: <Megaphone className="w-5 h-5 text-pink-400" />,
    tag: 'Community Feed',
  },
  services: {
    title: 'Music Professionals Directory',
    description: 'Vetted directory of labels, mixing engineers, managers, and designers for community-wide discovery.',
    icon: <Briefcase className="w-5 h-5 text-teal-400" />,
    tag: 'Services Network',
  },
  profile: {
    title: 'Producer Profile & Credits',
    description: 'Verified artist biography, production credits, studio hardware specs, and connected social media profiles.',
    icon: <UserCircle className="w-5 h-5 text-blue-400" />,
    tag: 'Artist Identity',
  },
};

export default function HomepageBuilder() {
  const { state, updateHomepageLayout, resetHomepageLayout } = useStore();
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentLayout: HomepageLayout = state.homepageLayout && state.homepageLayout.length > 0
    ? state.homepageLayout
    : DEFAULT_HOMEPAGE_LAYOUT;

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentLayout.length) return;

    const newLayout = [...currentLayout];
    const temp = newLayout[index];
    newLayout[index] = newLayout[targetIndex];
    newLayout[targetIndex] = temp;

    setIsSaving(true);
    await updateHomepageLayout(newLayout);
    setIsSaving(false);
    triggerSaveFeedback('Section order updated');
  };

  const handleToggle = async (sectionId: HomepageSectionId) => {
    const newLayout = currentLayout.map((section) => {
      if (section.id === sectionId) {
        return { ...section, enabled: !section.enabled };
      }
      return section;
    });

    setIsSaving(true);
    await updateHomepageLayout(newLayout);
    setIsSaving(false);
    const updated = newLayout.find(s => s.id === sectionId);
    triggerSaveFeedback(`Section ${updated?.enabled ? 'enabled' : 'hidden'}`);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset storefront sections to standard default order?')) return;
    setIsSaving(true);
    await resetHomepageLayout();
    setIsSaving(false);
    triggerSaveFeedback('Layout restored to default');
  };

  const triggerSaveFeedback = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => {
      setSaveStatus(null);
    }, 2500);
  };

  const activeCount = currentLayout.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <LayoutTemplate className="w-4 h-4" /> Storefront Layout Engine
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Homepage Section Builder</h2>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Control the exact presentation hierarchy and visibility of your public storefront. Reorder sections with single-click transport arrows or toggle any section on/off.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveStatus}</span>
              </div>
            )}
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-all border border-neutral-700 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Layout
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-neutral-800/80">
          <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl p-3">
            <span className="text-[10px] uppercase font-mono text-neutral-500 font-bold block">Active Sections</span>
            <span className="text-lg font-black text-white">{activeCount} / {currentLayout.length}</span>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl p-3">
            <span className="text-[10px] uppercase font-mono text-neutral-500 font-bold block">Topmost Section</span>
            <span className="text-lg font-black text-purple-400 truncate block">
              {SECTION_METADATA[currentLayout[0]?.id]?.title || 'Hero'}
            </span>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-mono text-neutral-500 font-bold block">Persistence Mode</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Cloud API Synced
            </span>
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {currentLayout.map((section, idx) => {
          const meta = SECTION_METADATA[section.id] || {
            title: section.name,
            description: 'Custom storefront section.',
            icon: <Layers className="w-5 h-5 text-purple-400" />,
            tag: 'Section',
          };

          const isFirst = idx === 0;
          const isLast = idx === currentLayout.length - 1;

          return (
            <div
              key={section.id}
              className={`bg-neutral-900 border rounded-2xl p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                section.enabled
                  ? 'border-neutral-800 hover:border-purple-900/50 shadow-md'
                  : 'border-neutral-900/60 opacity-60 bg-neutral-950/50'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start gap-4">
                {/* Index badge */}
                <div className="w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-xs font-mono font-black text-neutral-400 shrink-0">
                  #{idx + 1}
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 shrink-0 hidden sm:flex items-center justify-center">
                  {meta.icon}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white tracking-tight">
                      {meta.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-400 font-bold">
                      {meta.tag}
                    </span>
                    {!section.enabled && (
                      <span className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 text-[10px] font-bold text-red-300">
                        Hidden from Storefront
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                    {meta.description}
                  </p>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {/* Visibility toggle */}
                <button
                  onClick={() => handleToggle(section.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    section.enabled
                      ? 'bg-purple-950/60 border-purple-800/80 text-purple-300 hover:bg-purple-900/80'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white'
                  }`}
                  title={section.enabled ? 'Click to hide this section' : 'Click to show this section'}
                >
                  {section.enabled ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>

                {/* Move Up */}
                <button
                  onClick={() => handleMove(idx, 'up')}
                  disabled={isFirst || isSaving}
                  className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Move section up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                {/* Move Down */}
                <button
                  onClick={() => handleMove(idx, 'down')}
                  disabled={isLast || isSaving}
                  className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Move section down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30 flex items-start gap-3 text-xs text-purple-300">
        <HelpCircle className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
        <div>
          <span className="font-bold">Pro-Tip for Maximum Conversions:</span> Place High-Performance Tracks and Beat Packs near the top of the storefront to emphasize your top releases and bulk bundle deals to incoming artists.
        </div>
      </div>
    </div>
  );
}
