import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  src: string;
  title?: string;
  className?: string;
};

export default function TrackPlayer({ src, title, className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // 0..1

  const canPlay = useMemo(() => typeof src === "string" && src.length > 0, [src]);

  useEffect(() => {
    setError(null);
    setIsBuffering(false);
    setProgress(0);

    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    // Important: assign source without recreating the player
    audio.src = src;
    audio.load();
  }, [src, canPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onError = () => setError(`Playback error (code: ${audio.error?.code ?? "unknown"})`);
    const onTimeUpdate = () => {
      const dur = audio.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      setProgress(Math.min(1, Math.max(0, audio.currentTime / dur)));
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      setError(null);
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (e: any) {
      setError(e?.message ?? "Autoplay/play failed");
    }
  };

  const onSeek: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration;
    if (!Number.isFinite(dur) || dur <= 0) return;

    audio.currentTime = dur * Number(e.target.value);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <button 
          onClick={toggle} 
          disabled={!canPlay}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-lg text-white font-medium transition-colors cursor-pointer"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <div className="flex-1 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={onSeek}
            aria-label="Seek"
            className="w-full accent-indigo-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
          {isBuffering ? <span className="text-xs text-neutral-400 animate-pulse">Buffering…</span> : null}
        </div>
      </div>

      <audio ref={audioRef} preload="metadata" />

      {title ? <div className="mt-2 text-sm text-neutral-400 font-medium">{title}</div> : null}
      {error ? <div className="mt-2 text-sm text-red-500 font-medium">{error}</div> : null}
    </div>
  );
}
