"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Glass, GlassShadow } from "./Glass";
import { Icon, Logo } from "./Icons";
import { DepthSwitch } from "./Depth";

const NAV = [
  { href: "/explore", label: "Explore", icon: "explore" as const },
  { href: "/restore", label: "Restore", icon: "restore" as const },
  { href: "/you", label: "You", icon: "you" as const },
  { href: "/library", label: "Library", icon: "book" as const },
];

function isOn(path: string, href: string) {
  if (href === "/explore") return path.startsWith("/explore") || path.startsWith("/stories");
  if (href === "/restore") return path.startsWith("/restore") || path.startsWith("/guides");
  return path.startsWith(href);
}

export function SiteHeader() {
  const path = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header">
      {/* desktop: one floating bar of liquid glass */}
      <div className="only-desktop" style={{ position: "absolute", left: 24, right: 24, top: 16, height: 64 }}>
        <GlassShadow radius={22} style={{ inset: 0 }} />
        <Glass as="div" radius={22} bezel={22} thickness={34} blur={6} className="lg-tint" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px 0 18px" }}>
          <Link href="/" className="brand" aria-label="Human Factory Settings, home">
            <Logo size={28} />
            <span className="word">Human Factory Settings</span>
          </Link>
          <nav aria-label="Main" style={{ display: "flex", gap: 2 }}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`nav-link ${isOn(path, n.href) ? "on" : ""}`} aria-current={isOn(path, n.href) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
            <Link href="/films" className={`nav-link ${path.startsWith("/films") ? "on" : ""}`} aria-current={path.startsWith("/films") ? "page" : undefined}>
              Films
            </Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <DepthSwitch />
            <Link className="btn btn-sm" href="/you">
              Find your setting
            </Link>
          </div>
        </Glass>
      </div>

      {/* phone: a quiet top bar that turns to glass once you scroll */}
      <div
        className="only-mobile"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 60,
          padding: "0 12px 0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "rgba(7,8,10,.72)" : "linear-gradient(180deg, rgba(7,8,10,.55), rgba(7,8,10,0))",
          borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
          WebkitBackdropFilter: scrolled ? "blur(18px) saturate(1.2)" : "none",
          backdropFilter: scrolled ? "blur(18px) saturate(1.2)" : "none",
          transition: "background .35s var(--ease), border-color .35s var(--ease)",
        }}
      >
        <Link href="/" className="brand" aria-label="Human Factory Settings, home">
          <Logo size={26} />
          <span className="word" style={{ fontSize: 14 }}>
            Human Factory Settings
          </span>
        </Link>
        <Link href="/films/fig-01" className="icon-btn" aria-label="Watch Fig. 01" style={{ width: 40, height: 40 }}>
          <Icon name="play" size={17} />
        </Link>
      </div>
    </header>
  );
}

export function TabBar() {
  const path = usePathname() || "/";
  return (
    <div className="tabbar">
      <GlassShadow radius={24} style={{ inset: 0 }} />
      <Glass as="nav" radius={24} bezel={22} thickness={34} blur={7} className="lg-tint" aria-label="Main">
        {NAV.map((n) => {
          const on = isOn(path, n.href);
          return (
            <Link key={n.href} href={n.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
              <Icon name={n.icon} size={21} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </Glass>
    </div>
  );
}
