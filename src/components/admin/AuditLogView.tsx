import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { FileText, Search, ShieldAlert, Clock } from 'lucide-react';

export default function AuditLogView() {
  const { state } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLog = state.auditLog.filter(entry =>
    entry.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.beatId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Administrative Audit Log & Paper Trail
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Permanent, non-editable factual log of all store actions, beat creations, modifications, promotions, rights records, and deletions.
          </p>
        </div>
        <div className="text-xs text-neutral-400 bg-neutral-950 px-3 py-2.5 rounded-lg border border-neutral-800">
          Total Entries: <span className="text-white font-semibold">{state.auditLog.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search audit log by event type, description, or Beat ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-950 text-neutral-400 uppercase text-xs tracking-wider border-b border-neutral-800">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Event Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Reference ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filteredLog.map((entry) => (
              <tr key={entry.id} className="hover:bg-neutral-800/40 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-neutral-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-xs bg-neutral-950 text-indigo-300 px-2 py-1 rounded border border-neutral-800">
                    {entry.eventType}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-white leading-relaxed">{entry.description}</td>
                <td className="py-3 px-4 font-mono text-xs text-neutral-400">
                  {entry.beatId ? `Beat: ${entry.beatId}` : entry.packId ? `Pack: ${entry.packId}` : '—'}
                </td>
              </tr>
            ))}
            {filteredLog.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-neutral-500">
                  No audit log entries matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
