import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Beat } from '../../types';
import { Music, Trash2, Edit, Search, Shield, AlertTriangle, CheckCircle, Plus } from 'lucide-react';

export default function BeatsManagement({ onSwitchToUploader }: { onSwitchToUploader: () => void }) {
  const { state, removeBeat, updateBeat } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);

  const allBeats = [...state.beats, ...state.archivedBeats];
  const uniqueBeats = Array.from(new Map(allBeats.map(b => [b.id, b])).values());

  const filteredBeats = uniqueBeats.filter(b => 
    (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.primaryGenre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    removeBeat(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-indigo-400" />
            Beat Management Dashboard
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Manage individual beats, unique Beat IDs (VB-XXXXX), pricing, licenses, and permanent deletion with preserved audit trails.
          </p>
        </div>
        <button
          onClick={onSwitchToUploader}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Upload New Beat
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search beats by title, Beat ID, or genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-neutral-400 bg-neutral-950 px-3 py-2.5 rounded-lg border border-neutral-800">
          Total: <span className="text-white font-semibold">{filteredBeats.length}</span> beats
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-950 text-neutral-400 uppercase text-xs tracking-wider border-b border-neutral-800">
            <tr>
              <th className="py-3 px-4">Beat ID / Art</th>
              <th className="py-3 px-4">Title & Genre</th>
              <th className="py-3 px-4">BPM / Key</th>
              <th className="py-3 px-4">Price / Licensing</th>
              <th className="py-3 px-4">Visibility</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filteredBeats.map((beat) => {
              const beatIdStr = beat.id.startsWith('VB-') ? beat.id : `VB-${beat.id.slice(-5).toUpperCase()}`;
              return (
                <tr key={beat.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    {beat.coverArtUrl ? (
                      <img 
                        src={beat.coverArtUrl} 
                        alt="" 
                        className="w-10 h-10 rounded-lg object-cover border border-neutral-800"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-indigo-400">
                        <Music className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-mono bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50">
                        {beatIdStr}
                      </span>
                      <div className="text-xs text-neutral-500 mt-0.5">ID: {beat.id}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{beat.title}</div>
                    <div className="text-xs text-neutral-400">{beat.primaryGenre || 'Trap'}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {beat.bpm || '140'} BPM • {beat.key || 'C Min'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-emerald-400">
                      ${beat.price ? beat.price.toFixed(2) : '29.99'}
                    </div>
                    {beat.directPriceOnly && (
                      <span className="text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/50">
                        Direct Price Only
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      (beat.visibility || 'Public') === 'Public' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {beat.visibility || 'Public'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingBeat(beat)}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                        title="Edit Beat"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(beat.id)}
                        className="p-1.5 bg-red-950/50 hover:bg-red-900/80 text-red-400 rounded-lg transition-colors border border-red-900/50"
                        title="Permanently Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredBeats.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-neutral-500">
                  No beats found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Permanently Delete Beat?</h3>
            </div>
            <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
              This will remove the beat and its associated active files and storefront data. Its administrative audit history will remain permanently in the audit log.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-600/20"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Beat Modal */}
      {editingBeat && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Edit Beat: {editingBeat.title}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  value={editingBeat.title}
                  onChange={(e) => setEditingBeat({ ...editingBeat, title: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">BPM</label>
                  <input
                    type="number"
                    value={editingBeat.bpm || 140}
                    onChange={(e) => setEditingBeat({ ...editingBeat, bpm: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Key</label>
                  <input
                    type="text"
                    value={editingBeat.key || 'C Min'}
                    onChange={(e) => setEditingBeat({ ...editingBeat, key: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingBeat.price || 29.99}
                    onChange={(e) => setEditingBeat({ ...editingBeat, price: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Visibility</label>
                  <select
                    value={editingBeat.visibility || 'Public'}
                    onChange={(e) => setEditingBeat({ ...editingBeat, visibility: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                    <option value="Unlisted">Unlisted</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editDirectPrice"
                  checked={!!editingBeat.directPriceOnly}
                  onChange={(e) => setEditingBeat({ ...editingBeat, directPriceOnly: e.target.checked })}
                  className="rounded bg-neutral-950 border-neutral-800 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="editDirectPrice" className="text-sm text-neutral-300">
                  Direct Price Only (Bypass license terms)
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingBeat(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateBeat(editingBeat.id, editingBeat);
                  setEditingBeat(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
