"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CUES, FILM } from "@/lib/film";
import { Icon } from "./Icons";

/** The short film with a live list of the parts: the one landing now is lit, and tapping a part jumps to it. */
export function FilmPlayer({ videoClass, sheetClass, sideClass, header }: { videoClass: string; sheetClass: string; sideClass?: string; header?: ReactNode }) {
  const v = useRef<HTMLVideoElement>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = v.current;
    if (!el) return;
    el.muted = true;
    let raf = 0;
    const loop = () => {
      setT(el.currentTime);
      raf = requestAnimationFrame(loop);
    };
    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
      setT(el.currentTime);
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.play().catch(() => {});
      else el.pause();
    }, { threshold: 0.3 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  const seek = (to: number) => {
    const el = v.current;
    if (!el) return;
    el.currentTime = Math.max(0, to);
    el.play().catch(() => {});
  };
  const L = FILM.length;
  // the part landing now, or the last one that landed
  const now = [...CUES].reverse().find((c) => t >= c.t0 - 0.05) ?? null;

  return (
    <>
      <div className={videoClass}>
        <video ref={v} src={FILM.src} poster={FILM.poster} muted loop playsInline preload="auto" aria-label="A 3D human body puts itself together: bones first, then the organs, then the blood vessels" />
        <div className="film-ctl">
          <button type="button" className="icon-btn" aria-label={playing ? "Pause" : "Play"} onClick={() => (playing ? v.current?.pause() : v.current?.play().catch(() => {}))}>
            <Icon name={playing ? "pause" : "play"} size={18} />
          </button>
          <button type="button" className="icon-btn" aria-label="Start again" onClick={() => seek(0)}>
            <Icon name="redo" size={18} />
          </button>
          {now ? <span className="film-now">{now.n}</span> : null}
        </div>
      </div>

      <div className={sideClass}>
        {header}
        <div className={`glass ${sheetClass}`}>
          <div className="film-sheet-head">
            <span className="kick" style={{ fontSize: 10.5 }}>
              What you&apos;ll see
            </span>
            <span className="cap" style={{ textTransform: "none", letterSpacing: ".02em" }}>
              Tap a part to jump to it
            </span>
          </div>
          <div className="film-caption" aria-live="polite">
            {now ? (
              <>
                <b>{now.n}.</b> {now.d}
              </>
            ) : (
              "Press play to start."
            )}
          </div>
          <div style={{ position: "relative" }}>
            <div className="cue-track-area">
              <div className="cue-head" style={{ left: `${(Math.min(t, L) / L) * 100}%` }}>
                <b />
              </div>
            </div>
            {CUES.map((c) => {
              const state = t >= c.t0 && t <= c.t1 + 0.25 ? "on" : t > c.t1 + 0.25 ? "done" : "";
              return (
                <button key={c.n} type="button" className={`cue ${state}`} onClick={() => seek(c.t0 - 0.3)} aria-label={`Jump to ${c.n}: ${c.d}`}>
                  <span className="nm">{c.n}</span>
                  <span className="tr">
                    <i />
                    <span className="bar" style={{ left: `${(c.t0 / L) * 100}%`, width: `${((c.t1 - c.t0) / L) * 100}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
