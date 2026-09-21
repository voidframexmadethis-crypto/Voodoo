import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DistributorPartner, MusicProfessional, ProfessionalCategory, ServicesConfig } from '../../types';
import { 
  Globe, 
  Plus, 
  Trash2, 
  Edit, 
  MoveUp, 
  MoveDown, 
  ExternalLink, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  BarChart2, 
  DollarSign, 
  ShieldCheck, 
  FileText, 
  Upload, 
  Info,
  Link as LinkIcon,
  MousePointerClick,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  Sliders,
  Settings,
  Mail,
  Phone,
  User,
  XCircle,
  ThumbsUp,
  FolderLock
} from 'lucide-react';

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

export default function DistributionPartnersManagement() {
  const { 
    state, 
    // original distributor actions
    addDistributorPartner, 
    updateDistributorPartner, 
    deleteDistributorPartner, 
    reorderDistributorPartners,
    // new professional actions
    addProfessional,
    updateProfessional,
    deleteProfessional,
    updateServicesConfig
  } = useStore();

  const distributors = state.distributorPartners || [];
  const clicks = state.distributorClicks || [];
  const professionals = state.professionals || [];
  const config = state.servicesConfig || {
    enableMusicDistribution: false,
    enableProfessionalApplications: true
  };

  // Main navigation tab
  const [mainTab, setMainTab] = useState<'professionals' | 'distributors' | 'settings'>('professionals');

  // --- SUB-TAB 1: PROFESSIONALS DIRECTORY STATE ---
  const [profSearch, setProfSearch] = useState('');
  const [profCategoryFilter, setProfCategoryFilter] = useState<string>('all');
  const [profStatusFilter, setProfStatusFilter] = useState<string>('all');
  const [editingProf, setEditingProf] = useState<MusicProfessional | null>(null);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // --- SUB-TAB 2: DISTRIBUTORS STATE ---
  const [isDistModalOpen, setIsDistModalOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<DistributorPartner | null>(null);
  const [distSearch, setDistSearch] = useState('');
  const [distTab, setDistTab] = useState<'partners' | 'analytics'>('partners');
  const [featureInput, setFeatureInput] = useState('');

  // Distributor Form State
  const [distFormData, setDistFormData] = useState<Partial<DistributorPartner>>({
    name: '',
    description: '',
    logo: '',
    features: ['Keep 100% royalties', 'Deliver to Spotify & Apple Music'],
    pricing: '',
    officialWebsiteUrl: '',
    referralUrl: '',
    buttonText: 'Start Distribution',
    active: true,
    sortOrder: distributors.length + 1,
    partnershipType: 'Affiliate',
    commissionDescription: '',
    trackingMethod: 'Direct Link',
    applicationStatus: 'Approved',
    notes: ''
  });

  // Professionals Form State
  const [profFormData, setProfFormData] = useState<Partial<MusicProfessional>>({
    name: '',
    email: '',
    category: 'mixing_mastering',
    tagline: '',
    bio: '',
    location: '',
    websiteUrl: '',
    phone: '',
    bookingUrl: '',
    bookingMethod: 'email',
    pricingInfo: '',
    status: 'PENDING',
    published: false,
    featured: false,
    verified: false
  });

  // --- SETTINGS FORM STATE ---
  const [settingsApplications, setSettingsApplications] = useState(config.enableProfessionalApplications);
  const [settingsDistribution, setSettingsDistribution] = useState(config.enableMusicDistribution);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // --- RENDER PROFESSIONALS LOGIC ---
  const filteredProfessionals = professionals.filter(p => {
    if (profSearch.trim()) {
      const q = profSearch.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchEmail = p.email.toLowerCase().includes(q);
      const matchTagline = p.tagline?.toLowerCase().includes(q) || false;
      if (!matchName && !matchEmail && !matchTagline) return false;
    }
    if (profCategoryFilter !== 'all' && p.category !== profCategoryFilter) {
      return false;
    }
    if (profStatusFilter !== 'all' && p.status !== profStatusFilter) {
      return false;
    }
    return true;
  });

  // Calculate statistics
  const totalProfs = professionals.length;
  const pendingProfs = professionals.filter(p => p.status === 'PENDING').length;
  const approvedProfs = professionals.filter(p => p.status === 'APPROVED').length;
  const totalViews = professionals.reduce((sum, p) => sum + (p.profileViews || 0), 0);
  const totalInquiries = professionals.reduce((sum, p) => sum + (p.contactClicks || 0), 0);

  // Quick action handlers for professionals
  const handleApproveProf = async (id: string) => {
    await updateProfessional(id, { status: 'APPROVED', published: true });
  };

  const handleRejectProf = async (id: string) => {
    await updateProfessional(id, { status: 'REJECTED', published: false });
  };

  const handleSuspendProf = async (id: string) => {
    await updateProfessional(id, { status: 'SUSPENDED', published: false });
  };

  const handleToggleFeaturedProf = async (p: MusicProfessional) => {
    await updateProfessional(p.id, { featured: !p.featured });
  };

  const handleToggleVerifiedProf = async (p: MusicProfessional) => {
    await updateProfessional(p.id, { verified: !p.verified });
  };

  const handleDeleteProf = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete professional profile "${name}" permanently?`)) {
      await deleteProfessional(id);
    }
  };

  const openEditProfModal = (p: MusicProfessional) => {
    setEditingProf(p);
    setProfFormData({ ...p });
    setIsProfModalOpen(true);
  };

  const handleSaveProf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profFormData.name?.trim() || !profFormData.email?.trim()) {
      alert('Professional Name and Business Email are required.');
      return;
    }

    if (editingProf) {
      await updateProfessional(editingProf.id, profFormData);
    } else {
      const payload: MusicProfessional = {
        id: `pro_${Date.now()}`,
        name: profFormData.name.trim(),
        email: profFormData.email.trim(),
        category: profFormData.category || 'mixing_mastering',
        secondaryCategories: profFormData.secondaryCategories || [],
        tagline: profFormData.tagline?.trim() || undefined,
        bio: profFormData.bio?.trim() || '',
        location: profFormData.location?.trim() || undefined,
        websiteUrl: profFormData.websiteUrl?.trim() || undefined,
        phone: profFormData.phone?.trim() || undefined,
        bookingUrl: profFormData.bookingUrl?.trim() || undefined,
        bookingMethod: profFormData.bookingMethod || 'email',
        pricingInfo: profFormData.pricingInfo?.trim() || undefined,
        status: profFormData.status || 'APPROVED',
        published: profFormData.published !== undefined ? profFormData.published : true,
        featured: profFormData.featured !== undefined ? profFormData.featured : false,
        verified: profFormData.verified !== undefined ? profFormData.verified : false,
        createdAt: profFormData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileViews: profFormData.profileViews || 0,
        contactClicks: profFormData.contactClicks || 0
      };
      await addProfessional(payload);
    }
    setIsProfModalOpen(false);
  };

  // --- RENDER DISTRIBUTORS LOGIC ---
  const filteredDistributors = distributors.filter(d => 
    d.name.toLowerCase().includes(distSearch.toLowerCase()) ||
    d.description.toLowerCase().includes(distSearch.toLowerCase())
  );

  const totalDistClicks = distributors.reduce((sum, d) => sum + (d.clickCount || 0), 0);

  const openAddDistModal = () => {
    setEditingDistributor(null);
    setDistFormData({
      id: `dist_${Date.now()}`,
      name: '',
      description: '',
      logo: '',
      features: ['Keep 100% of your royalties', 'Deliver to Spotify, Apple Music & TikTok'],
      pricing: '$22.99 / year',
      officialWebsiteUrl: '',
      referralUrl: '',
      buttonText: 'Start Distribution',
      active: true,
      sortOrder: distributors.length + 1,
      partnershipType: 'Affiliate',
      commissionDescription: '',
      trackingMethod: 'Direct Link',
      applicationStatus: 'Approved',
      notes: '',
      clickCount: 0
    });
    setFeatureInput('');
    setIsDistModalOpen(true);
  };

  const openEditDistModal = (partner: DistributorPartner) => {
    setEditingDistributor(partner);
    setDistFormData({
      ...partner,
      features: [...partner.features]
    });
    setFeatureInput('');
    setIsDistModalOpen(true);
  };

  const handleSaveDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distFormData.name?.trim() || !distFormData.officialWebsiteUrl?.trim()) {
      alert('Please provide at least a Distributor Name and Official Website URL.');
      return;
    }

    const payload: DistributorPartner = {
      id: editingDistributor ? editingDistributor.id : (distFormData.id || `dist_${Date.now()}`),
      name: distFormData.name.trim(),
      description: distFormData.description?.trim() || '',
      logo: distFormData.logo?.trim() || '',
      features: distFormData.features && distFormData.features.length > 0 ? distFormData.features : ['Global Distribution', 'Royalties Kept'],
      pricing: distFormData.pricing?.trim() || '',
      officialWebsiteUrl: distFormData.officialWebsiteUrl.trim(),
      referralUrl: distFormData.referralUrl?.trim() || undefined,
      buttonText: distFormData.buttonText?.trim() || 'Start Distribution',
      active: distFormData.active !== undefined ? distFormData.active : true,
      sortOrder: distFormData.sortOrder || distributors.length + 1,
      partnershipType: distFormData.partnershipType || 'Affiliate',
      commissionDescription: distFormData.commissionDescription?.trim() || '',
      trackingMethod: distFormData.trackingMethod || 'Direct Link',
      applicationStatus: distFormData.applicationStatus || 'Approved',
      notes: distFormData.notes?.trim() || '',
      clickCount: editingDistributor ? (editingDistributor.clickCount || 0) : (distFormData.clickCount || 0)
    };

    if (editingDistributor) {
      await updateDistributorPartner(editingDistributor.id, payload);
    } else {
      await addDistributorPartner(payload);
    }
    setIsDistModalOpen(false);
  };

  const handleDeleteDistributor = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete distribution partner "${name}"?`)) {
      await deleteDistributorPartner(id);
    }
  };

  // --- SAVE GLOBAL SETTINGS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(false);

    const payload: ServicesConfig = {
      enableProfessionalApplications: settingsApplications,
      enableMusicDistribution: settingsDistribution
    };

    await updateServicesConfig(payload);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            Services & Network Center
          </h2>
          <p className="text-xs text-neutral-400 mt-1">Manage external professional submissions, distributor affiliate listings, and directory rules.</p>
        </div>

        <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 self-stretch sm:self-auto">
          <button
            onClick={() => setMainTab('professionals')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'professionals' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Professionals ({professionals.length})
          </button>
          <button
            onClick={() => setMainTab('distributors')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'distributors' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Distributors
          </button>
          <button
            onClick={() => setMainTab('settings')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'settings' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
        </div>
      </div>

      {/* --- SUB-TAB 1: PROFESSIONALS DIRECTORY MANAGER --- */}
      {mainTab === 'professionals' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <span className="text-neutral-400 text-xs font-medium block">Total Members</span>
              <span className="text-2xl font-black text-white font-mono">{totalProfs}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <span className="text-neutral-400 text-xs font-medium block flex items-center gap-1.5 text-amber-400">
                <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Reviews
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">{pendingProfs}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <span className="text-neutral-400 text-xs font-medium block">Aggregate Views</span>
              <span className="text-2xl font-black text-purple-400 font-mono">{totalViews.toLocaleString()}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <span className="text-neutral-400 text-xs font-medium block">Contact Inquiries</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{totalInquiries.toLocaleString()}</span>
            </div>
          </div>

          {/* Filters Row */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search professional by name, email, tagline..."
                value={profSearch}
                onChange={e => setProfSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={profCategoryFilter}
                onChange={e => setProfCategoryFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="all">All Categories</option>
                {Object.keys(CATEGORY_LABELS).map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat as ProfessionalCategory]}</option>
                ))}
              </select>

              <select
                value={profStatusFilter}
                onChange={e => setProfStatusFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved / Live</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <button
                onClick={() => {
                  setEditingProf(null);
                  setProfFormData({
                    name: '',
                    email: '',
                    category: 'mixing_mastering',
                    tagline: '',
                    bio: '',
                    location: '',
                    websiteUrl: '',
                    phone: '',
                    bookingUrl: '',
                    bookingMethod: 'email',
                    pricingInfo: '',
                    status: 'APPROVED',
                    published: true,
                    featured: false,
                    verified: true
                  });
                  setIsProfModalOpen(true);
                }}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Profile
              </button>
            </div>
          </div>

          {/* Directory Listings Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
            {filteredProfessionals.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 italic">
                No music professional profiles found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-white">
                  <thead>
                    <tr className="bg-neutral-950/40 text-neutral-400 text-[10px] uppercase font-bold border-b border-neutral-800">
                      <th className="px-5 py-3">Professional</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3 text-center">Badges</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Analytics</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredProfessionals.map(prof => (
                      <tr key={prof.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center font-bold text-neutral-400">
                              {prof.avatarUrl ? (
                                <img src={prof.avatarUrl} alt={prof.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{prof.name}</p>
                              <p className="text-[10px] text-neutral-500 font-mono">{prof.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-purple-400">
                          {CATEGORY_LABELS[prof.category]}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleToggleFeaturedProf(prof)}
                              title="Toggle Featured Badge"
                              className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                prof.featured
                                  ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-600'
                              }`}
                            >
                              Featured
                            </button>
                            <button
                              onClick={() => handleToggleVerifiedProf(prof)}
                              title="Toggle Verified Badge"
                              className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                prof.verified
                                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-600'
                              }`}
                            >
                              Verified
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            prof.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            prof.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {prof.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center font-mono font-medium text-neutral-400">
                          <span title="Views">👁️ {prof.profileViews || 0}</span>
                          <span className="mx-2">/</span>
                          <span title="Contact Inquiries" className="text-emerald-400">📨 {prof.contactClicks || 0}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {prof.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApproveProf(prof.id)}
                                  title="Approve Profile"
                                  className="p-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRejectProf(prof.id)}
                                  title="Reject Profile"
                                  className="p-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded hover:bg-rose-500/20 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {prof.status === 'APPROVED' && (
                              <button
                                onClick={() => handleSuspendProf(prof.id)}
                                title="Suspend Profile"
                                className="p-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {(prof.status === 'REJECTED' || prof.status === 'SUSPENDED') && (
                              <button
                                onClick={() => handleApproveProf(prof.id)}
                                title="Re-Approve / Restore Profile"
                                className="p-1 text-neutral-300 bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-750 transition-colors flex items-center gap-1 text-[10px]"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Restore
                              </button>
                            )}

                            <button
                              onClick={() => openEditProfModal(prof)}
                              title="Edit Details"
                              className="p-1 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteProf(prof.id, prof.name)}
                              title="Delete Permanently"
                              className="p-1 text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded hover:bg-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: DISTRIBUTORS LISTINGS MANAGER (ORIGINAL) --- */}
      {mainTab === 'distributors' && (
        <div className="space-y-6">
          {/* Sub-tab analytics & list switcher */}
          <div className="flex bg-neutral-900 border border-neutral-800 p-1.5 rounded-lg max-w-xs">
            <button
              onClick={() => setDistTab('partners')}
              className={`flex-1 py-1 text-xs font-semibold rounded ${
                distTab === 'partners' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              List Partners
            </button>
            <button
              onClick={() => setDistTab('analytics')}
              className={`flex-1 py-1 text-xs font-semibold rounded ${
                distTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Click Analytics
            </button>
          </div>

          {distTab === 'partners' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-xl gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search distributors..."
                    value={distSearch}
                    onChange={e => setDistSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                  />
                </div>
                <button
                  onClick={openAddDistModal}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Partner
                </button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
                {filteredDistributors.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500 italic">No distributor partners listed yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-white">
                      <thead>
                        <tr className="bg-neutral-950/40 text-neutral-400 text-[10px] uppercase font-bold border-b border-neutral-800">
                          <th className="px-5 py-3">Logo & Name</th>
                          <th className="px-5 py-3">Pricing Plan</th>
                          <th className="px-5 py-3 text-center">Referral URL Configured</th>
                          <th className="px-5 py-3 text-center">Status</th>
                          <th className="px-5 py-3 text-center">Clicks</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60">
                        {filteredDistributors.map((d, index) => (
                          <tr key={d.id} className="hover:bg-neutral-800/20 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center p-1 font-bold text-purple-400">
                                  {d.logo ? (
                                    <img src={d.logo} alt={d.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <Globe className="w-4 h-4" />
                                  )}
                                </div>
                                <span className="font-bold text-white text-sm">{d.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-neutral-300 font-medium">
                              {d.pricing || 'No pricing stated'}
                            </td>
                            <td className="px-5 py-3 text-center">
                              {d.referralUrl ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-semibold">
                                  <LinkIcon className="w-3 h-3" /> Enabled
                                </span>
                              ) : (
                                <span className="text-neutral-500 text-[10px]">No Link</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <button
                                onClick={async () => await updateDistributorPartner(d.id, { active: !d.active })}
                                className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  d.active 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-neutral-950 text-neutral-500 border border-neutral-800'
                                }`}
                              >
                                {d.active ? 'Active' : 'Draft'}
                              </button>
                            </td>
                            <td className="px-5 py-3 text-center font-mono font-bold text-indigo-400">
                              {d.clickCount || 0}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={openAddDistModal}
                                  disabled={index === 0}
                                  className="p-1 bg-neutral-950 border border-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30"
                                >
                                  <MoveUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={openAddDistModal}
                                  disabled={index === filteredDistributors.length - 1}
                                  className="p-1 bg-neutral-950 border border-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-30"
                                >
                                  <MoveDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditDistModal(d)}
                                  className="p-1 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded hover:bg-blue-500/20"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDistributor(d.id, d.name)}
                                  className="p-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded hover:bg-rose-500/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CLICK LOGS & REFERRALS */
            <div className="space-y-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h3 className="font-bold text-white mb-3">Referral Performance Overview</h3>
                <div className="text-3xl font-black text-indigo-400 font-mono">{totalDistClicks} clicks</div>
                <p className="text-xs text-neutral-400 mt-1">Total trackable clicks on partner redirect links since release.</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-neutral-800 font-semibold text-white">Direct Click Logs (Recent 25)</div>
                {clicks.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-xs italic">No redirect link clicks registered yet.</div>
                ) : (
                  <div className="divide-y divide-neutral-800/60 max-h-[400px] overflow-y-auto">
                    {clicks.slice(0, 25).map(c => (
                      <div key={c.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-neutral-850/10 transition-colors">
                        <div>
                          <p className="font-bold text-white">Outbound Redirect to: {c.distributorName}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">ID: {c.distributorId} | Page: {c.sourcePage}</p>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400">{new Date(c.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 3: DIRECTORY RULES CONFIGURATION SETTINGS --- */}
      {mainTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-2xl mx-auto shadow-lg space-y-6">
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
            <Settings className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-white text-base">Directory Visibility Settings</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Toggle categories and applicant submissions rules.</p>
            </div>
          </div>

          {settingsSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Rules updated successfully!
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-4 bg-neutral-950 border border-neutral-800/80 rounded-xl">
              <div className="flex-1">
                <span className="font-bold text-white text-sm block mb-1">Enable Professional Directory Applications</span>
                <span className="text-xs text-neutral-500">Expose the &quot;Join as Professional&quot; button in the public directory allowing outside professionals to submit registration forms.</span>
              </div>
              <input
                type="checkbox"
                checked={settingsApplications}
                onChange={e => setSettingsApplications(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-800 text-purple-600 focus:ring-purple-500 bg-neutral-950 shrink-0 mt-1"
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-4 bg-neutral-950 border border-neutral-800/80 rounded-xl">
              <div className="flex-1">
                <span className="font-bold text-white text-sm block mb-1">Expose &quot;Music Distribution&quot; Category</span>
                <span className="text-xs text-neutral-500">Allow artists to browse the Music Distribution category within the service directory list. Turn this off to completely disable/hide distribution.</span>
              </div>
              <input
                type="checkbox"
                checked={settingsDistribution}
                onChange={e => setSettingsDistribution(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-800 text-purple-600 focus:ring-purple-500 bg-neutral-950 shrink-0 mt-1"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800/65 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md shadow-purple-600/10"
            >
              Save Configuration Settings
            </button>
          </div>
        </form>
      )}

      {/* --- PROFESSIONAL CREATION / EDITION MODAL --- */}
      {isProfModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveProf} className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl relative animate-in zoom-in duration-150 p-6 sm:p-8 space-y-4">
            <button
              type="button"
              onClick={() => setIsProfModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-500" />
              {editingProf ? 'Edit Professional Details' : 'Add Professional Profile'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Professional / Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="Business Name"
                  value={profFormData.name}
                  onChange={e => setProfFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Business Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={profFormData.email}
                  onChange={e => setProfFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Category</label>
                <select
                  value={profFormData.category}
                  onChange={e => setProfFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none"
                >
                  {Object.keys(CATEGORY_LABELS).map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat as ProfessionalCategory]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Service Location / Area</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, Atlanta"
                  value={profFormData.location || ''}
                  onChange={e => setProfFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Short Tagline</label>
              <input
                type="text"
                placeholder="Tagline summary"
                value={profFormData.tagline || ''}
                onChange={e => setProfFormData(prev => ({ ...prev, tagline: e.target.value }))}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Biography / Overview</label>
              <textarea
                rows={4}
                required
                placeholder="Description of expertise..."
                value={profFormData.bio || ''}
                onChange={e => setProfFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">External Booking Channel</label>
                <select
                  value={profFormData.bookingMethod || 'email'}
                  onChange={e => setProfFormData(prev => ({ ...prev, bookingMethod: e.target.value as any }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="email">Direct Email</option>
                  <option value="booking_link">Calendly / Booking Link</option>
                  <option value="website">Official Website URL</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Booking Link / URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={profFormData.bookingUrl || ''}
                  onChange={e => setProfFormData(prev => ({ ...prev, bookingUrl: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3.5 border-t border-neutral-800/60">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="form-published"
                  checked={profFormData.published || false}
                  onChange={e => setProfFormData(prev => ({ ...prev, published: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-800 text-purple-600 focus:ring-purple-500 bg-neutral-950"
                />
                <label htmlFor="form-published" className="text-xs text-neutral-300 font-semibold select-none">Live / Published</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="form-featured"
                  checked={profFormData.featured || false}
                  onChange={e => setProfFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-800 text-purple-600 focus:ring-purple-500 bg-neutral-950"
                />
                <label htmlFor="form-featured" className="text-xs text-neutral-300 font-semibold select-none">Featured Badge</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="form-verified"
                  checked={profFormData.verified || false}
                  onChange={e => setProfFormData(prev => ({ ...prev, verified: e.target.checked }))}
                  className="w-4 h-4 rounded border-neutral-800 text-purple-600 focus:ring-purple-500 bg-neutral-950"
                />
                <label htmlFor="form-verified" className="text-xs text-neutral-300 font-semibold select-none">Verified Member</label>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800/60 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsProfModalOpen(false)}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Save Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- DISTRIBUTOR CREATION / EDITION MODAL (ORIGINAL) --- */}
      {isDistModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveDistributor} className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-4">
            <button
              type="button"
              onClick={() => setIsDistModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              {editingDistributor ? 'Edit Distributor Partner' : 'Add Distribution Partner'}
            </h3>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Distributor Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. DistroKid"
                value={distFormData.name}
                onChange={e => setDistFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Description / Key Benefit</label>
              <textarea
                rows={3}
                placeholder="Global music distribution services overview..."
                value={distFormData.description || ''}
                onChange={e => setDistFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Logo Link / URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={distFormData.logo || ''}
                  onChange={e => setDistFormData(prev => ({ ...prev, logo: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Official Plan Price</label>
                <input
                  type="text"
                  placeholder="e.g. $22.99 / year"
                  value={distFormData.pricing || ''}
                  onChange={e => setDistFormData(prev => ({ ...prev, pricing: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Official Website URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={distFormData.officialWebsiteUrl || ''}
                  onChange={e => setDistFormData(prev => ({ ...prev, officialWebsiteUrl: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Affiliate Referral URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={distFormData.referralUrl || ''}
                  onChange={e => setDistFormData(prev => ({ ...prev, referralUrl: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            {/* List of Features dynamic input */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Distributor Features & Selling Points</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add specific selling point"
                  value={featureInput}
                  onChange={e => setFeatureInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (featureInput.trim()) {
                      setDistFormData(prev => ({
                        ...prev,
                        features: [...(prev.features || []), featureInput.trim()]
                      }));
                      setFeatureInput('');
                    }
                  }}
                  className="px-3.5 bg-neutral-800 border border-neutral-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              {distFormData.features && distFormData.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3.5 max-h-24 overflow-y-auto">
                  {distFormData.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-medium text-neutral-300 inline-flex items-center gap-1"
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() => {
                          setDistFormData(prev => ({
                            ...prev,
                            features: (prev.features || []).filter((_, i) => i !== idx)
                          }));
                        }}
                        className="text-neutral-500 hover:text-rose-400 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-800/60 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDistModalOpen(false)}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-semibold text-neutral-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Save Partner
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
