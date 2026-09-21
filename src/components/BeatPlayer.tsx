import React, { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

export interface Beat {
  id?: string;
  title?: string;
  url: string;
}

interface BeatPlayerProps {
  beats?: Beat[];
  onDelete?: (beat: Beat) => void;
}

export default function BeatPlayer({ beats = [], onDelete }: BeatPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const safeBeats = useMemo(() => beats ?? [], [beats]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const current = safeBeats[index];

  function setAudioSourceAndPlay(nextIndex: number) {
    if (!safeBeats.length) return;
    const n = (nextIndex + safeBeats.length) % safeBeats.length;
    setIndex(n);
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = safeBeats[n].url;
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.then === "function") {
      p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(true);
    }
  }

  function playBeatAt(i: number) {
    setAudioSourceAndPlay(i);
  }

  function previousBeat() {
    setAudioSourceAndPlay(index - 1);
  }

  function nextBeat() {
    setAudioSourceAndPlay(index + 1);
  }

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setAudioSourceAndPlay(index + 1);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [index, safeBeats.length]);

  useEffect(() => {
    if (!safeBeats.length) setIndex(0);
    else setIndex((i) => Math.min(Math.max(i, 0), safeBeats.length - 1));
  }, [safeBeats]);

  const handleDelete = (b: Beat, i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(b);
  };

  return (
    <div style={{ maxWidth: 720, padding: 16 }}>
      <audio ref={audioRef} preload="metadata" />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={previousBeat} disabled={!safeBeats.length}>◀ Previous</button>
        <button onClick={togglePlayPause} disabled={!safeBeats.length}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={nextBeat} disabled={!safeBeats.length}>Next ▶</button>
        {current && onDelete && (
          <button 
             onClick={(e) => handleDelete(current, index, e)} 
             disabled={!safeBeats.length}
             style={{ display: "flex", alignItems: "center", gap: 4, color: "red", padding: '0 8px', background: 'transparent', border: '1px solid red', borderRadius: 4, cursor: 'pointer' }}
             title="Delete current beat"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div><b>Now playing:</b> {current?.title ?? "None"}</div>
      </div>

      <div>
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>All beats</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {safeBeats.map((b, i) => {
            const active = i === index;
            return (
              <li key={b.id ?? b.url ?? i} style={{ marginBottom: 6, display: 'flex', gap: 4 }}>
                <button
                  onClick={() => playBeatAt(i)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    padding: "8px 10px",
                    background: active ? "#eef6ff" : "#f5f5f5",
                    border: active ? "1px solid #3b82f6" : "1px solid #ddd",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  {b.title ?? `Beat ${i + 1}`}
                  {active ? "  (playing)" : ""}
                </button>
                {onDelete && (
                  <button 
                    onClick={(e) => handleDelete(b, i, e)}
                    style={{ padding: '8px', color: 'red', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    title="Delete beat"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
