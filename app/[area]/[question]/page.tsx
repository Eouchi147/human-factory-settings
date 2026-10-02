import type { Metadata } from "next";
import { notFound } from "next/navigation";
import s from "@/components/topic/topic.module.css";
import { Breadcrumb } from "@/components/Breadcrumb";
import { byArea } from "@/lib/areas";
import { QUESTIONS, questionFor } from "@/lib/questions";

export const dynamicParams = false;

export function generateStaticParams() {
  return QUESTIONS.map((q) => ({ area: q.meta.area, question: q.meta.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string; question: string }> }): Promise<Metadata> {
  const { area, question } = await params;
  const q = questionFor(area, question);
  if (!q) return {};
  return { title: q.meta.title, description: q.meta.description };
}

export default async function QuestionPage({ params }: { params: Promise<{ area: string; question: string }> }) {
  const { area, question } = await params;
  const q = questionFor(area, question);
  const a = byArea(area);
  if (!q || !a) notFound();
  const { Body } = q;
  return (
    <article className={s.page}>
      <div className={s.col}>
        <Breadcrumb items={[{ label: "Topics", href: "/#fix" }, { label: a.name, href: `/${a.slug}` }]} />
        <h1 className={s.h1}>{q.meta.title}</h1>
        <Body />
      </div>
    </article>
  );
}
