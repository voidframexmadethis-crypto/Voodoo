import React from 'react';
import { CheckCircle2, Download, ExternalLink, Music, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';
import { Beat, BeatPack } from '../types';

export interface OrderItem {
  beat?: Beat;
  pack?: BeatPack;
  licenseType: string;
  price: number;
}

export interface PurchaseOrderPayload {
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  customerEmail?: string;
  transactionDate: string;
}

interface PurchaseConfirmationModalProps {
  order: PurchaseOrderPayload;
  onClose: () => void;
}

export function PurchaseConfirmationModal({ order, onClose }: PurchaseConfirmationModalProps) {
  const triggerFileDownload = (audioUrl?: string, title?: string) => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${(title || 'Voodoo_Boomin_Beat').replace(/\s+/g, '_')}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-[#0d0d12] border-2 border-emerald-500/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] p-6 md:p-8 text-white relative my-8">
        
        {/* Header Icon & Title */}
        <div className="text-center pb-6 border-b border-neutral-800">
          <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30 inline-block mb-2">
            Official License Authorization Confirmed
          </span>

          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            Thank You For Your Purchase!
          </h2>
          <p className="text-neutral-400 text-xs md:text-sm mt-1 max-w-md mx-auto">
            Your transaction was successfully processed. Your high-quality untagged audio and commercial license agreements are ready for immediate download below.
          </p>
        </div>

        {/* Order Details Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs font-mono">
          <div>
            <span className="text-neutral-500 uppercase block text-[10px] font-bold">Order Ref</span>
            <span className="font-extrabold text-emerald-400">{order.orderId}</span>
          </div>
          <div>
            <span className="text-neutral-500 uppercase block text-[10px] font-bold">Date</span>
            <span className="font-bold text-neutral-300">{order.transactionDate}</span>
          </div>
          <div>
            <span className="text-neutral-500 uppercase block text-[10px] font-bold">Payment Via</span>
            <span className="font-bold text-purple-400 uppercase">{order.paymentMethod}</span>
          </div>
          <div>
            <span className="text-neutral-500 uppercase block text-[10px] font-bold">Total Paid</span>
            <span className="font-extrabold text-white text-sm">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Purchased Items List */}
        <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-400" />
            Purchased Releases & Downloads
          </h3>

          {order.items.map((item, index) => {
            const beat = item.beat;
            const pack = item.pack;
            const title = beat ? beat.title : (pack ? pack.title : 'Voodoo Release');
            const producer = beat ? beat.producer : 'Voodoo Boomin';
            const coverArt = beat ? beat.coverArtUrl : (pack ? pack.coverArtUrl : '');
            const downloadUrl = beat ? (beat.audioUrl || beat.watermarkedAudioUrl) : (pack ? pack.zipFileUrl : '');

            return (
              <div 
                key={index}
                className="p-3.5 rounded-2xl bg-[#13131a] border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <img 
                    src={coverArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&h=150&fit=crop'} 
                    alt={title}
                    className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-sm text-white uppercase italic tracking-tight truncate">
                      {title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      {producer} • <span className="text-purple-400 font-bold uppercase">{item.licenseType}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="font-mono text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0">
                    ${item.price.toFixed(2)}
                  </span>

                  <button
                    onClick={() => triggerFileDownload(downloadUrl, title)}
                    className="px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
                    title="Download Audio File"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Verification Guarantee Notice */}
        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-purple-300 text-xs flex items-center gap-3 mb-6">
          <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
          <p className="leading-normal">
            Your commercial rights agreement has been recorded under reference <strong className="text-white font-mono">{order.orderId}</strong>. You can re-download your files anytime from your account dashboard.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-extrabold uppercase tracking-wider text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Continue Browsing Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
