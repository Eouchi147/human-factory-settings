"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CUES, FILM } from "@/lib/film";
import { Icon } from "./Icons";

/** The Fig. 01 short with its cue sheet: every row is a part of the body, timed exactly as the renderer places it. */
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

  return (
    <>
      <div className={videoClass}>
        <video
          ref={v}
          src={FILM.src}
          poster={FILM.poster}
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Fig. 01, How you were built: the reference body assembles itself in one continuous shot"
        />
        <div className="film-ctl">
          <button type="button" className="icon-btn" aria-label={playing ? "Pause" : "Play"} onClick={() => (playing ? v.current?.pause() : v.current?.play().catch(() => {}))}>
            <Icon name={playing ? "pause" : "play"} size={18} />
          </button>
          <button type="button" className="icon-btn" aria-label="Restart" onClick={() => seek(0)}>
            <Icon name="redo" size={18} />
          </button>
          <span className="mono film-tc">{t.toFixed(1)} s</span>
        </div>
      </div>

      <div className={sideClass}>
      {header}
      <div className={`glass ${sheetClass}`}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
          <div className="kick" style={{ fontSize: 10 }}>
            The cascade · each part starts before the last one lands
          </div>
          <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            {t.toFixed(1)} s
          </span>
        </div>
        <div className="cue-scale">
          {[0, 3, 6, 9, 12, 15, 18].map((x) => (
            <span key={x} className="cap" style={{ left: `${(x / L) * 100}%` }}>
              {x}
            </span>
          ))}
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
              <button key={c.n} type="button" className={`cue ${state}`} onClick={() => seek(c.t0 - 0.3)} aria-label={`Jump to ${c.n}`}>
                <span className="nm">{c.n}</span>
                <span className="tr">
                  <i />
                  <span className="bar" style={{ left: `${(c.t0 / L) * 100}%`, width: `${((c.t1 - c.t0) / L) * 100}%` }} />
                </span>
                <span className="tg">{c.tag}</span>
              </button>
            );
          })}
        </div>
        <div className="cap" style={{ marginTop: 10, textTransform: "none", letterSpacing: ".02em" }}>
          Tap a row to jump there. Timings are the renderer&apos;s own.
        </div>
      </div>
      </div>
    </>
  );
}
