import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import s from "@/components/topic/topic.module.css";
import { AREAS, byArea } from "@/lib/areas";
import { Icon } from "@/components/Icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return AREAS.map((a) => ({ area: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params;
  const a = byArea(area);
  if (!a) return {};
  return { title: a.name, description: a.intro };
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const a = byArea(area);
  if (!a) notFound();
  return (
    <div className={s.page}>
      <div className={s.col}>
        <nav className={s.crumb} aria-label="Breadcrumb">
          <Link href="/#fix">Topics</Link>
          <span aria-hidden="true">/</span>
          <span>{a.name}</span>
        </nav>
        <h1 className={s.h1}>{a.name}</h1>
        <p className={s.answer}>{a.intro}</p>
        <div className={`glass ${s.fact}`}>
          <span className={s.factK}>Did you know?</span>
          <p className={s.factT}>{a.fact}</p>
          <span className={s.factS}>
            Source:{" "}
            <a href={a.source.href} target="_blank" rel="noopener noreferrer">
              {a.source.label}
            </a>
          </span>
        </div>
        {a.start?.length ? (
          <div className={s.start}>
            <span className={s.startK}>Start here</span>
            <ul className={s.hubList}>
              {a.start.map((x) => (
                <li key={x.href}>
                  <Link href={x.href} className={s.hubItem}>
                    <span className={s.hubQ}>{x.label}</span>
                    <span className={s.hubGo}>
                      <Icon name="arrow" size={20} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <ul className={s.hubList}>
          {a.questions.map((q) =>
            q.slug ? (
              <li key={q.q}>
                <Link href={`/${a.slug}/${q.slug}`} className={s.hubItem}>
                  <span>
                    <span className={s.hubQ}>{q.q}</span>
                    {q.hook ? <span className={s.hubHook}>{q.hook}</span> : null}
                  </span>
                  <span className={s.hubGo}>
                    <Icon name="arrow" size={20} />
                  </span>
                </Link>
              </li>
            ) : (
              <li key={q.q}>
                <div className={s.hubItem}>
                  <span className={s.hubQ} style={{ color: "var(--ink2)" }}>
                    {q.q}
                  </span>
                  <span className={s.hubSoon}>Soon</span>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
