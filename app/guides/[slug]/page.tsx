import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import s from "../guides.module.css";
import { GUIDES, loadGuide } from "@/lib/guides";
import { Icon } from "@/components/Icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = loadGuide(slug);
  if (!g) return {};
  return { title: `${g.title}, the deep guide`, description: g.lede };
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
              On this page
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
                  Restore
                </Link>
                <span aria-hidden="true">/</span>
                <span>Deep guide</span>
              </nav>
              <h1 className="h1">
                {g.title} <span className="serif">the deep guide.</span>
              </h1>
              <p className="lede">{g.lede}</p>
              <div className="banner">
                <Icon name="flag" size={18} style={{ flex: "none", marginTop: 2, color: "var(--signal-ink)" }} />
                <span>
                  <b>Draft for expert review.</b> General education, not personal medical advice. Every guide is reviewed by a licensed health professional before
                  launch; this one is waiting for that review. Checked against its sources on {g.checked}.
                </span>
              </div>
              <details className={`glass ${s.tocMobile}`}>
                <summary>
                  <span className="cap">On this page · {g.toc.length} sections</span>
                  <Icon name="menu" size={18} />
                </summary>
                <nav>
                  {g.toc.map((t) => (
                    <a key={t.id} href={`#${t.id}`}>
                      {t.text}
                    </a>
                  ))}
                </nav>
              </details>
            </header>
            <div className="prose" dangerouslySetInnerHTML={{ __html: g.html }} />
            <Link href={`/guides/${other.slug}`} className="card card-pad" style={{ marginTop: 48, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span className="stack gap-6">
                <span className="kick" style={{ fontSize: 10 }}>
                  The other deep guide
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
