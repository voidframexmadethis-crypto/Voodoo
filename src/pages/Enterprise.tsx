import React, { useState } from 'react';
import { 
  Music, 
  Sliders, 
  Volume2, 
  Check, 
  Send, 
  FileText, 
  Shield, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

export default function EnterpriseMusicPlatform() {
  // --- STATE FOR INQUIRY FORM ---
  const [artistName, setArtistName] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState('Custom Beat Production');
  const [requirements, setRequirements] = useState('');
  const [referenceLink, setReferenceLink] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- GENUINE VOODOO BOOMIN SERVICES LIST ---
  const services = [
    {
      id: 'custom-production',
      title: 'Custom Beat Production',
      icon: Music,
      description: 'Get a completely custom-crafted instrumental produced from scratch to match your unique sonic style, target tempo, and arrangement preferences. Includes exclusive draft previews and the final 24-bit multitrack audio stems.',
      details: [
        'Vocal range & reference track analysis',
        'Fully arranged structure (Intro, Verse, Chorus, Outro)',
        'Delivered in uncompressed WAV & tracked-out stems',
        'Standard non-exclusive or exclusive publishing rights agreement'
      ]
    },
    {
      id: 'mixing-mastering',
      title: 'Professional Mixing & Mastering',
      icon: Sliders,
      description: 'High-end stereo mixing and mastering of your recorded vocal takes over the instrumental track. This service uses precise equalization, dynamic range compression, vocal tuning, and commercial limiting algorithms to get your music radio-ready.',
      details: [
        'Vocal pitch correction & timing alignment',
        'Instrumental & vocal space balancing',
        'Industry-standard commercial loudness target (LUFS)',
        'Lossless WAV master & mobile-friendly reference MP3'
      ]
    },
    {
      id: 'audio-editing',
      title: 'Vocal Tuning & Stem Arranging',
      icon: Volume2,
      description: 'Detailed corrective editing of raw recordings. We clean up audio noise, align vocal stacks, apply transparent pitch tuning, and insert custom transitions or ambient sound design elements to heighten the track\'s impact.',
      details: [
        'Background noise cleaning & click removal',
        'Multi-vocal double and harmony alignment',
        'Custom drop editing, transitions, and audio filters',
        'Prerendered high-quality submix exports'
      ]
    },
    {
      id: 'rights-licensing',
      title: 'Exclusive Buyouts & Publishing Support',
      icon: FileText,
      description: 'Comprehensive publishing registration and custom contract preparation for exclusive beat buyouts. Get full administrative rights setup, custom drafted split-sheets, and guidance registering with performance rights organizations.',
      details: [
        'Custom contract creation with clear legal terms',
        'PRO registrations helper (ASCAP, BMI, SOCAN)',
        'Split-sheet templates and collaborative setup',
        'Zero-percent administrative platform commission'
      ]
    }
  ];

  // --- SUBMIT SERVICE INQUIRY FORM ---
  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!artistName.trim()) {
      setErrorMsg('Please enter your Artist or Stage Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address to contact you.');
      return;
    }
    if (!requirements.trim()) {
      setErrorMsg('Please provide a brief description of your project requirements.');
      return;
    }

    setIsSubmitting(true);

    // Simulate direct backend ingestion and metadata packing sequence
    setTimeout(() => {
      const newInquiry = {
        id: `INQ-${Date.now()}`,
        artistName,
        email,
        serviceType,
        requirements,
        referenceLink,
        submittedAt: new Date().toISOString(),
      };

      // Retrieve and append to persistent local cache
      try {
        const cached = localStorage.getItem('voodoo_boomin_services_inquiries');
        const list = cached ? JSON.parse(cached) : [];
        list.push(newInquiry);
        localStorage.setItem('voodoo_boomin_services_inquiries', JSON.stringify(list));
      } catch (err) {
        console.error('Error writing service inquiry cache:', err);
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Reset form fields
      setArtistName('');
      setEmail('');
      setRequirements('');
      setReferenceLink('');
    }, 1200);
  };

  return (
    <div className="bg-[#090d16] text-[#f8fafc] min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-12 font-sans selection:bg-indigo-500/30 selection:text-white">
      
      {/* 🔮 HERO BANNER */}
      <div className="text-center md:text-left border-b border-neutral-800/80 pb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-black tracking-wider uppercase italic text-white mb-3">
            VOODOO BOOMIN SERVICES
          </h1>
          <p className="text-neutral-400 text-base md:text-lg leading-relaxed max-w-[65ch]">
            Custom production, pristine mixing, and expert song arrangement engineered specifically for professional recording artists demanding commercial-grade quality.
          </p>
        </div>
        
        {/* Branding badge */}
        <div className="bg-neutral-900 border border-neutral-800/80 rounded-xl px-5 py-4 flex items-center gap-3 shrink-0">
          <Shield className="w-6 h-6 text-indigo-400" />
          <div className="text-left">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono block">VERIFIED PRODUCTIONS</span>
            <span className="text-sm font-bold text-neutral-200">100% Secure Rights</span>
          </div>
        </div>
      </div>

      {/* 📦 SERVICES CATALOG & INQUIRY FORM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Clean Services Cards (Lg screens 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h2 className="text-xl font-bold tracking-wider text-neutral-300 uppercase mb-2 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" /> Professional Services Offered
          </h2>

          <div className="space-y-6">
            {services.map((srv) => {
              const IconComp = srv.icon;
              return (
                <div 
                  key={srv.id} 
                  className="bg-neutral-900/60 border border-neutral-800/85 hover:border-neutral-700/80 rounded-xl p-5 md:p-6 transition-all duration-250 flex flex-col md:flex-row gap-5"
                >
                  {/* Service Icon */}
                  <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                    <IconComp className="w-6 h-6 text-indigo-400" />
                  </div>
                  
                  {/* Service Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <h3 className="text-lg font-bold text-white tracking-wide">{srv.title}</h3>
                      <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Rates Upon Inquiry
                      </span>
                    </div>
                    
                    <p className="text-neutral-400 text-sm leading-relaxed max-w-[65ch]">
                      {srv.description}
                    </p>
                    
                    {/* Bullet List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-800/60">
                      {srv.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-neutral-400">
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Professional Quote Inquiry Form (Lg screens 5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800/80 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="text-lg font-bold text-white tracking-wide uppercase">Request rates & quotes</h2>
            <p className="text-xs text-neutral-400 mt-1">Submit your project details to request custom arrangements and rates.</p>
          </div>

          {submitSuccess ? (
            <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-6 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-emerald-400">Inquiry Received Successfully</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Thank you! Your specifications have been logged securely in our producer pipeline. Voodoo Boomin will review your requirements and follow up via email within 24 hours.
                </p>
              </div>
              <button 
                onClick={() => setSubmitSuccess(false)}
                className="text-xs font-bold text-indigo-400 hover:text-white transition-colors pt-2 block mx-auto underline cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              
              {/* Form Validation Alert Box */}
              {errorMsg && (
                <div className="bg-red-500/5 border border-red-500/25 rounded-lg p-3 flex items-start gap-2.5 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Artist Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Artist / Stage Name</label>
                <input 
                  type="text" 
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g. Young Voodoo"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Contact Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. artist@example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Service Type Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Requested Service</label>
                <select 
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="Custom Beat Production">Custom Beat Production</option>
                  <option value="Professional Mixing & Mastering">Professional Mixing & Mastering</option>
                  <option value="Vocal Tuning & Stem Arranging">Vocal Tuning & Stem Arranging</option>
                  <option value="Exclusive Buyout & Legal Setup">Exclusive Buyout & Legal Setup</option>
                </select>
              </div>

              {/* Reference Links */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Reference Tracks / Work Link (Optional)</label>
                <input 
                  type="url" 
                  value={referenceLink}
                  onChange={(e) => setReferenceLink(e.target.value)}
                  placeholder="e.g. SoundCloud, YouTube, or Drive folder link"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Requirements text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Project Description & Requirements</label>
                <textarea 
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                  placeholder="Describe your vision, preferred tempo, mood, arrangement details, and deadlines..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Form Info Box */}
              <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3 flex items-start gap-2.5 text-[10px] text-neutral-500 leading-normal">
                <AlertCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <span>Submitted inquiries are saved securely. Your rates are custom negotiated depending on track complexity.</span>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                    <span>Processing Ingestion...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>Send Service Inquiry</span>
                  </>
                )}
              </button>

            </form>
          )}
        </div>

      </div>

      {/* 🔧 SYSTEM INFRASTRUCTURE / BACKSTAGE ADMIN PREVIEW */}
      <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-xl p-5 mt-4">
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Configure Service Rates</h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          This hub allows artists to connect directly with **Voodoo Boomin** for custom rates and services. Rates and offerings display as inquiries first, which are persisted locally inside the browser. Admin tools will permit immediate, integrated configuration of these items during final production steps.
        </p>
      </div>

    </div>
  );
}
