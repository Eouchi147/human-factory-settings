import fs from "node:fs";
import path from "node:path";
import { Marked, type Tokens } from "marked";

export type Guide = { slug: string; title: string; short: string; lede: string; html: string; toc: { id: string; text: string }[]; checked: string };

export const GUIDES = [
  { slug: "weight", file: "weight.md", short: "Weight management" },
  { slug: "supplements", file: "supplements.md", short: "Supplements and nutrition" },
] as const;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const LEVELS: [RegExp, number, string?][] = [
  [/^No evidence of benefit/, -1, "No proof it works"],
  [/^Harm signal/, -1, "Harm signal"],
  [/^Not a scientific term/, -1, "Not a scientific term"],
  [/^Strong/, 4],
  [/^Good/, 3],
  [/^Some/, 2],
  [/^Early/, 1],
];

function chip(level: number, text: string) {
  const cls = level === -1 ? "ev ev-x" : `ev ev-${level}`;
  return `<span class="${cls}"><span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${text}</span></span>`;
}

/** Turns the first words of an Evidence cell into a chip and keeps the explanation after it. */
function evidenceCell(html: string) {
  for (const [re, level, fixed] of LEVELS) {
    if (!re.test(html)) continue;
    if (fixed) {
      const rest = html.replace(re, "").replace(/^[.:,;]?\s*/, "");
      return chip(level, fixed) + (rest ? ` <span class="ev-rest">${rest}</span>` : "");
    }
    const m = html.match(/^(Strong|Good|Some|Early)(\s+evidence)?/);
    const word = m ? m[1] : "";
    let rest = html.slice(m ? m[0].length : 0).replace(/^[.:,;]?\s*/, "");
    if (m && m[2] && rest.startsWith("against")) rest = "evidence " + rest;
    return chip(level, word) + (rest ? ` <span class="ev-rest">${rest}</span>` : "");
  }
  return html;
}

function verdictCell(html: string) {
  const t = html.replace(/<[^>]+>/g, "").trim().toLowerCase();
  const bad = ["false", "mostly false"];
  const cls = bad.includes(t) ? "verdict bad" : "verdict";
  return `<span class="${cls}">${html}</span>`;
}

export function loadGuide(slug: string): Guide | null {
  const meta = GUIDES.find((g) => g.slug === slug);
  if (!meta) return null;
  const raw = fs.readFileSync(path.join(process.cwd(), "content", "guides", meta.file), "utf8");
  const lines = raw.split("\n");
  const title = lines[0].replace(/^#\s+/, "").replace(/\s*·\s*the deep guide\s*$/i, "").trim();
  // drop the title, the date and byline line, keep the intro paragraph as the lede
  let i = 1;
  while (i < lines.length && (lines[i].trim() === "" || /^\w{3} \d{1,2}, \d{4}/.test(lines[i].trim()))) i++;
  const lede = lines[i].trim();
  const body = lines.slice(i + 1).join("\n");
  const checkedMatch = raw.match(/Checked (\d{1,2} \w+ \d{4})/);

  const toc: { id: string; text: string }[] = [];
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading(token: Tokens.Heading) {
        const text = this.parser.parseInline(token.tokens);
        const id = slugify(token.text);
        if (token.depth === 2) toc.push({ id, text: token.text });
        return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
      },
      link(token: Tokens.Link) {
        const text = this.parser.parseInline(token.tokens);
        const ext = /^https?:\/\//.test(token.href);
        return `<a href="${token.href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
      },
      table(token: Tokens.Table) {
        const heads = token.header.map((h) => h.text.trim().toLowerCase());
        const evCol = heads.findIndex((h) => h === "evidence");
        const vCol = heads.findIndex((h) => h === "verdict");
        const th = token.header.map((h) => `<th>${this.parser.parseInline(h.tokens)}</th>`).join("");
        const rows = token.rows
          .map(
            (row) =>
              "<tr>" +
              row
                .map((cell, c) => {
                  let html = this.parser.parseInline(cell.tokens);
                  if (c === evCol) html = evidenceCell(html);
                  else if (c === vCol) html = verdictCell(html);
                  return `<td>${html}</td>`;
                })
                .join("") +
              "</tr>",
          )
          .join("\n");
        return `<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
    },
  });
  const html = marked.parse(body, { async: false }) as string;
  return { slug, title, short: meta.short, lede, html, toc, checked: checkedMatch ? checkedMatch[1] : "30 September 2026" };
}
