import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Trash2, Tag, ShoppingCart, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Beat } from '../types';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CURRENCY_MAP = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.78 },
  JPY: { symbol: '¥', rate: 150.0 }
};

export const MiniCart: React.FC<MiniCartProps> = ({ isOpen, onClose, onCheckout }) => {
  const { 
    cart, 
    removeFromCart, 
    updateCartItemLicense, 
    promoCode, 
    setPromoCode, 
    currency, 
    setCurrency, 
    state 
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Currency Formatter Helper
  const formatVal = (usdAmount: number) => {
    const data = CURRENCY_MAP[currency] || CURRENCY_MAP.USD;
    const converted = usdAmount * data.rate;
    if (currency === 'JPY') {
      return `${data.symbol}${Math.round(converted)}`;
    }
    return `${data.symbol}${converted.toFixed(2)}`;
  };

  // Check valid promo codes
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = promoInput.trim().toUpperCase();
    if (normalized === 'VOODOO20') {
      setPromoCode('VOODOO20');
      setPromoSuccess('Promo "VOODOO20" (20% Off) applied successfully!');
      setPromoError('');
    } else if (normalized === 'BOOMIN') {
      setPromoCode('BOOMIN');
      setPromoSuccess('Promo "BOOMIN" (50% Off VIP discount) applied successfully!');
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try "VOODOO20" or "BOOMIN"');
      setPromoSuccess('');
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoInput('');
    setPromoSuccess('');
    setPromoError('');
  };

  // Cart Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  
  let discountPct = 0;
  if (promoCode === 'VOODOO20') discountPct = 0.20;
  if (promoCode === 'BOOMIN') discountPct = 0.50;
  
  const discountAmount = subtotal * discountPct;
  const total = subtotal - discountAmount;

  // Cart Upsell Recommendations: Recommend beats that aren't already in the cart
  const upsellBeats = (state.beats || [])
    .filter(b => !cart.some(item => item.beat.id === b.id))
    .slice(0, 2);

  const { addToCart } = useStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Sliding Cart Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-md bg-[#0a0a0c] border-l border-neutral-900 shadow-[20px_0_50px_rgba(0,0,0,0.9)] flex flex-col text-white"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-purple-900/20 text-purple-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-wider">Your Cart</h3>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">{cart.length} items selected</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar">
              
              {/* Currency Selector */}
              <div className="bg-neutral-950 border border-neutral-900 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase">Select Currency</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Convert prices dynamically</p>
                </div>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-bold py-1.5 px-3 rounded-lg focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-neutral-500">
                  <span className="text-4xl">🛒</span>
                  <h4 className="font-bold text-white uppercase tracking-wider mt-4">Your Cart is Empty</h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs">Browse the catalog and add premium tracks to configure your licenses.</p>
                  <button 
                    onClick={onClose}
                    className="mt-6 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase px-5 py-2.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.map((item) => {
                    const beat = item.beat;
                    return (
                      <div 
                        key={beat.id}
                        className="bg-neutral-950 border border-neutral-900/60 p-3 rounded-xl flex items-center gap-3.5 relative group hover:border-neutral-800 transition-all"
                      >
                        {/* Artwork */}
                        <div className="w-14 h-14 bg-neutral-900 rounded-lg overflow-hidden shrink-0 border border-neutral-850">
                          {beat.coverArtUrl ? (
                            <img src={beat.coverArtUrl} alt={beat.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-purple-400">⚡</div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm text-white truncate uppercase tracking-tight">{beat.title}</h4>
                          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wide">{beat.producer || 'Voodoo Boomin'}</p>
                          
                          {/* License Dropdown Selector */}
                          <div className="mt-1.5 flex items-center gap-2">
                            <select 
                              value={item.licenseType}
                              onChange={(e) => updateCartItemLicense(beat.id, e.target.value)}
                              className="bg-neutral-900 border border-neutral-850 text-neutral-300 text-[10px] font-bold py-1 px-2 rounded focus:outline-none focus:border-purple-600 cursor-pointer"
                            >
                              {beat.licenses?.mp3Lease?.enabled && (
                                <option value="mp3Lease">MP3 Lease ({formatVal(beat.licenses.mp3Lease.price)})</option>
                              )}
                              {beat.licenses?.wavLease?.enabled && (
                                <option value="wavLease">WAV Lease ({formatVal(beat.licenses.wavLease.price)})</option>
                              )}
                              {beat.licenses?.premiumLease?.enabled && (
                                <option value="premiumLease">Premium ({formatVal(beat.licenses.premiumLease.price)})</option>
                              )}
                              {beat.licenses?.unlimitedLease?.enabled && (
                                <option value="unlimitedLease">Unlimited ({formatVal(beat.licenses.unlimitedLease.price)})</option>
                              )}
                              {beat.licenses?.exclusive?.enabled && (
                                <option value="exclusive">Exclusive ({formatVal(beat.licenses.exclusive.price)})</option>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Price & Remove */}
                        <div className="text-right flex flex-col items-end gap-2.5">
                          <span className="font-mono font-black text-sm text-white">{formatVal(item.price)}</span>
                          <button 
                            onClick={() => removeFromCart(beat.id)}
                            className="p-1.5 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Promo Code Input Form */}
              {cart.length > 0 && (
                <div className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-neutral-300 uppercase">Coupon / Promo Code</span>
                  </div>
                  
                  {promoCode ? (
                    <div className="bg-purple-950/20 border border-purple-500/20 p-2.5 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">{promoCode}</span>
                        <p className="text-[10px] text-purple-400 mt-0.5">Discount applied live</p>
                      </div>
                      <button 
                        onClick={handleRemovePromo}
                        className="text-xs font-bold text-red-400 hover:text-red-300 uppercase transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="e.g. VOODOO20"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-850 rounded-lg px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-purple-600 font-bold"
                      />
                      <button 
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {promoError && <p className="text-[10px] text-red-400 font-semibold">{promoError}</p>}
                  {promoSuccess && <p className="text-[10px] text-purple-400 font-semibold">{promoSuccess}</p>}
                </div>
              )}

              {/* Upsell Recommendations Container */}
              {cart.length > 0 && upsellBeats.length > 0 && (
                <div className="flex flex-col gap-3 mt-2 border-t border-neutral-900/60 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Cart Upsells / Add-ons</span>
                    <span className="text-[10px] text-purple-400 font-bold">VIP OFFERS</span>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    {upsellBeats.map(beat => (
                      <div 
                        key={beat.id}
                        className="bg-gradient-to-r from-purple-950/10 to-neutral-950 border border-purple-500/10 p-2.5 rounded-xl flex items-center justify-between gap-3 hover:border-purple-500/20 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={beat.coverArtUrl} alt={beat.title} className="w-9 h-9 object-cover rounded-md shrink-0" />
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-neutral-200 truncate">{beat.title}</h5>
                            <p className="text-[9px] text-neutral-500 font-mono">BPM: {beat.bpm} | {beat.key}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => addToCart(beat, 'mp3Lease')}
                          className="bg-neutral-900 hover:bg-purple-900/30 text-purple-300 hover:text-purple-200 font-black text-[10px] uppercase px-3 py-1.5 rounded-lg border border-purple-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          + Add - {formatVal(beat.price || 29.99)}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Footer Total Block */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-neutral-900 bg-neutral-950 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 font-mono text-sm">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal:</span>
                    <span>{formatVal(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-purple-400 font-semibold">
                      <span>Promo Discount:</span>
                      <span>-{formatVal(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-white pt-2 border-t border-neutral-900">
                    <span>Total:</span>
                    <span className="text-white">{formatVal(total)}</span>
                  </div>
                </div>

                <button 
                  onClick={onCheckout}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-sm uppercase py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-99 cursor-pointer shadow-[0_5px_20px_rgba(168,85,247,0.35)]"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
                
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span>SECURE SSL GUEST CHECKOUT DIRECT ROUTING</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
