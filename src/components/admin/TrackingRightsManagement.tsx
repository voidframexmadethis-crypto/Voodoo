import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DetectedUse, RightsRecord, LivePerformanceRecord, SyncCueRecord } from '../../types';
import { ShieldCheck, Activity, FileText, Globe, Plus, CheckCircle, AlertCircle } from 'lucide-react';

export default function TrackingRightsManagement() {
  const { state, addDetectedUse, updateDetectedUse, addRightsRecord, addLivePerformance, addSyncCue } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'tracking' | 'rights' | 'performance' | 'sync'>('tracking');

  // Modal states
  const [isAddingUse, setIsAddingUse] = useState(false);
  const [isAddingRights, setIsAddingRights] = useState(false);
  const [isAddingPerf, setIsAddingPerf] = useState(false);
  const [isAddingSync, setIsAddingSync] = useState(false);

  // Form states for tracking use
  const [beatId, setBeatId] = useState(state.beats[0]?.id || '');
  const [platform, setPlatform] = useState<'YouTube' | 'Facebook' | 'Instagram' | 'TikTok' | 'Twitch' | 'Reddit' | 'Other'>('YouTube');
  const [url, setUrl] = useState('');
  const [artistAccount, setArtistAccount] = useState('');
  const [location, setLocation] = useState('Global');

  // Form states for rights
  const [originalTitle, setOriginalTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [finalSongTitle, setFinalSongTitle] = useState('');
  const [producerName, setProducerName] = useState('Voodoo Boomin');
  const [producerIpi, setProducerIpi] = useState('');
  const [pro, setPro] = useState<'ASCAP' | 'BMI' | 'SESAC' | 'GEMA' | 'PRS' | 'Other'>('ASCAP');
  const [iswc, setIswc] = useState('');

  // Form states for live performance
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [perfDate, setPerfDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states for sync/cue
  const [productionCompany, setProductionCompany] = useState('');
  const [showProject, setShowProject] = useState('');
  const [airDate, setAirDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Beat ID, Tracking & Rights Tracking
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Monitor platform usage, publisher documentation (PRO, IPI, ISWC), live performance setlists, and sync/cue sheets.
          </p>
        </div>
        <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-1">
          <button
            onClick={() => setActiveSubTab('tracking')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'tracking' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Web Tracking
          </button>
          <button
            onClick={() => setActiveSubTab('rights')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'rights' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Publishing Rights
          </button>
          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'performance' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Live Shows
          </button>
          <button
            onClick={() => setActiveSubTab('sync')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'sync' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Sync & Cue Sheets
          </button>
        </div>
      </div>

      {/* External Integration Notice */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Globe className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-300 leading-relaxed">
          <span className="font-semibold text-white">External Integration Hub:</span> Connect your Content ID, YouTube, and distributor APIs to automatically ingest detected uses. You can also manually log rights records, live performance setlists, and cue sheets below for complete administrative audit protection.
        </div>
      </div>

      {/* SUB-TAB 1: WEB TRACKING */}
      {activeSubTab === 'tracking' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Detected Uses Across Platforms</h3>
            <button
              onClick={() => setIsAddingUse(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Detected Use
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-xs tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Platform / URL</th>
                  <th className="py-2.5 px-3">Beat ID</th>
                  <th className="py-2.5 px-3">Artist / Account</th>
                  <th className="py-2.5 px-3">Date Detected</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {state.detectedUses.map((use) => (
                  <tr key={use.id} className="hover:bg-neutral-800/40">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white">{use.platform}</div>
                      <a href={use.url || '#'} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 truncate max-w-xs block hover:underline">
                        {use.url || 'No URL specified'}
                      </a>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-indigo-300">{use.beatId}</td>
                    <td className="py-2.5 px-3 text-xs">{use.artistAccount || 'Unknown'}</td>
                    <td className="py-2.5 px-3 text-xs">{new Date(use.dateDetected).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        use.status === 'Licensed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {use.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <select
                        value={use.status}
                        onChange={(e) => updateDetectedUse(use.id, { status: e.target.value as any })}
                        className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="New">New</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Licensed">Licensed</option>
                        <option value="Unlicensed">Unlicensed</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {state.detectedUses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500">
                      No detected uses logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PUBLISHING RIGHTS */}
      {activeSubTab === 'rights' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Artist Song & Publishing Records (ISWC / IPI / PRO)</h3>
            <button
              onClick={() => setIsAddingRights(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Rights Record
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-xs tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Final Song & Artist</th>
                  <th className="py-2.5 px-3">Beat ID</th>
                  <th className="py-2.5 px-3">PRO / IPI</th>
                  <th className="py-2.5 px-3">ISWC Code</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {state.rightsRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-neutral-800/40">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white">{rec.finalSongTitle}</div>
                      <div className="text-xs text-neutral-400">Artist: {rec.artist}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-indigo-300">{rec.beatId}</td>
                    <td className="py-2.5 px-3 text-xs">{rec.pro} ({rec.producerIpi})</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{rec.iswc || 'Pending ISWC'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                        {rec.registrationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {state.rightsRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      No publishing rights records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LIVE PERFORMANCES */}
      {activeSubTab === 'performance' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Live Performance Royalty Documentation</h3>
            <button
              onClick={() => setIsAddingPerf(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Live Performance
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-xs tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Song & Artist</th>
                  <th className="py-2.5 px-3">Venue & City</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">PRO</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {state.livePerformances.map((perf) => (
                  <tr key={perf.id} className="hover:bg-neutral-800/40">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white">{perf.songTitle}</div>
                      <div className="text-xs text-neutral-400">{perf.artist}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs">{perf.venue}, {perf.city}</td>
                    <td className="py-2.5 px-3 text-xs">{perf.performanceDate}</td>
                    <td className="py-2.5 px-3 text-xs">{perf.pro}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400">
                        {perf.submissionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {state.livePerformances.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      No live performance records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SYNC / CUE SHEETS */}
      {activeSubTab === 'sync' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Sync & Cue Sheet Tracking</h3>
            <button
              onClick={() => setIsAddingSync(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Sync / Cue Record
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-xs tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Song & Project</th>
                  <th className="py-2.5 px-3">Production Company</th>
                  <th className="py-2.5 px-3">Air Date</th>
                  <th className="py-2.5 px-3">PRO / IPI</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {state.syncCueRecords.map((sync) => (
                  <tr key={sync.id} className="hover:bg-neutral-800/40">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-white">{sync.finalSongTitle}</div>
                      <div className="text-xs text-neutral-400">{sync.showProject}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs">{sync.productionCompany}</td>
                    <td className="py-2.5 px-3 text-xs">{sync.releaseAirDate}</td>
                    <td className="py-2.5 px-3 text-xs">{sync.pro} ({sync.ipi})</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300">
                        {sync.cueSheetStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {state.syncCueRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                      No sync or cue sheet records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals for adding records */}
      {isAddingUse && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Log Detected Use</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              addDetectedUse({
                id: `use_${Date.now()}`,
                beatId,
                platform,
                url,
                location,
                dateDetected: new Date().toISOString(),
                artistAccount,
                status: 'New'
              });
              setIsAddingUse(false);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Beat ID</label>
                <select
                  value={beatId}
                  onChange={(e) => setBeatId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {state.beats.map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Twitch">Twitch</option>
                  <option value="Reddit">Reddit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">URL / Link</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Artist / Account Name</label>
                <input
                  type="text"
                  value={artistAccount}
                  onChange={(e) => setArtistAccount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddingUse(false)} className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingRights && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Publishing Rights Record</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              addRightsRecord({
                id: `rights_${Date.now()}`,
                beatId,
                originalTitle: originalTitle || 'Untitled',
                artist,
                finalSongTitle,
                producerName,
                producerIpi,
                pro,
                iswc,
                registrationStatus: 'Submitted'
              });
              setIsAddingRights(false);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Beat</label>
                <select value={beatId} onChange={(e) => setBeatId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white">
                  {state.beats.map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Final Song Title</label>
                <input type="text" value={finalSongTitle} onChange={(e) => setFinalSongTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Artist Name</label>
                <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">PRO</label>
                  <select value={pro} onChange={(e) => setPro(e.target.value as any)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="ASCAP">ASCAP</option>
                    <option value="BMI">BMI</option>
                    <option value="SESAC">SESAC</option>
                    <option value="GEMA">GEMA</option>
                    <option value="PRS">PRS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">ISWC Code</label>
                  <input type="text" placeholder="T-123.456.789-C" value={iswc} onChange={(e) => setIswc(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddingRights(false)} className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Save Rights</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingPerf && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Live Performance Record</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              addLivePerformance({
                id: `perf_${Date.now()}`,
                beatId,
                songTitle: finalSongTitle || 'Live Performance Track',
                artist: artist || 'Voodoo Boomin',
                venue,
                city,
                performanceDate: perfDate,
                pro,
                submissionStatus: 'Submitted'
              });
              setIsAddingPerf(false);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Song Title</label>
                <input type="text" value={finalSongTitle} onChange={(e) => setFinalSongTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Venue</label>
                  <input type="text" placeholder="e.g. Madison Square Garden" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">City</label>
                  <input type="text" placeholder="e.g. New York, NY" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Performance Date</label>
                <input type="date" value={perfDate} onChange={(e) => setPerfDate(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddingPerf(false)} className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingSync && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Sync & Cue Sheet Record</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              addSyncCue({
                id: `sync_${Date.now()}`,
                beatId,
                finalSongTitle: finalSongTitle || 'Sync Instrumental',
                artist: artist || 'Voodoo Boomin',
                productionCompany,
                showProject,
                releaseAirDate: airDate,
                cueSheetStatus: 'Submitted',
                pro,
                ipi: producerIpi
              });
              setIsAddingSync(false);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Song Title & Project</label>
                <input type="text" placeholder="Song Title" value={finalSongTitle} onChange={(e) => setFinalSongTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white mb-2" required />
                <input type="text" placeholder="Show / Project / Film Name" value={showProject} onChange={(e) => setShowProject(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Production Company / Network</label>
                <input type="text" placeholder="e.g. HBO / Netflix" value={productionCompany} onChange={(e) => setProductionCompany(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Air / Release Date</label>
                <input type="date" value={airDate} onChange={(e) => setAirDate(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddingSync(false)} className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Save Sync Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
