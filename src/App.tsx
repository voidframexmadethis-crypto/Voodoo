import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import Layout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Videos from './pages/Videos';
import Player from './pages/Player';
import Storefront from './pages/Storefront';
import Uploader from './pages/Uploader';
import Admin from './pages/Admin';
import AdminPortal from './pages/AdminPortal';
import EnterpriseMusicPlatform from './pages/Enterprise';
import Services from './pages/Services';
import TopCharts from './pages/TopCharts';

class GlobalErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("GLOBAL ERROR CAUGHT:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-4xl font-bold mb-4 text-indigo-500">Something went wrong.</h1>
          <p className="text-neutral-400 mb-8">The application encountered an unexpected error. We've been notified.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-bold transition-all"
          >
            Return to Safety
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const VOODOO_BOOMIN_STREAM_VARIABLES = {
  previewAudio: '',
  musicAssets: []
};
export const KRYPSIDE_STREAM_VARIABLES = VOODOO_BOOMIN_STREAM_VARIABLES;

export default function App() {
  useEffect(() => {
    let visitorId = localStorage.getItem('VOODOO_BOOMIN_VISITOR_ID') || localStorage.getItem('KRYPSIDE_VISITOR_ID');
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('VOODOO_BOOMIN_VISITOR_ID', visitorId);
      localStorage.setItem('KRYPSIDE_VISITOR_ID', visitorId);
    }
    let sessionId = sessionStorage.getItem('VOODOO_BOOMIN_SESSION_ID') || sessionStorage.getItem('KRYPSIDE_SESSION_ID');
    if (!sessionId) {
      sessionId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('VOODOO_BOOMIN_SESSION_ID', sessionId);
      sessionStorage.setItem('KRYPSIDE_SESSION_ID', sessionId);
    }
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, sessionId })
    }).catch(err => console.error('Visit log error:', err));
  }, []);

  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <AnalyticsTracker />
          <AudioPlayerProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Storefront />} />
                <Route path="profile" element={<Profile />} />
                <Route path="artist-profile" element={<Profile />} />
                <Route path="home" element={<Home />} />
                <Route path="videos" element={<Videos />} />
                <Route path="player" element={<Player />} />
                <Route path="player/:track" element={<Player />} />
                <Route path="beat/:id" element={<Player />} />
                <Route path="beats/:id" element={<Player />} />
                <Route path="track/:id" element={<Player />} />
                <Route path="music/:id" element={<Player />} />
                <Route path="storefront" element={<Storefront />} />
                <Route path="admin-portal" element={<AdminPortal />} />
                <Route path="upload" element={<Uploader />} />
                <Route path="uploader" element={<Uploader />} />
                <Route path="admin" element={<Admin />} />
                <Route path="services" element={<Services />} />
                <Route path="enterprise" element={<Services />} />
                <Route path="top-charts" element={<TopCharts />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AudioPlayerProvider>
      </StoreProvider>
    </AuthProvider>
    </GlobalErrorBoundary>
  );
}
