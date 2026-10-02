import Link from "next/link";

export type Crumb = { label: string; href: string };

/** The one breadcrumb used on every page: the pages above this one, as links (the page's own title is its h1). */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="crumbs">
        {items.map((c) => (
          <li key={c.href}>
            <Link href={c.href}>{c.label}</Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
