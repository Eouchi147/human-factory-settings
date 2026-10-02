// Overlays for the film 1 voice guide, set in the site's own fonts: a corner label, one subtitle per line, the end
// card's handle. node overlays.js <report.json> -> png files here (transparent, 1080 x 1920)
const { chromium } = require('playwright');
const fs = require('fs');
const FONTS = '/home/claude/human-factory-settings/app/fonts';
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const LINES = [
  'Always tired? Check these three things first.',
  'One: short sleep. All day, a chemical called adenosine builds up in your brain and makes you sleepy.',
  'Sleep clears it. Cut sleep short, and some is left when you wake.',
  "Two: late coffee. Coffee doesn't clear that chemical. It hides it, and that cuts into your sleep.",
  'A coffee at 6 p.m.? About half of it is still in you at 11.',
  "Three: late light. Bright light at night, even room light, tells your body clock it's still day,",
  'so your sleep signal comes later.',
  'For a 7 a.m. alarm: in bed by 11, last coffee by 2, lights low from 8.',
  'Still tired with enough sleep? See a doctor: low iron or your thyroid can cause it.',
  'Back to factory settings.',
];
const b64 = (f) => fs.readFileSync(`${FONTS}/${f}`).toString('base64');
const head = `<style>
@font-face { font-family: Archivo; src: url(data:font/woff2;base64,${b64('archivo-latin.woff2')}) format('woff2'); font-weight: 100 900; font-stretch: 62% 125%; }
@font-face { font-family: 'Geist Mono'; src: url(data:font/woff2;base64,${b64('geist-mono-500.woff2')}) format('woff2'); font-weight: 500; }
html, body { margin: 0; width: 1080px; height: 1920px; background: transparent; -webkit-font-smoothing: antialiased; }
.label { position: absolute; top: 64px; left: 0; right: 0; text-align: center; font: 500 22px/1 'Geist Mono'; letter-spacing: .18em; color: rgba(236,238,241,.78); }
.label span { display: inline-block; padding: 12px 20px; border-radius: 99px; background: rgba(8,9,11,.62); border: 1px solid rgba(236,238,241,.22); }
.sub { position: absolute; left: 48px; right: 48px; bottom: 54px; display: flex; justify-content: center; }
.sub p { margin: 0; padding: 18px 26px; border-radius: 20px; background: rgba(8,9,11,.72); font: 600 36px/1.3 Archivo; font-stretch: 104%; letter-spacing: -.01em; color: #ECEEF1; text-align: center; text-wrap: balance; }
.handle { position: absolute; left: 0; right: 0; top: 1188px; height: 64px; background: #000; display: flex; align-items: center; justify-content: center; font: 500 26px/1 'Geist Mono'; letter-spacing: .3em; color: rgba(236,238,241,.55); }
</style>`;
(async () => {
  const b = await chromium.launch({ args: ['--disable-lcd-text'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const shot = async (html, file) => {
    await p.setContent(`<!doctype html><html><head>${head}</head><body>${html}</body></html>`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    await p.screenshot({ path: file, omitBackground: true });
  };
  await shot('<div class="label"><span>VOICE GUIDE · AI VOICE · NOT FOR POSTING</span></div>', 'label.png');
  await shot('<div class="handle">@HUMANFACTORYSETTINGS</div>', 'handle.png');
  for (let i = 0; i < LINES.length; i++) await shot(`<div class="sub"><p>${LINES[i]}</p></div>`, `sub${String(i + 1).padStart(2, '0')}.png`);
  await b.close();
  console.log('overlays done');
})();
