import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Beat } from '../types';
import { filterHumanBeats } from '../lib/beatUtils';
import { 
  TrendingUp, 
  Play, 
  Pause, 
  ShoppingCart, 
  Flame, 
  Sparkles, 
  Clock, 
  Music, 
  Headphones, 
  Award,
  ChevronRight
} from 'lucide-react';

interface TopTracksSectionProps {
  isDarkMode: boolean;
  onPlayBeat: (beat: Beat) => void;
  onPurchaseBeat: (beat: Beat) => void;
}

type TimeframeOption = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME';

export default function TopTracksSection({
  isDarkMode,
  onPlayBeat,
  onPurchaseBeat,
}: TopTracksSectionProps) {
  const { state, cart, addToCart } = useStore();
  const { currentTrack, isPlaying: isGlobalPlaying, togglePlay } = useAudioPlayer();
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('THIS_WEEK');

  // Filter out any AI / demo placeholders - only real human tracks
  const realBeats = useMemo(() => {
    return filterHumanBeats(state.beats || []);
  }, [state.beats]);

  // Calculate dynamic ranking based on recorded real store metrics & timeframe weighting
  const rankedBeats = useMemo(() => {
    if (realBeats.length === 0) return [];

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const oneMonthMs = 30 * oneDayMs;

    return [...realBeats]
      .map((beat) => {
        const beatCreatedTime = new Date(beat.createdAt || 0).getTime();
        const ageMs = Math.max(1, now - beatCreatedTime);
        const ageDays = ageMs / oneDayMs;

        const plays = beat.plays || 0;
        const purchases = beat.purchases || 0;
        const likes = beat.likes || 0;
        const downloads = beat.downloads || 0;

        // Calculate score based on timeframe
        let timeframeScore = 0;
        let isEligible = true;

        switch (selectedTimeframe) {
          case 'TODAY': {
            // For TODAY: Give immense weight to recent velocity & activity
            const recencyFactor = ageDays <= 1 ? 2.5 : Math.max(0.1, 1 / (ageDays + 1));
            timeframeScore = (purchases * 20 + downloads * 8 + plays * 2 + likes * 4) * recencyFactor;
            // Only include if there is recorded activity or created recently
            if (plays === 0 && purchases === 0 && downloads === 0 && likes === 0 && ageDays > 2) {
              isEligible = false;
            }
            break;
          }
          case 'THIS_WEEK': {
            const recencyFactor = ageDays <= 7 ? 2.0 : Math.max(0.2, 7 / (ageDays + 1));
            timeframeScore = (purchases * 15 + downloads * 6 + plays * 1.5 + likes * 3) * recencyFactor;
            if (plays === 0 && purchases === 0 && downloads === 0 && likes === 0 && ageDays > 14) {
              isEligible = false;
            }
            break;
          }
          case 'THIS_MONTH': {
            const recencyFactor = ageDays <= 30 ? 1.5 : Math.max(0.3, 30 / (ageDays + 1));
            timeframeScore = (purchases * 12 + downloads * 5 + plays * 1.2 + likes * 2.5) * recencyFactor;
            if (plays === 0 && purchases === 0 && downloads === 0 && likes === 0 && ageDays > 60) {
              isEligible = false;
            }
            break;
          }
          case 'ALL_TIME':
          default: {
            timeframeScore = purchases * 10 + downloads * 4 + plays * 1 + likes * 2;
            break;
          }
        }

        return {
          beat,
          score: timeframeScore,
          isEligible,
          plays,
          purchases,
          downloads,
          likes
        };
      })
      .filter(item => item.isEligible && (item.score > 0 || realBeats.length <= 5))
      .sort((a, b) => b.score - a.score)
      .map(item => item.beat)
      .slice(0, 10);
  }, [realBeats, selectedTimeframe]);

  const timeframes: { id: TimeframeOption; label: string }[] = [
    { id: 'TODAY', label: 'Today' },
    { id: 'THIS_WEEK', label: 'This Week' },
    { id: 'THIS_MONTH', label: 'This Month' },
    { id: 'ALL_TIME', label: 'All Time' },
  ];

  return (
    <section 
      id="top-tracks" 
      className={`rounded-3xl p-6 md:p-8 border shadow-xl relative scroll-mt-24 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0b0b0f] border-neutral-900' : 'bg-white border-neutral-200'
      }`}
    >
      {/* Header with Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={22} className="text-purple-400" />
            <h2 className={`text-xl md:text-2xl font-black tracking-tight uppercase italic ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>
              Top Tracks
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
              Dynamic Chart
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Rankings calculated automatically from verified store streams, licenses, and downloads.
          </p>
        </div>

        {/* Timeframe Navigation Tabs */}
        <div className={`flex items-center p-1 rounded-xl border self-start sm:self-auto ${
          isDarkMode ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
        }`}>
          {timeframes.map((tf) => {
            const isActive = selectedTimeframe === tf.id;
            return (
              <button
                key={tf.id}
                onClick={() => setSelectedTimeframe(tf.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : isDarkMode 
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Track Listing or Clean Empty State */}
      {rankedBeats.length === 0 ? (
        <div className={`text-center py-16 px-4 rounded-2xl border ${
          isDarkMode ? 'bg-neutral-900/20 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <TrendingUp size={28} />
          </div>
          <h3 className={`text-base font-black uppercase tracking-tight mb-2 ${
            isDarkMode ? 'text-white' : 'text-neutral-900'
          }`}>
            No Chart Rankings For {timeframes.find(t => t.id === selectedTimeframe)?.label} Yet
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto mb-6 leading-relaxed">
            As listeners stream and license beats on the storefront, chart positions for this period will automatically populate in real-time.
          </p>
          <button
            onClick={() => {
              const catalogEl = document.getElementById('catalog-search-section');
              if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            Explore Beats Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {rankedBeats.map((beat, idx) => {
            const isPlayingThis = isGlobalPlaying && currentTrack?.id === beat.id;
            const rankNumber = idx + 1;
            const inCart = cart?.some(item => item.id === beat.id);

            // Medals for top 3
            let rankBadgeClass = isDarkMode ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600';
            if (rankNumber === 1) {
              rankBadgeClass = 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black shadow-lg shadow-amber-500/20';
            } else if (rankNumber === 2) {
              rankBadgeClass = 'bg-gradient-to-br from-slate-200 to-slate-400 text-black font-black shadow-md';
            } else if (rankNumber === 3) {
              rankBadgeClass = 'bg-gradient-to-br from-amber-700 to-orange-800 text-white font-black shadow-md';
            }

            return (
              <div
                key={beat.id}
                className={`group flex items-center justify-between p-3 md:p-3.5 rounded-2xl border transition-all duration-200 ${
                  isPlayingThis
                    ? 'bg-purple-950/40 border-purple-600/60 shadow-[0_4px_20px_rgba(147,51,234,0.15)]'
                    : isDarkMode 
                      ? 'bg-[#111116] border-neutral-850 hover:border-neutral-750 hover:bg-[#15151c]' 
                      : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {/* Left: Rank # + Cover + Play + Title */}
                <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                  {/* Rank Number Badge */}
                  <div className={`w-7 h-7 shrink-0 rounded-xl flex items-center justify-center text-xs font-mono font-black ${rankBadgeClass}`}>
                    {rankNumber}
                  </div>

                  {/* Artwork & Play overlay */}
                  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-neutral-800 group/art cursor-pointer">
                    <img
                      src={beat.coverArtUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop'}
                      alt={beat.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/art:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => onPlayBeat(beat)}
                      className={`absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer ${
                        isPlayingThis 
                          ? 'bg-purple-950/70 opacity-100' 
                          : 'bg-black/50 opacity-0 group-hover/art:opacity-100'
                      }`}
                      aria-label={isPlayingThis ? `Pause ${beat.title}` : `Play ${beat.title}`}
                    >
                      {isPlayingThis ? (
                        <Pause size={18} className="text-purple-300 fill-current" />
                      ) : (
                        <Play size={18} className="text-white fill-current translate-x-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Track Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-black text-sm md:text-base tracking-tight truncate uppercase italic ${
                        isPlayingThis ? 'text-purple-400' : isDarkMode ? 'text-white' : 'text-neutral-900'
                      }`}>
                        {beat.title}
                      </h4>
                      {rankNumber <= 3 && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase">
                          <Flame size={10} className="fill-current" />
                          Top {rankNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400 font-mono flex-wrap">
                      <span className="font-bold text-neutral-300">{beat.producer || 'Voodoo Boomin'}</span>
                      <span>•</span>
                      <span>{beat.bpm} BPM</span>
                      <span>•</span>
                      <span>{beat.key}</span>
                      {beat.plays && beat.plays > 0 ? (
                        <>
                          <span className="hidden md:inline">•</span>
                          <span className="hidden md:inline-flex items-center gap-1 text-purple-400">
                            <Headphones size={11} />
                            {beat.plays.toLocaleString()} plays
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-3">
                  <span className="text-sm md:text-base font-black font-mono text-purple-400">
                    ${beat.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onPurchaseBeat(beat)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <ShoppingCart size={13} className="fill-current" />
                    <span className="hidden sm:inline">{inCart ? 'In Cart' : 'Lease'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
