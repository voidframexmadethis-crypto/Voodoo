import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import BeatUploader from '../components/BeatUploader';
import BeatPackUploader from '../components/BeatPackUploader';
import BeatPacksManagement from '../components/admin/BeatPacksManagement';
import { Music, Package } from 'lucide-react';

export default function Uploader() {
  const isAdmin = localStorage.getItem('VOODOO_BOOMIN_ADMIN_AUTH') === 'true' || localStorage.getItem('KRYPSIDE_ADMIN_AUTH') === 'true';
  const [uploaderMode, setUploaderMode] = useState<'single' | 'pack'>('single');

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Mode Switcher Bar */}
      <div className="border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Upload Content</span>
              <span className="text-sm font-extrabold text-white">
                {uploaderMode === 'single' ? 'Single Beat Uploader' : 'Beat Pack Uploader'}
              </span>
            </div>
          </div>

          {/* Clean Top-Level Uploader Tabs */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1.5 rounded-xl shadow-inner gap-1">
            <button
              onClick={() => setUploaderMode('single')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                uploaderMode === 'single'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Music className="w-4 h-4" />
              SINGLE BEAT
            </button>

            <button
              onClick={() => setUploaderMode('pack')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                uploaderMode === 'pack'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Package className="w-4 h-4" />
              BEAT PACK
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {uploaderMode === 'single' ? (
          <div className="animate-in fade-in duration-200">
            <BeatUploader />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-200">
            <BeatPackUploader />
          </div>
        )}
      </div>
    </div>
  );
}

