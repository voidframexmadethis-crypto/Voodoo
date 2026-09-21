import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Promotion } from '../../types';
import { Tag, Plus, Trash2, Edit, CheckCircle, Clock, XCircle, Percent } from 'lucide-react';

export default function PromotionsManagement() {
  const { state, addPromotion, updatePromotion, deletePromotion } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [promoType, setPromoType] = useState<'coupon_code' | 'bulk_deal'>('coupon_code');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('20');
  const [buyQty, setBuyQty] = useState('2');
  const [getQty, setGetQty] = useState('1');
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPromo: Promotion = {
      id: `promo_${Date.now()}`,
      name,
      type: promoType,
      discountType: promoType === 'coupon_code' ? discountType : 'free_item',
      discountValue: promoType === 'coupon_code' ? Number(discountValue) : Number(getQty),
      buyQty: promoType === 'bulk_deal' ? Number(buyQty) : undefined,
      getQty: promoType === 'bulk_deal' ? Number(getQty) : undefined,
      code: promoType === 'coupon_code' ? code.toUpperCase().trim() : undefined,
      status: 'Active',
      startDate: new Date().toISOString(),
      endDate: new Date(endDate).toISOString(),
      createdAt: new Date().toISOString()
    };

    addPromotion(newPromo);
    setName('');
    setCode('');
    setIsCreating(false);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            Promotions & Coupon Codes
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Configure bulk deals (Buy X Get Y Free) and custom alphanumeric discount codes with scheduling and automatic expiration.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Create Promotion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.promotions.map((promo) => (
          <div key={promo.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  promo.type === 'coupon_code' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/50' : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                }`}>
                  {promo.type === 'coupon_code' ? 'Coupon Code' : 'Bulk Deal'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                  promo.status === 'Active' ? 'text-emerald-400 bg-emerald-950/60' : 'text-neutral-400 bg-neutral-900'
                }`}>
                  {promo.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {promo.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">{promo.name}</h3>
              {promo.code && (
                <div className="font-mono text-xs bg-neutral-900 text-indigo-400 px-2 py-1 rounded border border-neutral-800 inline-block mb-3">
                  Code: {promo.code}
                </div>
              )}
              <div className="text-sm text-neutral-300 font-medium mb-4">
                {promo.type === 'coupon_code' ? (
                  <span>Discount: <strong className="text-emerald-400">{promo.discountValue}{promo.discountType === 'percentage' ? '%' : '$'} OFF</strong></span>
                ) : (
                  <span>Deal: <strong className="text-emerald-400">Buy {promo.buyQty} Get {promo.getQty} Free</strong></span>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
              <span>Expires: {new Date(promo.endDate).toLocaleDateString()}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updatePromotion(promo.id, { status: promo.status === 'Active' ? 'Disabled' : 'Active' })}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors"
                >
                  {promo.status === 'Active' ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => deletePromotion(promo.id)}
                  className="p-1 bg-red-950/50 hover:bg-red-900 text-red-400 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {state.promotions.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500">
            No active promotions or coupons. Click "Create Promotion" to add one.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create Promotion / Coupon</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Promotion Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Flash Sale"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Promotion Type</label>
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="coupon_code">Coupon Code (e.g. SAVE20)</option>
                  <option value="bulk_deal">Bulk Deal (e.g. Buy 2 Get 1 Free)</option>
                </select>
              </div>

              {promoType === 'coupon_code' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Coupon Code</label>
                    <input
                      type="text"
                      placeholder="e.g. VOODOO30"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Discount Type</label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Discount Value</label>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Buy Quantity</label>
                    <input
                      type="number"
                      value={buyQty}
                      onChange={(e) => setBuyQty(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Get Free Quantity</label>
                    <input
                      type="number"
                      value={getQty}
                      onChange={(e) => setGetQty(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
