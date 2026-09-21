import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Twitter, 
  ExternalLink, 
  Settings, 
  User, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  Disc
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Home() {
  const { incrementAnalytics } = useStore();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [userAvailableTokens, setUserAvailableTokens] = useState(1);
  const [isReloaded, setIsReloaded] = useState(false);
  const [contractCheck, setContractCheck] = useState(false);
  const [contractSig, setContractSig] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [displayName, setDisplayName] = useState('VOODOO BOOMIN');
  const [bioDescription, setBioDescription] = useState('Pro Audio Loops & Instrumental Beats');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [twitterLink, setTwitterLink] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  
  const [activeTab, setActiveTab] = useState<'profile' | 'edit'>('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);

  const handleDirectSubmit = () => {
    const signatureText = contractSig.trim();
    if (!contractCheck || signatureText.length < 3) {
      alert("You must check the agreement box and type your legal signature to authorize production.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clientEmail || !emailRegex.test(clientEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    const requestData = {
      legalSignature: signatureText,
      agreementTimestamp: new Date().toISOString(),
      clientEmail: clientEmail
    };

    console.log("📨 Executed Legal Package Saved to Studio Database:", requestData);
    incrementAnalytics('totalShares'); 

    setIsSubmitted(true);
    setIsRequestSent(true);

    setUserAvailableTokens(0);
    setIsReloaded(false);
  };

  useEffect(() => {
    const savedName = localStorage.getItem('VOODOO_BOOMIN_DISPLAY_NAME') || localStorage.getItem('KRYPSIDE_DISPLAY_NAME');
    const savedBio = localStorage.getItem('VOODOO_BOOMIN_BIO') || localStorage.getItem('KRYPSIDE_BIO');
    const savedImg = localStorage.getItem('VOODOO_BOOMIN_IMAGE_URL') || localStorage.getItem('KRYPSIDE_IMAGE_URL');
    const savedFacebook = localStorage.getItem('VOODOO_BOOMIN_FACEBOOK') || localStorage.getItem('KRYPSIDE_FACEBOOK');
    const savedInstagram = localStorage.getItem('VOODOO_BOOMIN_INSTAGRAM') || localStorage.getItem('KRYPSIDE_INSTAGRAM');
    const savedYoutube = localStorage.getItem('VOODOO_BOOMIN_YOUTUBE') || localStorage.getItem('KRYPSIDE_YOUTUBE');
    const savedTwitter = localStorage.getItem('VOODOO_BOOMIN_TWITTER') || localStorage.getItem('KRYPSIDE_TWITTER');
    const savedPaypal = localStorage.getItem('VOODOO_BOOMIN_PERSONAL_PAYPAL') || localStorage.getItem('KRYPSIDE_PERSONAL_PAYPAL');
    
    if (savedName) setDisplayName(savedName);
    if (savedBio) setBioDescription(savedBio);
    if (savedImg) setProfileImageUrl(savedImg);
    if (savedFacebook) setFacebookLink(savedFacebook);
    if (savedInstagram) setInstagramLink(savedInstagram);
    if (savedYoutube) setYoutubeLink(savedYoutube);
    if (savedTwitter) setTwitterLink(savedTwitter);
    if (savedPaypal) setPaypalEmail(savedPaypal);
  }, []);

  // 🔒 THE DIRECT MERCHANT ROUTING VALVE
  // Locks your personal profile & social media links straight into storage
  const handleProfileDataPersistence = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('VOODOO_BOOMIN_DISPLAY_NAME', displayName);
    localStorage.setItem('VOODOO_BOOMIN_BIO', bioDescription);
    localStorage.setItem('VOODOO_BOOMIN_IMAGE_URL', profileImageUrl);
    localStorage.setItem('VOODOO_BOOMIN_FACEBOOK', facebookLink.trim());
    localStorage.setItem('VOODOO_BOOMIN_INSTAGRAM', instagramLink.trim());
    localStorage.setItem('VOODOO_BOOMIN_YOUTUBE', youtubeLink.trim());
    localStorage.setItem('VOODOO_BOOMIN_TWITTER', twitterLink.trim());
    localStorage.setItem('VOODOO_BOOMIN_PERSONAL_PAYPAL', paypalEmail.trim());

    localStorage.setItem('KRYPSIDE_DISPLAY_NAME', displayName);
    localStorage.setItem('KRYPSIDE_BIO', bioDescription);
    localStorage.setItem('KRYPSIDE_IMAGE_URL', profileImageUrl);
    localStorage.setItem('KRYPSIDE_FACEBOOK', facebookLink.trim());
    localStorage.setItem('KRYPSIDE_INSTAGRAM', instagramLink.trim());
    localStorage.setItem('KRYPSIDE_YOUTUBE', youtubeLink.trim());
    localStorage.setItem('KRYPSIDE_TWITTER', twitterLink.trim());
    localStorage.setItem('KRYPSIDE_PERSONAL_PAYPAL', paypalEmail.trim());
    
    setIsSaved(true);
    
    // 📡 Trigger Realtime UI Update Signal across Layout Sidebar
    window.dispatchEvent(new Event('VOODOO_BOOMIN_PROFILE_UPDATE'));
    window.dispatchEvent(new Event('KRYPSIDE_PROFILE_UPDATE'));

    setTimeout(() => setIsSaved(false), 3000);
  };

  const getCleanHref = (url: string) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  return (
    <div style={{ padding: '10px', width: '100%', fontFamily: 'sans-serif', color: '#ffffff' }}>
      
      {/* Dynamic Tab Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1c1c1f', paddingBottom: '15px', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Artist Studio</h2>
          <p style={{ color: '#727278', fontSize: '13px', margin: '4px 0 0 0' }}>Manage your profile homepage, social media channels, and storefront settings.</p>
        </div>
        
        <div style={{ display: 'flex', background: '#0e0e10', padding: '4px', borderRadius: '8px', border: '1px solid #1c1c1f' }}>
          <button 
            onClick={() => setActiveTab('profile')} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              border: 'none', 
              fontSize: '13px', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              background: activeTab === 'profile' ? '#1c1c1f' : 'transparent', 
              color: activeTab === 'profile' ? '#fff' : '#727278',
              transition: 'all 0.2s'
            }}
          >
            <User size={15} />
            My Profile Home Page
          </button>
          <button 
            onClick={() => setActiveTab('edit')} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              border: 'none', 
              fontSize: '13px', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              background: activeTab === 'edit' ? '#1c1c1f' : 'transparent', 
              color: activeTab === 'edit' ? '#fff' : '#727278',
              transition: 'all 0.2s'
            }}
          >
            <Settings size={15} />
            Edit Profile Settings
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* PROFILE HOME PAGE VIEW */}
          <div style={{ background: '#0e0e10', border: '1px solid #1c1c1f', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            {/* Artistic Header Banner */}
            <div style={{ height: '180px', background: 'linear-gradient(135deg, #4338ca 0%, #1e1b4b 50%, #000 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: '-45px', left: '40px', display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#1c1c1f', border: '4px solid #0e0e10', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                  ) : (
                    <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#6366f1' }}>
                      {displayName.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '60px 40px 40px 40px' }}>
              {/* Profile Meta Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>{displayName}</h1>
                    <CheckCircle2 size={20} style={{ color: '#00ffcc' }} />
                  </div>
                  <p style={{ color: '#00ffcc', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '6px 0 12px 0' }}>Verified Music Producer</p>
                  <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: '1.6', maxWidth: '650px', margin: 0 }}>{bioDescription}</p>
                </div>
                
                {/* Connected Services Tag */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: '#1c1c1f', border: '1px solid #2d2d30', padding: '12px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Disc size={18} style={{ color: '#6366f1' }} className="animate-spin" />
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#727278', fontWeight: 'bold', textTransform: 'uppercase' }}>Storefront Status</span>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>24h Distribution Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SOCIAL MEDIA CHANNELS MATRIX */}
              <div style={{ borderTop: '1px solid #1c1c1f', paddingTop: '30px', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Globe size={18} style={{ color: '#6366f1' }} />
                  Social Media Connections
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                  {/* Facebook Connection */}
                  <div style={{ background: '#111114', border: '1px solid #1c1c1f', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px', transition: 'border 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Facebook size={24} style={{ color: '#1877F2' }} />
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: facebookLink ? '#1877F2' : '#727278' }}>
                        {facebookLink ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#727278', textTransform: 'uppercase', fontWeight: 'bold' }}>Facebook Page</span>
                      <span style={{ display: 'block', fontSize: '13px', color: facebookLink ? '#fff' : '#48484a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500', marginTop: '4px' }}>
                        {facebookLink ? facebookLink.replace(/(^\w+:|^)\/\//, '') : 'No link provided'}
                      </span>
                    </div>
                    {facebookLink ? (
                      <a href={getCleanHref(facebookLink)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1877F2', fontWeight: 'bold', textDecoration: 'none', marginTop: '5px' }}>
                        Visit Profile <ExternalLink size={12} />
                      </a>
                    ) : (
                      <button onClick={() => setActiveTab('edit')} style={{ background: 'transparent', border: 'none', color: '#727278', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                        Configure in Settings <ArrowRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* Instagram Connection */}
                  <div style={{ background: '#111114', border: '1px solid #1c1c1f', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px', transition: 'border 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Instagram size={24} style={{ color: '#E4405F' }} />
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: instagramLink ? '#E4405F' : '#727278' }}>
                        {instagramLink ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#727278', textTransform: 'uppercase', fontWeight: 'bold' }}>Instagram Handle</span>
                      <span style={{ display: 'block', fontSize: '13px', color: instagramLink ? '#fff' : '#48484a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500', marginTop: '4px' }}>
                        {instagramLink ? instagramLink.replace(/(^\w+:|^)\/\//, '') : 'No link provided'}
                      </span>
                    </div>
                    {instagramLink ? (
                      <a href={getCleanHref(instagramLink)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#E4405F', fontWeight: 'bold', textDecoration: 'none', marginTop: '5px' }}>
                        Visit Profile <ExternalLink size={12} />
                      </a>
                    ) : (
                      <button onClick={() => setActiveTab('edit')} style={{ background: 'transparent', border: 'none', color: '#727278', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                        Configure in Settings <ArrowRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* YouTube Connection */}
                  <div style={{ background: '#111114', border: '1px solid #1c1c1f', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px', transition: 'border 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Youtube size={24} style={{ color: '#FF0000' }} />
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: youtubeLink ? '#FF0000' : '#727278' }}>
                        {youtubeLink ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#727278', textTransform: 'uppercase', fontWeight: 'bold' }}>YouTube Channel</span>
                      <span style={{ display: 'block', fontSize: '13px', color: youtubeLink ? '#fff' : '#48484a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500', marginTop: '4px' }}>
                        {youtubeLink ? youtubeLink.replace(/(^\w+:|^)\/\//, '') : 'No link provided'}
                      </span>
                    </div>
                    {youtubeLink ? (
                      <a href={getCleanHref(youtubeLink)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#FF0000', fontWeight: 'bold', textDecoration: 'none', marginTop: '5px' }}>
                        Visit Channel <ExternalLink size={12} />
                      </a>
                    ) : (
                      <button onClick={() => setActiveTab('edit')} style={{ background: 'transparent', border: 'none', color: '#727278', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                        Configure in Settings <ArrowRight size={12} />
                      </button>
                    )}
                  </div>

                  {/* Twitter Connection */}
                  <div style={{ background: '#111114', border: '1px solid #1c1c1f', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px', transition: 'border 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Twitter size={24} style={{ color: '#1DA1F2' }} />
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: twitterLink ? '#1DA1F2' : '#727278' }}>
                        {twitterLink ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#727278', textTransform: 'uppercase', fontWeight: 'bold' }}>Twitter / X Account</span>
                      <span style={{ display: 'block', fontSize: '13px', color: twitterLink ? '#fff' : '#48484a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500', marginTop: '4px' }}>
                        {twitterLink ? twitterLink.replace(/(^\w+:|^)\/\//, '') : 'No link provided'}
                      </span>
                    </div>
                    {twitterLink ? (
                      <a href={getCleanHref(twitterLink)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1DA1F2', fontWeight: 'bold', textDecoration: 'none', marginTop: '5px' }}>
                        Visit Profile <ExternalLink size={12} />
                      </a>
                    ) : (
                      <button onClick={() => setActiveTab('edit')} style={{ background: 'transparent', border: 'none', color: '#727278', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                        Configure in Settings <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PayPal Secure Booking Section */}
              <div style={{ borderTop: '1px solid #1c1c1f', paddingTop: '30px' }}>
                <div style={{ background: 'linear-gradient(90deg, #111114 0%, #0c0d16 100%)', border: '1px solid #1c1c1f', padding: '30px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>💼 Booking & Collaborations</h3>
                    <p style={{ color: '#727278', fontSize: '13px', margin: '6px 0 0 0', lineHeight: '1.4', maxWidth: '500px' }}>
                      For custom beat arrangements, engineering sessions, or publishing inquiries. Secured with direct client-to-artist routing.
                    </p>
                  </div>
                  <button 
                    id="booking-btn"
                    onClick={() => {
                      setBookingModalOpen(true);
                      if (userAvailableTokens > 0) {
                        setBookingStep(2);
                      } else {
                        setBookingStep(1);
                      }
                    }}
                    style={{ background: '#FFC439', color: '#111', padding: '15px 30px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 99 }}
                  >
                    Contact for Booking
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Booking Funnel Modal (Overrides Layout) */}
      {bookingModalOpen && (
        <div id="booking-modal" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.92)', zIndex: 999999, justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
          
          <div style={{ background: '#18181c', border: '2px solid #FFC439', padding: '35px', borderRadius: '16px', width: '440px', color: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* ==================== SCREEN A: THE PAY-PER-REQUEST RECHARGE GATE ==================== */}
            {bookingStep === 1 && (
              <div id="paywall-step" style={{ display: 'block' }}>
                  <div style={{ background: '#191922', padding: '20px', borderBottom: '1px solid #242432', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px 8px 0 0', margin: '-35px -35px 20px -35px' }}>
                      <div>
                          <h4 style={{ margin: 0, fontSize: '14px', color: '#ff4a4a' }}>⚠️ 0 REQUEST TOKENS REMAINING</h4>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#9292a6' }}>Buy an additional request slot to change your beat path</p>
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4a4a' }}>$69.55</span>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: '#9292a6', lineHeight: 1.5, marginBottom: '20px' }}>
                      Your first initial custom beat request has already been used. To unlock a brand new project revision slot, clear the PayPal processing gateway fee below.
                  </p>

                  {/* Itemized Order Summary Box */}
                  <div style={{ background: '#191922', borderRadius: '8px', padding: '16px', marginBottom: '24px', border: '1px solid #242432' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                          <span style={{ color: '#9292a6' }}>Additional Production Token</span>
                          <span style={{ fontWeight: 600 }}>$69.55</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #242432' }}>
                          <span style={{ color: '#9292a6' }}>Processing Fees / VAT</span>
                          <span style={{ color: '#00e676', fontWeight: 600 }}>$0.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                          <span>Total Due Today:</span>
                          <span style={{ color: '#00e676', fontSize: '16px' }}>$69.55</span>
                      </div>
                  </div>

                  {/* Live PayPal Mount */}
                  <div id="paypal-smart-button-mount" style={{ marginBottom: '15px', position: 'relative', zIndex: 10 }}>
                      <PayPalScriptProvider options={{ clientId: "test", currency: "USD" }}>
                          <PayPalButtons 
                              createOrder={(data, actions) => {
                                  return actions.order.create({
                                      intent: "CAPTURE",
                                      purchase_units: [{
                                          amount: {
                                              value: '69.55',
                                              currency_code: 'USD'
                                          },
                                          description: "Additional Custom Beat Request Token Reload"
                                      }]
                                  });
                              }}
                              onApprove={async (data, actions) => {
                                  if (actions.order) {
                                      const details = await actions.order.capture();
                                      console.log("💰 Payment Cleared! Crediting user profile with 1 token.");
                                      setUserAvailableTokens(1);
                                      setIsReloaded(true);
                                      setBookingStep(2);
                                  }
                              }}
                              onError={(err) => {
                                  console.error("PayPal Processing Halted: ", err);
                                  alert("Checkout initialization encountered a localized network bottleneck.");
                              }}
                              style={{ layout: 'vertical', color: 'gold', shape: 'pill', label: 'checkout' }}
                          />
                      </PayPalScriptProvider>
                  </div>
              </div>
            )}

            {/* ==================== SCREEN B: THE REQUEST MESSAGE WALL ==================== */}
            {bookingStep === 2 && (
              <div id="message-wall-step" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, color: '#00e676', fontSize: '20px' }}>🔓 Message Wall Active</h3>
                      <span id="token-badge" style={{ background: isReloaded ? '#FFC439' : (userAvailableTokens > 0 ? '#00e676' : '#FFC439'), color: '#111', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                          {isReloaded ? 'RELOADED CREDIT UNLOCKED' : (userAvailableTokens > 0 ? `${userAvailableTokens} REQUEST AVAILABLE` : '0 REQUEST TOKENS REMAINING')}
                      </span>
                  </div>
                  
                      {isRequestSent || isSubmitted ? (
                      <div style={{ textAlign: 'center', padding: '30px', background: '#252529', borderRadius: '8px', border: '1px solid #3f3f46', marginTop: '20px' }}>
                          <h3 style={{ color: '#00e676', fontSize: '20px', marginBottom: '10px' }}>Success!</h3>
                          <p style={{ color: '#fff' }}>Your custom beat request has been locked in!</p>
                          <button
                              onClick={() => {
                                  setIsSubmitted(false);
                                  setIsRequestSent(false);
                                  setBookingStep(1);
                                  setContractCheck(false);
                                  setContractSig('');
                                  setClientEmail('');
                                  setBookingModalOpen(false);
                              }}
                              style={{ marginTop: '20px', padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                          >
                              Close
                          </button>
                      </div>
                  ) : (
                      <div style={{}}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>Reference Track URL:</label>
                      <input 
                          type="url" 
                          id="ref-link" 
                          placeholder="YouTube or Spotify link" 
                          required 
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} 
                      />

                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>Target BPM:</label>
                      <input 
                          type="number" 
                          id="bpm-val" 
                          placeholder="e.g., 140" 
                          required 
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} 
                      />

                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>Your Email Address:</label>
                      <input 
                          type="email" 
                          id="client-email" 
                          placeholder="producer@gmail.com" 
                          required 
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} 
                      />

                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>What do you want changed or created? (Details):</label>
                      <textarea 
                          id="project-notes" 
                          placeholder="Be descriptive. Submitting this form consumes 1 request token..." 
                          rows={3} 
                          required 
                          style={{ width: '100%', padding: '12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', marginBottom: '20px', resize: 'none', boxSizing: 'border-box', lineHeight: 1.4 }} 
                      ></textarea>

                      {/* EXPLICIT LEGAL PRO-PAGE CONTRACT CARD SECTION */}
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#FFC439', fontWeight: 'bold' }}>📝 Mandatory Production Agreement:</label>
                      <div style={{ background: '#111116', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px', height: '110px', overflowY: 'scroll', fontSize: '11px', color: '#ccc', lineHeight: 1.5, marginBottom: '15px', boxSizing: 'border-box', fontFamily: 'monospace' }}>
                          <strong>SECTION 1: EXCLUSIVE PRIVACY CLAUSE</strong><br/>
                          Upon delivery of the custom audio track file, the purchasing Client is strictly prohibited from sharing, copying, leaking, sending, or distributing the audio source data to any third-party individuals, web entities, or networks. This audio asset is created solely and exclusively for your personal use.<br/><br/>
                          <strong>SECTION 2: VIOLATION PENALTY & PERMANENT BLACKLIST</strong><br/>
                          If the client attempts to distribute, leak, or share this custom beat asset with anyone else, the Producer reserves the complete right to immediately terminate the project contract. Furthermore, the Client will be permanently banned and restricted from purchasing or acquiring any future custom beats from this studio space indefinitely.
                      </div>

                      {/* Signature Consent Input Elements */}
                      <div style={{ background: '#191922', padding: '12px', borderRadius: '8px', border: '1px solid #242432', marginBottom: '20px' }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer', marginBottom: '10px' }}>
                              <input type="checkbox" id="contract-check" required style={{ marginTop: '2px' }} checked={contractCheck} onChange={(e) => setContractCheck(e.target.checked)} />
                              <span>I agree to the privacy restrictions and understand a leak results in a permanent custom beat ban.</span>
                          </label>
                          <input type="text" id="contract-sig" placeholder="Type Full Legal Name to Sign" required style={{ width: '100%', padding: '8px 12px', background: '#252529', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} value={contractSig} onChange={(e) => setContractSig(e.target.value)} />
                      </div>

                      <button type="button" onClick={handleDirectSubmit} style={{ width: '100%', background: '#4e73df', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                          Sign & Send Request Elements
                      </button>
                  </div>
                  )}
              </div>
            )}

            {/* Failsafe Manual Close Trigger X */}
            <button 
              onClick={() => {
                setBookingModalOpen(false);
                setBookingStep(1);
              }}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#ff4a4a', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {activeTab === 'edit' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* EDIT PROFILE SETTINGS VIEW */}
          <form onSubmit={handleProfileDataPersistence} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }} className="lg:grid-cols-[1fr_320px]">
            
            {/* LEFT COLUMN: FIELDS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Basic Information */}
              <div style={{ background: '#0e0e10', border: '1px solid #1c1c1f', borderRadius: '8px', padding: '25px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 15px 0' }}>Basic Information</h3>
                
                <label style={{ display: 'block', fontSize: '11px', color: '#727278', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Display Name</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  required
                  style={{ width: '100%', background: '#060607', border: '1px solid #1c1c1f', padding: '12px', borderRadius: '6px', color: '#fff', fontSize: '13px', marginBottom: '15px', boxSizing: 'border-box' }} 
                />
                
                <label style={{ display: 'block', fontSize: '11px', color: '#727278', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Bio / Description</label>
                <textarea 
                  value={bioDescription} 
                  onChange={(e) => setBioDescription(e.target.value)} 
                  required
                  style={{ width: '100%', height: '80px', background: '#060607', border: '1px solid #1c1c1f', padding: '12px', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box', resize: 'none' }} 
                />
                
                <label style={{ display: 'block', fontSize: '11px', color: '#727278', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', marginTop: '15px' }}>PayPal Email</label>
                <input 
                  type="email" 
                  value={paypalEmail} 
                  onChange={(e) => setPaypalEmail(e.target.value)} 
                  placeholder="you@example.com"
                  style={{ width: '100%', background: '#060607', border: '1px solid #1c1c1f', padding: '12px', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} 
                />
              </div>

              {/* Social Media Link Connectors */}
              <div style={{ background: '#0e0e10', border: '1px solid #1c1c1f', borderRadius: '8px', padding: '25px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>🌐 Social Media Links</h3>
                <p style={{ color: '#727278', fontSize: '12px', margin: '0 0 15px 0', lineHeight: '1.4' }}>Provide links to your active pages to display them dynamically on your storefront and profile home page.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#727278', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      <Facebook size={14} style={{ color: '#1877F2' }} /> Facebook URL
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. facebook.com/voodooboominofficial" 
                      value={facebookLink}
                      onChange={(e) => setFacebookLink(e.target.value)}
                      style={{ width: '100%', background: '#060607', border: '1px solid #1c1c1f', padding: '12px', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} 
                    />
                  </div>

                   <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#727278', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      <Instagram size={14} style={{ color: '#E4405F' }} /> Instagram URL
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. instagram.com/voodooboomin" 
                      value={instagramLink}
                      onChange={(e) => setInstagramLink(e.target.value)}
                      style={{ width: '100%', background: '#060607', border: '1px solid #1c1c1f', padding: '12px', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#727278', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      <Youtube size={14} style={{ color: '#FF0000' }} /> YouTube Channel URL
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. youtube.com/c/voodooboomin" 
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      style={{ width: '100%', background: '#060607', border: '1px solid #1c1c1f', padding: '12px', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#727278', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      <Twitter size={14} style={{ color: '#1DA1F2' }} /> Twitter / X URL
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. twitter.com/voodooboomin" 
                      value={twitterLink}
                      onChange={(e) => setTwitterLink(e.target.value)}
                      style={{ width: '100%', background: '#060607', border: '1px solid #1c1c1f', padding: '12px', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>
              </div>


            </div>

            {/* RIGHT COLUMN: ARTWORK / SAVE ACTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Image card */}
              <div style={{ background: '#0e0e10', border: '1px solid #1c1c1f', borderRadius: '8px', padding: '25px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 15px 0', textAlign: 'left' }}>Profile Image</h3>
                
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', border: '2px dashed #2d2d30', margin: '0 auto 15px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#060607' }}>
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                  ) : (
                    <span style={{ fontSize: '28px' }}>📷</span>
                  )}
                </div>
                
                <input 
                  type="text" 
                  placeholder="Image URL" 
                  value={profileImageUrl} 
                  onChange={(e) => setProfileImageUrl(e.target.value)} 
                  style={{ width: '100%', background: '#060607', border: '1px solid #1c1c1f', padding: '10px', borderRadius: '6px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} 
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                style={{ 
                  width: '100%', 
                  background: isSaved ? '#00ffcc' : '#5856d6', 
                  color: isSaved ? '#000' : '#fff', 
                  border: 'none', 
                  padding: '14px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  transition: 'background 0.2s', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px' 
                }}
              >
                {isSaved ? '✓ Changes Saved Live' : 'Save Changes'}
              </button>

              {/* Static Live updates hints */}
              <div style={{ background: '#0e0e10', border: '1px dashed #1c1c1f', borderRadius: '8px', padding: '15px', fontSize: '11px', color: '#727278', lineHeight: '1.4' }}>
                💡 <strong>Tip:</strong> Changes saved here will instantly synchronize with the sidebar layout and your public-facing Storefront pages.
              </div>

            </div>

          </form>
        </div>
      )}

    </div>
  );
}
