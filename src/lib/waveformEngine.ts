/**
 * Waveform Peak Extraction & Visualization Engine
 * 
 * Non-destructively reads audio data (without altering, compressing, or replacing the original file)
 * and computes normalized amplitude peaks for ultra-smooth waveform scrubbing.
 * Features an intelligent in-memory cache to eliminate redundant computation.
 */

const waveformCache = new Map<string, number[]>();

/**
 * Generate a deterministic, musically realistic waveform for instances where
 * remote CORS or format constraints prevent client-side WebAudio decoding.
 */
export function generateFallbackWaveform(seed: string, count = 64): number[] {
  const cacheKey = `fallback_${seed}_${count}`;
  if (waveformCache.has(cacheKey)) {
    return waveformCache.get(cacheKey)!;
  }

  const bars: number[] = [];
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) + h + seed.charCodeAt(i);
  }

  // Generate dynamic dynamic-range envelope with intro, drop, verse, hook contours
  for (let i = 0; i < count; i++) {
    h = (h * 33) & 0x7fffffff;
    const progress = i / count;
    
    // Musical energy envelope contour (intro -> build -> drop -> breakdown -> hook -> outro)
    const energyEnvelope = 
      progress < 0.15 
        ? 0.35 + 0.4 * (progress / 0.15) // intro build
        : progress < 0.5 
        ? 0.75 + 0.25 * Math.sin(progress * Math.PI * 4) // heavy verse / drop
        : progress < 0.65 
        ? 0.45 + 0.2 * Math.cos(progress * Math.PI * 2) // breakdown
        : 0.8 + 0.2 * Math.sin(progress * Math.PI * 3); // climax hook

    const noise = (h % 35) / 100;
    const amplitude = Math.min(100, Math.max(15, Math.round((energyEnvelope * 70 + noise * 30))));
    bars.push(amplitude);
  }

  waveformCache.set(cacheKey, bars);
  return bars;
}

/**
 * Extracts true normalized audio peaks from an audio URL.
 * Falls back gracefully to deterministic waveform if CORS or decode fails.
 */
export async function getWaveformData(
  audioUrl: string | undefined, 
  seedId: string, 
  count = 64
): Promise<number[]> {
  if (!audioUrl) {
    return generateFallbackWaveform(seedId, count);
  }

  const cacheKey = `url_${audioUrl}_${count}`;
  if (waveformCache.has(cacheKey)) {
    return waveformCache.get(cacheKey)!;
  }

  // Try decoding real audio peaks in background
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      return generateFallbackWaveform(seedId, count);
    }

    // Only attempt fetch if same-origin, blob, or data URL to prevent unnecessary CORS errors in dev console
    const isLocalOrBlob = audioUrl.startsWith('blob:') || audioUrl.startsWith('data:') || audioUrl.startsWith('/');
    if (!isLocalOrBlob && !audioUrl.includes(window.location.hostname)) {
      return generateFallbackWaveform(seedId, count);
    }

    const response = await fetch(audioUrl, { mode: 'cors' });
    if (!response.ok) {
      return generateFallbackWaveform(seedId, count);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new AudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / count);
    const peaks: number[] = [];

    let maxPeak = 0.001;
    for (let i = 0; i < count; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += Math.abs(channelData[j]);
      }
      const avg = sum / (end - start || 1);
      peaks.push(avg);
      if (avg > maxPeak) maxPeak = avg;
    }

    // Normalize to 15..95 range
    const normalized = peaks.map(p => Math.min(95, Math.max(15, Math.round((p / maxPeak) * 80 + 15))));
    waveformCache.set(cacheKey, normalized);
    
    // Close context
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }

    return normalized;
  } catch (err) {
    // Non-fatal: fallback to deterministic waveform
    const fallback = generateFallbackWaveform(seedId, count);
    waveformCache.set(cacheKey, fallback);
    return fallback;
  }
}
