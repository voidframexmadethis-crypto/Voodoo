import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Send, 
  User, 
  MapPin, 
  ExternalLink, 
  Instagram, 
  Youtube, 
  Twitter, 
  Globe, 
  ChevronRight, 
  Sparkles, 
  Music, 
  Disc 
} from 'lucide-react';

interface ProfileSectionProps {
  isDarkMode: boolean;
}

// Social platform icon helper
const getSocialIcon = (platform: string, size = 18) => {
  const p = platform.toLowerCase();
  if (p.includes('instagram')) return <Instagram size={size} className="text-[#E4405F]" />;
  if (p.includes('youtube')) return <Youtube size={size} className="text-[#FF0000]" />;
  if (p.includes('twitter') || p.includes('x')) return <Twitter size={size} className="text-[#1DA1F2]" />;
  if (p.includes('spotify')) return <Disc size={size} className="text-[#1DB954]" />;
  if (p.includes('tiktok')) return <Music size={size} className="text-[#00F2FE]" />;
  return <Globe size={size} className="text-purple-400" />;
};

const getCleanHref = (url: string) => {
  if (!url) return '#';
  return url.startsWith('http') ? url : `https://${url}`;
};

export default function ProfileSection({ isDarkMode }: ProfileSectionProps) {
  const { state } = useStore();
  const navigate = useNavigate();

  const profile = state.profile || {
    name: 'Voodoo Boomin',
    tagline: 'Multi-Platinum Trap & Dark 808 Architect',
    bio: 'Industry producer crafting heavy trap basslines, atmospheric synths, and dark melodic drills.',
    avatarUrl: '',
    coverUrl: '',
    location: 'Atlanta, GA / Global',
    socialLinks: []
  };

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // VIP Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSubmitting(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject || 'General Inquiry',
          message: contactMessage
        })
      });
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to dispatch contact message:', err);
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitting(true);
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail,
          name: 'Mailing List Stage Name',
          notifyOnBeatDrop: true
        })
      });
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to submit subscription:', err);
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* 👤 STUNNING ABOUT / PROFILE INTRO CARD */}
      <section className={`rounded-3xl p-6 md:p-8 border shadow-2xl relative overflow-hidden transition-all duration-300 ${
        isDarkMode ? 'bg-[#08080b] border-neutral-900' : 'bg-white border-neutral-200'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          {/* Avatar Area */}
          <div className="flex flex-col items-center space-y-4 shrink-0">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-3xl blur-md opacity-25 group-hover:opacity-45 transition-opacity pointer-events-none" />
              <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-3xl overflow-hidden border-2 border-purple-500/30 bg-neutral-950 p-0.5">
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={profile.name} 
                    className="w-full h-full object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-neutral-900 to-purple-950/80 flex flex-col items-center justify-center text-center p-3">
                    <User className="w-8 h-8 text-purple-400 mb-1" />
                    <span className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">VOODOO</span>
                  </div>
                )}
              </div>
            </div>

            {profile.location && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 font-bold uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {/* Biography and Social Links */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Sparkles size={16} className="text-purple-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 font-mono">
                  THE PRODUCER BEHIND THE BEATS
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-white leading-none">
                {profile.name}
              </h2>
              <p className="text-xs text-neutral-400 font-mono tracking-wider uppercase font-semibold">
                {profile.tagline || 'Multi-Platinum Trap & Dark 808 Architect'}
              </p>
            </div>

            <p className="text-neutral-300 text-xs md:text-sm font-medium leading-relaxed max-w-3xl">
              {profile.bio || 'Industry producer crafting heavy trap basslines, atmospheric synths, and dark melodic drills.'}
            </p>

            {/* Social Media Link Grid */}
            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-2 font-mono">
                  Official Channels & Portals
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {profile.socialLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={getCleanHref(link.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-white transition-colors"
                    >
                      {getSocialIcon(link.platform, 14)}
                      <span>{link.platform}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation hook to the full editable profile */}
            <div className="pt-2 flex justify-center md:justify-start">
              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-purple-600/10"
              >
                <span>View Full Studio Profile</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* 📹 RESPONSIVE YOUTUBE/VIDEO SECTION */}
      {state.videos.length > 0 && (
        <section className={`rounded-2xl p-6 border shadow-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-neutral-950/40 border-neutral-900' : 'bg-white border-neutral-200'
        }`}>
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Video size={20} className="text-purple-500" />
              <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic">Featured Videos</h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-mono">
              Official video cookups and studio sessions from Voodoo Boomin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.videos.map((video) => (
              <div key={video.id} className="flex flex-col space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                  <iframe 
                    src={`https://www.youtube.com/embed/${video.videoId}`} 
                    title={video.title} 
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight text-white uppercase italic">{video.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 📥 CONTACT AND CUSTOM BEATS REQUEST FORM */}
      <section 
        id="contact-form-section"
        className={`rounded-2xl p-6 border shadow-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-neutral-950/40 border-neutral-900' : 'bg-white border-neutral-200'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Send size={20} className="text-purple-500" />
              <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic">Secure Booking & Collaboration</h2>
            </div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono">
              Inquire for exclusive arrangements, mastering sessions, or unique instrumental soundscapes.
            </p>
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDarkMode ? 'bg-neutral-900/30 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-xs font-extrabold text-white uppercase">Direct Studio Routing Active</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                All booking messages are piped securely to Voodoo Boomin's private email router. Typical turnaround for custom exclusive inquiries is 24-48 hours.
              </p>
            </div>
          </div>

          {/* Contact form controls */}
          <form onSubmit={handleContactSubmit} className="space-y-4">
            {contactSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-wider">
                ✓ Message sent successfully! Voodoo Boomin will contact you shortly.
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1.5">Artist/Legal Name</label>
                <input 
                  type="text" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Slim Kid" 
                  required
                  className={`w-full border px-3.5 py-3 rounded-lg text-xs font-semibold focus:outline-none transition-all ${
                    isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white focus:border-purple-600' : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="artist@gmail.com" 
                  required
                  className={`w-full border px-3.5 py-3 rounded-lg text-xs font-semibold focus:outline-none transition-all ${
                    isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white focus:border-purple-600' : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1.5">Subject Type</label>
              <input 
                type="text" 
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="e.g. Custom Exclusive Trap Beat Request" 
                className={`w-full border px-3.5 py-3 rounded-lg text-xs font-semibold focus:outline-none transition-all ${
                  isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white focus:border-purple-600' : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1.5">Your Message / Request details</label>
              <textarea 
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Include reference tracks, bpm targets, key structures, and license targets..."
                required
                className={`w-full border px-3.5 py-3 rounded-lg text-xs font-semibold focus:outline-none transition-all resize-none ${
                  isDarkMode ? 'bg-neutral-900 border-neutral-800 text-white focus:border-purple-600' : 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                }`}
              />
            </div>

            <button 
              type="submit"
              disabled={contactSubmitting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {contactSubmitting ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{contactSubmitting ? "Sending..." : "Send Message"}</span>
            </button>
          </form>
        </div>
      </section>

      {/* 📧 MAILING LIST SIGNUP CARD */}
      <section className="bg-gradient-to-r from-neutral-950 via-purple-950/20 to-neutral-950 border border-neutral-900 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] z-0" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[10px] font-black tracking-widest uppercase">
            ⚡ Voodoo Priority VIP Club
          </div>
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight text-white leading-none">
            Unlock 20% Off Your First Purchase
          </h2>
          <p className="text-neutral-400 text-xs md:text-sm font-medium leading-relaxed">
            Subscribe to receive premium release announcements, limited 1-of-1 loops, and exclusive coupons directly to your inbox. No spam. Unsubscribe at any time.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 pt-4 max-w-lg mx-auto">
            <input 
              type="email" 
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email to receive discount..." 
              required
              className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-4 py-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600"
            />
            <button 
              type="submit"
              disabled={newsletterSubmitting}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              {newsletterSubmitting && (
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{newsletterSubmitting ? "Joining..." : "Join VIP List"}</span>
            </button>
          </form>

          {newsletterSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-wider mt-4">
              ✓ Subscribed! Check your inbox for your 20% off coupon code: "VOODOO20".
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
