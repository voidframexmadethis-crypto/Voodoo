import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { MusicProfessional, ProfessionalCategory } from '../types';
import { 
  Sliders, 
  Sparkles, 
  User, 
  Music, 
  Layers, 
  Volume2, 
  Globe, 
  Shield, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  Briefcase
} from 'lucide-react';

interface ServicesSectionProps {
  isDarkMode: boolean;
}

const CATEGORY_LABELS: Record<ProfessionalCategory, string> = {
  anr_record_labels: 'A&R / Record Labels',
  mixing_mastering: 'Mixing & Mastering',
  recording_engineers: 'Recording Engineers',
  music_managers: 'Music Managers',
  playlist_curators: 'Playlist Curators',
  cover_art_designers: 'Cover Art & Design',
  music_promotion: 'Music Promotion & Marketing',
  production_services: 'Production Services',
  music_distribution: 'Music Distribution'
};

const CATEGORY_ICONS: Record<ProfessionalCategory, any> = {
  anr_record_labels: Shield,
  mixing_mastering: Sliders,
  recording_engineers: Volume2,
  music_managers: User,
  playlist_curators: Music,
  cover_art_designers: Layers,
  music_promotion: Sparkles,
  production_services: Sliders,
  music_distribution: Globe
};

export default function ServicesSection({ isDarkMode }: ServicesSectionProps) {
  const navigate = useNavigate();
  const { state, trackProfessionalClick } = useStore();
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const config = state.servicesConfig || {
    enableMusicDistribution: false,
    enableProfessionalApplications: true
  };

  const professionals = state.professionals || [];
  const publicProfessionals = useMemo(() => {
    return professionals.filter(p => p.status === 'APPROVED' && p.published === true);
  }, [professionals]);

  // Exclude distribution if disabled
  const activeCategories = useMemo(() => {
    const list = Object.keys(CATEGORY_LABELS) as ProfessionalCategory[];
    return list.filter(cat => {
      if (cat === 'music_distribution') {
        return config.enableMusicDistribution;
      }
      return true;
    });
  }, [config.enableMusicDistribution]);

  const displayedProfessionals = useMemo(() => {
    if (selectedCat === 'all') {
      return publicProfessionals.slice(0, 6);
    }
    return publicProfessionals.filter(p => p.category === selectedCat || (p.secondaryCategories || []).includes(selectedCat as any)).slice(0, 6);
  }, [publicProfessionals, selectedCat]);

  const handleContact = async (prof: MusicProfessional) => {
    await trackProfessionalClick(prof.id, 'contact');
    
    if (prof.bookingMethod === 'email') {
      window.location.href = `mailto:${prof.email}?subject=Inquiry from Voodoo Boomin Storefront`;
    } else if (prof.bookingMethod === 'custom' && prof.phone) {
      window.location.href = `tel:${prof.phone}`;
    } else if ((prof.bookingMethod === 'booking_link' || prof.bookingMethod === 'website') && prof.bookingUrl) {
      window.open(prof.bookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = `mailto:${prof.email}?subject=Inquiry from Voodoo Boomin Storefront`;
    }
  };

  return (
    <section 
      id="services-directory" 
      className={`rounded-3xl p-6 md:p-8 border shadow-xl transition-all duration-300 ${
        isDarkMode ? 'bg-[#09090c] border-neutral-900' : 'bg-white border-neutral-200'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-400" />
            <h2 className={`text-xl md:text-2xl font-black tracking-tight uppercase italic ${
              isDarkMode ? 'text-white' : 'text-neutral-900'
            }`}>
              Music Professionals Directory
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
              Vetted Partners
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
            Directly connect with high-end mixing engineers, record labels, playlist curators, and promotion agencies.
          </p>
        </div>

        <button
          onClick={() => navigate('/services')}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer self-start md:self-auto"
        >
          <span>View Directory</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase shrink-0 transition-all cursor-pointer ${
            selectedCat === 'all'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10'
              : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-850'
          }`}
        >
          All Categories
        </button>
        {activeCategories.map(cat => {
          const Icon = CATEGORY_ICONS[cat] || Briefcase;
          const isActive = selectedCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10'
                  : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-850'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{CATEGORY_LABELS[cat]}</span>
            </button>
          );
        })}
      </div>

      {/* Professionals Grid */}
      {publicProfessionals.length === 0 ? (
        <div className={`text-center py-12 px-4 rounded-2xl border ${
          isDarkMode ? 'bg-neutral-900/20 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-neutral-800/50 flex items-center justify-center text-neutral-400">
            <User size={24} />
          </div>
          <p className="text-sm font-semibold text-neutral-400">
            No Music Professionals Listed Yet.
          </p>
        </div>
      ) : displayedProfessionals.length === 0 ? (
        <div className={`text-center py-12 px-4 rounded-2xl border ${
          isDarkMode ? 'bg-neutral-900/20 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <p className="text-xs text-neutral-400">
            No professionals listed in this specific category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProfessionals.map((prof) => {
            const CatIcon = CATEGORY_ICONS[prof.category] || Briefcase;
            return (
              <div
                key={prof.id}
                className="p-4 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-850 hover:border-neutral-700 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                        {prof.avatarUrl ? (
                          <img 
                            src={prof.avatarUrl} 
                            alt={prof.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User className="w-5 h-5 text-neutral-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-white group-hover:text-purple-400 transition-colors uppercase italic tracking-tight flex items-center gap-1">
                          {prof.name}
                        </h3>
                        <span className="text-[10px] font-mono text-purple-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                          <CatIcon className="w-3 h-3 shrink-0" />
                          {CATEGORY_LABELS[prof.category]}
                        </span>
                      </div>
                    </div>

                    {prof.verified && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase shrink-0">
                        Verified
                      </span>
                    )}
                  </div>

                  {prof.tagline && (
                    <p className="text-xs text-neutral-200 font-semibold mb-2 italic">
                      &quot;{prof.tagline}&quot;
                    </p>
                  )}

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                    {prof.bio}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-850/60 mt-auto">
                  {prof.location ? (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500 font-mono">
                      <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span>{prof.location}</span>
                    </div>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => handleContact(prof)}
                    className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Connect</span>
                    <ExternalLink className="w-3 h-3" />
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
