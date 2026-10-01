import fs from "node:fs";
import path from "node:path";
import { Marked, type Tokens } from "marked";

export type Guide = { slug: string; title: string; short: string; lede: string; html: string; toc: { id: string; text: string }[]; checked: string; h1: readonly string[]; plain: string; points: readonly string[] };

export const GUIDES = [
  {
    slug: "weight",
    file: "weight.md",
    short: "How to lose weight and keep it off",
    h1: ["How to lose weight", "and keep it off."],
    lede: "What really moves your weight, what doesn't, and why your body pushes back. Plain words first; every study is underneath.",
    points: [
      "Your weight settles where the energy you eat matches the energy you use. After you lose weight, your body pushes back for more than a year, so keeping it off is the hard part. Plan for it from day one.",
      "Any diet you can stick to works about as well as any other. Sticking to it matters far more than which diet it is.",
      "Eat enough protein, lift weights to keep your muscle, and cut down on ultra-processed food. Short sleep tends to make people eat more.",
      "Exercise alone takes off only a little weight, but it matters a lot for keeping weight off and for your health.",
      "For obesity, newer medicines take off about 15 to 21% of body weight, with a doctor. Most of it comes back after stopping.",
      "Detox teas, belly-fat exercises and fat-burner pills don't work.",
    ],
  },
  {
    slug: "supplements",
    file: "supplements.md",
    short: "Do you need supplements?",
    h1: ["Do you need", "supplements?"],
    lede: "Food does almost all the work. Here's who a few pills really help, which ones most people don't need, and which can do harm.",
    points: [
      "Most healthy adults who eat a varied diet need one or two supplements at most.",
      "Worth it for specific people: folic acid if you could become pregnant; vitamin D if you get little sun, especially in autumn and winter up north; vitamin B12 if you're vegan, over 65 or take metformin; creatine if you do strength training.",
      "Iron only if a blood test shows it's low. When you don't need it, it can do harm.",
      "Most people don't need multivitamins, fish oil pills, antioxidant pills, detox products or \"superfoods\". Beta-carotene pills raised lung cancer in smokers.",
      "Take medicines, pregnant, or have a health condition? Check any supplement with a doctor or pharmacist first.",
    ],
  },
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
  return { slug, title, short: meta.short, lede, html, toc, checked: checkedMatch ? checkedMatch[1] : "30 September 2026", h1: meta.h1, plain: meta.lede, points: meta.points };
}
