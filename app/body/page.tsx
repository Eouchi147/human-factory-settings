import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import s from "./body.module.css";
import { SYSTEMS } from "@/lib/systems";
import { Measured } from "@/components/Evidence";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/Icons";
import { BLUR } from "@/lib/blur";

export const metadata: Metadata = {
  title: "How your body works",
  description: "How your body works, one part at a time: plain words, real 3D pictures, and the science underneath.",
};

export default function ExplorePage() {
  const systems = SYSTEMS.filter((x) => x.inExplore);
  const organs = SYSTEMS.filter((x) => !x.inExplore);
  return (
    <div className="page-top">
      <div className="wrap stack gap-32">
        <header className={s.head}>
          <div className="kick a-in">Your body</div>
          <h1 className="h1 a-in a-d1">
            How your body works, <span className="serif">one part at a time.</span>
          </h1>
          <p className="lede a-in a-d2">
            Pick a part. Each page explains what it does in plain words, with real 3D pictures. Every picture comes from the same 3D body, so the sizes fit together: the
            12.5 cm heart sits in the chest of a body 1.73 m tall.
          </p>
        </header>

        <div className={s.grid}>
          {systems.map((x, i) => (
            <Reveal key={x.slug} delay={(i % 3) * 0.06}>
              <Link href={`/body/${x.slug}`} className={`card ${s.card}`}>
                <div className={s.cardImg}>
                  <Image src={x.img} alt={x.alt} fill sizes="(min-width: 1040px) 33vw, (min-width: 640px) 50vw, 100vw" placeholder="blur" blurDataURL={BLUR[x.img]} style={{ objectFit: "cover", objectPosition: "50% 35%" }} />
                </div>
                <div className={s.cardBody}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div className="kick">{x.group}</div>
                    <Measured text="Real sizes" />
                  </div>
                  <div className="h3">{x.name}</div>
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "var(--ink2)" }}>{x.card}</p>
                  <div>
                    {x.cardRows.map(([k, v]) => (
                      <div key={k} className={s.cardRow}>
                        <span style={{ color: "var(--ink3)" }}>{k}</span>
                        <span className="mono" style={{ fontWeight: 600, color: "var(--ink)" }}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <section className="stack gap-16" style={{ marginTop: 24 }}>
          <div className="kick">Close-ups</div>
          <div className={s.organs}>
            {organs.map((x) => (
              <Link key={x.slug} href={`/body/${x.slug}`} className={`card ${s.organ}`}>
                <div className={s.organImg}>
                  <Image src={x.img} alt={x.alt} fill sizes="120px" placeholder="blur" blurDataURL={BLUR[x.img]} style={{ objectFit: "cover" }} />
                </div>
                <div className="stack gap-6">
                  <span className="h3">
                    {x.name} <span className="serif" style={{ color: "var(--signal-ink)", fontSize: 20 }}>{x.tagline}</span>
                  </span>
                  <span style={{ fontSize: 14, color: "var(--ink3)" }}>{x.card}</span>
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink2)" }}>
                    {x.cardRows[0][0]} · <span style={{ color: "var(--ink)" }}>{x.cardRows[0][1]}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="stack gap-16" style={{ marginTop: 8 }}>
          <div className="kick">Stories</div>
          <Link href="/stories/why-you-wake-up-tired" className="card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span className="stack gap-6">
              <span className="h3">Why you wake up tired</span>
              <span style={{ fontSize: 14, color: "var(--ink3)" }}>Six short steps, from the chemical that makes you sleepy to the coffee that hides it.</span>
            </span>
            <span style={{ color: "var(--signal-ink)" }}>
              <Icon name="arrow" size={20} />
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
}
