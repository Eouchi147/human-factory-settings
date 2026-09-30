import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import s from "../body.module.css";
import { SYSTEMS, bySlug } from "@/lib/systems";
import { Ev, Measured } from "@/components/Evidence";
import { DepthSwitch, DepthText } from "@/components/Depth";
import { SpecFigure } from "@/components/SpecFigure";
import { Icon } from "@/components/Icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return SYSTEMS.map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const x = bySlug(slug);
  if (!x) return {};
  return { title: `${x.name}, ${x.tagline}`, description: x.card };
}

export default async function SystemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const x = bySlug(slug);
  if (!x) notFound();

  return (
    <div className="page-top">
      <div className="wrap">
        <div className={s.sheet}>
          <div className={s.figWrap}>
            <SpecFigure
              img={x.img}
              imgW={x.imgW}
              imgH={x.imgH}
              alt={x.alt}
              alt2={x.alt2}
              dims={x.dims}
              callouts={x.callouts}
              className={s.fig}
              toggleClassName={s.toggle}
            />
          </div>

          <section className={s.side} aria-labelledby="sys-name">
            <nav className={`cap ${s.crumb}`} aria-label="Breadcrumb">
              <Link href="/body">Your body</Link>
              <span aria-hidden="true">/</span>
              <span>{x.group}</span>
              <span aria-hidden="true">/</span>
              <span style={{ color: "var(--ink2)" }}>{x.name}</span>
            </nav>
            <div className={s.titleRow}>
              <div className="kick">{x.group}</div>
              <DepthSwitch />
            </div>
            <h1 id="sys-name" className={s.name}>
              <span className={s.n}>{x.name}</span>
              <span className={s.t}>{x.tagline}</span>
            </h1>
            <DepthText className={s.depthText} simple={x.simple} clear={x.clear} expert={x.expert} />
            <div>
              {x.rows.map((r) => (
                <div key={r.k} className="spec-row">
                  <div>
                    <div className="k">{r.k}</div>
                    <div className="v">{r.v}</div>
                  </div>
                  <div>
                    {r.measured ? (
                      <Measured text="Measured" />
                    ) : r.calc ? (
                      <span className="ms">
                        <span>{r.calc}</span>
                      </span>
                    ) : r.ev !== undefined ? (
                      <Ev level={r.ev} text={r.evText} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {x.related?.map((r) => (
              <Link key={r.href} href={r.href} className={`glass ${s.related}`}>
                <span className="stack gap-6">
                  <span className="kick" style={{ fontSize: 10 }}>
                    {r.kicker}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 620 }}>{r.title}</span>
                </span>
                <Icon name="arrow" size={18} />
              </Link>
            ))}
            <p className="cap" style={{ margin: 0, lineHeight: 1.7, textTransform: "none", letterSpacing: ".02em" }}>
              Sources:{" "}
              {x.sources.map((src, i) => (
                <span key={src.label}>
                  {i > 0 ? " · " : null}
                  {src.href ? (
                    <a href={src.href} target="_blank" rel="noopener noreferrer">
                      {src.label}
                    </a>
                  ) : (
                    src.label
                  )}
                </span>
              ))}
              . 3D body: BodyParts3D, CC BY 4.0.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
