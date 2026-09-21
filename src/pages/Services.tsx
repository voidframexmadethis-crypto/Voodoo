import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { MusicProfessional, ProfessionalCategory, ServiceOffer, PortfolioItem, ProfessionalSocialLink } from '../types';
import { optimizeImageFile } from '../lib/imageOptimizer';
import { 
  Globe, 
  ExternalLink, 
  Check, 
  Info, 
  Search, 
  Music, 
  Sliders, 
  Volume2, 
  FileText, 
  ShieldCheck, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  Mail,
  Phone,
  Link as LinkIcon,
  MapPin,
  Plus,
  Play,
  Video,
  FileAudio,
  User,
  Settings,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Filter,
  Trash2,
  Lock,
  Building
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

const CATEGORY_ICONS: Record<ProfessionalCategory, any> = {
  anr_record_labels: Shield,
  mixing_mastering: Sliders,
  recording_engineers: Volume2,
  music_managers: User,
  playlist_curators: Music,
  cover_art_designers: Layers,
  music_promotion: Sparkles,
  production_services: Sliders,
  music_distribution: Globe
};

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, addProfessional, trackProfessionalClick } = useStore();
  const { user } = useAuth();
  
  const isAdmin = localStorage.getItem('VOODOO_BOOMIN_ADMIN_AUTH') === 'true' || 
                  localStorage.getItem('KRYPSIDE_ADMIN_AUTH') === 'true' || 
                  user?.email === 'glennbucky@gmail.com';

  const categoryParam = searchParams.get('category') || 'all';
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filterFeaturedOnly, setFilterFeaturedOnly] = useState(false);

  // Modals state
  const [selectedProfessional, setSelectedProfessional] = useState<MusicProfessional | null>(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [loadedPortfolioId, setLoadedPortfolioId] = useState<string | null>(null);

  // Sync state with URL params
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setSearchParams({ category: cat });
  };

  // Get active configurations
  const config = state.servicesConfig || {
    enableMusicDistribution: false,
    enableProfessionalApplications: true
  };

  // Filter professionals (APPROVED & PUBLISHED only, unless admin is looking at details)
  const allProfessionals = state.professionals || [];
  const publicProfessionals = allProfessionals.filter(p => p.status === 'APPROVED' && p.published === true);

  // Filter active directory categories depending on optional distribution state
  const categoriesList = Object.keys(CATEGORY_LABELS) as ProfessionalCategory[];
  const activeCategoriesList = categoriesList.filter(cat => {
    if (cat === 'music_distribution') {
      return config.enableMusicDistribution;
    }
    return true;
  });

  // Filtered professionals to display
  const filteredProfessionals = publicProfessionals.filter(p => {
    // Category check
    if (activeCategory !== 'all' && p.category !== activeCategory && !(p.secondaryCategories || []).includes(activeCategory as any)) {
      return false;
    }
    // Search query check (name, tagline, services)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchTagline = p.tagline?.toLowerCase().includes(q) || false;
      const matchBio = p.bio.toLowerCase().includes(q);
      const matchServices = p.services?.some(s => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)) || false;
      const matchCatLabel = CATEGORY_LABELS[p.category].toLowerCase().includes(q);
      
      if (!matchName && !matchTagline && !matchBio && !matchServices && !matchCatLabel) {
        return false;
      }
    }
    // Location check
    if (locationQuery.trim()) {
      const loc = locationQuery.toLowerCase();
      if (!p.location || !p.location.toLowerCase().includes(loc)) {
        return false;
      }
    }
    // Featured check
    if (filterFeaturedOnly && !p.featured) {
      return false;
    }
    return true;
  });

  // Sort featured ones first, then by creation date
  const sortedProfessionals = [...filteredProfessionals].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Handle viewing professional
  const handleViewProfessional = (prof: MusicProfessional) => {
    setSelectedProfessional(prof);
    setLoadedPortfolioId(null); // Reset lazy loaded embeds
    trackProfessionalClick(prof.id, 'view');
  };

  const handleContactProfessional = (prof: MusicProfessional) => {
    trackProfessionalClick(prof.id, 'contact');
    
    // Choose preferred contact method
    if (prof.bookingMethod === 'email') {
      window.location.href = `mailto:${prof.email}?subject=Inquiry from Voodoo Boomin Services Directory`;
    } else if (prof.bookingMethod === 'custom' && prof.phone) {
      window.location.href = `tel:${prof.phone}`;
    } else if ((prof.bookingMethod === 'booking_link' || prof.bookingMethod === 'website') && prof.bookingUrl) {
      window.open(prof.bookingUrl, '_blank', 'noopener,noreferrer');
    } else if (prof.websiteUrl) {
      window.open(prof.websiteUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = `mailto:${prof.email}?subject=Inquiry from Voodoo Boomin Services Directory`;
    }
  };

  // --- SIGNUP WIZARD STATE ---
  const [wizardStep, setWizardStep] = useState(1);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCategory, setFormCategory] = useState<ProfessionalCategory>('mixing_mastering');
  const [formSecondary, setFormSecondary] = useState<ProfessionalCategory[]>([]);
  const [formTagline, setFormTagline] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBookingUrl, setFormBookingUrl] = useState('');
  const [formBookingMethod, setFormBookingMethod] = useState<'website' | 'email' | 'booking_link'>('email');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [pricingNotes, setPricingNotes] = useState('');

  // Lists for services and portfolio in form
  const [formServices, setFormServices] = useState<ServiceOffer[]>([{ id: '1', title: '', price: '', turnaround: '' }]);
  const [formPortfolio, setFormPortfolio] = useState<PortfolioItem[]>([]);
  const [socialInsta, setSocialInsta] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');

  // Submission state
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOptimizing(true);
    try {
      // Resize and compress on client side to maximize bandwidth efficiency
      const optimizedBase64 = await optimizeImageFile(file, 240, 240, 0.85);
      setFormAvatarUrl(optimizedBase64);
    } catch (err) {
      console.error('Failed to optimize image:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAddServiceRow = () => {
    setFormServices(prev => [...prev, { id: Date.now().toString(), title: '', price: '', turnaround: '' }]);
  };

  const handleRemoveServiceRow = (id: string) => {
    setFormServices(prev => prev.filter(s => s.id !== id));
  };

  const handleServiceChange = (id: string, field: keyof ServiceOffer, val: string) => {
    setFormServices(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleAddPortfolioRow = () => {
    setFormPortfolio(prev => [...prev, { id: Date.now().toString(), title: '', url: '', type: 'audio' }]);
  };

  const handleRemovePortfolioRow = (id: string) => {
    setFormPortfolio(prev => prev.filter(p => p.id !== id));
  };

  const handlePortfolioChange = (id: string, field: keyof PortfolioItem, val: string) => {
    setFormPortfolio(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleNextStep = () => {
    setValidationError('');
    if (wizardStep === 1) {
      if (!formName.trim()) {
        setValidationError('Please enter your Professional or Business name.');
        return;
      }
      if (!formEmail.trim() || !formEmail.includes('@')) {
        setValidationError('Please enter a valid business email.');
        return;
      }
      if (!formBio.trim() || formBio.length < 20) {
        setValidationError('Please enter a short biography of at least 20 characters.');
        return;
      }
    }
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardStep(prev => prev - 1);
  };

  const handleToggleSecondaryCategory = (cat: ProfessionalCategory) => {
    if (formSecondary.includes(cat)) {
      setFormSecondary(prev => prev.filter(c => c !== cat));
    } else {
      setFormSecondary(prev => [...prev, cat]);
    }
  };

  const resetFormState = () => {
    setWizardStep(1);
    setFormName('');
    setFormEmail('');
    setFormCategory('mixing_mastering');
    setFormSecondary([]);
    setFormTagline('');
    setFormBio('');
    setFormLocation('');
    setFormWebsite('');
    setFormPhone('');
    setFormBookingUrl('');
    setFormBookingMethod('email');
    setFormAvatarUrl('');
    setPricingNotes('');
    setFormServices([{ id: '1', title: '', price: '', turnaround: '' }]);
    setFormPortfolio([]);
    setSocialInsta('');
    setSocialTwitter('');
    setSocialYoutube('');
    setSocialLinkedin('');
    setValidationError('');
    setSignupSubmitting(false);
    setSignupSuccess(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSignupSubmitting(true);

    try {
      const socialLinks: ProfessionalSocialLink[] = [];
      if (socialInsta) socialLinks.push({ platform: 'instagram', url: socialInsta });
      if (socialTwitter) socialLinks.push({ platform: 'twitter', url: socialTwitter });
      if (socialYoutube) socialLinks.push({ platform: 'youtube', url: socialYoutube });
      if (socialLinkedin) socialLinks.push({ platform: 'linkedin', url: socialLinkedin });
      if (formWebsite) socialLinks.push({ platform: 'website', url: formWebsite });

      const cleanServices = formServices.filter(s => s.title.trim() !== '');
      const cleanPortfolio = formPortfolio.filter(p => p.title.trim() !== '' && p.url.trim() !== '');

      const professionalData: MusicProfessional = {
        id: `pro_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: formName.trim(),
        category: formCategory,
        secondaryCategories: formSecondary,
        tagline: formTagline.trim() || undefined,
        bio: formBio.trim(),
        avatarUrl: formAvatarUrl || undefined,
        location: formLocation.trim() || undefined,
        websiteUrl: formWebsite.trim() || undefined,
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        bookingUrl: formBookingUrl.trim() || undefined,
        bookingMethod: formBookingMethod,
        socialLinks,
        services: cleanServices.length > 0 ? cleanServices : undefined,
        portfolio: cleanPortfolio.length > 0 ? cleanPortfolio : undefined,
        pricingInfo: pricingNotes.trim() || undefined,
        status: 'PENDING',
        published: false,
        featured: false,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileViews: 0,
        contactClicks: 0
      };

      await addProfessional(professionalData);
      setSignupSuccess(true);
    } catch (err) {
      console.error('Error submitting professional signup:', err);
      setValidationError('Failed to submit registration. Please check your connections and try again.');
    } finally {
      setSignupSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-neutral-900/80 bg-gradient-to-b from-purple-950/20 via-neutral-950 to-neutral-950 pt-12 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Artist Network Discovery
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase italic">
              Music Professional Directory
            </h1>
            <p className="mt-3 text-sm sm:text-base text-neutral-400">
              Discover industry professionals verified to help custom production, engineering, record release, playlist submissions, and design. Connect directly with their trusted services.
            </p>
          </div>

          {config.enableProfessionalApplications && (
            <button
              onClick={() => {
                resetFormState();
                setIsSignupModalOpen(true);
              }}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 self-start md:self-auto shrink-0 border border-purple-500/30"
            >
              <Plus className="w-4 h-4" />
              Join as Professional
            </button>
          )}
        </div>
      </section>

      {/* Main Directory Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search and Filters panel */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 mb-8 flex flex-col gap-4 sm:gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search professionals, services, skillsets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-600 transition-colors"
              />
            </div>

            {/* Location Input */}
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Location (e.g. Remote, Atlanta)"
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-600 transition-colors"
              />
            </div>

            {/* Featured filter toggle */}
            <button
              onClick={() => setFilterFeaturedOnly(prev => !prev)}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${
                filterFeaturedOnly
                  ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Featured Profiles Only
            </button>
          </div>

          {/* Navigation Category Switcher bar */}
          <div className="border-t border-neutral-800/60 pt-4 overflow-x-auto scrollbar-none flex items-center gap-2">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                activeCategory === 'all'
                  ? 'bg-white text-black border-white'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              All Categories
            </button>

            {activeCategoriesList.map(cat => {
              const Icon = CATEGORY_ICONS[cat] || Shield;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    activeCategory === cat
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/10'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory Results */}
        <div>
          {sortedProfessionals.length === 0 ? (
            <div className="bg-neutral-900/30 border border-neutral-800/80 border-dashed rounded-2xl p-16 text-center max-w-4xl mx-auto">
              <User className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">
                {allProfessionals.length === 0 ? 'No Music Professionals Joined Yet' : 'No Professionals Listed in This Category Yet'}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-6">
                {allProfessionals.length === 0
                  ? 'Be the first professional to establish your business presence in Voodoo Boomin\'s high-traffic directory! Connect directly with artists.'
                  : 'Try adjusting your search criteria, clearing your keyword query, or browsing alternative category tabs.'}
              </p>

              {config.enableProfessionalApplications && allProfessionals.length === 0 && (
                <button
                  onClick={() => {
                    resetFormState();
                    setIsSignupModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Submit Your Professional Profile
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProfessionals.map((prof) => {
                const Icon = CATEGORY_ICONS[prof.category] || Shield;
                return (
                  <div
                    key={prof.id}
                    className={`bg-neutral-900/90 border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between hover:shadow-xl group relative overflow-hidden ${
                      prof.featured 
                        ? 'border-purple-500/50 hover:border-purple-400 hover:shadow-purple-950/20' 
                        : 'border-neutral-800 hover:border-neutral-700 hover:shadow-black'
                    }`}
                  >
                    {/* Featured subtle gradient strip */}
                    {prof.featured && (
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600" />
                    )}

                    <div>
                      {/* Avatar & Verification badges */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-purple-500/20 transition-colors">
                          {prof.avatarUrl ? (
                            <img
                              src={prof.avatarUrl}
                              alt={prof.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <User className="w-6 h-6 text-neutral-600" />
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {prof.featured && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold uppercase tracking-wider">
                              Featured
                            </span>
                          )}
                          {prof.verified && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Header Title & Categories */}
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                        {prof.name}
                      </h3>

                      <div className="flex items-center gap-1 text-xs text-purple-400 font-bold uppercase tracking-wider mt-1">
                        <Icon className="w-3 h-3" />
                        <span>{CATEGORY_LABELS[prof.category]}</span>
                      </div>

                      {/* Tagline or Description */}
                      <p className="text-xs text-neutral-300 font-medium mt-3 italic line-clamp-1">
                        {prof.tagline || `Professional ${CATEGORY_LABELS[prof.category]}`}
                      </p>

                      <p className="text-xs text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                        {prof.bio}
                      </p>

                      {/* Specific Services Preview tags */}
                      {prof.services && prof.services.length > 0 && (
                        <div className="mt-4 pt-3.5 border-t border-neutral-800/60">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Services Offered</h4>
                          <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                            {prof.services.slice(0, 3).map((serv, idx) => (
                              <span
                                key={serv.id || idx}
                                className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded-md text-[10px] text-neutral-300 font-medium whitespace-nowrap"
                              >
                                {serv.title} {serv.price ? `(${serv.price})` : ''}
                              </span>
                            ))}
                            {prof.services.length > 3 && (
                              <span className="px-2 py-0.5 bg-neutral-950/40 border border-neutral-800 border-dashed rounded-md text-[10px] text-neutral-500 font-medium">
                                +{prof.services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Location or Service Area */}
                      {prof.location && (
                        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-neutral-400">
                          <MapPin className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                          <span className="line-clamp-1">{prof.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="mt-5 pt-4 border-t border-neutral-800/60 flex items-center gap-2">
                      <button
                        onClick={() => handleViewProfessional(prof)}
                        className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-bold transition-all text-center border border-neutral-800"
                      >
                        Details & Portfolio
                      </button>
                      <button
                        onClick={() => handleContactProfessional(prof)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        Contact
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- PROFESSIONAL PROFILE MODAL (DETAIL VIEW) --- */}
      {selectedProfessional && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl relative animate-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => setSelectedProfessional(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Cover subtle ambient glow */}
            <div className="h-28 bg-gradient-to-r from-purple-900/30 via-neutral-950 to-purple-900/20 border-b border-neutral-800/60 relative overflow-hidden" />

            {/* Profile Header Container */}
            <div className="px-6 sm:px-8 pb-6 relative -mt-10">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                {/* Avatar with absolute styling */}
                <div className="w-20 h-20 rounded-2xl bg-neutral-950 border-2 border-neutral-800 flex items-center justify-center overflow-hidden shadow-xl">
                  {selectedProfessional.avatarUrl ? (
                    <img
                      src={selectedProfessional.avatarUrl}
                      alt={selectedProfessional.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-neutral-600" />
                  )}
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic">
                      {selectedProfessional.name}
                    </h2>
                    {selectedProfessional.verified && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mt-1">
                    {CATEGORY_LABELS[selectedProfessional.category]}
                  </p>
                </div>
              </div>

              {/* Bio & Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 border-t border-neutral-800/80 pt-6">
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Biography</h3>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                      {selectedProfessional.bio}
                    </p>
                  </div>

                  {/* Portfolio pre-views (lazy loads video or embeds on click only) */}
                  {selectedProfessional.portfolio && selectedProfessional.portfolio.length > 0 && (
                    <div className="pt-4 border-t border-neutral-800/40">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Portfolio & Work</h3>
                      <div className="space-y-3">
                        {selectedProfessional.portfolio.map((item) => {
                          const isLoaded = loadedPortfolioId === item.id;
                          const isYoutube = item.url.includes('youtube.com') || item.url.includes('youtu.be');
                          const isSoundcloud = item.url.includes('soundcloud.com');

                          return (
                            <div key={item.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  {item.type === 'video' ? <Video className="w-4 h-4 text-purple-400 flex-shrink-0" /> : <FileAudio className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                                  <span className="text-xs font-semibold text-neutral-200 line-clamp-1">{item.title}</span>
                                </div>

                                {!isLoaded && (isYoutube || isSoundcloud) ? (
                                  <button
                                    onClick={() => setLoadedPortfolioId(item.id)}
                                    className="px-2.5 py-1 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800 text-purple-400 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    Load Embed
                                  </button>
                                ) : (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Visit Link
                                  </a>
                                )}
                              </div>

                              {/* Dynamically Load Embeds ONLY after user intent click (bandwidth optimization) */}
                              {isLoaded && isYoutube && (
                                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black mt-1">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${item.url.split('v=')[1]?.split('&')[0] || item.url.split('/').pop()}`}
                                    title={item.title}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              )}

                              {isLoaded && isSoundcloud && (
                                <div className="w-full h-[120px] rounded-lg overflow-hidden bg-black mt-1">
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    scrolling="no"
                                    frameBorder="no"
                                    allow="autoplay"
                                    src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(item.url)}&color=%237c3aed&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Info & Booking column */}
                <div className="space-y-5 bg-neutral-950/50 p-4 border border-neutral-800/80 rounded-2xl">
                  {/* Location info */}
                  {selectedProfessional.location && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Service Location</h4>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{selectedProfessional.location}</span>
                      </div>
                    </div>
                  )}

                  {/* Pricing info details */}
                  {selectedProfessional.pricingInfo && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Pricing Overview</h4>
                      <p className="text-xs text-neutral-300 italic">{selectedProfessional.pricingInfo}</p>
                    </div>
                  )}

                  {/* Core Services Rates Table */}
                  {selectedProfessional.services && selectedProfessional.services.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Service Rates</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                        {selectedProfessional.services.map((serv) => (
                          <div key={serv.id} className="bg-neutral-950 border border-neutral-800/80 p-2.5 rounded-lg text-xs flex justify-between gap-2 items-start">
                            <div>
                              <p className="font-semibold text-neutral-200">{serv.title}</p>
                              {serv.turnaround && <p className="text-[10px] text-neutral-500 mt-0.5">Turnaround: {serv.turnaround}</p>}
                            </div>
                            {serv.price && (
                              <span className="px-2 py-0.5 bg-purple-950/40 border border-purple-800/40 text-purple-400 font-bold rounded shrink-0">
                                {serv.price}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social & Booking Button */}
                  <div className="pt-4 border-t border-neutral-800/80 space-y-4">
                    {/* Social networks links */}
                    {selectedProfessional.socialLinks && selectedProfessional.socialLinks.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Connect Externally</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfessional.socialLinks.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-neutral-950 border border-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                            >
                              {link.platform === 'instagram' ? <Instagram className="w-4 h-4" /> :
                               link.platform === 'twitter' ? <Twitter className="w-4 h-4" /> :
                               link.platform === 'youtube' ? <Youtube className="w-4 h-4" /> :
                               link.platform === 'linkedin' ? <Linkedin className="w-4 h-4" /> :
                               <Globe className="w-4 h-4" />}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Booking call-to-action button */}
                    <button
                      onClick={() => handleContactProfessional(selectedProfessional)}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/10"
                    >
                      <Mail className="w-4 h-4" />
                      Inquire / Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PROFESSIONAL SIGNUP WIZARD MODAL --- */}
      {isSignupModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl relative animate-in zoom-in duration-150 p-6 sm:p-8">
            {/* Header close button */}
            <button
              onClick={() => setIsSignupModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950/40 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Titles */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-500" />
                Join Professional Directory
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Establish your profile to connect with independent artists. Applications must be reviewed and approved by administrators.
              </p>
            </div>

            {/* Progress indicators */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="space-y-1.5">
                  <div className={`h-1 rounded-full transition-all ${idx <= wizardStep ? 'bg-purple-500' : 'bg-neutral-800'}`} />
                  <span className={`text-[9px] uppercase tracking-wider font-bold block text-center ${idx === wizardStep ? 'text-purple-400' : 'text-neutral-500'}`}>
                    Step {idx}
                  </span>
                </div>
              ))}
            </div>

            {/* Validation Error banner */}
            {validationError && (
              <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Step Views */}
            {signupSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase italic">Registration Submitted Successfully!</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  Your professional directory profile application is received and set to <span className="font-semibold text-purple-400 bg-purple-950/50 px-1.5 py-0.5 rounded">PENDING</span>. Administrators will review details shortly before publishing publicly.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setIsSignupModalOpen(false)}
                    className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-neutral-800"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* STEP 1: BASIC INFORMATION */}
                {wizardStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Professional Name */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Business / Professional Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Glenn Bucky Studios"
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-600 transition-colors"
                        />
                      </div>

                      {/* Business Email */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Business Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. business@glennbucky.com"
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-600 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Primary Category Dropdown */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Primary Category *</label>
                        <select
                          value={formCategory}
                          onChange={e => setFormCategory(e.target.value as ProfessionalCategory)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-600 transition-colors"
                        >
                          {categoriesList.map(cat => (
                            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                          ))}
                        </select>
                      </div>

                      {/* Location Input */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Service Location / Area</label>
                        <input
                          type="text"
                          placeholder="e.g. Atlanta, GA / Remote"
                          value={formLocation}
                          onChange={e => setFormLocation(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-600 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Tagline short phrase */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Short Catchy Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Industry-ready professional mastering starting at $50"
                        value={formTagline}
                        onChange={e => setFormTagline(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-600 transition-colors"
                      />
                    </div>

                    {/* Biography & description */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Biography & Detailed Experience * (Min 20 chars)</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Describe your credentials, past clients, gears, or process here..."
                        value={formBio}
                        onChange={e => setFormBio(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-600 transition-colors resize-none"
                      />
                    </div>

                    {/* Avatar upload with bandwidth optimization */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Profile Avatar / Logo</label>
                      <div className="flex items-center gap-4 p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                        <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                          {formAvatarUrl ? (
                            <img src={formAvatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-neutral-600" />
                          )}
                        </div>

                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            id="avatar-input"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="avatar-input"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                          >
                            {isOptimizing ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Optimizing...
                              </>
                            ) : (
                              'Select File'
                            )}
                          </label>
                          <p className="text-[10px] text-neutral-500 mt-1.5">Images are compressed automatically on the fly to conserve network data.</p>
                        </div>
                      </div>
                    </div>

                    {/* Next step button */}
                    <div className="pt-4 border-t border-neutral-800/60 flex justify-end">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        Next Step: Rates
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: SPECIFIC SERVICES & RATES */}
                {wizardStep === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Specify Offered Services & Rates</h3>
                      <button
                        type="button"
                        onClick={handleAddServiceRow}
                        className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Row
                      </button>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                      {formServices.map((serv, index) => (
                        <div key={serv.id} className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl grid grid-cols-12 gap-2.5 items-end">
                          <div className="col-span-6">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Service Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Full Vocal Master"
                              value={serv.title}
                              onChange={e => handleServiceChange(serv.id, 'title', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                            />
                          </div>

                          <div className="col-span-3">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Price</label>
                            <input
                              type="text"
                              placeholder="e.g. $150 /hr"
                              value={serv.price}
                              onChange={e => handleServiceChange(serv.id, 'price', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Time</label>
                            <input
                              type="text"
                              placeholder="3-5 days"
                              value={serv.turnaround}
                              onChange={e => handleServiceChange(serv.id, 'turnaround', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                            />
                          </div>

                          <div className="col-span-1 pb-1 flex justify-center">
                            {formServices.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveServiceRow(serv.id)}
                                className="p-1.5 text-neutral-500 hover:text-rose-400 bg-neutral-900 border border-neutral-800 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pricing Notes */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">General Pricing Notes / Rates Summary</label>
                      <input
                        type="text"
                        placeholder="e.g. Custom quote on project sizes. Standard revisions included."
                        value={pricingNotes}
                        onChange={e => setPricingNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-600 transition-colors"
                      />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-4 border-t border-neutral-800/60 flex justify-between">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        Next Step: Portfolio
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: PORTFOLIO & SOCIAL LINKS */}
                {wizardStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Portfolio Items dynamic list */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Showcase Portfolio Items</h3>
                      <button
                        type="button"
                        onClick={handleAddPortfolioRow}
                        className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Portfolio Work
                      </button>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                      {formPortfolio.length === 0 ? (
                        <p className="text-[11px] text-neutral-500 italic">No portfolio work added yet. Click &quot;Add Portfolio Work&quot; to include links to your SoundCloud, YouTube, Behance, or external files.</p>
                      ) : (
                        formPortfolio.map((item) => (
                          <div key={item.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-4">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Work Title</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Mastered Mix #3"
                                value={item.title}
                                onChange={e => handlePortfolioChange(item.id, 'title', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                              />
                            </div>

                            <div className="col-span-5">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Url (e.g. SoundCloud / YouTube)</label>
                              <input
                                type="url"
                                required
                                placeholder="https://..."
                                value={item.url}
                                onChange={e => handlePortfolioChange(item.id, 'url', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">Type</label>
                              <select
                                value={item.type || 'audio'}
                                onChange={e => handlePortfolioChange(item.id, 'type', e.target.value)}
                                className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                              >
                                <option value="audio">Audio</option>
                                <option value="video">Video</option>
                                <option value="design">Design</option>
                                <option value="link">Other Link</option>
                              </select>
                            </div>

                            <div className="col-span-1 pb-1 flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePortfolioRow(item.id)}
                                className="p-1.5 text-neutral-500 hover:text-rose-400 bg-neutral-900 border border-neutral-800 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Social links grid */}
                    <div className="pt-4 border-t border-neutral-800/60">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">External Links & Socials</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1 flex items-center gap-1">
                            <Instagram className="w-3 h-3" /> Instagram Link
                          </label>
                          <input
                            type="url"
                            placeholder="https://instagram.com/yourprofile"
                            value={socialInsta}
                            onChange={e => setSocialInsta(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1 flex items-center gap-1">
                            <Twitter className="w-3 h-3" /> Twitter Link
                          </label>
                          <input
                            type="url"
                            placeholder="https://twitter.com/yourprofile"
                            value={socialTwitter}
                            onChange={e => setSocialTwitter(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1 flex items-center gap-1">
                            <Youtube className="w-3 h-3" /> YouTube Channel
                          </label>
                          <input
                            type="url"
                            placeholder="https://youtube.com/@yourprofile"
                            value={socialYoutube}
                            onChange={e => setSocialYoutube(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-1 flex items-center gap-1">
                            <Linkedin className="w-3 h-3" /> LinkedIn Link
                          </label>
                          <input
                            type="url"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={socialLinkedin}
                            onChange={e => setSocialLinkedin(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-4 border-t border-neutral-800/60 flex justify-between">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        Next Step: Booking
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: CONTACT & BOOKING METHOD */}
                {wizardStep === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Establish Preferred Contact Method</h3>

                    <div className="space-y-3">
                      {/* Booking Method radio choice */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Preferred Booking & Contact Channel</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'email', label: 'Direct Email', icon: Mail },
                            { id: 'booking_link', label: 'Booking Link', icon: LinkIcon },
                            { id: 'website', label: 'Official Website', icon: Globe }
                          ].map((channel) => (
                            <button
                              key={channel.id}
                              type="button"
                              onClick={() => setFormBookingMethod(channel.id as any)}
                              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                                formBookingMethod === channel.id
                                  ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-white'
                              }`}
                            >
                              <channel.icon className="w-4 h-4" />
                              {channel.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Web URL or Booking Link details */}
                      {(formBookingMethod === 'booking_link' || formBookingMethod === 'website') && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Booking / URL Address *</label>
                          <input
                            type="url"
                            required
                            placeholder="e.g. https://calendly.com/username or https://mywebsite.com"
                            value={formBookingUrl}
                            onChange={e => setFormBookingUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-600 transition-colors"
                          />
                        </div>
                      )}

                      {/* Optional Web URL if Direct Email is chosen */}
                      {formBookingMethod === 'email' && (
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Personal / Business Website URL</label>
                          <input
                            type="url"
                            placeholder="e.g. https://mywebsite.com"
                            value={formWebsite}
                            onChange={e => setFormWebsite(e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-600 transition-colors"
                          />
                        </div>
                      )}

                      {/* Secondary Phone contact option */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Secondary Contact Phone (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. +1 (404) 555-0199"
                          value={formPhone}
                          onChange={e => setFormPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-600 transition-colors"
                        />
                      </div>

                      {/* Secondary Categories options for visibility */}
                      <div className="pt-3 border-t border-neutral-800/60">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Secondary Service Categorization (Visibility in Searches)</label>
                        <div className="flex flex-wrap gap-2">
                          {categoriesList.filter(c => c !== formCategory).map((cat) => {
                            const isSelected = formSecondary.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => handleToggleSecondaryCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                                  isSelected 
                                    ? 'bg-purple-950/40 border-purple-500 text-purple-300' 
                                    : 'bg-neutral-950 border-neutral-850 text-neutral-500 hover:text-white'
                                }`}
                              >
                                {CATEGORY_LABELS[cat]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-4 border-t border-neutral-800/60 flex justify-between">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={signupSubmitting}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/10"
                      >
                        {signupSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            Submit Registration
                            <Check className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
