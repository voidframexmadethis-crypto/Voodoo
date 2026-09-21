import React, { useState } from 'react';
import { X, Mail, Bell, Sparkles, Check, Download, Music, Youtube } from 'lucide-react';
import { Beat } from '../types';
import { handleMarketingError } from '../lib/marketing';
import { useAudioPlayer } from '../context/AudioPlayerContext';

interface SubscribeDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  beat: Beat | null;
  onSuccess: (beat: Beat) => void;
}

export default function SubscribeDownloadModal({ isOpen, onClose, beat, onSuccess }: SubscribeDownloadModalProps) {
  const { playTrack } = useAudioPlayer();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notifyOnBeatDrop, setNotifyOnBeatDrop] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showEmailFormOnly, setShowEmailFormOnly] = useState(false);

  if (!isOpen || !beat) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setStatus('error');
      setMessage('Name and email are required to unlock your download.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          notifyOnBeatDrop
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message);
        
        localStorage.setItem('VOODOO_BOOMIN_SUBSCRIBED', 'true');
        localStorage.setItem('VOODOO_BOOMIN_SUBSCRIBER_EMAIL', email.trim());
        localStorage.setItem('VOODOO_BOOMIN_SUBSCRIBER_NAME', name.trim());
        localStorage.setItem('KRYPSIDE_SUBSCRIBED', 'true');
        localStorage.setItem('KRYPSIDE_SUBSCRIBER_EMAIL', email.trim());
        localStorage.setItem('KRYPSIDE_SUBSCRIBER_NAME', name.trim());
        
        window.dispatchEvent(new Event('VOODOO_BOOMIN_SUBSCRIBED_STATUS_CHANGED'));
        window.dispatchEvent(new Event('KRYPSIDE_SUBSCRIBED_STATUS_CHANGED'));

        setTimeout(() => {
          onSuccess(beat);
          onClose();
        }, 1500);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to register subscription.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleSocialUnlock = (platform: 'youtube' | 'tiktok') => {
    try {
      if (platform === 'youtube') {
        localStorage.setItem('VOODOO_BOOMIN_YOUTUBE_SUBSCRIBED', 'true');
        localStorage.setItem('KRYPSIDE_YOUTUBE_SUBSCRIBED', 'true');
      } else {
        localStorage.setItem('VOODOO_BOOMIN_TIKTOK_FOLLOWED', 'true');
        localStorage.setItem('KRYPSIDE_TIKTOK_FOLLOWED', 'true');
      }
      window.dispatchEvent(new Event('VOODOO_BOOMIN_SUBSCRIBED_STATUS_CHANGED'));
      window.dispatchEvent(new Event('KRYPSIDE_SUBSCRIBED_STATUS_CHANGED'));
      setStatus('success');
      setMessage(`✓ ${platform.toUpperCase()} connection verified. Unlocking master...`);
      playTrack(beat);
      onSuccess(beat);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      handleMarketingError('UNKNOWN_MARKETING_ERROR', {
        componentName: 'SubscribeDownloadModal',
        context: { error: (error as Error).message }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-white font-bold">
            <Sparkles className="text-indigo-500" size={20} />
            <span>Unlock High-Quality Master</span>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6">
          <div className="flex gap-4 items-center mb-6 bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/50">
            <div className="w-16 h-16 bg-neutral-800 rounded-md overflow-hidden border border-neutral-700 flex-shrink-0">
              {beat.coverArtUrl ? (
                <img 
                  src={beat.coverArtUrl} 
                  alt={beat.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500"><Music size={20} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base truncate">{beat.title}</h3>
              <p className="text-neutral-400 text-xs truncate">by {beat.producer}</p>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded">
                <Download size={10} /> MASTER UNLOCK REQUIRED
              </div>
            </div>
          </div>

          {status === 'success' ? (
            <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-xl font-bold text-white">Check Your Inbox!</h4>
              <p className="text-sm text-neutral-400 mt-2">
                Your high-quality master for <strong className="text-white">"{beat.title}"</strong> is being sent to you...
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-neutral-200 text-center uppercase tracking-wider">
                Complete Action to Unlock Free Download
              </h3>

              {/* Safe Social Navigation Buttons */}
              {!showEmailFormOnly && (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleSocialUnlock('youtube')}
                    className="w-full py-3.5 bg-[#f87171] hover:bg-[#ef4444] text-black font-black text-sm uppercase tracking-tighter rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Youtube size={18} fill="currentColor" />
                    Subscribe on YouTube ↗
                  </button>

                  <button 
                    onClick={() => handleSocialUnlock('tiktok')}
                    className="w-full py-3.5 bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-black text-sm uppercase tracking-tighter rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Music size={18} fill="currentColor" />
                    Follow on TikTok ↗
                  </button>
                </div>
              )}

              {!showEmailFormOnly && (
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-neutral-900 px-3 text-neutral-500 font-bold tracking-widest">OR USE EMAIL</span></div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  required
                  placeholder="Artist / Stage Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <input 
                  type="email" 
                  required
                  placeholder="Your Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button 
                  type="button" 
                  disabled={status === 'loading'}
                  onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
                  className="w-full bg-white hover:bg-neutral-200 text-black font-bold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
                >
                  {status === 'loading' ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Unlock VIP Access & Free Downloads'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}
