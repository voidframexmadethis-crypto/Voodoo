# Voodoo Boomin — Independent Dark Trap Beat Store & Music Platform

Voodoo Boomin is a full-stack e-commerce and music storefront designed for dark trap beat producers, artists, and sound designers. It features an interactive beat catalog, continuous audio playback engine, customizable licensing options, Beat Pack bundles, producer feed updates, and an integrated music professionals directory.

## Features

- **Interactive Beat Catalog**: High-performance audio player with real-time waveform visualization, BPM & key filtering, and category browsing.
- **Continuous Audio Engine**: Seamless audio queue management, continuous background playback across navigation, volume controls, and track previewing.
- **Beat Packs & Bundles**: Multi-track instrumental collections with ZIP stem downloads and "What's Inside" interactive track list previews.
- **Dynamic Pricing & Licensing**: Interactive license tier selection (MP3 Lease, WAV Lease, Premium Lease, Unlimited Lease, Exclusive Rights) with direct cart and instant checkout integration.
- **Producer Feed**: Studio updates, beat drops, video embeds, and pinned announcements directly from Voodoo Boomin.
- **Music Professionals Directory**: Direct connect directory for mixing engineers, A&R labels, recording engineers, playlist curators, and promotion agencies.
- **Producer Hub / Admin Interface**: Comprehensive management portal for beat uploads, ZIP stem processing, catalog organization, and analytics tracking.

## Architecture & Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons
- **Backend**: Node.js, Express server with API routes for persistent storage and metadata management
- **Audio Engine**: Web Audio API & HTML5 Audio with global playback context
- **Deployment**: Production-ready Express static file serving with bundled server build

## Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file based on `.env.example`:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Build & Execution**:
   ```bash
   npm run build
   npm start
   ```

