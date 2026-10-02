import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import s from "../guides.module.css";
import { GUIDES, loadGuide } from "@/lib/guides";
import { Icon } from "@/components/Icons";
import { WaistCheck } from "@/components/tools/WaistCheck";
import { ProteinCheck } from "@/components/tools/ProteinCheck";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = loadGuide(slug);
  if (!g) return {};
  return { title: g.short, description: g.plain };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = loadGuide(slug);
  if (!g) notFound();
  const other = GUIDES.find((x) => x.slug !== slug)!;

  return (
    <div className="page-top">
      <div className="wrap">
        <div className={s.layout}>
          <aside className={s.toc} aria-label="On this page">
            <span className="cap" style={{ padding: "0 10px 8px" }}>
              In the full guide
            </span>
            {g.toc.map((t) => (
              <a key={t.id} href={`#${t.id}`}>
                {t.text}
              </a>
            ))}
          </aside>
          <article>
            <header className={s.head}>
              <nav className="cap" aria-label="Breadcrumb" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/feel-better" style={{ color: "var(--ink3)", textDecoration: "none" }}>
                  Feel better
                </Link>
                <span aria-hidden="true">/</span>
                <span>Guide</span>
              </nav>
              <h1 className="h1">
                {g.h1[0]} <span className="serif">{g.h1[1]}</span>
              </h1>
              <p className="lede">{g.plain}</p>
              <div className="banner">
                <Icon name="flag" size={18} style={{ flex: "none", marginTop: 2, color: "var(--signal-ink)" }} />
                <span>
                  <b>Draft.</b> A licensed health professional will check this guide before the site goes public. It&apos;s for learning and does not replace your
                  doctor. Facts checked against their sources on {g.checked}.
                </span>
              </div>
            </header>

            <section className={`card ${s.short}`} aria-labelledby="short">
              <h2 id="short" className="h3" style={{ margin: 0 }}>
                The short version
              </h2>
              <ol>
                {g.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            </section>

            <section id="checks" className="stack gap-12" style={{ margin: "28px 0 48px", scrollMarginTop: 90 }} aria-label="Quick checks">
              <span className="cap">Quick checks</span>
              <div className={slug === "weight" ? "tools-2" : undefined}>
                {slug === "weight" ? <WaistCheck /> : null}
                <ProteinCheck />
              </div>
            </section>

            <div className={s.fullHead}>
              <h2 className="h2" style={{ margin: 0 }}>
                The full guide, <span className="serif">every study included.</span>
              </h2>
              <p className="lede" style={{ margin: 0 }}>
                For when you want the numbers. Each claim shows how strong its evidence is and links to its source.
              </p>
              <details className={`glass ${s.tocMobile}`}>
                <summary>
                  <span className="cap">In the full guide · {g.toc.length} sections</span>
                  <Icon name="menu" size={18} />
                </summary>
                <nav aria-label="In the full guide">
                  {g.toc.map((t) => (
                    <a key={t.id} href={`#${t.id}`}>
                      {t.text}
                    </a>
                  ))}
                </nav>
              </details>
            </div>
            <div className="prose" dangerouslySetInnerHTML={{ __html: g.html }} />
            <Link href={`/guides/${other.slug}`} className="card card-pad" style={{ marginTop: 48, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span className="stack gap-6">
                <span className="kick" style={{ fontSize: 10 }}>
                  The other guide
                </span>
                <span className="h3">{other.short}</span>
              </span>
              <Icon name="arrow" size={20} />
            </Link>
          </article>
        </div>
      </div>
    </div>
  );
}
