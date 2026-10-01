/** Times the way the films say them: "11 p.m.", "6:30 a.m.", "midnight". h is hours since midnight (may run past 24). */
export function clock12(h: number) {
  const t = ((h % 24) + 24) % 24;
  let hr = Math.floor(t);
  let mm = Math.round((t - hr) * 60);
  if (mm === 60) {
    hr = (hr + 1) % 24;
    mm = 0;
  }
  if (hr === 0 && mm === 0) return "midnight";
  if (hr === 12 && mm === 0) return "noon";
  const suffix = hr < 12 ? "a.m." : "p.m.";
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return mm ? `${h12}:${String(mm).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
}
