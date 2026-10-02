"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Glass, GlassShadow } from "./Glass";
import { Icon, Logo } from "./Icons";

const AREA_PATHS = ["/sleep-energy", "/weight-food", "/fitness-strength", "/posture-looks", "/stress-mood", "/habits-focus", "/connection-purpose", "/your-body", "/body", "/stories", "/guides", "/feel-better"];

const NAV = [
  { href: "/", label: "Home", short: "Home", icon: "you" as const },
  { href: "/#fix", label: "Topics", short: "Topics", icon: "layers" as const },
  { href: "/tools", label: "Tools", short: "Tools", icon: "dial" as const },
  { href: "/watch", label: "Watch", short: "Watch", icon: "play" as const },
];

function isOn(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/#fix") return AREA_PATHS.some((p) => path.startsWith(p));
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
            {NAV.filter((n) => n.href !== "/").map((n) => (
              <Link key={n.href} href={n.href} className={`nav-link ${isOn(path, n.href) ? "on" : ""}`} aria-current={isOn(path, n.href) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/how-we-check"
            className={`nav-link ${path.startsWith("/how-we-check") ? "on" : ""}`}
            aria-current={path.startsWith("/how-we-check") ? "page" : undefined}
            style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            <Icon name="check" size={15} />
            How we check facts
          </Link>
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
              <span>{n.short}</span>
            </Link>
          );
        })}
      </Glass>
    </div>
  );
}
