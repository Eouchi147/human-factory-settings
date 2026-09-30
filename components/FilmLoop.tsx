"use client";

import { useEffect, useRef } from "react";

/** A silent looping film that plays only while it is on screen. */
export function FilmLoop({ src, poster, label, className, style }: { src: string; poster: string; label: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} className={className} style={style} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} />;
}
