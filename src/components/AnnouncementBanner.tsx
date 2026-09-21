import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Megaphone, X, ArrowRight, Sparkles } from 'lucide-react';

export default function AnnouncementBanner() {
  const { state } = useStore();
  const [dismissed, setDismissed] = useState(false);

  const announcement = state.announcement;

  if (dismissed || !announcement || !announcement.active || !announcement.title) {
    return null;
  }

  const handleAction = () => {
    if (announcement.actionUrl) {
      if (announcement.actionUrl.startsWith('http')) {
        window.open(announcement.actionUrl, '_blank');
      } else {
        const el = document.querySelector(announcement.actionUrl);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.hash = announcement.actionUrl;
        }
      }
      return;
    }

    // Handle by action type
    switch (announcement.actionType) {
      case 'BEATS': {
        const beatsSection = document.getElementById('beats') || document.querySelector('#beats-catalog');
        beatsSection?.scrollIntoView({ behavior: 'smooth' });
        break;
      }
      case 'BEAT_PACK': {
        const packsSection = document.getElementById('beat-packs');
        packsSection?.scrollIntoView({ behavior: 'smooth' });
        break;
      }
      case 'VAULT': {
        const vaultSection = document.getElementById('vault');
        vaultSection?.scrollIntoView({ behavior: 'smooth' });
        break;
      }
      case 'SERVICES': {
        const servicesSection = document.getElementById('services');
        servicesSection?.scrollIntoView({ behavior: 'smooth' });
        break;
      }
      default: {
        const defaultSection = document.getElementById('beats');
        defaultSection?.scrollIntoView({ behavior: 'smooth' });
        break;
      }
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-purple-950 via-neutral-900 to-indigo-950 border-b border-purple-800/60 text-white py-2.5 px-4 relative z-40 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Banner Content */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="p-1.5 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 shrink-0">
            <Megaphone className="w-4 h-4 text-purple-400" />
          </span>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-purple-300 shrink-0">
              {announcement.title}:
            </span>
            <span className="text-xs text-neutral-200 truncate max-w-xl">
              {announcement.message}
            </span>
          </div>
        </div>

        {/* Action & Close button */}
        <div className="flex items-center gap-2 shrink-0">
          {announcement.actionText && (
            <button
              onClick={handleAction}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <span>{announcement.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Dismiss Announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
